const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const StoreItem = require('../../models/StoreItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('additem')
    .setDescription('Add a new item to the store')
    .addStringOption(opt => opt.setName('name').setDescription('Item name').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('Item description').setRequired(true))
    .addNumberOption(opt => opt.setName('price').setDescription('Item price').setRequired(true))
    .addStringOption(opt => opt.setName('image').setDescription('Image URL (optional)').setRequired(false))
    .addRoleOption(opt => opt.setName('role').setDescription('Role requirement (optional)').setRequired(false)),
async execute(interaction) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.MentionEveryone)) {
    return interaction.reply({ content: '❌ You do not have permission to mention @everyone or roles.', ephemeral: true });
  }

    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const price = interaction.options.getNumber('price');
    const image = interaction.options.getString('image');
    const role = interaction.options.getRole('role');

    await StoreItem.create({
      name,
      description,
      price,
      image,
      roleRequirement: role ? role.id : null,
    });

    const embed = new EmbedBuilder()
      .setTitle('🛒 New Store Item Added')
      .addFields(
        { name: 'Name', value: name, inline: true },
        { name: 'Price', value: `$${price}`, inline: true },
        { name: 'Description', value: description }
      )
      .setColor('Green')
      .setTimestamp();

    if (image) embed.setImage(image);
    if (role) embed.addFields({ name: 'Role Requirement', value: `<@&${role.id}>` });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
