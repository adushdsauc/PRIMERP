require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const fetch = require("node-fetch");
const MemoryStore = require("memorystore")(session);
const { client } = require("./bot/index.js");

// Models and Routes
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
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [FRONTEND_URL]
).map((origin) => origin.trim());


// ✅ Required for Railway & HTTPS proxies (fixes cookie not setting)
app.set("trust proxy", 1);

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);

    },
    credentials: true,
  })
);

app.use(
  session({
    name: "sid",
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      domain: ".primerpcad.com", // ✅ forces cookie to your root domain (including www)
      httpOnly: true,
      secure: true,               // ✅ required on HTTPS
      sameSite: "none",           // ✅ required for cross-origin cookies
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ✅ Discord OAuth Strategy
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: `${API_BASE_URL}/auth/discord/callback`,
      scope: ["identify", "guilds", "guilds.members.read"],
    },
    async (accessToken, refreshToken, profile, done) => {
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
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Auth Routes
app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    console.log("✅ Callback reached");
    console.log("✅ Session:", req.sessionID);
    console.log("✅ User:", req.user);
    res.redirect(`${FRONTEND_URL}/home`);
  }
);

app.get("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Logout failed.");
    res.redirect(FRONTEND_URL);
  });
});

app.get("/auth/resync", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Logout failed.");
    res.redirect("/auth/discord");
  });
});

app.get("/auth/failure", (req, res) => res.send("❌ Discord login failed"));

app.get("/api/auth/me", (req, res) => {
  console.log("🧪 Cookies received:", req.headers.cookie);
  console.log("🧪 User on session:", req.user);
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
app.use((req, res, next) => {
  req.client = client;
  next();
});
app.use("/api/clock", clockRoutes);
app.use("/api/psoreports", psoReportRoutes);
app.use("/api/warrants", warrantRoutes);
app.use("/admin", adminRoutes);

// DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

// Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server live at port ${PORT}`);
});
