import React, { useState, Fragment } from "react";
import api from "../utils/axios";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const VEHICLE_TYPES = ["Sedan", "Coupe", "SUV", "Truck", "Offroad", "Motorcycle"];

const EditVehicleModal = ({ vehicle, onClose, onSuccess }) => {
  const [type, setType] = useState(vehicle?.type || "");
  const [plate, setPlate] = useState(vehicle?.plate || "");
  const [make, setMake] = useState(vehicle?.make || "");
  const [model, setModel] = useState(vehicle?.model || "");
  const [year, setYear] = useState(vehicle?.year || "");
  const [color, setColor] = useState(vehicle?.color || "");
  const [insured, setInsured] = useState(vehicle?.insured || false);
  const [message, setMessage] = useState("");

  const handleUpdate = async () => {
    try {
      const res = await api.put(`/api/vehicles/${vehicle._id}`, {
        plate,
        make,
        model,
        year,
        color,
        insured,
        type,
      });

      setMessage("✅ Vehicle updated successfully.");
      setTimeout(() => {
        onSuccess(res.data.vehicle);
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Update error:", err);
      setMessage("❌ Failed to update vehicle.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl shadow-xl w-full max-w-xl">
        <h2 className="text-xl font-bold mb-4 text-center">Edit Vehicle</h2>

        <Listbox value={type} onChange={setType}>
          <div className="relative mb-4">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-700 py-2 pl-4 pr-10 text-left">
              <span className="block truncate">{type || "Select Vehicle Type"}</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {VEHICLE_TYPES.map((t) => (
                  <Listbox.Option
                    key={t}
                    value={t}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active ? "bg-indigo-600 text-white" : "text-gray-100"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{t}</span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input className="bg-gray-700 p-2 rounded" placeholder="Plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
          <input className="bg-gray-700 p-2 rounded" placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
          <input className="bg-gray-700 p-2 rounded" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} />
          <input className="bg-gray-700 p-2 rounded" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>

        <input className="bg-gray-700 p-2 rounded w-full mb-4" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />

        <label className="flex items-center mb-4">
          <input type="checkbox" checked={insured} onChange={() => setInsured(!insured)} className="mr-2" />
          This vehicle is insured
        </label>

        {message && <p className="mb-4 text-sm text-center text-yellow-400">{message}</p>}

        <div className="flex flex-col sm:flex-row justify-end gap-3 space-y-2 sm:space-y-0">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded">
            Cancel
          </button>
          <button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">
            Update Vehicle
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditVehicleModal;
