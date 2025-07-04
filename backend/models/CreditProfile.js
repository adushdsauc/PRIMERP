const mongoose = require('mongoose');

const CreditProfileSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  score: { type: Number, default: 600 }
}, { timestamps: true });

module.exports = mongoose.model('CreditProfile', CreditProfileSchema);
