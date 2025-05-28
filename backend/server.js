require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const fetch = require("node-fetch");
const MemoryStore = require("memorystore")(session);
const { client } = require("./bot");

const User = require("./models/User");
const civilianRoutes = require("./routes/civilians");
const licenseRoutes = require("./routes/licenses");
const vehicleRoutes = require("./routes/vehicles");
const authRoutes = require("./routes/auth");
const officerRoutes = require("./routes/officers");
const bankRoutes = require("./routes/bank");
const walletRoutes = require("./routes/wallet");
const weaponRoutes = require("./routes/weapons");
const medicalRecordRoutes = require("./routes/medicalRecords");
const searchRoutes = require("./routes/search");
const penalCodeRoutes = require("./routes/penalCodes");
const reportRoutes = require("./routes/reports");
const dmRoutes = require("./routes/dm");
const callRoutes = require("./routes/calls");
const boloRoutes = require("./routes/bolos");
const clockRoutes = require("./routes/clock");
const psoReportRoutes = require("./routes/psoreports");
const warrantRoutes = require("./routes/warrants");

const app = express();
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.primerpcad.com";
const API_BASE_URL = process.env.API_BASE_URL || "https://primerp-production-6780.up.railway.app";

// ✅ Needed for Railway proxies
app.set("trust proxy", 1);

app.use(express.json());

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(session({
  name: "sid",
  store: new MemoryStore({ checkPeriod: 86400000 }),
  secret: process.env.SESSION_SECRET || "super-secret-session",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".primerpcad.com", // ✅ Make sure this matches your domain
  },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: `${API_BASE_URL}/auth/discord/callback`,
  scope: ["identify", "guilds", "guilds.members.read"],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const guildIds = process.env.DISCORD_GUILD_IDS.split(",");
    const botToken = process.env.DISCORD_BOT_TOKEN;
    let allRoles = [];

    for (const guildId of guildIds) {
      const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${profile.id}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (!res.ok) continue;
      const member = await res.json();
      if (Array.isArray(member.roles)) {
        allRoles = [...new Set([...allRoles, ...member.roles])];
      }
    }

    let user = await User.findOne({ discordId: profile.id });
    if (!user) {
      user = await User.create({
        discordId: profile.id,
        username: profile.username,
        discriminator: profile.discriminator,
        avatar: profile.avatar,
        globalName: profile.global_name,
      });
    }

    return done(null, {
      discordId: profile.id,
      username: profile.username,
      discriminator: profile.discriminator,
      avatar: profile.avatar,
      globalName: profile.global_name,
      roles: allRoles,
    });
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Auth Routes
app.get("/auth/discord", passport.authenticate("discord"));
app.get("/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/auth/failure" }),
  (req, res) => res.redirect(`${FRONTEND_URL}/home`)
);
app.get("/auth/logout", (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).send("Logout failed.");
    res.redirect(FRONTEND_URL);
  });
});
app.get("/auth/failure", (req, res) => res.send("❌ Discord login failed"));
app.get("/api/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not logged in" });
  res.json(req.user);
});

// Routes
app.use("/api/civilians", civilianRoutes);
app.use("/api/licenses", licenseRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/officers", officerRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/weapons", weaponRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/penal-codes", penalCodeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dm", dmRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/bolos", boloRoutes);
app.use((req, res, next) => { req.client = client; next(); });
app.use("/api/clock", clockRoutes);
app.use("/api/psoreports", psoReportRoutes);
app.use("/api/warrants", warrantRoutes);

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at port ${PORT}`);
});
