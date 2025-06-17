const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const InvestmentAsset = require('../../models/InvestmentAsset');
const InvestmentHolding = require('../../models/InvestmentHolding');
const Wallet = require('../../models/Wallet');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invest')
    .setDescription('Buy or sell investments')
    .addSubcommand(sub =>
      sub.setName('buy')
        .setDescription('Buy an investment')
        .addStringOption(opt =>
          opt.setName('identifier').setDescription('Asset identifier').setRequired(true))
        .addNumberOption(opt =>
          opt.setName('quantity').setDescription('Quantity to buy').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('sell')
        .setDescription('Sell an investment')
        .addStringOption(opt =>
          opt.setName('identifier').setDescription('Asset identifier').setRequired(true))
        .addNumberOption(opt =>
          opt.setName('quantity').setDescription('Quantity to sell').setRequired(true))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const identifier = interaction.options.getString('identifier');
    const quantity = interaction.options.getNumber('quantity');
    if (quantity <= 0) {
      return interaction.reply({ content: '❌ Quantity must be greater than 0.', ephemeral: true });
    }

    const asset = await InvestmentAsset.findOne({ identifier });
    if (!asset) return interaction.reply({ content: '❌ Asset not found.', ephemeral: true });

    const wallet = await Wallet.findOne({ discordId: interaction.user.id }) || await Wallet.create({ discordId: interaction.user.id });
    let holding = await InvestmentHolding.findOne({ discordId: interaction.user.id, assetId: asset._id });

    const cost = asset.price * quantity;

    if (sub === 'buy') {
      if (wallet.balance < cost) {
        return interaction.reply({ content: '❌ Insufficient funds.', ephemeral: true });
      }
      wallet.balance -= cost;
      if (!holding) {
        holding = await InvestmentHolding.create({ discordId: interaction.user.id, assetId: asset._id, quantity });
      } else {
        holding.quantity += quantity;
        await holding.save();
      }
      await wallet.save();
      return interaction.reply({ content: `✅ Bought ${quantity} ${identifier} for $${cost}.`, ephemeral: true });
    } else {
      if (!holding || holding.quantity < quantity) {
        return interaction.reply({ content: '❌ Not enough holdings to sell.', ephemeral: true });
      }
      holding.quantity -= quantity;
      wallet.balance += cost;
      await wallet.save();
      if (holding.quantity <= 0) {
        await InvestmentHolding.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }
      return interaction.reply({ content: `✅ Sold ${quantity} ${identifier} for $${cost}.`, ephemeral: true });
    }
  }
};
