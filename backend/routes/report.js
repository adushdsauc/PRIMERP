const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Civilian = mongoose.models.Civilian || require("../models/Civilian");
const { jailUser } = require("../utilities");
const { trackFine, client } = require("../bot");
const { Types } = require("mongoose");

router.post("/create", async (req, res) => {
  try {
    const {
      civilianId,
      type,
      officer,
      reason,
      fineAmount,
      jailTime,
      notes,
      platform
    } = req.body;

    if (!civilianId || !type || !officer || !reason || !platform) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const civilian = await Civilian.findById(civilianId);
    if (!civilian) return res.status(404).json({ error: "Civilian not found." });

    if (!Array.isArray(civilian.reports)) {
      civilian.reports = [];
    }

    const reportId = new Types.ObjectId();

    civilian.reports.push({
      reportId,
      offense: reason,
      fine: fineAmount,
      jailTime,
      type,
      notes,
      officerName: officer,
      timestamp: new Date(),
      paid: false,
    });

    await civilian.save();

    if (jailTime && jailTime > 0) {
      jailUser(client, civilian.discordId, jailTime, platform.toLowerCase());
    }

    return res.json({ recordId: reportId });
  } catch (err) {
    console.error("❌ Report creation error:", err);
    return res.status(500).json({ error: "Failed to create report." });
  }
});

// POST /api/reports/track-fine
router.post("/track-fine", async (req, res) => {
  const { civilianId, reportId, messageId, channelId, platform } = req.body;

  try {
    await trackFine({ civilianId, reportId, messageId, channelId, platform });
    return res.json({ success: true });
  } catch (err) {
    console.error("trackFine error:", err);
    return res.status(500).json({ error: "Failed to start fine tracker." });
  }
});

module.exports = router;
