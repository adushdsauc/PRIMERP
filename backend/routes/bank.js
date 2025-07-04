const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const BankAccount = require("../models/BankAccount");
const Transaction = require("../models/Transaction");
const Civilian = mongoose.models.Civilian || require("../models/Civilian");
const Wallet = require("../models/Wallet");
const { sendBankApprovalEmbed, sendFinancialLogEmbed } = require("../bot");
const { EmbedBuilder } = require('discord.js');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

router.get("/accounts/:civilianId", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.civilianId)) return res.status(400).json({ error: "Invalid Civilian ID" });
    const accounts = await BankAccount.find({ civilianId: req.params.civilianId });
    res.json(accounts);
  } catch (err) {
    console.error("❌ Load accounts error:", err);
    res.status(500).json({ error: "Failed to load accounts." });
  }
});

router.post("/create", async (req, res) => {
  const { civilianId, accountType, reason, needsApproval } = req.body;
  try {
    if (!isValidObjectId(civilianId)) return res.status(400).json({ error: "Invalid Civilian ID" });
    const civilian = await Civilian.findById(civilianId); // ✅ No populate here
    if (!civilian) return res.status(404).json({ error: "Civilian not found." });

    const accountNumber = Math.floor(100000000 + Math.random() * 900000000).toString();
    const status = needsApproval ? "pending" : "approved";

    const newAccount = await BankAccount.create({
      civilianId,
      accountType,
      reason,
      accountNumber,
      balance: 0,
      status,
      needsApproval
    });

    if (needsApproval) {
      await sendBankApprovalEmbed(
        `${civilian.firstName} ${civilian.lastName}`,
        civilian.discordId,
        accountType,
        reason,
        newAccount._id.toString(),
        accountNumber
      );
    }

    res.status(201).json(newAccount);
  } catch (err) {
    console.error("❌ Bank account creation failed:", err);
    res.status(500).json({ error: "Failed to create account." });
  }
});

router.post("/deposit", async (req, res) => {
  const { accountId, amount, description } = req.body;
  try {
    if (!isValidObjectId(accountId)) return res.status(400).json({ error: "Invalid account ID" });
    const account = await BankAccount.findById(accountId);
    if (!account || account.status !== "approved") return res.status(404).json({ error: "Account not found or not approved." });

    const civilian = await Civilian.findById(account.civilianId);
    if (!civilian) return res.status(404).json({ error: "Civilian not found." });

    const wallet = await Wallet.findOne({ discordId: civilian.discordId });
    if (!wallet || wallet.balance < amount) return res.status(400).json({ error: "Insufficient wallet funds." });

    wallet.balance -= amount;
    account.balance += amount;
    await Promise.all([wallet.save(), account.save()]);

    await Transaction.create({ accountId, type: "Deposit", amount, description });

    const actor = req.user ? `${req.user.globalName || req.user.username}#${req.user.discriminator}` : 'Unknown';
    const embed = new EmbedBuilder()
      .setTitle('💰 Deposit')
      .setColor('Green')
      .addFields(
        { name: 'Account', value: `#${account.accountNumber}`, inline: true },
        { name: 'Amount', value: `$${amount}`, inline: true },
        { name: 'Civilian', value: `${civilian.firstName} ${civilian.lastName}`, inline: true },
        { name: 'By', value: actor, inline: false }
      )
      .setTimestamp();
    await sendFinancialLogEmbed(embed);

    res.json({ success: true, newBalance: account.balance });
  } catch (err) {
    console.error("❌ Deposit failed:", err);
    res.status(500).json({ error: "Failed to deposit." });
  }
});

router.post("/withdraw", async (req, res) => {
  const { accountId, amount, description } = req.body;
  try {
    if (!isValidObjectId(accountId)) return res.status(400).json({ error: "Invalid account ID" });
    const account = await BankAccount.findById(accountId);
    if (!account || account.status !== "approved") return res.status(404).json({ error: "Account not found or not approved." });
    if (account.balance < amount) return res.status(400).json({ error: "Insufficient account funds." });

    const civilian = await Civilian.findById(account.civilianId);
    if (!civilian) return res.status(404).json({ error: "Civilian not found." });

    let wallet = await Wallet.findOne({ discordId: civilian.discordId });
    if (!wallet) wallet = await Wallet.create({ discordId: civilian.discordId });


    account.balance -= amount;
    wallet.balance += amount;
    await Promise.all([account.save(), wallet.save()]);

    await Transaction.create({ accountId, type: "Withdrawal", amount: -amount, description });

    const actor = req.user ? `${req.user.globalName || req.user.username}#${req.user.discriminator}` : 'Unknown';
    const embed = new EmbedBuilder()
      .setTitle('💸 Withdrawal')
      .setColor('Orange')
      .addFields(
        { name: 'Account', value: `#${account.accountNumber}`, inline: true },
        { name: 'Amount', value: `$${amount}`, inline: true },
        { name: 'Civilian', value: `${civilian.firstName} ${civilian.lastName}`, inline: true },
        { name: 'By', value: actor, inline: false }
      )
      .setTimestamp();
    await sendFinancialLogEmbed(embed);

    res.json({ success: true, newBalance: account.balance });
  } catch (err) {
    console.error("❌ Withdraw failed:", err);
    res.status(500).json({ error: "Failed to withdraw." });
  }
});

router.post("/transfer", async (req, res) => {
  const { fromAccountId, toAccountNumber, amount, description } = req.body;
  try {
    if (!isValidObjectId(fromAccountId)) return res.status(400).json({ error: "Invalid sender account ID" });

    const fromAccount = await BankAccount.findById(fromAccountId);
    const toAccount = await BankAccount.findOne({ accountNumber: toAccountNumber.toString().trim() });

    if (!fromAccount || !toAccount) return res.status(404).json({ error: "One or both accounts not found." });
    if (fromAccount.status !== "approved" || toAccount.status !== "approved") return res.status(400).json({ error: "Accounts not approved." });
    if (fromAccount.balance < amount) return res.status(400).json({ error: "Insufficient funds." });

    fromAccount.balance -= amount;
    toAccount.balance += amount;
    await Promise.all([fromAccount.save(), toAccount.save()]);

    await Transaction.insertMany([
      { accountId: fromAccount._id, type: "Transfer", amount: -amount, description: `Transfer to ${toAccount.accountNumber} - ${description || ""}` },
      { accountId: toAccount._id, type: "Transfer", amount, description: `Transfer from ${fromAccount.accountNumber} - ${description || ""}` }
    ]);

    const actor = req.user ? `${req.user.globalName || req.user.username}#${req.user.discriminator}` : 'Unknown';
    const embed = new EmbedBuilder()
      .setTitle('🔄 Transfer')
      .setColor('Blue')
      .addFields(
        { name: 'From', value: `#${fromAccount.accountNumber}`, inline: true },
        { name: 'To', value: `#${toAccount.accountNumber}`, inline: true },
        { name: 'Amount', value: `$${amount}`, inline: true },
        { name: 'By', value: actor, inline: false }
      )
      .setTimestamp();
    await sendFinancialLogEmbed(embed);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Transfer failed:", err);
    res.status(500).json({ error: "Failed to transfer." });
  }
});

router.get("/transactions/byCivilian/:civilianId", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.civilianId)) return res.status(400).json({ error: "Invalid Civilian ID" });

    const accounts = await BankAccount.find({ civilianId: req.params.civilianId, status: "approved" });
    const accountIds = accounts.map(a => a._id);
    const transactions = await Transaction.find({ accountId: { $in: accountIds } }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error("❌ Load transactions failed:", err);
    res.status(500).json({ error: "Failed to load transactions." });
  }
});

module.exports = router;
