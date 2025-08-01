import React, { useEffect, useState } from "react";
import api from "../utils/axios";
import { Listbox } from "@headlessui/react";
import TextareaAutosize from 'react-textarea-autosize'; // install if needed

const DISCHARGE_OPTIONS = ["Weapon Discharged:", "Baton", "Taser", "Pistol", "Shotgun", "Assault Rifle"];
const SUCCESS_OPTIONS = ["Was the use of force succesful?", "Yes", "No"];

export default function CreateUseOfForceModal({ onClose, onSubmit }) {
  const [officer, setOfficer] = useState(null);
  const [form, setForm] = useState({
    discharged: DISCHARGE_OPTIONS[0],
    reason: "",
    justification: "",
    lawsBroken: "",
    successful: SUCCESS_OPTIONS[0],
    additionalInfo: ""
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOfficer = async () => {
      try {
        const res = await api.get("/api/auth/me");
        const officerRes = await api.get(`/api/officers/${res.data.discordId}`);
        setOfficer(officerRes.data);
      } catch (err) {
        setError("Failed to load officer info.");
        console.error("❌ fetchOfficer error:", err);
        console.trace();
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
      await api.post("/api/psoreports/use-of-force", {
        ...form,
        officerName: officer?.callsign,
        officerRank: officer?.rank,
        discordUsername: officer?.discordId
      });
      onSubmit?.();
      onClose();
    } catch (err) {
      console.error("Submit error:", err);
      setError("Submission failed.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-[#1E1F24] text-white p-4 sm:p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Use of Force Report</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          {/* Discharge Weapon */}
          <div>
            <Listbox value={form.discharged} onChange={(val) => setForm({ ...form, discharged: val })}>
              <Listbox.Button className="w-full bg-[#2A2B31] border border-[#3B3C42] rounded px-3 py-2 text-left text-sm">
                {form.discharged}
              </Listbox.Button>
              <Listbox.Options className="bg-[#2A2B31] border border-[#3B3C42] mt-1 rounded shadow-md z-50">
                {DISCHARGE_OPTIONS.map((item, i) => (
                  <Listbox.Option key={i} value={item} className="p-2 text-sm hover:bg-[#3B3C42] cursor-pointer">
                    {item}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Listbox>
          </div>

          {/* Text Inputs with Auto-Expand */}
          <TextareaAutosize
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="Why did you discharge your weapon?"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
          <TextareaAutosize
            name="justification"
            value={form.justification}
            onChange={handleChange}
            placeholder="Justification for discharge"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
          <TextareaAutosize
            name="lawsBroken"
            value={form.lawsBroken}
            onChange={handleChange}
            placeholder="Penal codes/laws broken"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />

          {/* Was it successful */}
          <Listbox value={form.successful} onChange={(val) => setForm({ ...form, successful: val })}>
            <Listbox.Button className="w-full bg-[#2A2B31] border border-[#3B3C42] rounded px-3 py-2 text-left text-sm">
              {form.successful}
            </Listbox.Button>
            <Listbox.Options className="bg-[#2A2B31] border border-[#3B3C42] mt-1 rounded shadow-md z-50">
              {SUCCESS_OPTIONS.map((item, i) => (
                <Listbox.Option key={i} value={item} className="p-2 text-sm hover:bg-[#3B3C42] cursor-pointer">
                  {item}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Listbox>

          {/* Additional Info */}
          <TextareaAutosize
            name="additionalInfo"
            value={form.additionalInfo}
            onChange={handleChange}
            placeholder="Additional information (optional)"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2 space-y-2 sm:space-y-0">
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
