const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, userMention } = require('discord.js');
const Wallet = require('../../models/Wallet');
const Civilian = require('../../models/Civilian');
const BankAccount = require('../../models/BankAccount');
const InvestmentHolding = require('../../models/InvestmentHolding');
const InvestmentAsset = require('../../models/InvestmentAsset');
const Inventory = require('../../models/Inventory');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('economy')
    .setDescription('View a user\'s entire economic standing')
    .addUserOption(opt =>
      opt.setName('user').setDescription('Target user').setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Admins only.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const discordId = target.id;

    const civilians = await Civilian.find({ discordId });
    if (!civilians.length) {
      return interaction.reply({ content: '❌ You do not have a registered civilian profile.', ephemeral: true });
    }

    const wallet = await Wallet.findOne({ discordId }) || await Wallet.create({ discordId });
    const civilianIds = civilians.map(c => c._id);
    const accounts = await BankAccount.find({ civilianId: { $in: civilianIds } });

    const holdings = await InvestmentHolding.find({ discordId });
    const assetIds = holdings.map(h => h.assetId);
    const assets = assetIds.length ? await InvestmentAsset.find({ _id: { $in: assetIds } }) : [];

    const inventory = await Inventory.findOne({ discordId });

    const walletEmbed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('💰 Wallet Balance')
      .setDescription(`${userMention(discordId)} has **$${wallet.balance.toFixed(2)}** in cash.`)
      .setTimestamp();

    const bankEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('🏦 Bank Accounts')
      .setTimestamp();

    if (!accounts.length) {
      bankEmbed.setDescription(`No bank accounts found for ${userMention(discordId)}.`);
    } else {
      for (const account of accounts) {
        const civ = civilians.find(c => c._id.equals(account.civilianId));
        const civName = civ ? `${civ.firstName} ${civ.lastName}` : 'Unknown';
        bankEmbed.addFields({
          name: `#${account.accountNumber} — ${account.accountType}`,
          value: `Balance: $${account.balance.toFixed(2)}\nCivilian: ${civName}`
        });
      }
    }

    const portfolioEmbed = new EmbedBuilder()
      .setColor('Purple')
      .setTitle('📊 Investment Portfolio')
      .setTimestamp();

    if (!holdings.length) {
      portfolioEmbed.setDescription(`No investments for ${userMention(discordId)}.`);
    } else {
      let total = 0;
      for (const holding of holdings) {
        const asset = assets.find(a => a._id.equals(holding.assetId));
        if (!asset) continue;
        const value = asset.price * holding.quantity;
        total += value;
        portfolioEmbed.addFields({
          name: `${asset.name} (${asset.identifier})`,
          value: `Quantity: **${holding.quantity}**\nValue: **$${value.toFixed(2)}**`
        });
      }
      portfolioEmbed.addFields({ name: 'Total Worth', value: `$${total.toFixed(2)}` });
    }

    const inventoryEmbed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('📦 Inventory')
      .setTimestamp();

    if (!inventory || !inventory.items || inventory.items.length === 0) {
      inventoryEmbed.setDescription(`No items in inventory for ${userMention(discordId)}.`);
    } else {
      inventory.items.forEach((item, index) => {
        inventoryEmbed.addFields({
          name: `#${index + 1} — ${item.name}`,
          value: `Price: $${item.price.toLocaleString()}\nPurchased: <t:${Math.floor(new Date(item.purchasedAt).getTime() / 1000)}:R>`
        });
      });
    }

    return interaction.reply({ embeds: [walletEmbed, bankEmbed, portfolioEmbed, inventoryEmbed] });
  }
};
