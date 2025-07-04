const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCredit } = require('../services/loanService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credit')
    .setDescription('Credit system commands')
    .addSubcommand(sub =>
      sub.setName('check').setDescription('Check your credit score')
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'check') {
      const profile = await getCredit(interaction.user.id);
      const embed = new EmbedBuilder()
        .setTitle('💳 Credit Score')
        .setColor('Blue')
        .setDescription(`Your credit score is **${profile.score}**.`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
