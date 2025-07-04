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
    const reportId = customId.split('pay_fine_')[1];
    const discordId = interaction.user.id;

    const civilian = await Civilian.findOne({ discordId });
    if (!civilian) return interaction.reply({ content: '❌ Civilian not found.', ephemeral: true });

    const report = civilian.reports.find(r => r.reportId?.toString() === reportId);
    if (!report) return interaction.reply({ content: '❌ Report not found.', ephemeral: true });
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
};
