const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Wallet = require('../../models/Wallet');
const Civilian = require('../../models/Civilian');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('View your wallet balance'),
  async execute(interaction) {
    const discordId = interaction.user.id;

    const civilian = await Civilian.findOne({ discordId });
    if (!civilian) {
      return interaction.reply({ content: '❌ You do not have a registered civilian profile.', ephemeral: true });
    }

    const wallet = await Wallet.findOne({ discordId }) || await Wallet.create({ discordId });

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('💰 Your Wallet Balance')
      .setDescription(`You have **$${wallet.balance.toFixed(2)}** in cash.`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
