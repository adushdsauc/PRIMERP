const mongoose = require('mongoose');

const InvestmentAssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  identifier: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  risk: { type: Number, required: true },
  price: { type: Number, default: 100 },
  eventModifier: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('InvestmentAsset', InvestmentAssetSchema);
