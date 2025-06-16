const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Inventory = require('../../models/Inventory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your purchased store items'),
  async execute(interaction) {
    const discordId = interaction.user.id;
    const inventory = await Inventory.findOne({ discordId: discordId.toString() });

    if (!inventory || !Array.isArray(inventory.items) || inventory.items.length === 0) {
      return interaction.reply({ content: '🪹 Your inventory is empty.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('📦 Your Inventory')
      .setDescription("Here are the items you've purchased:")
      .setColor('Blue')
      .setTimestamp();

    inventory.items.forEach((item, index) => {
      embed.addFields({
        name: `#${index + 1} — ${item.name}`,
        value: `**Price:** $${item.price.toLocaleString()}\n**Purchased:** <t:${Math.floor(new Date(item.purchasedAt).getTime() / 1000)}:R>`
      });
    });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
