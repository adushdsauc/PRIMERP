const express = require("express");
const router = express.Router();
const axios = require("axios");
const TestResult = require("../models/TestResult");
const mongoose = require("mongoose");
const Civilian = mongoose.models.Civilian || require("../models/Civilian");
const { assignLicenseRole } = require("../bot");
const { ensureAuth } = require("../middleware/auth");

const DISCORD_WEBHOOK_URL = process.env.DMV_LOG_WEBHOOK;

// ✅ Save DMV test result and assign Discord role
router.post("/save-test", ensureAuth, async (req, res) => {
  const { licenseType, score, passed, answers } = req.body;
  const user = req.user;

  if (!user || !user.discordId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    console.log("📥 Incoming test submission:", {
      discordId: user.discordId,
      username: user.username,
      licenseType,
      score,
      passed,
      answers
    });

    // Save test result to database
    const result = await TestResult.create({
      discordId: user.discordId,
      username: user.username,
      licenseType,
      score,
      passed,
      answers
    });

    // Attempt to assign license role if passed
    if (passed) {
      const success = await assignLicenseRole(user.discordId, licenseType);
      if (success) {
        console.log(`✅ Assigned ${licenseType} role to ${user.username}`);
      } else {
        console.error(`❌ Failed to assign ${licenseType} role to ${user.username}`);
      }
    }

    // Attempt to send log to Discord webhook
    if (DISCORD_WEBHOOK_URL) {
      try {
        await axios.post(DISCORD_WEBHOOK_URL, {
          embeds: [
            {
              title: "📋 DMV Test Submitted",
              description: `**User:** <@${user.discordId}> (${user.username})\n**License Type:** ${licenseType}\n**Score:** ${score}/10\n**Result:** ${passed ? "✅ Passed" : "❌ Failed"}`,
              color: passed ? 0x57F287 : 0xED4245,
              timestamp: new Date().toISOString()
            }
          ]
        });
      } catch (webhookErr) {
        console.error("❌ Failed to send Discord webhook:", webhookErr);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Error saving test result:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: "Failed to save test result",
      error: err.message
    });
  }
});

// ✅ Add license to civilian (used by frontend "Add License" modal)
router.post("/add-license", ensureAuth, async (req, res) => {
  const { civilianId, licenseType } = req.body;

  if (!req.user?.discordId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const civilian = await Civilian.findById(civilianId);
    if (!civilian) {
      return res.status(404).json({ success: false, message: "Civilian not found" });
    }

    if (civilian.discordId !== req.user.discordId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (civilian.licenses.includes(licenseType)) {
      return res.status(400).json({ success: false, message: "License already exists" });
    }

    civilian.licenses.push(licenseType);
    await civilian.save();

    return res.json({ success: true, civilian });
  } catch (err) {
    console.error("❌ Add license error:", err.stack || err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;
