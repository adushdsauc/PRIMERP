import React, { useState, useEffect } from "react";
import api from "../utils/axios";

const EditWeaponModal = ({ weaponId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    weaponType: "",
    serialNumber: "",
    registeredName: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchWeapon = async () => {
      try {
        const res = await api.get(`/api/weapons/${weaponId}`);
        if (res.data.success) {
          setForm(res.data.weapon);
        } else {
          setMessage("Failed to load weapon data.");
        }
      } catch (err) {
        console.error("Fetch weapon error:", err);
        setMessage("Error loading weapon data.");
      }
    };
    fetchWeapon();
  }, [weaponId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await api.put(`/api/weapons/${weaponId}`, form);
      if (res.data.success) {
        setMessage("Weapon updated.");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 800);
      } else {
        setMessage(res.data.message || "Failed to update weapon.");
      }
    } catch (err) {
      console.error("Update error:", err);
      setMessage("An error occurred while updating.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-4 sm:p-6 rounded-xl text-white w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Edit Weapon</h2>
        <div className="space-y-3">
          <input
            name="weaponType"
            value={form.weaponType}
            onChange={handleChange}
            placeholder="Weapon Type"
            className="w-full bg-gray-800 p-2 rounded text-sm"
          />
          <input
            name="serialNumber"
            value={form.serialNumber}
            onChange={handleChange}
            placeholder="Serial Number"
            className="w-full bg-gray-800 p-2 rounded text-sm"
          />
          <input
            name="registeredName"
            value={form.registeredName}
            onChange={handleChange}
            placeholder="Registered To"
            className="w-full bg-gray-800 p-2 rounded text-sm"
          />
        </div>
        {message && (
          <p className="text-center text-sm mt-2 text-red-400">{message}</p>
        )}
        <div className="flex flex-col sm:flex-row justify-end gap-2 space-y-2 sm:space-y-0 mt-4">
          <button
            onClick={onClose}
            className="bg-gray-700 px-4 py-2 rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditWeaponModal;
