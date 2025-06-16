const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Civilian = mongoose.models.Civilian || require("../models/Civilian");
const { Types } = require("mongoose");
const { jailUser } = require("../utilities");
const { trackFine, client } = require("../bot");

// POST /api/reports/create
router.post("/create", async (req, res) => {
  try {
    console.log("Incoming request:", req.body);
    const {
      civilianId,
      type,
      officer,
      reason,
      fineAmount,
      jailTime,
      notes,
      platform,
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
    console.error("Report creation error:", err);
    return res.status(500).json({ error: "Failed to create report." });
  }
});

// POST /api/reports/track-fine
router.post("/fix-corrupted-reports", async (req, res) => {
  try {
    const corrupted = await Civilian.find({ reports: { $type: "string" } });

    for (const civ of corrupted) {
      civ.reports = [];
      await civ.save();
      console.log(`✅ Fixed ${civ.firstName} ${civ.lastName}`);
    }

    return res.json({ fixed: corrupted.length });
  } catch (err) {
    console.error("Fix corrupted reports error:", err);
    return res.status(500).json({ error: "Failed to fix reports." });
  }
});

module.exports = router;
