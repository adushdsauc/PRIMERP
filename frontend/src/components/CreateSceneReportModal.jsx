import React, { useEffect, useState } from "react";
import api from "../utils/axios";
import TextareaAutosize from "react-textarea-autosize";

export default function CreateSceneReportModal({ onClose, onSubmit }) {
  const [officer, setOfficer] = useState(null);
  const [form, setForm] = useState({
    involvedCivilians: "",
    involvedOfficers: "",
    location: "",
    timeOfDay: "",
    whatHappened: "",
    how: "",
    witnesses: "",
    verdicts: ""
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
      console.error("🔥 Unhandled promise rejection in fetchOfficer:", err);
      console.trace();
    });
  }, []);  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      await api.post("/api/psoreports/scene-report", {
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center p-4 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-[#1E1F24] text-white p-4 sm:p-6 rounded-lg w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Scene Report</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-4">
          <TextareaAutosize
            name="involvedCivilians"
            value={form.involvedCivilians}
            onChange={handleChange}
            placeholder="Civilians involved"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
          <TextareaAutosize
            name="involvedOfficers"
            value={form.involvedOfficers}
            onChange={handleChange}
            placeholder="Other officers involved"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
          <TextareaAutosize
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location of scene"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
          <TextareaAutosize
            name="timeOfDay"
            value={form.timeOfDay}
            onChange={handleChange}
            placeholder="Time of day"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
          <TextareaAutosize
            name="whatHappened"
            value={form.whatHappened}
            onChange={handleChange}
            placeholder="What happened on the scene"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
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
            name="verdicts"
            value={form.verdicts}
            onChange={handleChange}
            placeholder="Verdict / outcome of the scene"
            className="w-full px-3 py-2 text-sm bg-[#2A2B31] border border-[#3B3C42] rounded resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 space-y-2 sm:space-y-0 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded bg-[#3B3C42] hover:bg-[#4A4B50] text-sm">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm">Submit</button>
        </div>
      </div>
    </div>
  );
}
