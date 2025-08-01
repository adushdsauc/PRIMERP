import React, { useState } from "react";
import axios from "axios";

const AddMedicalModal = ({ civilianId, onClose, onSuccess }) => {
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddMedicalRecord = async () => {
    if (!notes.trim()) {
      setMessage("Please enter medical record details.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "/api/medical",
        { civilianId, description: notes },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        setMessage("✅ Medical record successfully added.");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setMessage(res.data.message || "Failed to add medical record.");
      }
    } catch (err) {
      console.error("Add medical record error:", err);
      setMessage("An error occurred while adding the medical record.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Add Medical Record</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-sm text-white placeholder-gray-400"
          placeholder="Enter medical record details..."
        ></textarea>

        {message && (
          <p className={`mt-2 text-sm text-center ${message.includes("✅") ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
          <button
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm disabled:opacity-50"
            onClick={handleAddMedicalRecord}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Record"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMedicalModal;
