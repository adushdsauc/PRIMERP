const express = require("express");
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");

const router = express.Router();

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel], // Needed for DM support
});

// Bot login
(async () => {
  try {
    await bot.login(process.env.DISCORD_BOT_TOKEN);
    console.log("✅ Discord bot logged in.");
  } catch (err) {
    console.error("❌ Bot login failed:", err);
  }
})();

// DM send endpoint
router.post("/send", async (req, res) => {
  const { discordId, embed, components } = req.body;

  if (!discordId || !embed) {
    return res.status(400).json({ error: "Missing required fields: discordId or embed." });
  }

  try {
    const user = await bot.users.fetch(discordId);

    try {
      await user.send({
        embeds: [embed],
        components: components || [],
      });

      console.log(`✅ DM sent to user ${discordId}`);
      return res.json({ success: true });

    } catch (err) {
      if (err.code === 50007) {
        console.warn(`❌ Cannot send DM to ${discordId} — DMs disabled or bot blocked.`);
        return res.status(403).json({
          error: "Cannot send DMs to this user. They may have DMs disabled or blocked the bot.",
        });
      }

      console.error("❌ DM send error:", err);
      return res.status(500).json({ error: "Unexpected error sending DM." });
    }

  } catch (err) {
    console.error("❌ Failed to fetch user:", err);
    return res.status(404).json({ error: "User not found or unreachable." });
  }
});

module.exports = router;
