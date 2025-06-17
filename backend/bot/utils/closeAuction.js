const { EmbedBuilder } = require('discord.js');
const Auction = require('../../models/Auction');
const Wallet = require('../../models/Wallet');
const Inventory = require('../../models/Inventory');
const logError = require('./logError');

async function closeAuction(client, auctionId) {
  try {
    const auction = await Auction.findById(auctionId);
    if (!auction || auction.status === 'closed') return;

    auction.status = 'closed';
    await auction.save();

    const channel = await client.channels.fetch(auction.channelId).catch(() => null);
    const message = channel ? await channel.messages.fetch(auction.messageId).catch(() => null) : null;

    if (auction.highestBid && auction.highestBid.bidderId) {
      const sellerWallet = await Wallet.findOne({ discordId: auction.sellerId }) || await Wallet.create({ discordId: auction.sellerId });
      const buyerWallet = await Wallet.findOne({ discordId: auction.highestBid.bidderId }) || await Wallet.create({ discordId: auction.highestBid.bidderId });

      if (buyerWallet.balance >= auction.highestBid.amount) {
        buyerWallet.balance -= auction.highestBid.amount;
        sellerWallet.balance += auction.highestBid.amount;
        await Promise.all([buyerWallet.save(), sellerWallet.save()]);

        await Inventory.findOneAndUpdate(
          { discordId: auction.sellerId },
          { $pull: { items: { name: auction.itemName } } }
        );
        await Inventory.findOneAndUpdate(
          { discordId: auction.highestBid.bidderId },
          { $push: { items: { name: auction.itemName, price: auction.highestBid.amount, purchasedAt: new Date() } } },
          { upsert: true }
        );
      }
    }

    if (message) {
      const embed = EmbedBuilder.from(message.embeds[0])
        .setFooter({ text: 'Auction closed.' })
        .setColor('Grey');
      await message.edit({ embeds: [embed], components: [] });
    }
  } catch (err) {
    logError('Close auction', err);
  }
}

module.exports = closeAuction;
