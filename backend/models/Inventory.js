const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
});

const inventorySchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  items: [itemSchema],
});

module.exports = mongoose.model("Inventory", inventorySchema);
