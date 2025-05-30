require("dotenv").config();

const express = require("express");
const router = express.Router();
const Warrant = require("../models/Warrant");
const Civilian = require("../models/Civilian");
const axios = require("axios");

const WEBHOOKS = {
  Xbox: process.env.XBOX_WARRANT_WEBHOOK,
  PlayStation: process.env.PS_WARRANT_WEBHOOK,
};
  
  router.get("/all", async (req, res) => {
    try {
      const warrants = await Warrant.find({})
        .populate("civilianId")
        .sort({ createdAt: -1 });
      res.json(warrants);
    } catch (err) {
      console.error("❌ Fetch all warrants error:", err);
      res.status(500).json({ error: "Failed to fetch warrants" });
    }
  });
  
// Create new warrant (platform-aware)
router.post("/create", async (req, res) => {
    const { civilianId, type, reason, officerName, officerCallsign, expiresAt, platform } = req.body;
    console.log("📥 Received payload:", req.body);
    try {
      const civilian = await Civilian.findById(civilianId);
      if (!civilian) return res.status(404).json({ error: "Civilian not found" });
  
      const warrant = await Warrant.create({
        civilianId,
        type,
        reason,
        officerName,
        officerCallsign,
        expiresAt: expiresAt || null,
        platform  // ✅ Add this!
      });      
  
      // Determine correct webhook
      const webhookUrl = WEBHOOKS?.[platform];
      if (!webhookUrl) return res.status(400).json({ error: "Invalid platform for webhook" });
  
      // Build Discord embed
      const embed = {
        title: "🔴 New Warrant Issued",
        color: 0xff0000,
        fields: [
          { name: "Civilian", value: `${civilian.firstName} ${civilian.lastName}` },
          { name: "Platform", value: platform, inline: true },
          { name: "Warrant Type", value: type, inline: true },
          { name: "Reason", value: reason },
          { name: "Issued By", value: `${officerName} (${officerCallsign})`, inline: true },
          { name: "Status", value: "Active", inline: true },
          { name: "Expires", value: expiresAt ? `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:R>` : "N/A" }
        ],
        timestamp: new Date().toISOString()
      };
  
      await axios.post(webhookUrl, { embeds: [embed] });
  
      res.status(201).json({ message: "Warrant created", warrant });
    } catch (err) {
      console.error("Warrant creation error:", err);
      res.status(500).json({ error: "Failed to create warrant" });
    }
  });  

// Resolve a warrant
router.post("/resolve/:id", async (req, res) => {
  try {
    const warrant = await Warrant.findById(req.params.id);
    if (!warrant) return res.status(404).json({ error: "Warrant not found" });

    warrant.status = "Resolved";
    await warrant.save();

    res.json({ message: "Warrant resolved", warrant });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve warrant" });
  }
});

module.exports = router;
