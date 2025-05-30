require("dotenv").config();

import React, { useState, useEffect } from "react";
import { Dialog, Listbox } from "@headlessui/react";
import axios from "axios";

const REPORT_TYPES = ["Select Report Type", "Arrest", "Citation", "Warning"];

export default function CreateReportModal({ civilian, onClose }) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [offense, setOffense] = useState("");
  const [offenses, setOffenses] = useState([]);
  const [fine, setFine] = useState(0);
  const [jailTime, setJailTime] = useState(0);
  const [notes, setNotes] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [penalCodes, setPenalCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [message, setMessage] = useState("");
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const res = await axios.get("/api/auth/me");
      setOfficerName(res.data.username);
      const officerRes = await axios.get(`/api/officers/${res.data.discordId}`);
      setPlatform(officerRes.data.department);
    };
    fetchUser();

    const fetchPenalCodes = async () => {
      const res = await axios.get("/api/penal-codes");
      setPenalCodes(res.data);
    };
    fetchPenalCodes();
  }, []);

  const handleOffenseInput = (value) => {
    setOffense(value);
    const matches = penalCodes.filter(code => code.title.toLowerCase().includes(value.toLowerCase()));
    setFilteredCodes(matches);
  };

  const addOffense = () => {
    const exact = penalCodes.find(code => code.title.toLowerCase() === offense.toLowerCase());
    if (exact) {
      setOffenses(prev => [...prev, exact]);
      setFine(prev => prev + exact.fine);
      setJailTime(prev => prev + exact.jailTime);
    } else {
      setOffenses(prev => [...prev, { title: offense, fine: 0, jailTime: 0 }]);
    }
    setOffense("");
    setFilteredCodes([]);
  };

  const handleSubmit = async () => {
    if (reportType === REPORT_TYPES[0]) {
      setMessage("❌ Please select a valid report type.");
      return;
    }

    try {
      const reasons = offenses.map(o => o.title).join(", ");
      const reportRes = await axios.post("/api/reports/create", {
        civilianId: civilian._id,
        type: reportType.toLowerCase(),
        officer: officerName,
        reason: reasons,
        fineAmount: fine,
        jailTime,
        notes,
        platform: platform.toLowerCase(),
      });

      const embed = {
        title: `You have received a ${reportType}`,
        description: `**Offenses:** ${reasons}\n**Fine:** $${fine}\n**Jail Time:** ${jailTime} min\n**Notes:** ${notes || "None"}`,
        color: reportType === "Citation" ? 0xffcc00 : reportType === "Arrest" ? 0xff0000 : 0x00b0f4,
      };

      const components = [];
      if ((reportType === "Citation" || reportType === "Arrest") && fine > 0) {
        components.push({
          type: 1,
          components: [
            {
              type: 2,
              label: "💸 Pay Fine",
              style: 3,
              custom_id: `pay_fine_${reportRes.data.recordId}`,
            },
          ],
        });
      }

      await axios.post("/api/dm/send", {
        discordId: civilian.discordId,
        embed,
        components,
      });

      const webhookUrl =
      platform === "Xbox"
        ? process.env.REACT_APP_XBOX_REPORT_WEBHOOK
        : process.env.REACT_APP_PS_REPORT_WEBHOOK;    

      await axios.post(webhookUrl, {
        embeds: [
          {
            title: `New ${reportType} Issued`,
            description: `**Offenses:** ${reasons}\n**Fine:** $${fine}\n**Jail Time:** ${jailTime} min\n**Officer:** ${officerName}`,
            footer: { text: `Issued to: ${civilian.firstName} ${civilian.lastName}` },
            color: reportType === "Citation" ? 0xffcc00 : reportType === "Arrest" ? 0xff0000 : 0x00b0f4,
          },
        ],
      });

      setMessage("✅ Report submitted successfully.");
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error("Report submission error:", err);
      setMessage("❌ Failed to submit report.");
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Panel className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full mx-auto">
          <Dialog.Title className="text-white text-xl mb-4 text-left">Create Report</Dialog.Title>
          <div className="space-y-4">
            <div>
              <label className="text-white block text-left">Report Type</label>
              <Listbox value={reportType} onChange={setReportType}>
                <div className="relative">
                  <Listbox.Button className="w-full bg-gray-800 text-white p-2 rounded text-left">
                    {reportType}
                  </Listbox.Button>
                  <Listbox.Options className="absolute mt-1 w-full bg-gray-800 rounded text-white max-h-60 overflow-y-auto z-10">
                    {REPORT_TYPES.map((type) => (
                      <Listbox.Option
                        key={type}
                        value={type}
                        className={({ active }) => `px-4 py-2 cursor-pointer ${active ? "bg-indigo-600" : ""}`}
                      >
                        {type}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>

            <div>
              <label className="text-white block text-left">Add Offense</label>
              <input
                type="text"
                value={offense}
                onChange={(e) => handleOffenseInput(e.target.value)}
                className="w-full bg-gray-800 text-white p-2 rounded"
                placeholder="Start typing to search penal code..."
              />
              {filteredCodes.length > 0 && (
                <ul className="bg-gray-800 mt-1 rounded text-white text-sm max-h-48 overflow-y-auto">
                  {filteredCodes.map((code) => (
                    <li
                      key={code.title}
                      onClick={() => {
                        setOffense(code.title);
                        setFilteredCodes([]);
                      }}
                      className="px-3 py-2 hover:bg-indigo-600 cursor-pointer"
                    >
                      {code.title}
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={addOffense}
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded"
              >
                Add Offense
              </button>
              {offenses.length > 0 && (
                <ul className="mt-2 text-white text-sm">
                  {offenses.map((o, idx) => (
                    <li key={idx}>• {o.title}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="text-white block text-left">Fine ($)</label>
                <input
                  type="number"
                  value={fine}
                  onChange={(e) => setFine(parseInt(e.target.value))}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                />
              </div>
              <div className="flex-1">
                <label className="text-white block text-left">Jail Time (min)</label>
                <input
                  type="number"
                  value={jailTime}
                  onChange={(e) => setJailTime(parseInt(e.target.value))}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                />
              </div>
            </div>

            <div>
              <label className="text-white block text-left">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-800 text-white p-2 rounded"
              ></textarea>
            </div>

            <div className="text-gray-400 text-sm text-left">
              <p>Date/Time: {new Date().toLocaleString()}</p>
              <p>Officer: {officerName}</p>
            </div>

            {message && (
              <p className={`text-left text-sm font-medium ${message.includes("✅") ? "text-green-400" : "text-red-400"}`}>{message}</p>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
              >
                Submit Report
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
