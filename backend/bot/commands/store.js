const { SlashCommandBuilder } = require('discord.js');
const StoreItem = require('../../models/StoreItem');
const formatStorePage = require('../utils/formatStorePage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('store')
    .setDescription('View the available items in the store'),
  async execute(interaction) {
    const items = await StoreItem.find();

    if (items.length === 0) {
      return interaction.reply({ content: '🛒 The store is currently empty.', ephemeral: true });
    }

    const { embed, row } = formatStorePage(items, 0);
    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
