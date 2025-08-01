// src/components/OfficerSetupModal.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/axios";
import { useUser } from "../hooks/useUser";
import { Listbox } from "@headlessui/react";

export default function OfficerSetupModal({ onCreated }) {
  const { discordId } = useUser();
  const [civilians, setCivilians] = useState([]);
  const [selectedCivilian, setSelectedCivilian] = useState(null);
  const [callsign, setCallsign] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCivilians = async () => {
      try {
        const res = await api.get("/api/civilians");
        setCivilians(res.data.civilians || []);
      } catch (err) {
        console.error("❌ Failed to fetch civilians:", err);
        console.trace();
      }
    };
  
    fetchCivilians().catch((err) => {
      console.error("🔥 Unhandled rejection in fetchCivilians:", err);
      console.trace();
    });
  }, []);  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!selectedCivilian || !callsign || !department) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/officers", {
        discordId,
        civilianId: selectedCivilian._id,
        department,
        callsign,
      });
      onCreated(res.data);
    } catch (err) {
      console.error("Error creating officer:", err);
      setError("Failed to register officer. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg w-full max-w-md text-white">
        <h2 className="text-xl font-bold mb-4">Officer Registration</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm">Civilian</label>
            <Listbox value={selectedCivilian} onChange={setSelectedCivilian}>
              <div className="relative">
                <Listbox.Button className="w-full p-2 bg-gray-700 rounded text-left">
                  {selectedCivilian ? `${selectedCivilian.firstName} ${selectedCivilian.lastName}` : "-- Select Civilian --"}
                </Listbox.Button>
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded bg-gray-700 text-white shadow-lg z-10">
                  {civilians.map((civ) => (
                    <Listbox.Option
                      key={civ._id}
                      value={civ}
                      className={({ active }) =>
                        `cursor-pointer select-none px-4 py-2 ${active ? "bg-gray-600" : ""}`
                      }
                    >
                      {civ.firstName} {civ.lastName}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          <div>
            <label className="block mb-1 text-sm">Callsign</label>
            <input
              type="text"
              className="w-full p-2 bg-gray-700 rounded"
              placeholder="e.g., D-104"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm">Platform</label>
            <Listbox value={department} onChange={setDepartment}>
              <div className="relative">
                <Listbox.Button className="w-full p-2 bg-gray-700 rounded text-left">
                  {department || "-- Select Platform --"}
                </Listbox.Button>
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded bg-gray-700 text-white shadow-lg z-10">
                  {['Xbox', 'PlayStation'].map((platform) => (
                    <Listbox.Option
                      key={platform}
                      value={platform}
                      className={({ active }) =>
                        `cursor-pointer select-none px-4 py-2 ${active ? "bg-gray-600" : ""}`
                      }
                    >
                      {platform}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex flex-col sm:flex-row justify-end gap-2 space-y-2 sm:space-y-0">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
