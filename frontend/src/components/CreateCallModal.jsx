import React, { useState, Fragment, useEffect } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import api from "../utils/axios";

const CALL_TYPES = [
  "Traffic Stop",
  "Domestic Disturbance",
  "Robbery",
  "Pursuit",
  "Officer Down",
  "Shots Fired",
  "Suspicious Activity",
  "Other"
];

export default function CreateCallModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    type: CALL_TYPES[0],
    location: "",
    postal: "",
    details: ""
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
      const res = await api.post("/api/calls", form);
      if (res.data.success) {
        onSuccess();
        onClose();
      } else {
        setMessage("Failed to create call.");
      }
    } catch (err) {
      console.error("Error creating call:", err);
      setMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Create New Call</h2>

        <div className="space-y-3">
          <div>
            <Listbox value={form.type} onChange={(val) => setForm({ ...form, type: val })}>
              <div className="relative">
                <Listbox.Button className="w-full px-3 py-2 text-left bg-gray-800 border border-gray-700 rounded text-sm">
                  {form.type}
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow-lg">
                    {CALL_TYPES.map((type, i) => (
                      <Listbox.Option
                        key={i}
                        value={type}
                        className={({ active }) =>
                          `cursor-pointer select-none px-4 py-2 text-sm ${active ? "bg-gray-700 text-white" : "text-gray-300"}`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{type}</span>
                            {selected && <CheckIcon className="w-4 h-4 text-green-500 float-right" />}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location"
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm"
          />
          <input
            name="postal"
            value={form.postal}
            onChange={handleChange}
            placeholder="Postal Code"
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm"
          />
          <textarea
            name="details"
            value={form.details}
            onChange={handleChange}
            placeholder="Additional Details"
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm h-24"
          />
        </div>

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
          >{loading ? "Creating..." : "Create Call"}</button>
        </div>
      </div>
    </div>
  );
}
