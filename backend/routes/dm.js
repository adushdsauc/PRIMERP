const express = require("express");
const router = express.Router();
const { Client, GatewayIntentBits } = require("discord.js");

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ['CHANNEL'], // Required to receive DMs
});

// Login bot
(async () => {
  try {
    await bot.login(process.env.DISCORD_BOT_TOKEN);
    console.log("✅ Discord bot logged in");
  } catch (err) {
    console.error("❌ Failed to log in Discord bot:", err);
  }
})();

router.post("/send", async (req, res) => {
  const { discordId, embed, components } = req.body;

  if (!discordId || !embed) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const user = await bot.users.fetch(discordId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    await user.send({
      embeds: [embed],
      components: components || [],
    });

    return res.json({ success: true });
  } catch (err) {
    if (err.code === 50007) {
      console.warn(`❌ Cannot send DM to ${discordId} — likely has DMs off or blocked the bot.`);
      return res.status(403).json({ error: "Cannot send DMs to this user. DMs may be disabled or the bot is blocked." });
    }

    console.error("DM send error:", err);
    return res.status(500).json({ error: "Failed to send DM due to an unexpected error." });
  }
});

module.exports = router;
