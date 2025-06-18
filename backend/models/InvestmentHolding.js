const mongoose = require('mongoose');

const InvestmentHoldingSchema = new mongoose.Schema({
  discordId: { type: String, required: true },
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentAsset', required: true },
  quantity: { type: Number, default: 0 },
  avgPrice: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('InvestmentHolding', InvestmentHoldingSchema);
