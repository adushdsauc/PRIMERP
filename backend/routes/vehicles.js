const express = require("express");
const router = express.Router();
const Vehicle = require("../models/Vehicle");
const mongoose = require("mongoose");
const Civilian = mongoose.models.Civilian || require("../models/Civilian");
const { ensureAuth } = require("../middleware/auth");

// POST /api/vehicles/register
router.post("/register", async (req, res) => {
  try {
    const { civilianId, plate, make, model, year, color, insured, type } = req.body;

    if (!civilianId || !plate || !make || !model || !year || !color || !type) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const vehicle = await Vehicle.create({ civilianId, plate, make, model, year, color, insured, type });

    res.json({ success: true, vehicle });
  } catch (err) {
    console.error("Vehicle registration error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// GET /api/vehicles/my
router.get("/my", async (req, res) => {
  try {
    if (!req.user?.discordId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const civilians = await Civilian.find({ discordId: req.user.discordId });
    if (!civilians.length) return res.json({ success: true, vehicles: [] });

    const civilianIds = civilians.map((c) => c._id);
    const vehicles = await Vehicle.find({ civilianId: { $in: civilianIds } }).populate("civilianId", "firstName lastName");

    const formatted = vehicles.map((v) => ({
      _id: v._id,
      plate: v.plate,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      insured: v.insured,
      type: v.type,
      civilianName: v.civilianId ? `${v.civilianId.firstName} ${v.civilianId.lastName}` : "Unknown"
    }));

    res.json({ success: true, vehicles: formatted });
  } catch (err) {
    console.error("My vehicles fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/vehicles/by-civilian/:id
router.get("/by-civilian/:id", async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ civilianId: req.params.id });
    res.json({ success: true, vehicles });
  } catch (err) {
    console.error("Vehicle fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/vehicles/all - for search dropdowns
router.get("/all", async (req, res) => {


  try {
    const vehicles = await Vehicle.find({}).populate(
      "civilianId",
      "firstName lastName"
    );
    const formatted = vehicles.map((v) => ({
      _id: v._id,
      plate: v.plate,
      make: v.make,
      model: v.model,
      color: v.color,
      year: v.year,
      civilianName: v.civilianId
        ? `${v.civilianId.firstName} ${v.civilianId.lastName}`
        : "Unknown",
    }));
    res.json({ success: true, vehicles: formatted });
  } catch (err) {
    console.error("❌ Fetch all vehicles error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch vehicles" });
  }
});

// PUT /api/vehicles/:id
router.put("/:id", async (req, res) => {
  try {
    const updateFields = (({ plate, make, model, year, color, insured, type }) => ({ plate, make, model, year, color, insured, type }))(req.body);
    const updated = await Vehicle.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    if (!updated) return res.status(404).json({ success: false, message: "Vehicle not found." });

    res.json({ success: true, vehicle: updated });
  } catch (err) {
    console.error("Update vehicle error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// DELETE /api/vehicles/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Vehicle not found." });

    res.json({ success: true, message: "Vehicle deleted." });
  } catch (err) {
    console.error("Delete vehicle error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
