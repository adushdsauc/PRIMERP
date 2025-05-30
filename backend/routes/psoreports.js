require("dotenv").config();

const express = require("express");
const router = express.Router();
const axios = require("axios");
const Officer = require("../models/Officer");

// Platform + ReportType → Webhook map
const WEBHOOKS = {
  Xbox: {
    "use-of-force": process.env.XBOX_USE_OF_FORCE_WEBHOOK,
    "10-50": process.env.XBOX_10_50_WEBHOOK,
    "scene-report": process.env.XBOX_SCENE_REPORT_WEBHOOK
  },
  PlayStation: {
    "use-of-force": process.env.PS_USE_OF_FORCE_WEBHOOK,
    "10-50": process.env.PS_10_50_WEBHOOK,
    "scene-report": process.env.PS_SCENE_REPORT_WEBHOOK
  }
};

// Send embed to the correct webhook
async function sendReportToWebhook(platform, type, embed) {
  const webhookUrl = WEBHOOKS?.[platform]?.[type];
  if (!webhookUrl) throw new Error(`No webhook configured for ${platform}/${type}`);
  await axios.post(webhookUrl, { embeds: [embed] });
}

router.post("/use-of-force", async (req, res) => {
    const {
      discordUsername, officerName, officerRank,
      discharged, reason, justification, lawsBroken, successful, additionalInfo
    } = req.body;
  
    try {
      const officer = await Officer.findOne({ discordId: discordUsername });
      if (!officer || !officer.department) return res.status(400).json({ error: "Officer/department not found" });
  
      const embed = {
        title: "Use of Force Report",
        color: 0x3498db,
        fields: [
            { name: "Discord User", value: `<@${officer.discordId}>`, inline: false },
            { name: "Officer Name", value: `${officer.firstName} ${officer.lastName}`, inline: true },
            { name: "Officer Callsign & Rank", value: `${officerName} (${officerRank})`, inline: true },
          { name: "Weapon Discharged", value: discharged, inline: false },
          { name: "Reason", value: reason || "N/A" },
          { name: "Justification", value: justification || "N/A" },
          { name: "Laws Broken", value: lawsBroken || "N/A" },
          { name: "Was it Successful?", value: successful, inline: false },
          { name: "Additional Info", value: additionalInfo || "None" }
        ],
        timestamp: new Date().toISOString()
      };
  
      await sendReportToWebhook(officer.department, "use-of-force", embed);
      res.status(200).json({ message: "Use of force report sent." });
    } catch (err) {
      console.error("Use of force error:", err);
      res.status(500).json({ error: "Failed to send use of force report." });
    }
  });
  
// 10-50 Accident Report
router.post("/10-50", async (req, res) => {
  const {
    discordUsername, officerName, officerRank,
    location, timeOfDay, accidentType, how, witnesses, civilians
  } = req.body;

  try {
    const officer = await Officer.findOne({ discordId: discordUsername });
    if (!officer || !officer.department) return res.status(400).json({ error: "Officer/department not found" });

    const embed = {
      title: "10-50 Accident Report",
      color: 0xe67e22,
      fields: [
        { name: "Officer Name", value: `${officer.firstName} ${officer.lastName}`, inline: true },
        { name: "Officer Callsign & Rank", value: `${officerName} (${officerRank})`, inline: true },
        { name: "Discord User", value: `<@${officer.discordId}>`, inline: false },
        { name: "Location of Accident", value: location || "N/A" },
        { name: "Time of Day", value: timeOfDay || "N/A", inline: true },
        { name: "Type of Accident", value: accidentType || "N/A", inline: true },
        { name: "How It Happened", value: how || "N/A" },
        { name: "Witnesses", value: witnesses || "None" },
        { name: "Civilians Involved", value: civilians || "None" }
      ],
      timestamp: new Date().toISOString()
    };

    await sendReportToWebhook(officer.department, "10-50", embed);
    res.status(200).json({ message: "10-50 report sent." });
  } catch (err) {
    console.error("10-50 report error:", err);
    res.status(500).json({ error: "Failed to send 10-50 report." });
  }
});

// Scene Report
router.post("/scene-report", async (req, res) => {
  const {
    discordUsername, officerName, officerRank,
    involvedCivilians, involvedOfficers, location, timeOfDay,
    whatHappened, how, witnesses, verdicts
  } = req.body;

  try {
    const officer = await Officer.findOne({ discordId: discordUsername });
    if (!officer || !officer.department) return res.status(400).json({ error: "Officer/department not found" });

    const embed = {
      title: "Scene Report",
      color: 0x9b59b6,
      fields: [
        { name: "Officer Name", value: `${officer.firstName} ${officer.lastName}`, inline: true },
        { name: "Officer Callsign & Rank", value: `${officerName} (${officerRank})`, inline: true },
        { name: "Discord User", value: `<@${officer.discordId}>`, inline: false },
        { name: "Location", value: location || "N/A" },
        { name: "Time of Day", value: timeOfDay || "N/A", inline: true },
        { name: "Civilians Involved", value: involvedCivilians || "None" },
        { name: "Other Officers Involved", value: involvedOfficers || "None" },
        { name: "What Happened", value: whatHappened || "N/A" },
        { name: "How It Happened", value: how || "N/A" },
        { name: "Witnesses", value: witnesses || "None" },
        { name: "Verdict / Outcome", value: verdicts || "N/A" }
      ],
      timestamp: new Date().toISOString()
    };

    await sendReportToWebhook(officer.department, "scene-report", embed);
    res.status(200).json({ message: "Scene report sent." });
  } catch (err) {
    console.error("Scene report error:", err);
    res.status(500).json({ error: "Failed to send scene report." });
  }
});

module.exports = router;
