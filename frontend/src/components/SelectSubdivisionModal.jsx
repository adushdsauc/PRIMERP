// SelectSubdivisionModal.jsx
import React, { useState } from "react";

const SUBDIVISIONS = [
  "Air Support Unit ASU",
  "High Speed Unit HSU",
  "Special Weapons and Tactics SWAT",
  "Detectives"
];

export default function SelectSubdivisionModal({ onClose, onSave }) {
  const [selected, setSelected] = useState(SUBDIVISIONS[0]);

  const handleSubmit = () => {
    onSave(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Select Subdivision</h2>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-sm mb-4"
        >
          {SUBDIVISIONS.map((sub, i) => (
            <option key={i} value={sub}>{sub}</option>
          ))}
        </select>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm">Save</button>
        </div>
      </div>
    </div>
  );
}
