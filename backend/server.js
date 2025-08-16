// server.js
require("dotenv").config();

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const fetch = require("node-fetch");
const MemoryStore = require("memorystore")(session);

// Your Discord bot client
const { client } = require("./bot/index.js");

// Models & Routes
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

/* =========================
   Core Config / Environment
   ========================= */
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";

// Frontend (site shown to users)
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (NODE_ENV === "production" ? "https://primerpcad.com" : "http://localhost:3000");

// Public API base (used to build OAuth callback URL)
const API_BASE_URL =
  process.env.API_BASE_URL ||
  (NODE_ENV === "production" ? "https://api.primerpcad.com" : "http://localhost:8080");

// Allowed CORS origins (comma-separated in env) or sensible defaults
const DEFAULT_ORIGINS = [
  "https://primerpcad.com",
  "https://www.primerpcad.com",
  "http://localhost:3000",
];
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : DEFAULT_ORIGINS
).map((o) => o.trim());

// Cookie settings
const IS_PROD = NODE_ENV === "production";
// If you are proxying via Vercel (frontend calls /api) you can use "lax"; if calling the api subdomain directly, use "none".
const COOKIE_SAMESITE =
  process.env.COOKIE_SAMESITE || (process.env.PROXY_MODE === "true" ? "lax" : "none");
const COOKIE_DOMAIN = IS_PROD ? ".primerpcad.com" : undefined; // don't set a domain for localhost

/* =========================
   Trust Proxy & Parsers
   ========================= */
app.set("trust proxy", 1); // needed for secure cookies behind Railway/Proxies
app.use(express.json());

/* =========================
   CORS (must be before routes)
   ========================= */
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser requests (no Origin) and whitelisted origins
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// Preflight
app.options("*", cors());

/* =========================
   Session & Passport
   ========================= */
app.use(
  session({
    name: "sid",
    store: new MemoryStore({ checkPeriod: 86400000 }), // prune expired entries every 24h
    secret: process.env.SESSION_SECRET || "change-me",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      domain: COOKIE_DOMAIN,  // .primerpcad.com in prod, unset in dev
      secure: IS_PROD,        // secure cookies over HTTPS only in prod
      httpOnly: true,
      sameSite: COOKIE_SAMESITE, // "none" for true cross-site; "lax" if using proxy
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* =========================
   Discord OAuth
   ========================= */
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
        const guildIds = (process.env.DISCORD_GUILD_IDS || "").split(",").map((g) => g.trim()).filter(Boolean);
        const botToken = process.env.DISCORD_BOT_TOKEN;
        let allRoles = [];

        for (const guildId of guildIds) {
          const res = await fetch(
            `https://discord.com/api/v10/guilds/${guildId}/members/${profile.id}`,
            { headers: { Authorization: `Bot ${botToken}` } }
          );
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

/* =========================
   Auth Endpoints
   ========================= */
app.get("/auth/discord", passport.authenticate("discord"));

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/auth/failure" }),
  (req, res) => {
    console.log("✅ OAuth callback reached");
    console.log("✅ Session:", req.sessionID);
    console.log("✅ User:", req.user);
    // after login, send user back to the app
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

/* =========================
   Health & WhoAmI
   ========================= */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: NODE_ENV, time: new Date().toISOString() });
});

app.get("/api/auth/me", (req, res) => {
  console.log("🧪 Cookies:", req.headers.cookie || "(none)");
  console.log("🧪 User:", req.user || "(none)");
  if (!req.user) return res.status(401).json({ message: "Not logged in" });
  res.json(req.user);
});

/* =========================
   Mount Routes
   ========================= */
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

// make discord client available to routes that need it
app.use((req, _res, next) => {
  req.client = client;
  next();
});
app.use("/api/clock", clockRoutes);
app.use("/api/psoreports", psoReportRoutes);
app.use("/api/warrants", warrantRoutes);
app.use("/admin", adminRoutes);

/* =========================
   Database & Server
   ========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server live on port ${PORT}`);
  console.log(`   NODE_ENV=${NODE_ENV}`);
  console.log(`   FRONTEND_URL=${FRONTEND_URL}`);
  console.log(`   API_BASE_URL=${API_BASE_URL}`);
  console.log(`   ALLOWED_ORIGINS=${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`   COOKIE_DOMAIN=${COOKIE_DOMAIN || "(host-only)"}`);
  console.log(`   COOKIE_SAMESITE=${COOKIE_SAMESITE}`);
});
