const mongoose = require("mongoose");

const BankAccountSchema = new mongoose.Schema({
  civilianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Civilian",
    required: true,
  },
  accountType: {
    type: String,
    enum: ["Checking", "Savings", "Business Checking", "Business Savings"],
    required: true,
  },
  name: {
    type: String,
    default: null,
  },
  accountNumber: {
    type: String,
    unique: true,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["approved", "pending"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("BankAccount", BankAccountSchema);
