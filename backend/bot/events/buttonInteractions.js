const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const dayjs = require('dayjs');
const BankAccount = require('../../models/BankAccount');
const Civilian = require('../../models/Civilian');
const Wallet = require('../../models/Wallet');
const StoreItem = require('../../models/StoreItem');
const ClockSession = require('../../models/ClockSession');
const Officer = require('../../models/Officer');
const formatStorePage = require('../utils/formatStorePage');
const sendFinancialLogEmbed = require('../utils/sendFinancialLogEmbed');


module.exports = async function handleButtonInteractions(interaction) {
  const customId = interaction.customId;

  if (customId === 'clock_in' || customId === 'clock_out') {
    const discordId = interaction.user.id;
    const officer = await Officer.findOne({ discordId });
    if (!officer) {
      return interaction.reply({ content: '❌ Officer not registered.', ephemeral: true });
    }

    const now = new Date();
    const platform = officer.department.toLowerCase();
    const logChannelId = platform === 'xbox' ? '1376268599924232202' : '1376268687656353914';
    const logChannel = await interaction.client.channels.fetch(logChannelId).catch(() => null);

    const dmEmbed = new EmbedBuilder()
      .setColor(customId === 'clock_in' ? 'Green' : 'Red')
      .setTitle(customId === 'clock_in' ? '🟢 You are now clocked in.' : '🔴 You are now clocked out.')
      .setDescription(`Officer **${officer.callsign}** has ${customId === 'clock_in' ? 'clocked in' : 'clocked out'}.`)
      .setFooter({ text: dayjs().format('MMMM D, YYYY • h:mm A') });

    const logEmbed = EmbedBuilder.from(dmEmbed)
      .setTitle(`${customId === 'clock_in' ? '🟢 Clock In Log' : '🔴 Clock Out Log'}`)
      .addFields(
        { name: 'Name', value: officer.callsign, inline: true },
        { name: 'Badge #', value: String(officer.badgeNumber), inline: true },
        { name: 'Platform', value: officer.department, inline: true }
      );

    if (customId === 'clock_in') {
      const active = await ClockSession.findOne({ discordId, clockOutTime: null });
      if (active) return interaction.reply({ content: '❌ You are already clocked in.', ephemeral: true });

      await ClockSession.create({ discordId, clockInTime: now });

      await interaction.user.send({ embeds: [dmEmbed] }).catch(() => null);
      if (logChannel) await logChannel.send({ embeds: [logEmbed] });

      return interaction.reply({ content: '✅ You are clocked in.', ephemeral: true });
    }

    if (customId === 'clock_out') {
      const session = await ClockSession.findOne({ discordId, clockOutTime: null });
      if (!session) return interaction.reply({ content: '❌ You were not clocked in.', ephemeral: true });

      session.clockOutTime = now;
      await session.save();

      const durationMs = now - session.clockInTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      dmEmbed.setDescription(`Officer **${officer.callsign}** clocked out.\nTotal time: **${hours}h ${minutes}m**`);
      logEmbed.setDescription(`Officer **${officer.callsign}** clocked out.\nTotal time: **${hours}h ${minutes}m**`);

      await interaction.user.send({ embeds: [dmEmbed] }).catch(() => null);
      if (logChannel) await logChannel.send({ embeds: [logEmbed] });

      return interaction.reply({ content: '✅ You are clocked out.', ephemeral: true });
    }
  }

  if (customId.startsWith('store_prev_') || customId.startsWith('store_next_')) {
    const items = await StoreItem.find();
    const [, , rawPage] = customId.split('_');
    const page = parseInt(rawPage);

    const { embed, row } = formatStorePage(items, page);
    return interaction.update({ embeds: [embed], components: [row] });
  }

  if (customId.startsWith('approve_bank_')) {
    const accountId = customId.split('approve_bank_')[1];
    const account = await BankAccount.findById(accountId);
    if (!account) return interaction.reply({ content: '❌ Account not found.', ephemeral: true });

    account.needsApproval = false;
    account.status = 'approved';
    await account.save();

    const civilian = await Civilian.findById(account.civilianId);
    if (!civilian) return interaction.reply({ content: '❌ Civilian not found.', ephemeral: true });

    const user = await interaction.client.users.fetch(civilian.discordId);
    const embed = new EmbedBuilder()
      .setTitle('✅ Bank Account Approved')
      .setDescription(`Your **${account.accountType}** account (#${account.accountNumber}) has been approved.`)
      .setColor('Green')
      .setTimestamp();

    await user.send({ embeds: [embed] }).catch(err => console.warn('Failed to DM user:', err));
    return interaction.reply({ content: '✅ Approved and user notified.', ephemeral: true });
  }

  if (customId.startsWith('pay_fine_')) {
    const reportId = customId.slice('pay_fine_'.length);
    const discordId = interaction.user.id;

    const civilian = await Civilian.findOne({ discordId });
    if (!civilian) return interaction.reply({ content: '❌ Civilian not found.', ephemeral: true });
    console.debug('[pay_fine] looking for report', reportId, 'for civilian', civilian._id);

    const report = civilian.reports.find(r => {
      const id = r.reportId || r._id;
      console.debug('[pay_fine] checking report id', id?.toString());
      return id && id.toString() === reportId;
    });
    if (!report) {
      console.warn('[pay_fine] report not found. Available reports:', civilian.reports.map(r => r.reportId || r._id));
      return interaction.reply({ content: '❌ Report not found.', ephemeral: true });
    }
    console.debug('[pay_fine] report found', report.reportId || report._id);
    if (report.paid) return interaction.reply({ content: '✅ Fine already paid.', ephemeral: true });

    const wallet = await Wallet.findOne({ discordId });
    if (!wallet || wallet.balance < report.fine) {
      return interaction.reply({ content: `❌ Not enough funds. You need $${report.fine}.`, ephemeral: true });
    }

    wallet.balance -= report.fine;
    report.paid = true;
    await wallet.save();
    await civilian.save();

    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setFooter({ text: 'Status: PAID' })
      .setColor('Green');

    await interaction.update({ embeds: [updatedEmbed], components: [] });

    const logEmbed = new EmbedBuilder()
      .setTitle('💰 Fine Paid')
      .setColor('Blue')
      .addFields(
        { name: 'User', value: interaction.user.tag, inline: true },
        { name: 'Amount', value: `$${report.fine}`, inline: true },
        { name: 'Report ID', value: reportId, inline: true }
      )
      .setTimestamp();
    await sendFinancialLogEmbed(interaction.client, logEmbed);

  }

  if (customId.startsWith('bid_')) {
    const auctionId = customId.split('bid_')[1];
    const modal = new ModalBuilder()
      .setCustomId(`bid_modal_${auctionId}`)
      .setTitle('Place Bid')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('bid_amount')
            .setLabel('Bid Amount')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    return interaction.showModal(modal);
  }

  if (customId.startsWith('buyout_')) {
    const auctionId = customId.split('buyout_')[1];
    const Auction = require('../../models/Auction');
    const Wallet = require('../../models/Wallet');
    const closeAuction = require('../utils/closeAuction');

    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status !== 'open') {
      return interaction.reply({ content: '❌ Auction is closed.', ephemeral: true });
    }

    const wallet = await Wallet.findOne({ discordId: interaction.user.id }) || await Wallet.create({ discordId: interaction.user.id });
    if (wallet.balance < auction.buyoutPrice) {
      return interaction.reply({ content: '❌ Insufficient funds for buyout.', ephemeral: true });
    }

    auction.highestBid = { amount: auction.buyoutPrice, bidderId: interaction.user.id };
    await auction.save();
    await closeAuction(interaction.client, auction._id);
    const buyoutEmbed = new EmbedBuilder()
      .setTitle('🏷️ Auction Buyout')
      .setColor('Purple')
      .addFields(
        { name: 'User', value: interaction.user.tag, inline: true },
        { name: 'Auction ID', value: auctionId, inline: true },
        { name: 'Amount', value: `$${auction.buyoutPrice}`, inline: true }
      )
      .setTimestamp();
    await sendFinancialLogEmbed(interaction.client, buyoutEmbed);


    return interaction.reply({ content: '✅ Buyout successful.', ephemeral: true });
  }

  if (customId.startsWith('deny_bank_')) {
    const accountId = customId.split('deny_bank_')[1];
    const modal = new ModalBuilder()
      .setCustomId(`deny_modal_${accountId}`)
      .setTitle('Deny Bank Account')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('deny_reason')
            .setLabel('Reason for Denial')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );
    return interaction.showModal(modal);
  }

  if (customId === 'loan_apply') {
    const modal = new ModalBuilder()
      .setCustomId('loan_application')
      .setTitle('Loan Application')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('loan_type')
            .setLabel('Loan Type (Personal/Home/Auto/Business)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('loan_amount')
            .setLabel('Loan Amount')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('loan_term')
            .setLabel('Loan Term (Weeks)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('loan_purpose')
            .setLabel('Purpose of Loan')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('loan_terms')
            .setLabel('Agree to Terms? (Yes/No)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );
    return interaction.showModal(modal);
  }

  if (customId.startsWith('loan_app_accept_')) {
    const [, , userId, amt, term, rate, type] = customId.split('_');
    const user = await interaction.client.users.fetch(userId).catch(() => null);
    if (user) {
      const amount = parseFloat(amt);
      const termWeeks = parseInt(term);
      const interest = parseFloat(rate);
      const total = amount * (1 + interest / 100);
      const weekly = (total / termWeeks).toFixed(2);
      const contract = new EmbedBuilder()
        .setTitle('📜 Loan Contract')
        .setColor('Blue')
        .addFields(
          { name: 'Loan Type', value: type, inline: true },
          { name: 'Loan Amount', value: `$${amount}`, inline: true },
          { name: 'Term Length', value: `${termWeeks} weeks`, inline: true },
          { name: 'Interest %', value: `${interest}%`, inline: true },
          { name: 'Total Repayment', value: `$${total.toFixed(2)}`, inline: true },
          { name: 'Weekly Payment', value: `$${weekly}`, inline: true }
        );
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`loan_sign_${userId}_${amount}_${termWeeks}_${interest}_${type}`)
          .setLabel('Sign Loan')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('loan_decline').setLabel('Decline').setStyle(ButtonStyle.Danger)
      );
      await user.send({ embeds: [contract], components: [row] }).catch(() => null);
    }
    const logEmbed = new EmbedBuilder()
      .setTitle('✅ Loan Application Approved')
      .setColor('Green')
      .addFields(
        { name: 'Applicant', value: `<@${userId}>`, inline: true },
        { name: 'Staff', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Amount', value: `$${amt}`, inline: true },
        { name: 'Type', value: type, inline: true }
      )
      .setTimestamp();
    await sendFinancialLogEmbed(interaction.client, logEmbed);
    return interaction.update({ content: 'Application approved.', components: [], embeds: interaction.message.embeds });
  }

  if (customId.startsWith('loan_app_deny_')) {
    const [, , userId, amt, term, rate, type] = customId.split('_');
    const modal = new ModalBuilder()
      .setCustomId(`loan_deny_reason_${userId}_${amt}_${term}_${rate}_${type}`)
      .setTitle('Deny Reason')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('deny_reason')
            .setLabel('Reason for denial')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );
    return interaction.showModal(modal);
  }

  if (customId.startsWith('loan_sign_')) {
    const [, , userId, amt, term, rate, type] = customId.split('_');

    if (interaction.user.id !== userId) {
      return interaction.reply({ content: '❌ This contract is not for you.', ephemeral: true });
    }

    const { createLoan } = require('../services/loanService');
    const amount = parseFloat(amt);
    const termWeeks = parseInt(term);
    const interest = parseFloat(rate);
    await createLoan(interaction.client, userId, amount, termWeeks, interest, type);
    await interaction.update({ content: '✅ Loan signed and stored.', embeds: [], components: [] });
  }

  if (customId === 'loan_decline') {
    return interaction.update({ content: '❌ Loan declined.', embeds: [], components: [] });
  }

  if (customId.startsWith('loan_pay_')) {
    const loanId = customId.split('loan_pay_')[1];
    const { payLoan } = require('../services/loanService');
    await payLoan(interaction.client, loanId);
    await interaction.update({ content: '✅ Payment received.', embeds: [], components: [] });
  }
};
