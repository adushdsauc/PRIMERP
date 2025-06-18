const fs = require('fs');
const path = require('path');
const InvestmentAsset = require('../../models/InvestmentAsset');
const { EmbedBuilder } = require('discord.js');
const logError = require('./logError');

async function updatePrices(client) {
  try {
    let assets = await InvestmentAsset.find();
    if (assets.length === 0) {
      const filePath = path.join(__dirname, '../../data/investments.json');
      const seed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assets = await InvestmentAsset.insertMany(seed.map(s => ({
        name: s.name,
        identifier: s.identifier,
        category: s.category,
        risk: s.risk,
        price: 100
      })));
    }
    for (const asset of assets) {
      // base change based on risk
      const volatility = asset.risk / 50; // risk 10 -> 0.2
      let changePercent = (Math.random() * volatility * 2 - volatility) * 100; // -volatility..volatility percent
      // apply event modifier if present
      if (asset.eventModifier) {
        changePercent += asset.eventModifier * asset.risk * 2;
        asset.eventModifier = 0;
      }

      const newPrice = Math.max(1, Math.round(asset.price * (1 + changePercent / 100)));
      asset.price = newPrice;
      await asset.save();
    }

    if (client) {
      const channelId = process.env.MARKET_CHANNEL_ID || '1372730256032665731';
      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (channel) {
        const lines = assets.map(a => `${a.identifier}: $${a.price.toLocaleString()}`).join('\n');
        const embed = new EmbedBuilder()
          .setTitle('📈 Market Update')
          .setDescription(lines)
          .setColor('Blue')
          .setTimestamp();
        await channel.send({ embeds: [embed] });
      }
    }
  } catch (err) {
    logError('Update investment prices', err);
  }
}

function scheduleInvestmentUpdates(client) {
  // run immediately and then every 12 hours
  updatePrices(client);
  setInterval(() => updatePrices(client), 1000 * 60 * 60 * 12);
}

module.exports = scheduleInvestmentUpdates;
