// Search Database UI (finalized layout with full civilian info toggle and full detail sections)
import React, { useState, useEffect } from "react";
import axios from "axios";
import CreateReportModal from "../../components/CreateReportModal";

export default function SearchDatabase() {
  const [nameQuery, setNameQuery] = useState("");
  const [plateQuery, setPlateQuery] = useState("");
  const [weaponQuery, setWeaponQuery] = useState("");
  const [civilian, setCivilian] = useState(null);
  const [vehicleResult, setVehicleResult] = useState(null);
  const [weaponResult, setWeaponResult] = useState(null);
  const [searchType, setSearchType] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFullCivilian, setShowFullCivilian] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [plateSuggestions, setPlateSuggestions] = useState([]);
  const [weaponSuggestions, setWeaponSuggestions] = useState([]);

  const handleSearch = async ({
    name = nameQuery,
    plate = plateQuery,
    weapon = weaponQuery,
    id = null,
  } = {}) => {

    try {
      setCivilian(null);
      setVehicleResult(null);
      setWeaponResult(null);
      setSearchType(null);
      setShowFullCivilian(false);
      setNameSuggestions([]);
      setPlateSuggestions([]);
      setWeaponSuggestions([]);

      const res = await axios.get("/api/search", {
        params: { name, plate, weapon, id },

      });

      if (plate) {
        setSearchType("plate");
        setVehicleResult(res.data.vehicle);
        setCivilian(res.data.civilian || null);
      } else if (weapon) {
        setSearchType("weapon");
        setWeaponResult(res.data.weapon);
        setCivilian(res.data.civilian || null);
      } else if (name || id) {

        setSearchType("name");
        setCivilian(res.data);
        setShowFullCivilian(true);
      }

    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  // Fetch suggestion lists as the user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (nameQuery.trim().length < 2) return setNameSuggestions([]);
      try {
        const res = await axios.get("/api/search/names", { params: { q: nameQuery } });
        setNameSuggestions(res.data);
      } catch (err) {
        console.error("Name suggestion failed:", err);
      }
    };
    fetchSuggestions();
  }, [nameQuery]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!plateQuery) return setPlateSuggestions([]);
      try {
        const res = await axios.get("/api/search/vehicles", { params: { q: plateQuery } });
        setPlateSuggestions(res.data);
      } catch (err) {
        console.error("Plate suggestion failed:", err);
      }
    };
    fetchSuggestions();
  }, [plateQuery]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!weaponQuery) return setWeaponSuggestions([]);
      try {
        const res = await axios.get("/api/search/weapons", { params: { q: weaponQuery } });
        setWeaponSuggestions(res.data);
      } catch (err) {
        console.error("Weapon suggestion failed:", err);
      }
    };
    fetchSuggestions();
  }, [weaponQuery]);

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Search Database</h2>

      <div className="flex flex-col sm:flex-row justify-center sm:space-x-4 space-y-4 sm:space-y-0 mb-6">
        <div className="flex flex-col">
          <label className="text-purple-400 font-semibold mb-1">Name Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Name or SSN"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-md w-full"
            />
            {nameSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-gray-800 text-white w-full mt-1 rounded-md max-h-40 overflow-y-auto">
                {nameSuggestions.map((s) => (
                  <li
                    key={s._id}
                    className="px-4 py-1 hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setNameQuery(s.name);
                      setPlateQuery("");
                      setWeaponQuery("");
                      handleSearch({ id: s._id });

                    }}
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-green-400 font-semibold mb-1">Plate Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Plate or VIN"
              value={plateQuery}
              onChange={(e) => setPlateQuery(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-md w-full"
            />
            {plateSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-gray-800 text-white w-full mt-1 rounded-md max-h-40 overflow-y-auto">
                {plateSuggestions.map((s) => (
                  <li
                    key={s._id}
                    className="px-4 py-1 hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setPlateQuery(s.plate);
                      setNameQuery("");
                      setWeaponQuery("");
                      handleSearch({ plate: s.plate });

                    }}
                  >
                    {s.plate}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-yellow-400 font-semibold mb-1">Weapon Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Name or Serial"
              value={weaponQuery}
              onChange={(e) => setWeaponQuery(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-md w-full"
            />
            {weaponSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-gray-800 text-white w-full mt-1 rounded-md max-h-40 overflow-y-auto">
                {weaponSuggestions.map((s) => (
                  <li
                    key={s._id}
                    className="px-4 py-1 hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      setWeaponQuery(s.serialNumber);
                      setNameQuery("");
                      setPlateQuery("");
                      handleSearch({ weapon: s.serialNumber });

                    }}
                  >
                    {s.serialNumber} - {s.weaponType}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          onClick={() => handleSearch()}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              <div className="overflow-x-auto">
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
              </div>
            ) : <p className="text-white">No vehicles registered.</p>}
          </div>

          <div className="bg-gray-900 p-4 rounded-md">
            <h4 className="text-white font-semibold mb-2">Registered Firearms</h4>
            {civilian.weapons?.length > 0 ? (
              <div className="overflow-x-auto">
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
              </div>
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
