// Search Database UI (finalized layout with full civilian info toggle and full detail sections)
import React, { useState, useEffect, Fragment } from "react";
import api from "../../utils/axios";

// The build previously failed because this component attempted to
// reset state hooks that were never defined. Those lines were removed
// so ESLint no longer reports `no-undef` errors.

import { Combobox, Transition } from "@headlessui/react";

export default function SearchDatabase() {
  // Selected search values
  const [nameQuery, setNameQuery] = useState("");
  const [plateQuery, setPlateQuery] = useState("");
  const [weaponQuery, setWeaponQuery] = useState("");
  // Text the user is typing into each combobox
  const [nameInput, setNameInput] = useState("");
  const [plateInput, setPlateInput] = useState("");
  const [weaponInput, setWeaponInput] = useState("");
  const [searchType, setSearchType] = useState(null);
  const [results, setResults] = useState([]);
  const [civilians, setCivilians] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [filteredCivilians, setFilteredCivilians] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [filteredWeapons, setFilteredWeapons] = useState([]);
  const [dropdownError, setDropdownError] = useState(null);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDropdownError(null);
        const civRes = await api.get("/api/civilians/all");
        const vehRes = await api.get("/api/vehicles/all");
        const weapRes = await api.get("/api/weapons/all");

        setCivilians(civRes.data.civilians || []);
        setVehicles(vehRes.data.vehicles || []);
        setWeapons(weapRes.data.weapons || []);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setDropdownError("You do not have permission to access the requested resource.");
        } else {
          setDropdownError("Failed to load dropdown data.");
        }

      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const q = nameInput.toLowerCase();

    setFilteredCivilians(
      q === ""
        ? civilians
        : civilians.filter((c) => {
            const first = c.firstName?.toLowerCase() || "";
            const last = c.lastName?.toLowerCase() || "";
            const full = `${first} ${last}`;
            return first.includes(q) || last.includes(q) || full.includes(q);
          })
    );
  }, [nameInput, civilians]);

  useEffect(() => {
    const q = plateInput.toLowerCase();

    setFilteredVehicles(
      q === ""
        ? vehicles
        : vehicles.filter((v) => v.plate.toLowerCase().includes(q))
    );
  }, [plateInput, vehicles]);

  useEffect(() => {
    const q = weaponInput.toLowerCase();

    setFilteredWeapons(
      q === ""
        ? weapons
        : weapons.filter(
            (w) =>
              w.serialNumber.toLowerCase().includes(q) ||
              w.weaponType.toLowerCase().includes(q)
          )
    );
  }, [weaponInput, weapons]);


  const handleSearch = async () => {
    try {
      setSearchError(null);
      setSearchType(null);
      setResults([]);

      const res = await api.get("/api/search", {
        params: {
          name: nameQuery || nameInput,
          plate: plateQuery || plateInput,
          weapon: weaponQuery || weaponInput,
        },

      });

      if (plateQuery || plateInput) {
        setSearchType("plate");
        setResults(res.data.vehicles || []);
      } else if (weaponQuery || weaponInput) {
        setSearchType("weapon");
        setResults(res.data.weapons || []);
      } else if (nameQuery || nameInput) {
        setSearchType("name");
        setResults(res.data.civilians || []);
      }
      
    } catch (err) {
      console.error("Search failed:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setSearchError("You do not have permission to access the requested resource.");
      } else {
        setSearchError("Search failed. Please try again later.");
      }

    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Search Database</h2>
      {dropdownError && (
        <p className="text-red-500 text-center mb-4">{dropdownError}</p>
      )}
      {searchError && (
        <p className="text-red-500 text-center mb-4">{searchError}</p>
      )}

      <div className="flex justify-center space-x-4 mb-6">
        <div className="flex flex-col">
          <label className="text-purple-400 font-semibold mb-1">Name Search</label>
          <Combobox
            value={nameQuery}
            onChange={(val) => {
              setNameQuery(val);
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="bg-gray-800 text-white px-4 py-2 rounded-md w-56"
                onChange={(e) => setNameInput(e.target.value)}

                placeholder="Search Name"
              />
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setNameInput("")}

              >
                <Combobox.Options className="absolute z-10 mt-1 bg-gray-800 border border-gray-700 rounded w-full max-h-60 overflow-auto">
                  {filteredCivilians.map((civ) => (
                    <Combobox.Option
                      key={civ._id}
                      value={`${civ.firstName} ${civ.lastName}`}
                      className={({ active }) =>
                        `cursor-pointer p-2 text-sm ${active ? "bg-gray-700" : ""}`
                      }
                    >
                      {civ.firstName} {civ.lastName}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
        <div className="flex flex-col">
          <label className="text-green-400 font-semibold mb-1">Plate Search</label>
          <Combobox
            value={plateQuery}
            onChange={(val) => {
              setPlateQuery(val);
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="bg-gray-800 text-white px-4 py-2 rounded-md w-56"
                onChange={(e) => setPlateInput(e.target.value)}

                placeholder="Search Plate"
              />
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setPlateInput("")}

              >
                <Combobox.Options className="absolute z-10 mt-1 bg-gray-800 border border-gray-700 rounded w-full max-h-60 overflow-auto">
                  {filteredVehicles.map((v) => (
                    <Combobox.Option
                      key={v._id}
                      value={v.plate}
                      className={({ active }) =>
                        `cursor-pointer p-2 text-sm ${active ? "bg-gray-700" : ""}`
                      }
                    >
                      {v.plate.toUpperCase()} - {v.make} {v.model}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
        <div className="flex flex-col">
          <label className="text-yellow-400 font-semibold mb-1">Weapon Search</label>
          <Combobox
            value={weaponQuery}
            onChange={(val) => {
              setWeaponQuery(val);
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="bg-gray-800 text-white px-4 py-2 rounded-md w-56"
                onChange={(e) => setWeaponInput(e.target.value)}

                placeholder="Search Weapon"
              />
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setWeaponInput("")}

              >
                <Combobox.Options className="absolute z-10 mt-1 bg-gray-800 border border-gray-700 rounded w-full max-h-60 overflow-auto">
                  {filteredWeapons.map((w) => (
                    <Combobox.Option
                      key={w._id}
                      value={w.serialNumber}
                      className={({ active }) =>
                        `cursor-pointer p-2 text-sm ${active ? "bg-gray-700" : ""}`
                      }
                    >
                      {w.serialNumber} - {w.weaponType}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
        <button
          onClick={handleSearch}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded h-10 self-end"
        >Search</button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4 mt-6">
          {searchType === "plate" &&
            results.map((r) => (
              <div key={r.vehicle._id} className="bg-gray-900 p-4 rounded-md text-white">
                <h4 className="font-semibold mb-1">{r.vehicle.plate.toUpperCase()} - {r.vehicle.make} {r.vehicle.model}</h4>
                <p className="text-sm">Owner: {r.civilian.firstName} {r.civilian.lastName}</p>
              </div>
            ))}

          {searchType === "weapon" &&
            results.map((r) => (
              <div key={r.weapon._id} className="bg-gray-900 p-4 rounded-md text-white">
                <h4 className="font-semibold mb-1">{r.weapon.serialNumber} - {r.weapon.weaponType}</h4>
                <p className="text-sm">Owner: {r.civilian.firstName} {r.civilian.lastName}</p>
              </div>
            ))}

          {searchType === "name" &&
            results.map((civ) => (
              <div key={civ._id} className="bg-gray-900 p-4 rounded-md text-white">
                <h4 className="font-semibold">{civ.firstName} {civ.lastName}</h4>
                <p className="text-sm">DOB: {civ.dateOfBirth}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
