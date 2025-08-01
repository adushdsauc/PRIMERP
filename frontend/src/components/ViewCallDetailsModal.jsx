import React from "react";

export default function ViewCallDetailsModal({ call, onClose }) {
  if (!call) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl w-full max-w-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Call Details</h2>

        <div className="space-y-2 text-sm">
          <p><strong>Call Number:</strong> {call.callNumber}</p>
          <p><strong>Type:</strong> {call.type}</p>
          <p><strong>Location:</strong> {call.location}</p>
          <p><strong>Postal Code:</strong> {call.postal}</p>
          <p><strong>Primary Officer:</strong> {call.primaryOfficer || "Unknown"}</p>
          {call.details && (
            <div>
              <p className="font-semibold">Details:</p>
              <p className="text-gray-300 whitespace-pre-wrap">{call.details}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end mt-4 space-y-2 sm:space-y-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >Close</button>
        </div>
      </div>
    </div>
  );
}
