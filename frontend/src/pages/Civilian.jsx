// src/pages/Civilian.jsx
import React, { useState, useEffect } from "react";
import api from "../utils/axios";
import { useUser } from "../hooks/useUser";
import CivilianDetailView from "../components/CivilianDetailView";
import CreateCivilianModal from "../components/CreateCivilianModal";
import EditCivilianModal from "../components/EditCivilianModal";

export default function CivilianPage() {
  const [civilians, setCivilians] = useState([]);
  const [selectedCivilian, setSelectedCivilian] = useState(null);
  const [viewMode, setViewMode] = useState("none");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const { discordTag } = useUser();

  useEffect(() => {
    fetchCivilians();
  }, []);

  const fetchCivilians = async () => {
    try {
      const res = await api.get("/api/civilians");
      setCivilians(res.data.civilians);
    } catch (err) {
      console.error("Failed to fetch civilians:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this civilian?")) return;
    await api.delete(`/api/civilians/${id}`);
    setCivilians((prev) => prev.filter((c) => c._id !== id));
    setSelectedCivilian(null);
    setViewMode("none");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center sm:text-left">
        Civilian Dashboard
      </h1>

      {viewMode === "detail" && selectedCivilian ? (
        <CivilianDetailView
          civilian={selectedCivilian}
          onClose={() => {
            setViewMode("none");
            setSelectedCivilian(null);
          }}
          onEdit={() => setViewMode("edit")}
          onDelete={() => handleDelete(selectedCivilian._id)}
        />
      ) : viewMode === "edit" && selectedCivilian ? (
        <EditCivilianModal
          civilian={selectedCivilian}
          onClose={() => {
            setViewMode("none");
            setSelectedCivilian(null);
          }}
          onSuccess={() => {
            setViewMode("none");
            fetchCivilians();
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <h2 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">
              Your Civilians
            </h2>
            <button
              onClick={() => setShowCreate(true)}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white"
            >
              + Add Civilian
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-400">Loading...</p>
          ) : civilians.length === 0 ? (
            <p className="text-center text-gray-400">No civilians found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {civilians.map((civ) => (
                <div
                  key={civ._id}
                  className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 hover:border-red-500 transition cursor-pointer"
                  onClick={() => {
                    setSelectedCivilian(civ);
                    setViewMode("detail");
                  }}
                >
                  <h3 className="text-lg sm:text-xl font-bold">
                    {civ.firstName} {civ.lastName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    DOB: {civ.dateOfBirth || "N/A"}
                  </p>
                  <p className="text-sm text-gray-400">
                    Occupation: {civ.occupation || "Unemployed"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateCivilianModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchCivilians();
          }}
        />
      )}
    </div>
  );
}
