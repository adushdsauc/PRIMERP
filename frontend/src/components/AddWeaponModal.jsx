import React, { useState, useEffect } from "react";
import api from "../utils/axios";

const AddWeaponModal = ({ civilianId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    weaponType: "",
    serialNumber: "",
    registeredName: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const generateSerial = () => {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `WPN-${random}`;
    };
    setForm((prev) => ({ ...prev, serialNumber: generateSerial() }));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post(`/api/weapons/register`, {
        ...form,
        civilianId,
      });

      if (res.data.success) {
        setMessage("✅ Weapon registered successfully.");
        setTimeout(() => {
          setLoading(false);
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setLoading(false);
        setMessage(res.data.message || "Failed to register weapon.");
      }
    } catch (err) {
      console.error("Weapon registration error:", err);
      setLoading(false);
      setMessage("An error occurred while registering the weapon.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl w-full max-w-md shadow-xl border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Register New Weapon</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Weapon Type</label>
            <input
              name="weaponType"
              value={form.weaponType}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-sm"
              placeholder="e.g., Pistol, Rifle"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Serial Number</label>
            <input
              name="serialNumber"
              value={form.serialNumber}
              disabled
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Registered Owner Name</label>
            <input
              name="registeredName"
              value={form.registeredName}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-600 text-sm"
              placeholder="e.g., John Smith"
            />
          </div>
        </div>

        {message && (
          <p
            className={`mt-3 text-center text-sm ${message.includes("✅") ? "text-green-400" : "text-red-400"}`}
          >
            {message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row justify-end pt-4 space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-sm disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register Weapon"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWeaponModal;
