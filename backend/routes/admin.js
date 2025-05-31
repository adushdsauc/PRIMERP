// routes/admin.js (create if needed)
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/drop-wallet-index", async (req, res) => {
  try {
    await mongoose.connection.db.collection("wallets").dropIndex("civilianId_1");
    res.send("✅ Dropped index 'civilianId_1' on wallets collection.");
  } catch (err) {
    res.status(500).send("❌ Failed to drop index: " + err.message);
  }
});

module.exports = router;
