import React, { useState } from "react";
import api from "../utils/axios";

const EditCivilianModal = ({ civilian, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ ...civilian });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAliasesChange = (e) => {
    const value = e.target.value;
    const aliases = value.split(",").map((alias) => alias.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, knownAliases: aliases }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/api/civilians/${civilian._id}`, formData);
      setSuccess("✅ Civilian updated successfully.");
      onSuccess();
    } catch (err) {
      console.error("❌ Failed to update civilian:", err);
      setError("Failed to update civilian. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-gray-900 p-4 sm:p-6 rounded-lg w-full max-w-xl text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-4">✏️ Edit Civilian</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="middleInitial" placeholder="Middle Initial" value={formData.middleInitial || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="dateOfBirth" type="date" placeholder="DOB" value={formData.dateOfBirth || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="age" placeholder="Age" value={formData.age || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="sex" placeholder="Sex" value={formData.sex || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="residence" placeholder="Residence Address" value={formData.residence || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="zipCode" placeholder="Zip Code" value={formData.zipCode || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="occupation" placeholder="Occupation" value={formData.occupation || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="height" placeholder="Height" value={formData.height || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="weight" placeholder="Weight" value={formData.weight || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="skinTone" placeholder="Skin Tone" value={formData.skinTone || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="hairColor" placeholder="Hair Color" value={formData.hairColor || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />
          <input name="eyeColor" placeholder="Eye Color" value={formData.eyeColor || ""} onChange={handleChange} className="p-2 rounded bg-gray-700" />

          <input
            name="knownAliases"
            placeholder="Aliases (comma separated)"
            value={formData.knownAliases?.join(", ") || ""}
            onChange={handleAliasesChange}
            className="p-2 rounded bg-gray-700 col-span-2"
          />

          {error && <p className="text-red-400 col-span-2">{error}</p>}
          {success && <p className="text-green-400 col-span-2">{success}</p>}

          <div className="col-span-2 flex flex-col sm:flex-row justify-end gap-3 space-y-2 sm:space-y-0 mt-4">
            <button onClick={onClose} type="button" className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded">
              Cancel
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCivilianModal;
