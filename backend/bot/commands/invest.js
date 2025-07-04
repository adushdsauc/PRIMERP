const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { sendFinancialLogEmbed } = require('../index');
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
          opt.setName('identifier').setDescription('Asset identifier').setRequired(true).setAutocomplete(true))
        .addNumberOption(opt =>
          opt.setName('quantity').setDescription('Quantity to buy (leave empty for max)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('sell')
        .setDescription('Sell an investment')
        .addStringOption(opt =>
          opt.setName('identifier').setDescription('Asset identifier').setRequired(true).setAutocomplete(true))
        .addNumberOption(opt =>
          opt.setName('quantity').setDescription('Quantity to sell (leave empty for all)').setRequired(false))
    ),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const identifier = interaction.options.getString('identifier');
    let quantity = interaction.options.getNumber('quantity');

    const asset = await InvestmentAsset.findOne({ identifier });
    if (!asset) return interaction.reply({ content: '❌ Asset not found.', ephemeral: true });

    const wallet = await Wallet.findOne({ discordId: interaction.user.id }) || await Wallet.create({ discordId: interaction.user.id });
    let holding = await InvestmentHolding.findOne({ discordId: interaction.user.id, assetId: asset._id });

    if (sub === 'buy') {
      if (!quantity || quantity <= 0) {
        quantity = Math.floor(wallet.balance / asset.price);
      }
      const cost = asset.price * quantity;
      if (quantity <= 0 || wallet.balance < cost) {
        return interaction.reply({ content: '❌ Insufficient funds.', ephemeral: true });
      }

      wallet.balance -= cost;
      if (!holding) {
        holding = await InvestmentHolding.create({ discordId: interaction.user.id, assetId: asset._id, quantity, avgPrice: asset.price });
      } else {
        const totalCost = holding.avgPrice * holding.quantity + asset.price * quantity;
        holding.quantity += quantity;
        holding.avgPrice = totalCost / holding.quantity;
        await holding.save();
      }
      asset.netDemand += quantity;
      await asset.save();
      await wallet.save();
      const buyEmbed = new EmbedBuilder()
        .setTitle('📈 Investment Purchase')
        .setColor('Green')
        .addFields(
          { name: 'User', value: interaction.user.tag, inline: true },
          { name: 'Asset', value: identifier, inline: true },
          { name: 'Quantity', value: String(quantity), inline: true },
          { name: 'Total Cost', value: `$${cost}`, inline: true }
        )
        .setTimestamp();
      await sendFinancialLogEmbed(buyEmbed);
      return interaction.reply({ content: `✅ Bought ${quantity} ${identifier} for $${cost}.`, ephemeral: true });
    } else {
      if (!holding) {
        return interaction.reply({ content: '❌ You do not own this asset.', ephemeral: true });
      }
      if (!quantity || quantity <= 0) {
        quantity = holding.quantity;
      }
      if (holding.quantity < quantity) {
        return interaction.reply({ content: '❌ Not enough holdings to sell.', ephemeral: true });
      }
      const revenue = asset.price * quantity;
      holding.quantity -= quantity;
      wallet.balance += revenue;
      asset.netDemand -= quantity;
      await asset.save();
      await wallet.save();
      if (holding.quantity <= 0) {
        await InvestmentHolding.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }
      const sellEmbed = new EmbedBuilder()
        .setTitle('📉 Investment Sale')
        .setColor('Orange')
        .addFields(
          { name: 'User', value: interaction.user.tag, inline: true },
          { name: 'Asset', value: identifier, inline: true },
          { name: 'Quantity', value: String(quantity), inline: true },
          { name: 'Total Revenue', value: `$${revenue}`, inline: true }
        )
        .setTimestamp();
      await sendFinancialLogEmbed(sellEmbed);
      return interaction.reply({ content: `✅ Sold ${quantity} ${identifier} for $${revenue}.`, ephemeral: true });
    }
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const assets = await InvestmentAsset.find({
      $or: [
        { identifier: { $regex: focused, $options: 'i' } },
        { name: { $regex: focused, $options: 'i' } }
      ]
    }).limit(25);
    await interaction.respond(
      assets.map(a => ({ name: `${a.name} (${a.identifier})`, value: a.identifier }))
    );
  }
};
