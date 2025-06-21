const express = require("express");
const router = express.Router();
const Weapon = require("../models/Weapon");
const { ensureAuth } = require("../middleware/auth");

// POST /api/weapons/register
router.post("/register", async (req, res) => {
  const { civilianId, weaponType, serialNumber, registeredName } = req.body;
  if (!civilianId || !weaponType || !serialNumber || !registeredName)
    return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    const newWeapon = await Weapon.create({ civilianId, weaponType, serialNumber, registeredName });
    res.json({ success: true, weapon: newWeapon });
  } catch (err) {
    console.error("Weapon registration error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/weapons/all - for search dropdowns
router.get("/all", async (req, res) => {

  try {
    const weapons = await Weapon.find({}).populate(
      "civilianId",
      "firstName lastName"
    );
    const formatted = weapons.map((w) => ({
      _id: w._id,
      weaponType: w.weaponType,
      serialNumber: w.serialNumber,
      registeredName: w.registeredName,
      civilianName: w.civilianId
        ? `${w.civilianId.firstName} ${w.civilianId.lastName}`
        : "Unknown",
    }));
    res.json({ success: true, weapons: formatted });
  } catch (err) {
    console.error("❌ Fetch all weapons error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch weapons" });
  }
});

// GET /api/weapons/by-civilian/:id
router.get("/by-civilian/:id", async (req, res) => {
  try {
    const weapons = await Weapon.find({ civilianId: req.params.id });
    res.json({ success: true, weapons });
  } catch (err) {
    console.error("Error fetching weapons by civilian ID:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const weapon = await Weapon.findById(req.params.id);
    if (!weapon) return res.status(404).json({ success: false, message: "Weapon not found" });

    res.json({ success: true, weapon });
  } catch (err) {
    console.error("Fetch weapon error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// PUT update weapon by ID
router.put("/:id", async (req, res) => {
  try {
    const updated = await Weapon.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updated) return res.status(404).json({ success: false, message: "Weapon not found" });

    res.json({ success: true, weapon: updated });
  } catch (err) {
    console.error("Update weapon error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/weapons/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Weapon.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Weapon not found." });
    }

    res.json({ success: true, message: "Weapon deleted." });
  } catch (err) {
    console.error("Delete weapon error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


module.exports = router;
