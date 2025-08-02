const express = require("express");
const router = express.Router();
const Civilian = require("../models/Civilian");
const Vehicle = require("../models/Vehicle");
const Weapon = require("../models/Weapon");

// Autocomplete endpoints for names, vehicles and weapons
router.get("/names", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const regex = new RegExp(q, "i");
    const civilians = await Civilian.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { knownAliases: regex },
      ],
    })
      .limit(10)
      .lean();

    const results = civilians.map((c) => ({
      _id: c._id,
      name: `${c.firstName} ${c.lastName}`.trim(),
    }));

    res.json(results);
  } catch (err) {
    console.error("Name suggestion error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/vehicles", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const regex = new RegExp(q, "i");
    const vehicles = await Vehicle.find({ plate: regex })
      .limit(10)
      .lean();

    const results = vehicles.map((v) => ({
      _id: v._id,
      plate: v.plate,
    }));

    res.json(results);
  } catch (err) {
    console.error("Vehicle suggestion error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/weapons", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const regex = new RegExp(q, "i");
    const weapons = await Weapon.find({
      $or: [
        { serialNumber: regex },
        { weaponType: regex },
      ],
    })
      .limit(10)
      .lean();

    const results = weapons.map((w) => ({
      _id: w._id,
      serialNumber: w.serialNumber,
      weaponType: w.weaponType,
    }));

    res.json(results);
  } catch (err) {
    console.error("Weapon suggestion error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/", async (req, res) => {
  const { name, plate, weapon, id } = req.query;

  try {
    let civilian = null;

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

    // 🔍 ID or name-based search
    if (id || name) {
      if (id) {
        civilian = await Civilian.findById(id).lean();
      } else {
        const regex = new RegExp(name, "i");
        civilian = await Civilian.findOne({
          $or: [
            { firstName: regex },
            { lastName: regex },
            { knownAliases: regex },
          ],
        }).lean();
      }

      if (!civilian) return res.status(404).json({ error: "Civilian not found." });

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
