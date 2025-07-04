const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, userMention } = require('discord.js');
const Wallet = require('../../models/Wallet');
const Inventory = require('../../models/Inventory');
const sendFinancialLogEmbed = require('../utils/sendFinancialLogEmbed');
const StoreItem = require('../../models/StoreItem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('useradd')
    .setDescription('Add money or items to a user')
    .addSubcommand(sub =>
      sub.setName('money')
        .setDescription('Add money to a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addNumberOption(opt => opt.setName('amount').setDescription('Amount to add').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('item')
        .setDescription('Add an item to a user')
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
      wallet.balance += amount;
      await wallet.save();
      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('✅ Money Added')
        .setDescription(`Added $${amount.toFixed(2)} to ${userMention(discordId)}'s wallet.`)
        .addFields({ name: 'New Balance', value: `$${wallet.balance.toFixed(2)}` })
        .setTimestamp();
      await sendFinancialLogEmbed(interaction.client, EmbedBuilder.from(embed).setTitle('➕ Money Added'));
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'item') {
      const name = interaction.options.getString('name');
      const item = await StoreItem.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (!item) {
        return interaction.reply({ content: `❌ No item named "${name}" found in the store.`, ephemeral: true });
      }
      await Inventory.findOneAndUpdate(
        { discordId },
        { $push: { items: { name: item.name, price: item.price, purchasedAt: new Date() } } },
        { upsert: true, new: true }
      );
      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('📦 Item Added')
        .setDescription(`Added **${item.name}** to ${userMention(discordId)}'s inventory.`)
        .setTimestamp();
      await sendFinancialLogEmbed(interaction.client, EmbedBuilder.from(embed));
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
