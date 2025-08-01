import React, { useState } from "react";
import api from "../utils/axios";
import { useUser } from "../hooks/useUser";

const CreateCivilianModal = ({ onClose, onSuccess = () => {} }) => {
  const { discordId } = useUser(); // just for dev logging

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleInitial: "",
    dateOfBirth: "",
    age: "",
    sex: "",
    knownAliases: "",
    residence: "",
    zipCode: "",
    occupation: "",
    height: "",
    weight: "",
    skinTone: "",
    hairColor: "",
    eyeColor: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        knownAliases: formData.knownAliases
          .split(",")
          .map((alias) => alias.trim())
          .filter(Boolean),
      };

      console.log("🧾 Submitting civilian payload:", payload);
      console.log("🙋 Current user ID (from useUser):", discordId);

      const res = await api.post("/api/civilians", payload, {
        withCredentials: true,
      });

      console.log("✅ Civilian created:", res.data);
      onSuccess();
    } catch (err) {
      console.error("❌ Error creating civilian:", err);
      console.log("📦 Error payload:", err?.response?.data);
      setError(
        err?.response?.data?.message || "Failed to create civilian. Check all fields."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "p-3 rounded bg-gray-700 placeholder-gray-400 text-white w-full";
  const selectClass =
    "p-3 rounded bg-gray-700 text-white w-full appearance-none";

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg w-full max-w-3xl text-white overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-semibold mb-6">Register New Civilian</h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            className={inputClass}
            required
          />
          <input
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            className={inputClass}
            required
          />
          <input
            name="middleInitial"
            placeholder="Middle Initial"
            value={formData.middleInitial}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className={inputClass}
            required
          />
          <input
            name="age"
            type="number"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="sex"
            placeholder="Sex"
            value={formData.sex}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="knownAliases"
            placeholder="Aliases (optional, comma separated)"
            value={formData.knownAliases}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="residence"
            placeholder="Residence"
            value={formData.residence}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="zipCode"
            placeholder="Zip Code"
            value={formData.zipCode}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="occupation"
            placeholder="Occupation"
            value={formData.occupation}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="height"
            placeholder={`Height (e.g., 5'11")`}
            value={formData.height}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="weight"
            placeholder="Weight (e.g., 160lbs)"
            value={formData.weight}
            onChange={handleChange}
            className={inputClass}
          />
          <input
            name="skinTone"
            placeholder="Skin Tone"
            value={formData.skinTone}
            onChange={handleChange}
            className={inputClass}
          />

          <select
            name="hairColor"
            value={formData.hairColor}
            onChange={handleChange}
            className={selectClass}
          >
            <option value="">Select Hair Color</option>
            <option value="Black">Black</option>
            <option value="Brown">Brown</option>
            <option value="Blonde">Blonde</option>
            <option value="Red">Red</option>
            <option value="Gray">Gray</option>
            <option value="White">White</option>
            <option value="Other">Other</option>
          </select>

          <select
            name="eyeColor"
            value={formData.eyeColor}
            onChange={handleChange}
            className={selectClass}
          >
            <option value="">Select Eye Color</option>
            <option value="Brown">Brown</option>
            <option value="Blue">Blue</option>
            <option value="Green">Green</option>
            <option value="Hazel">Hazel</option>
            <option value="Gray">Gray</option>
            <option value="Amber">Amber</option>
            <option value="Other">Other</option>
          </select>

          {error && (
            <div className="col-span-2 text-red-400 mt-2">{error}</div>
          )}

          <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row justify-end gap-4 space-y-2 sm:space-y-0 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 px-5 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded"
            >
              {loading ? "Saving..." : "Create Civilian"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCivilianModal;
