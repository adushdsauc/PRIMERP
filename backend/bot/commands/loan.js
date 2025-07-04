const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Loan = require('../../models/Loan');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loan')
    .setDescription('Loan system commands')
  .addSubcommand(sub => sub.setName('panel').setDescription('Open the loan application panel'))
  .addSubcommand(sub => sub.setName('status').setDescription('View your active loans'))
  .addSubcommand(sub => sub.setName('history').setDescription('View your loan history'))
  .addSubcommand(sub => sub.setName('pay').setDescription('Send payment panel')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'panel') {
      const embed = new EmbedBuilder()
        .setTitle('📄 Apply for a Loan')
        .setColor('Blue')
        .setDescription('Available loan types: **Personal**, **Home**, **Auto**, **Business**\nApplying affects your credit score.');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('loan_apply').setLabel('Apply Now').setStyle(ButtonStyle.Primary)
      );
      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (sub === 'status') {
      const loans = await Loan.find({ userId: interaction.user.id, status: 'active' });
      const embed = new EmbedBuilder()
        .setTitle('📑 Active Loans')
        .setColor('Blue');
      if (!loans.length) embed.setDescription('You have no active loans.');
      for (const loan of loans) {
        embed.addFields({
          name: `Loan ${loan._id.toString()}`,
          value: `Type: ${loan.type}\nAmount: $${loan.amount}\nWeekly: $${loan.weeklyPayment}\nPayments Left: ${loan.paymentsRemaining}\nStrikes: ${loan.strikes}`
        });
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'history') {
      const loans = await Loan.find({ userId: interaction.user.id, status: { $ne: 'active' } });
      const embed = new EmbedBuilder()
        .setTitle('📜 Loan History')
        .setColor('Blue');
      if (!loans.length) embed.setDescription('No past loans.');
      for (const loan of loans) {
        embed.addFields({
          name: `Loan ${loan._id.toString()}`,
          value: `Type: ${loan.type}\nAmount: $${loan.amount}\nStatus: ${loan.status}\nStrikes: ${loan.strikes}`
        });
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'pay') {
      const { sendPaymentEmbed } = require('../services/loanService');
      const loans = await Loan.find({ userId: interaction.user.id, status: 'active' });
      if (!loans.length) return interaction.reply({ content: '❌ You have no active loans.', ephemeral: true });
      for (const loan of loans) {
        await sendPaymentEmbed(interaction.client, loan);
      }
      return interaction.reply({ content: '✅ Payment panel sent to your DMs.', ephemeral: true });
    }
  }
};
