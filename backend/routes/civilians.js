const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Civilian = mongoose.models.Civilian || require("../models/Civilian");
const { ensureAuth } = require("../middleware/auth");

// GET all civilians (admin/staff access)
router.get("/all", async (req, res) => {
  try {
    const civilians = await Civilian.find({});
    res.json({ success: true, civilians });
  } catch (err) {
    console.error("❌ Fetch all civilians error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch civilians" });
  }
});

// GET civilians for the logged-in user
router.get("/", ensureAuth, async (req, res) => {
  try {
    const discordId = req.user?.discordId;
    if (!discordId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing Discord ID" });
    }

    const civilians = await Civilian.find({ discordId });
    res.json({ success: true, civilians });
  } catch (err) {
    console.error("❌ Fetch civilians error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch civilians" });
  }
});

// GET single civilian by ID
router.get("/:id", ensureAuth, async (req, res) => {
  try {
    console.log("📥 Hit GET /api/civilians/:id");
    const populate = req.query.populate === "true";
    console.log("➡️ Requested ID:", req.params.id);
    console.log("➡️ Populate mode:", populate);

    let query = Civilian.findById(req.params.id);
    if (populate) {
      query = query.populate("vehicles").populate("weapons");
    }

    const civilian = await query;
    if (!civilian) {
      console.warn("⚠️ Civilian not found.");
      return res.status(404).json({ success: false, message: "Civilian not found" });
    }

    console.log("✅ Civilian found:", civilian._id);
    res.json({ success: true, civilian });
  } catch (err) {
    console.error("❌ Fetch single civilian error:", err.stack || err.message || err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});


// CREATE new civilian
router.post("/", ensureAuth, async (req, res) => {
  try {
    const discordId = req.user?.discordId;
    if (!discordId) return res.status(400).json({ success: false, message: "Missing Discord ID" });

    const newCiv = new Civilian({ ...req.body, discordId });
    await newCiv.save();

    res.status(201).json({ success: true, civilian: newCiv });
  } catch (err) {
    console.error("❌ Create civilian error:", err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// UPDATE civilian
router.put("/:id", ensureAuth, async (req, res) => {
  try {
    const civ = await Civilian.findById(req.params.id);
    if (!civ) return res.status(404).json({ success: false, message: "Civilian not found" });

    Object.assign(civ, req.body);
    await civ.save();

    res.json({ success: true, civilian: civ });
  } catch (err) {
    console.error("❌ Update civilian error:", err);
    res.status(400).json({ success: false, message: "Failed to update civilian" });
  }
});

// PATCH civilian (partial update)
router.patch("/:id", ensureAuth, async (req, res) => {
  try {
    const updated = await Civilian.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: "Civilian not found" });

    res.json({ success: true, civilian: updated });
  } catch (err) {
    console.error("❌ Patch civilian error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE civilian
router.delete("/:id", ensureAuth, async (req, res) => {
  try {
    const deleted = await Civilian.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Civilian not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Delete civilian error:", err);
    res.status(500).json({ success: false, message: "Server error deleting civilian" });
  }
});

// ADD LICENSE
router.post("/:id/add-license", ensureAuth, async (req, res) => {
  try {
    const licenseType = req.body.license;
    const discordId = req.user?.discordId;

    // Map license names to Discord role IDs. Allow environment variables to
    // override the defaults.
    const LICENSE_ROLE_MAP = {
      "Class C - Standard Drivers License":
        process.env.ROLE_DRIVER || "1372243631766896680",
      "Class M - Motorcycle License":
        process.env.ROLE_MOTORCYCLE || "1372243630613598258",
      "Class A - CDL Class A License":
        process.env.ROLE_CDL_A || "1370192296162885672",
      "Class B - CDL Class B License":
        process.env.ROLE_CDL_B || "1370192299195236352",
    };

    const requiredRoleId = LICENSE_ROLE_MAP[licenseType];
    if (!requiredRoleId) return res.status(400).json({ success: false, message: "Invalid license type" });
    if (!req.user.roles?.includes(requiredRoleId)) return res.status(403).json({ success: false, message: "Missing required license role" });

    const civ = await Civilian.findById(req.params.id);
    if (!civ) return res.status(404).json({ success: false, message: "Civilian not found" });

    if (!civ.licenses.includes(licenseType)) {
      civ.licenses.push(licenseType);
      await civ.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Add license error:", err);
    res.status(500).json({ success: false, message: "Server error adding license" });
  }
});

module.exports = router;
