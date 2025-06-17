const mongoose = require('mongoose');

const AuctionSchema = new mongoose.Schema({
  sellerId: { type: String, required: true },
  itemName: { type: String, required: true },
  startingBid: { type: Number, required: true },
  buyoutPrice: { type: Number, required: true },
  highestBid: {
    amount: Number,
    bidderId: String
  },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  endDate: { type: Date, required: true },
  channelId: String,
  messageId: String,
}, { timestamps: true });

module.exports = mongoose.model('Auction', AuctionSchema);
