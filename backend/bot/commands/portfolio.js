const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const InvestmentHolding = require('../../models/InvestmentHolding');
const InvestmentAsset = require('../../models/InvestmentAsset');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('portfolio')
    .setDescription('View your current investments'),
  async execute(interaction) {
    const holdings = await InvestmentHolding.find({ discordId: interaction.user.id });
    if (!holdings.length) {
      return interaction.reply({ content: '❌ You have no investments.', ephemeral: true });
    }
    const assetIds = holdings.map(h => h.assetId);
    const assets = await InvestmentAsset.find({ _id: { $in: assetIds } });
    const embed = new EmbedBuilder()
      .setTitle('📊 Your Investments')
      .setColor('Blue')
      .setTimestamp();
    let total = 0;
    for (const holding of holdings) {
      const asset = assets.find(a => a._id.equals(holding.assetId));
      if (!asset) continue;
      const value = holding.quantity * asset.price;
      total += value;
      embed.addFields({
        name: `${asset.name} (${asset.identifier})`,
        value: `Quantity: **${holding.quantity}**\nPurchase Price: **$${holding.avgPrice.toFixed(2)}**\nCurrent Price: **$${asset.price.toFixed(2)}**\nValue: **$${value.toFixed(2)}**`
      });
    }
    embed.addFields({ name: 'Total Worth', value: `$${total.toFixed(2)}` });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
