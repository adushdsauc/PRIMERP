import React, { useState } from "react";
import { Listbox } from "@headlessui/react";
import api from "../utils/axios";

const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Truck",
  "Motorcycle",
  "Coupe",
  "Van",
  "Convertible",
];

const AddVehicleModal = ({ civilianId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    plate: "",
    make: "",
    model: "",
    year: "",
    color: "",
    type: VEHICLE_TYPES[0],
    insured: false,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post(`/api/vehicles/register`, {
        ...formData,
        civilianId,
      });
      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setMessage(res.data.message || "Failed to register vehicle.");
      }
    } catch (err) {
      console.error("Register vehicle error:", err);
      setMessage("An error occurred while registering vehicle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-2xl w-full max-w-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Register New Vehicle</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <input name="plate" value={formData.plate} onChange={handleChange} placeholder="Plate Number" className="bg-gray-800 rounded px-3 py-2" />
          <input name="make" value={formData.make} onChange={handleChange} placeholder="Make" className="bg-gray-800 rounded px-3 py-2" />
          <input name="model" value={formData.model} onChange={handleChange} placeholder="Model" className="bg-gray-800 rounded px-3 py-2" />
          <input name="year" value={formData.year} onChange={handleChange} placeholder="Year" className="bg-gray-800 rounded px-3 py-2" />
          <input name="color" value={formData.color} onChange={handleChange} placeholder="Color" className="bg-gray-800 rounded px-3 py-2" />
          <div className="col-span-2">
            <label className="block mb-1 text-sm font-medium">Type</label>
            <Listbox value={formData.type} onChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}>
              <div className="relative">
                <Listbox.Button className="w-full bg-gray-800 rounded px-3 py-2 text-left">
                  {formData.type}
                </Listbox.Button>
                <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto bg-gray-800 border border-gray-700 rounded z-50">
                  {VEHICLE_TYPES.map((type) => (
                    <Listbox.Option
                      key={type}
                      value={type}
                      className={({ active }) =>
                        `cursor-pointer px-3 py-2 ${active ? "bg-gray-700" : ""}`
                      }
                    >
                      {type}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
          <label className="col-span-2 text-sm">
            <input type="checkbox" name="insured" checked={formData.insured} onChange={handleChange} className="mr-2" />
            Insured
          </label>
        </div>

        {message && <p className="text-red-400 text-sm text-center mt-2">{message}</p>}

        <div className="flex flex-col sm:flex-row justify-end mt-4 space-y-3 sm:space-y-0 sm:space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm" disabled={loading}>
            {loading ? "Submitting..." : "Register Vehicle"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVehicleModal;
