const express = require("express");
const router = express.Router();
const Civilian = require("../models/Civilian");
const Vehicle = require("../models/Vehicle");
const Weapon = require("../models/Weapon");

router.get("/", async (req, res) => {
  const { name, plate, weapon } = req.query;

  try {
    // 🔍 Name-based search
    if (name) {
      const trimmed = name.trim();
      let civilians = [];

      if (trimmed.includes(" ")) {
        const parts = trimmed.split(/\s+/);
        const first = parts.shift();
        const last = parts.join(" ");
        civilians = await Civilian.find({
          firstName: new RegExp(first, "i"),
          lastName: new RegExp(last, "i"),
        }).lean();
      }

      if (civilians.length === 0) {
        const regex = new RegExp(trimmed, "i");
        civilians = await Civilian.find({
          $or: [
            { firstName: regex },
            { lastName: regex },
            { knownAliases: regex },
          ],
        }).lean();
      }

      if (civilians.length === 0) {
        return res.status(404).json({ error: "Civilian not found." });
      }

      const results = await Promise.all(
        civilians.map(async (civ) => {
          const vehicles = await Vehicle.find({ civilianId: civ._id }).lean();
          const weapons = await Weapon.find({ civilianId: civ._id }).lean();
          return { ...civ, vehicles, weapons };
        })
      );

      return res.json({ civilians: results });
    }

    // 🚗 Plate-based search
    if (plate) {
      const vehicles = await Vehicle.find({
        plate: new RegExp(`^${plate}$`, "i"),
      }).lean();

      if (vehicles.length === 0) {
        return res.status(404).json({ error: "Vehicle not found." });
      }

      const results = await Promise.all(
        vehicles.map(async (vehicle) => {
          const civilian = await Civilian.findById(vehicle.civilianId).lean();
          return { vehicle, civilian };
        })
      );

      return res.json({ vehicles: results });
    }

    // 🔫 Weapon-based search
    if (weapon) {
      const weapons = await Weapon.find({
        $or: [
          { serialNumber: new RegExp(weapon, "i") },
          { weaponType: new RegExp(weapon, "i") },
        ],
      }).lean();

      if (weapons.length === 0) {
        return res.status(404).json({ error: "Weapon not found." });
      }

      const results = await Promise.all(
        weapons.map(async (weaponDoc) => {
          const civilian = await Civilian.findById(weaponDoc.civilianId).lean();
          return { weapon: weaponDoc, civilian };
        })
      );

      return res.json({ weapons: results });
    }

    return res.status(400).json({ error: "No valid search query." });
  } catch (err) {
    console.error("Search API error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
