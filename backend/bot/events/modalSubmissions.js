const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const BankAccount = require('../../models/BankAccount');
const Civilian = require('../../models/Civilian');

module.exports = async function handleModalSubmissions(interaction) {
  if (interaction.customId.startsWith('deny_modal_')) {
    const accountId = interaction.customId.split('deny_modal_')[1];
    const reason = interaction.fields.getTextInputValue('deny_reason');

    const account = await BankAccount.findById(accountId);
    if (!account) return interaction.reply({ content: '❌ Account not found.', ephemeral: true });

    const civilian = await Civilian.findById(account.civilianId);
    if (!civilian) return interaction.reply({ content: '❌ Civilian not found.', ephemeral: true });

    const user = await interaction.client.users.fetch(civilian.discordId);
    const embed = new EmbedBuilder()
      .setTitle('❌ Bank Account Denied')
      .setDescription(`Your **${account.accountType}** account (#${account.accountNumber}) was denied.`)
      .addFields({ name: 'Reason', value: reason })
      .setColor('Red')
      .setTimestamp();

    await user.send({ embeds: [embed] }).catch(err => console.warn('Failed to DM user:', err));
    await BankAccount.findByIdAndDelete(accountId);
    return interaction.reply({ content: '✅ Account denied and user notified.', ephemeral: true });
  }

  if (interaction.customId.startsWith('bid_modal_')) {
    const auctionId = interaction.customId.split('bid_modal_')[1];
    const amount = parseFloat(interaction.fields.getTextInputValue('bid_amount'));
    const Auction = require('../../models/Auction');
    const Wallet = require('../../models/Wallet');

    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'open') {
      return interaction.reply({ content: '❌ Auction is closed.', ephemeral: true });
    }

    const minBid = auction.highestBid?.amount ? auction.highestBid.amount + 1 : auction.startingBid;
    if (amount < minBid) {
      return interaction.reply({ content: `❌ Bid must be at least $${minBid}.`, ephemeral: true });
    }

    const wallet = await Wallet.findOne({ discordId: interaction.user.id }) || await Wallet.create({ discordId: interaction.user.id });
    if (wallet.balance < amount) {
      return interaction.reply({ content: '❌ Insufficient funds for bid.', ephemeral: true });
    }

    auction.highestBid = { amount, bidderId: interaction.user.id };
    await auction.save();

    const channel = await interaction.client.channels.fetch(auction.channelId).catch(() => null);
    const message = channel ? await channel.messages.fetch(auction.messageId).catch(() => null) : null;
    if (message) {
      const updatedEmbed = EmbedBuilder.from(message.embeds[0])
        .setFields(
          { name: 'Seller', value: `<@${auction.sellerId}>`, inline: true },
          { name: 'Item', value: auction.itemName, inline: true },
          { name: 'Starting Bid', value: `$${auction.startingBid}`, inline: true },
          { name: 'Buyout Price', value: `$${auction.buyoutPrice}`, inline: true },
          { name: 'Highest Bid', value: `$${amount} by <@${interaction.user.id}>` },
          { name: 'Ends', value: `<t:${Math.floor(auction.endDate.getTime() / 1000)}:R>` }
        );
      await message.edit({ embeds: [updatedEmbed] });
    }

    return interaction.reply({ content: '✅ Bid placed.', ephemeral: true });
  }

  if (interaction.customId === 'loan_application') {
    const type = interaction.fields.getTextInputValue('loan_type');
    const amount = parseFloat(interaction.fields.getTextInputValue('loan_amount'));
    const termWeeks = parseInt(interaction.fields.getTextInputValue('loan_term'));
    const agree = interaction.fields.getTextInputValue('loan_terms').toLowerCase();
    const purpose = interaction.fields.getTextInputValue('loan_purpose');

    if (agree !== 'yes') {
      return interaction.reply({ content: '❌ You must agree to the terms.', ephemeral: true });
    }

    const { getCredit } = require('../services/loanService');
    const profile = await getCredit(interaction.user.id);

    const getRate = score => {
      if (score <= 579) return 25;
      if (score <= 669) return 18;
      if (score <= 739) return 12;
      if (score <= 799) return 6;
      return 3;
    };

    const modifiers = { personal: 0, home: -2, auto: -1, business: 1 };

    if (profile.score < 580) {
      const warn = new EmbedBuilder()
        .setTitle('Collateral Required')
        .setDescription('Your credit score is below 580. Collateral will be required.')
        .setColor('Orange');
      await interaction.reply({ embeds: [warn], ephemeral: true });
      const sendFinancialLogEmbed = require('../utils/sendFinancialLogEmbed');
      const log = EmbedBuilder.from(warn)
        .setTitle('⚠️ Loan Collateral Needed')
        .addFields({ name: 'User', value: `<@${interaction.user.id}>` }, { name: 'Purpose', value: purpose });
      await sendFinancialLogEmbed(interaction.client, log);
      return;
    }

    const base = getRate(profile.score);
    const rate = base + (modifiers[type.toLowerCase()] ?? 0);
    const total = amount * (1 + rate / 100);
    const weeklyPayment = Number((total / termWeeks).toFixed(2));

    const reviewChannel = await interaction.client.channels.fetch('1390762518837989496').catch(() => null);
    if (reviewChannel) {
      const appEmbed = new EmbedBuilder()
        .setTitle('📄 Loan Application')
        .setColor('Blue')
        .addFields(
          { name: 'Applicant', value: `<@${interaction.user.id}>` },
          { name: 'Type', value: type, inline: true },
          { name: 'Amount', value: `$${amount}`, inline: true },
          { name: 'Term', value: `${termWeeks} weeks`, inline: true },
          { name: 'Purpose', value: purpose },
          { name: 'Credit Score', value: String(profile.score), inline: true },
          { name: 'Interest %', value: `${rate}%`, inline: true }
        )
        .setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`loan_app_accept_${interaction.user.id}_${amount}_${termWeeks}_${rate}_${type}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`loan_app_deny_${interaction.user.id}_${amount}_${termWeeks}_${rate}_${type}`)
          .setLabel('Deny')
          .setStyle(ButtonStyle.Danger)
      );
      await reviewChannel.send({ embeds: [appEmbed], components: [row] });
    }
    await interaction.reply({ content: '✅ Application submitted for review.', ephemeral: true });
  }

  if (interaction.customId.startsWith('loan_deny_reason_')) {
    const parts = interaction.customId.split('_');
    const userId = parts[3];
    const amount = parts[4];
    const term = parts[5];
    const rate = parts[6];
    const type = parts[7];
    const reason = interaction.fields.getTextInputValue('deny_reason');

    const user = await interaction.client.users.fetch(userId).catch(() => null);
    if (user) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Loan Application Denied')
        .setColor('Red')
        .setDescription(`Your ${type} loan request for **$${amount}** was denied.`)
        .addFields({ name: 'Reason', value: reason });
      await user.send({ embeds: [embed] }).catch(() => null);
    }

    const sendFinancialLogEmbed = require('../utils/sendFinancialLogEmbed');
    const log = new EmbedBuilder()
      .setTitle('❌ Loan Denied')
      .setColor('Red')
      .addFields(
        { name: 'Applicant', value: `<@${userId}>`, inline: true },
        { name: 'Staff', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Amount', value: `$${amount}`, inline: true },
        { name: 'Type', value: type, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();
    await sendFinancialLogEmbed(interaction.client, log);

    await interaction.update({ content: 'Application denied.', components: [], embeds: interaction.message.embeds });
  }
};
