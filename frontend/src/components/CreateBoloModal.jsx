import React, { useState } from "react";
import api from "../utils/axios";

export default function CreateBoloModal({ onClose, onSuccess }) {
  const [boloType, setBoloType] = useState("vehicle");
  const [form, setForm] = useState({
    vehicleDescription: "",
    vehiclePlate: "",
    personDescription: "",
    personName: "",
    location: "",
    details: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/api/bolos", { ...form, boloType });
      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setMessage("Failed to create BOLO.");
      }
    } catch (err) {
      console.error("Error creating BOLO:", err);
      setMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Create BOLO</h2>

        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setBoloType("vehicle")}
            className={`px-3 py-1 rounded text-sm ${boloType === "vehicle" ? "bg-blue-600" : "bg-gray-700"}`}
          >Vehicle</button>
          <button
            onClick={() => setBoloType("person")}
            className={`px-3 py-1 rounded text-sm ${boloType === "person" ? "bg-blue-600" : "bg-gray-700"}`}
          >Person</button>
        </div>

        {boloType === "vehicle" ? (
          <div className="space-y-3">
            <input
              name="vehicleDescription"
              value={form.vehicleDescription}
              onChange={handleChange}
              placeholder="Vehicle Description"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
            <input
              name="vehiclePlate"
              value={form.vehiclePlate}
              onChange={handleChange}
              placeholder="Vehicle Plate # (Optional)"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Last Known Location"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              placeholder="Additional Details"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm h-20"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <input
              name="personDescription"
              value={form.personDescription}
              onChange={handleChange}
              placeholder="Person Description"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
            <input
              name="personName"
              value={form.personName}
              onChange={handleChange}
              placeholder="Name (Optional)"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Last Known Location"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              placeholder="Additional Details"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm h-20"
            />
          </div>
        )}

        {message && <p className="text-red-400 text-sm text-center mt-2">{message}</p>}

        <div className="flex flex-col sm:flex-row justify-end mt-4 space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
          >Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm"
          >{loading ? "Creating..." : "Create BOLO"}</button>
        </div>
      </div>
    </div>
  );
}
