const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, userMention } = require('discord.js');
const Wallet = require('../../models/Wallet');
const Inventory = require('../../models/Inventory');
const StoreItem = require('../../models/StoreItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userremove')
    .setDescription('Remove money or items from a user')
    .addSubcommand(sub =>
      sub.setName('money')
        .setDescription('Remove money from a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addNumberOption(opt => opt.setName('amount').setDescription('Amount to remove').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('item')
        .setDescription('Remove an item from a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('name').setDescription('Item name').setRequired(true).setAutocomplete(true))
    ),
async execute(interaction) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.MentionEveryone)) {
    return interaction.reply({ content: '❌ You do not have permission to mention @everyone or roles.', ephemeral: true });
  }

    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const discordId = user.id;

    if (sub === 'money') {
      const amount = interaction.options.getNumber('amount');
      const wallet = await Wallet.findOne({ discordId }) || await Wallet.create({ discordId });
      wallet.balance = Math.max(0, wallet.balance - amount);
      await wallet.save();
      const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('✅ Money Removed')
        .setDescription(`Removed $${amount.toFixed(2)} from ${userMention(discordId)}'s wallet.`)
        .addFields({ name: 'New Balance', value: `$${wallet.balance.toFixed(2)}` })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'item') {
      const name = interaction.options.getString('name');
      const inventory = await Inventory.findOne({ discordId });
      if (!inventory || !inventory.items.length) {
        return interaction.reply({ content: '❌ Inventory is empty.', ephemeral: true });
      }
      const index = inventory.items.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
      if (index === -1) {
        return interaction.reply({ content: `❌ Item "${name}" not found in inventory.`, ephemeral: true });
      }
      const [removed] = inventory.items.splice(index, 1);
      await inventory.save();
      const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('📦 Item Removed')
        .setDescription(`Removed **${removed.name}** from ${userMention(discordId)}'s inventory.`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
  async autocomplete(interaction) {
    if (interaction.options.getSubcommand() !== 'item') return;
    const focused = interaction.options.getFocused();
    const items = await StoreItem.find({ name: { $regex: focused, $options: 'i' } }).limit(25);
    await interaction.respond(items.map(i => ({ name: i.name, value: i.name })));
  }
};
