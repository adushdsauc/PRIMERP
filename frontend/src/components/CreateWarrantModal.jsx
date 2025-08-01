// src/components/CreateWarrantModal.jsx
import React, { useEffect, useState, Fragment } from "react";
import api from "../utils/axios";
import { Combobox, Transition, Listbox } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import TextareaAutosize from "react-textarea-autosize";

const WARRANT_TYPES = ["Arrest", "Search"];

export default function CreateWarrantModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    type: "Arrest",
    reason: "",
    expiresAt: "",
    civilianId: ""
  });
  const [query, setQuery] = useState("");
  const [civilians, setCivilians] = useState([]);
  const [filteredCivilians, setFilteredCivilians] = useState([]);
  const [officer, setOfficer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await api.get("/api/auth/me");
        const officerRes = await api.get(`/api/officers/${session.data.discordId}`);
        const civRes = await api.get("/api/civilians/all");

        setOfficer(officerRes.data);
        setCivilians(civRes.data.civilians);
      } catch (err) {
        console.error("❌ Init error:", err);
        console.trace();
        setError("Failed to load required data.");
      }
    };
  
    fetchData().catch((err) => {
      console.error("🔥 Unhandled rejection in fetchData:", err);
      console.trace();
    });
  }, []);  

  useEffect(() => {
    const q = query.toLowerCase();
    setFilteredCivilians(
      q === ""
        ? civilians
        : civilians.filter((civ) => {
            const first = civ.firstName?.toLowerCase() || "";
            const last = civ.lastName?.toLowerCase() || "";
            const full = `${first} ${last}`;
            return (
              first.includes(q) ||
              last.includes(q) ||
              full.includes(q)
            );
          })
    );
  }, [query, civilians]);

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
        officerName: `${officer.firstName} ${officer.lastName}`,
        officerCallsign: officer.callsign,
        platform: officer.department
      };

      await api.post("/api/warrants/create", payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to create warrant.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1f24] text-white p-4 sm:p-6 rounded-lg max-w-md w-full border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Create Warrant</h2>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <div className="space-y-3">
          <label className="block text-sm font-medium">Warrant Type</label>
          <Listbox value={form.type} onChange={(val) => setForm({ ...form, type: val })}>
            <div className="relative">
              <Listbox.Button className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm flex justify-between items-center">
                {form.type}
                <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 bg-gray-800 border border-gray-700 rounded w-full">
                {WARRANT_TYPES.map((type) => (
                  <Listbox.Option
                    key={type}
                    value={type}
                    className={({ active }) =>
                      `cursor-pointer p-2 text-sm ${active ? "bg-gray-700" : ""}`
                    }
                  >
                    {type}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>

          <label className="block text-sm font-medium">Search Civilian</label>
          <Combobox value={form.civilianId} onChange={(val) => setForm({ ...form, civilianId: val })}>
            <div className="relative">
              <Combobox.Input
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm"
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Start typing a name"
              />
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setQuery("")}
              >
                <Combobox.Options className="absolute z-10 mt-1 bg-gray-800 border border-gray-700 rounded w-full max-h-60 overflow-auto">
                  {filteredCivilians.map((civ) => (
                    <Combobox.Option
                      key={civ._id}
                      value={civ._id}
                      className={({ active }) =>
                        `cursor-pointer p-2 text-sm ${active ? "bg-gray-700" : ""}`
                      }
                    >
                      {civ.firstName} {civ.lastName}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>

          <label className="block text-sm font-medium">Reason</label>
          <TextareaAutosize
            name="reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Enter reason"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded resize-none text-sm"
          />

          <label className="block text-sm font-medium">Expiration (optional)</label>
          <input
            type="datetime-local"
            name="expiresAt"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 space-y-2 sm:space-y-0 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-sm"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
