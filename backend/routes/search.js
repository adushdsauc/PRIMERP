const express = require("express");
const router = express.Router();
const Civilian = require("../models/Civilian");
const Vehicle = require("../models/Vehicle");
const Weapon = require("../models/Weapon");

router.get("/", async (req, res) => {
  const { name, plate, weapon } = req.query;

  try {
    let civilian = null;

    // 🔍 Name-based search
    if (name) {
      const trimmed = name.trim();
      if (trimmed.includes(" ")) {
        const parts = trimmed.split(/\s+/);
        const first = parts.shift();
        const last = parts.join(" ");
        civilian = await Civilian.findOne({
          firstName: new RegExp(first, "i"),
          lastName: new RegExp(last, "i"),
        }).lean();
      }

      if (!civilian) {
        const regex = new RegExp(trimmed, "i");
        civilian = await Civilian.findOne({
          $or: [
            { firstName: regex },
            { lastName: regex },
            { knownAliases: regex },
          ],
        }).lean();
      }

      if (!civilian) return res.status(404).json({ error: "Civilian not found." });
    }

    // 🚗 Plate-based search
    if (plate) {
      const vehicle = await Vehicle.findOne({ plate: new RegExp(`^${plate}$`, "i") }).lean();
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found." });

      civilian = await Civilian.findById(vehicle.civilianId).lean();
      if (!civilian) return res.status(404).json({ error: "Owner not found." });

      const vehicles = await Vehicle.find({ civilianId: civilian._id }).lean();
      const weapons = await Weapon.find({ civilianId: civilian._id }).lean();

      return res.json({ vehicle, civilian: { ...civilian, vehicles, weapons } });
    }

    // 🔫 Weapon-based search
    if (weapon) {
      const foundWeapon = await Weapon.findOne({
        $or: [
          { serialNumber: new RegExp(weapon, "i") },
          { weaponType: new RegExp(weapon, "i") },
        ],
      }).lean();

      if (!foundWeapon) return res.status(404).json({ error: "Weapon not found." });

      civilian = await Civilian.findById(foundWeapon.civilianId).lean();
      if (!civilian) return res.status(404).json({ error: "Owner not found." });

      const vehicles = await Vehicle.find({ civilianId: civilian._id }).lean();
      const weapons = await Weapon.find({ civilianId: civilian._id }).lean();

      return res.json({ weapon: foundWeapon, civilian: { ...civilian, vehicles, weapons } });
    }

    // Only do this if name-based search succeeded
    if (civilian) {
      const vehicles = await Vehicle.find({ civilianId: civilian._id }).lean();
      const weapons = await Weapon.find({ civilianId: civilian._id }).lean();

      return res.json({ ...civilian, vehicles, weapons });
    }

    return res.status(400).json({ error: "No valid search query." });
  } catch (err) {
    console.error("Search API error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
