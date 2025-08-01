// src/pages/police/SelectPoliceCharacter.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/axios";

export default function SelectPoliceCharacter({ discordId, onSuccess }) {
  const [civilians, setCivilians] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCivilians = async () => {
      try {
        const res = await api.get("/api/civilians", { withCredentials: true });
        setCivilians(res.data?.civilians || []);
      } catch (err) {
        console.error("❌ Error fetching civilians:", err);
        setError("Failed to load civilians");
      }
    };

    fetchCivilians().catch((err) => {
      console.error("❌ Unhandled error in fetchCivilians:", err);
      setError("Unexpected error while loading civilians.");
    });
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.patch(`/api/civilians/${selected}`, { occupation: "Officer" });
      onSuccess();
    } catch (err) {
      console.error("❌ Failed to assign officer character:", err);
      setError("Failed to assign officer character.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 sm:p-8 rounded-lg w-full max-w-md border border-gray-700 shadow">
        <h2 className="text-xl font-bold mb-4">Select Police Character</h2>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 mb-4"
        >
          <option value="">-- Choose Civilian --</option>
          {civilians.map((civ) => (
            <option key={civ._id} value={civ._id}>
              {civ.firstName} {civ.lastName}
            </option>
          ))}
        </select>

        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleAssign}
            disabled={loading || !selected}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Assigning..." : "Assign as Officer"}
          </button>
        </div>
      </div>
    </div>
  );
}
