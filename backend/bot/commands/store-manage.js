const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const StoreItem = require('../../models/StoreItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('store-manage')
    .setDescription('Edit or delete store items')
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Edit a store item')
        .addStringOption(opt => opt.setName('name').setDescription('Item name').setRequired(true).setAutocomplete(true))
        .addNumberOption(opt => opt.setName('price').setDescription('New price').setRequired(false))
        .addStringOption(opt => opt.setName('description').setDescription('New description').setRequired(false))
        .addStringOption(opt => opt.setName('image').setDescription('Image URL').setRequired(false))
        .addRoleOption(opt => opt.setName('role').setDescription('Role requirement').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a store item')
        .addStringOption(opt => opt.setName('name').setDescription('Item name').setRequired(true).setAutocomplete(true))
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'edit') {
      const name = interaction.options.getString('name');
      const item = await StoreItem.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (!item) {
        return interaction.reply({ content: `❌ No item named "${name}" found.`, ephemeral: true });
      }
      const price = interaction.options.getNumber('price');
      const description = interaction.options.getString('description');
      const image = interaction.options.getString('image');
      const role = interaction.options.getRole('role');

      if (price !== null && price !== undefined) item.price = price;
      if (description) item.description = description;
      if (image) item.image = image;
      if (role) item.roleRequirement = role.id;
      await item.save();

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('✅ Item Updated')
        .setDescription(`Updated **${item.name}**.`)
        .addFields(
          { name: 'Price', value: `$${item.price.toFixed(2)}`, inline: true },
          { name: 'Role', value: item.roleRequirement ? `<@&${item.roleRequirement}>` : 'None', inline: true }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'delete') {
      const name = interaction.options.getString('name');
      const item = await StoreItem.findOneAndDelete({ name: new RegExp(`^${name}$`, 'i') });
      if (!item) {
        return interaction.reply({ content: `❌ No item named "${name}" found.`, ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('🗑️ Item Deleted')
        .setDescription(`Deleted **${item.name}** from the store.`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const items = await StoreItem.find({ name: { $regex: focused, $options: 'i' } }).limit(25);
    await interaction.respond(items.map(i => ({ name: i.name, value: i.name })));
  }
};
