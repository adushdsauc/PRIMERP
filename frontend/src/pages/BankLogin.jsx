import React, { useEffect, useState } from "react";
import api from "../utils/axios";
import { useNavigate } from "react-router-dom";

export default function BankLogin() {
  const [civilians, setCivilians] = useState([]);
  const [selectedCivilian, setSelectedCivilian] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCivilians = async () => {
      try {
        const res = await api.get("/api/civilians");
        setCivilians(res.data.civilians || []);
      } catch (err) {
        console.error("Failed to fetch civilians:", err);
      }
    };

    fetchCivilians();
  }, []);

  const handleLogin = () => {
    if (selectedCivilian) {
      navigate(`/bank/dashboard?civilian=${selectedCivilian}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md p-6 sm:p-8">
        {/* Maze Bank Logo */}
        <div className="flex justify-center mb-8">
          <img src="/Mazebank.png" alt="Mazebank" className="h-60 object-contain" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">Account Login</h2>

        {/* Civilian Dropdown */}
        <label className="block mb-2 text-sm font-medium text-gray-300">Select Civilian</label>
        <div className="relative">
          <select
            value={selectedCivilian}
            onChange={(e) => setSelectedCivilian(e.target.value)}
            className="w-full appearance-none bg-gray-900 text-white border border-gray-700 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <option value="">-- Choose Civilian --</option>
            {civilians.map((civ) => (
              <option key={civ._id} value={civ._id}>
                {civ.firstName} {civ.lastName}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            ▼
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={!selectedCivilian}
          className={`w-full mt-6 py-3 rounded-lg font-semibold text-white transition ${
            selectedCivilian
              ? "bg-red-600 hover:bg-red-700"
              : "bg-gray-700 cursor-not-allowed"
          }`}
        >
          Log in
        </button>
      </div>
    </div>
  );
}
