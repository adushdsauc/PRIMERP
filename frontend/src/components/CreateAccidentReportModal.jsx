import React, { useEffect, useState } from "react";
import api from "../utils/axios";
import { Listbox } from "@headlessui/react";
import TextareaAutosize from "react-textarea-autosize";

const ACCIDENT_TYPES = [
    "Type of Accident:",
  "Single Vehicle",
  "Multi-Vehicle",
  "Hit-and-Run",
  "Pedestrian Involved",
  "Other"
];

export default function CreateAccidentReportModal({ onClose, onSubmit }) {
  const [officer, setOfficer] = useState(null);
  const [form, setForm] = useState({
    location: "",
    timeOfDay: "",
    accidentType: ACCIDENT_TYPES[0],
    how: "",
    witnesses: "",
    civilians: ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOfficer = async () => {
      try {
        const res = await api.get("/api/auth/me");
        const officerRes = await api.get(`/api/officers/${res.data.discordId}`);
        setOfficer(officerRes.data);
      } catch (err) {
        console.error("❌ Failed to load officer info:", err);
        console.trace();
        setError("Failed to load officer info.");
      }
    };
  
    fetchOfficer().catch((err) => {
      console.error("🔥 Unhandled rejection in fetchOfficer:", err);
      console.trace();
    });
  }, []);  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      await api.post("/api/psoreports/10-50", {
        ...form,
        discordUsername: officer?.discordId,
        officerName: officer?.callsign,
        officerRank: officer?.rank
      });
      onSubmit?.();
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit report.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-[#1E1F24] text-white p-4 sm:p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">10-50 Accident Report</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          <TextareaAutosize
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location of Accident"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
          <TextareaAutosize
            name="timeOfDay"
            value={form.timeOfDay}
            onChange={handleChange}
            placeholder="Time of Day"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />

          <div>
            <Listbox
              value={form.accidentType}
              onChange={(val) => setForm({ ...form, accidentType: val })}
            >
              <Listbox.Button className="w-full bg-[#2A2B31] border border-[#3B3C42] rounded px-3 py-2 text-left text-sm">
                {form.accidentType}
              </Listbox.Button>
              <Listbox.Options className="bg-[#2A2B31] border border-[#3B3C42] mt-1 rounded shadow-md z-50">
                {ACCIDENT_TYPES.map((type, i) => (
                  <Listbox.Option
                    key={i}
                    value={type}
                    className="p-2 text-sm hover:bg-[#3B3C42] cursor-pointer"
                  >
                    {type}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Listbox>
          </div>

          <TextareaAutosize
            name="how"
            value={form.how}
            onChange={handleChange}
            placeholder="How it happened"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
          <TextareaAutosize
            name="witnesses"
            value={form.witnesses}
            onChange={handleChange}
            placeholder="Witnesses (if any)"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
          <TextareaAutosize
            name="civilians"
            value={form.civilians}
            onChange={handleChange}
            placeholder="Civilians involved (optional)"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 space-y-2 sm:space-y-0 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#3B3C42] hover:bg-[#4A4B50] text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
