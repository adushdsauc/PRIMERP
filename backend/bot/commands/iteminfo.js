const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const StoreItem = require('../../models/StoreItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('iteminfo')
    .setDescription('Get detailed information about a store item')
    .addStringOption(opt => opt.setName('name').setDescription('Name of the item').setRequired(true)),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const item = await StoreItem.findOne({ name: new RegExp(`^${name}$`, 'i') });

    if (!item) {
      return interaction.reply({ content: `❌ No item named "${name}" found in the store.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🧾 Info: ${item.name}`)
      .setDescription(item.description)
      .addFields(
        { name: 'Price', value: `$${item.price.toFixed(2)}`, inline: true },
        { name: 'Role Required', value: item.roleRequirement ? `<@&${item.roleRequirement}>` : 'None', inline: true }
      )
      .setColor('Purple')
      .setTimestamp();

    if (item.image) embed.setImage(item.image);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
