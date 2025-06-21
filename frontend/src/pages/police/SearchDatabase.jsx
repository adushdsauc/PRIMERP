// Search Database UI (finalized layout with full civilian info toggle and full detail sections)
import React, { useState, useEffect, Fragment } from "react";
import api from "../../utils/axios";
import { Combobox, Transition } from "@headlessui/react";
import CreateReportModal from "../../components/CreateReportModal";

export default function SearchDatabase() {
  // Selected search values
  const [nameQuery, setNameQuery] = useState("");
  const [plateQuery, setPlateQuery] = useState("");
  const [weaponQuery, setWeaponQuery] = useState("");
  // Text the user is typing into each combobox
  const [nameInput, setNameInput] = useState("");
  const [plateInput, setPlateInput] = useState("");
  const [weaponInput, setWeaponInput] = useState("");
  const [civilian, setCivilian] = useState(null);
  const [vehicleResult, setVehicleResult] = useState(null);
  const [weaponResult, setWeaponResult] = useState(null);
  const [searchType, setSearchType] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFullCivilian, setShowFullCivilian] = useState(false);
  const [civilians, setCivilians] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [filteredCivilians, setFilteredCivilians] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [filteredWeapons, setFilteredWeapons] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const civRes = await api.get("/api/civilians/all");
        const vehRes = await api.get("/api/vehicles/all");
        const weapRes = await api.get("/api/weapons/all");
        setCivilians(civRes.data.civilians || []);
        setVehicles(vehRes.data.vehicles || []);
        setWeapons(weapRes.data.weapons || []);
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
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
      setCivilian(null);
      setVehicleResult(null);
      setWeaponResult(null);
      setSearchType(null);
      setShowFullCivilian(false);

      const res = await api.get("/api/search", {
        params: {
          name: nameQuery || nameInput,
          plate: plateQuery || plateInput,
          weapon: weaponQuery || weaponInput,
        },
      });

      if (plateQuery) {
        setSearchType("plate");
        setVehicleResult(res.data.vehicle);
        setCivilian(res.data.civilian || null);
      } else if (weaponQuery) {
        setSearchType("weapon");
        setWeaponResult(res.data.weapon);
        setCivilian(res.data.civilian || null);
      } else if (nameQuery) {
        setSearchType("name");
        setCivilian(res.data);
        setShowFullCivilian(true);
      }
      
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Search Database</h2>

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

      {vehicleResult && searchType === "plate" && (
        <div className="bg-gray-900 p-4 rounded-md mb-6">
          <h4 className="text-white font-semibold mb-2">Vehicle Match</h4>
          <p className="text-white">Plate: {vehicleResult.plate}</p>
          <p className="text-white">Make: {vehicleResult.make}</p>
          <p className="text-white">Model: {vehicleResult.model}</p>
          <p className="text-white">Color: {vehicleResult.color}</p>
          <p className="text-white">Insured: {vehicleResult.insured ? "Yes" : "No"}</p>
          {civilian && (
            <button
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
              onClick={() => setShowFullCivilian(true)}
            >View Registered Owner</button>
          )}
        </div>
      )}

      {weaponResult && searchType === "weapon" && (
        <div className="bg-gray-900 p-4 rounded-md mb-6">
          <h4 className="text-white font-semibold mb-2">Weapon Match</h4>
          <p className="text-white">Serial Number: {weaponResult.serialNumber}</p>
          <p className="text-white">Type: {weaponResult.weaponType}</p>
          {civilian && (
            <button
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
              onClick={() => setShowFullCivilian(true)}
            >View Registered Owner</button>
          )}
        </div>
      )}

      {civilian && showFullCivilian && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 p-4 rounded-md h-full">
              <h4 className="text-white font-semibold mb-2">Personal Information</h4>
              <p className="text-white">Name: {civilian.firstName} {civilian.middleInitial} {civilian.lastName}</p>
              <p className="text-white">DOB: {civilian.dateOfBirth}</p>
              <p className="text-white">Age: {civilian.age}</p>
              <p className="text-white">Sex: {civilian.sex}</p>
              <p className="text-white">Height: {civilian.height}</p>
              <p className="text-white">Weight: {civilian.weight}</p>
              <p className="text-white">Skin Tone: {civilian.skinTone}</p>
              <p className="text-white">Hair Color: {civilian.hairColor}</p>
              <p className="text-white">Eye Color: {civilian.eyeColor}</p>
              <p className="text-white">Residence: {civilian.residence}, {civilian.zipCode}</p>
              <p className="text-white">Occupation: {civilian.occupation}</p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-gray-900 p-4 rounded-md h-full">
                <h4 className="text-white font-semibold mb-2">Medical Information</h4>
                <p className="text-white">Blood Type: Unknown</p>
                <p className="text-white">Emergency Contact: {civilian.emergencyContactName}</p>
                <p className="text-white">Allergies: Unknown</p>
                <p className="text-white">Medication: Unknown</p>
                <p className="text-white">Past History: Unknown</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 p-4 rounded-md">
              <h4 className="text-white font-semibold mb-2">Licenses</h4>
              {civilian.licenses?.length > 0 ? (
                <ul className="text-white space-y-1">
                  {civilian.licenses.map((lic, i) => (
                    <li key={i}>{lic}</li>
                  ))}
                </ul>
              ) : <p className="text-white">No licenses found.</p>}
            </div>

            <div className="bg-gray-900 p-4 rounded-md">
              <h4 className="text-white font-semibold mb-2">Public Safety Tools</h4>
              <div className="flex space-x-4">
                <button
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                  onClick={() => setShowReportModal(true)}
                >Create Report</button>
                <button className="bg-red-600 text-white px-4 py-2 rounded">Suspend License</button>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-md">
            <h4 className="text-white font-semibold mb-2">Registered Vehicles</h4>
            {civilian.vehicles?.length > 0 ? (
              <table className="w-full text-sm text-left text-white">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                  <tr>
                    <th className="px-2 py-1">Plate</th>
                    <th className="px-2 py-1">Make</th>
                    <th className="px-2 py-1">Model</th>
                    <th className="px-2 py-1">Color</th>
                    <th className="px-2 py-1">Year</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {civilian.vehicles.map((v, i) => (
                    <tr key={i} className="border-t border-gray-800">
                      <td className="px-2 py-1">{v.plate}</td>
                      <td className="px-2 py-1">{v.make}</td>
                      <td className="px-2 py-1">{v.model}</td>
                      <td className="px-2 py-1">{v.color}</td>
                      <td className="px-2 py-1">{v.year}</td>
                      <td className="px-2 py-1">{v.status || "Valid"}</td>
                      <td className="px-2 py-1">
                        <button className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs">Impound</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-white">No vehicles registered.</p>}
          </div>

          <div className="bg-gray-900 p-4 rounded-md">
            <h4 className="text-white font-semibold mb-2">Registered Firearms</h4>
            {civilian.weapons?.length > 0 ? (
              <table className="w-full text-sm text-left text-white">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                  <tr>
                    <th className="px-2 py-1">Model</th>
                    <th className="px-2 py-1">Serial</th>
                    <th className="px-2 py-1">Registered To</th>
                  </tr>
                </thead>
                <tbody>
                  {civilian.weapons.map((w, i) => (
                    <tr key={i} className="border-t border-gray-800">
                      <td className="px-2 py-1">{w.weaponType}</td>
                      <td className="px-2 py-1">{w.serialNumber}</td>
                      <td className="px-2 py-1">{w.registeredName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-white">No firearms registered.</p>}
          </div>

          {showReportModal && (
            <CreateReportModal civilian={civilian} onClose={() => setShowReportModal(false)} />
          )}
        </div>
      )}
    </div>
  );
}
