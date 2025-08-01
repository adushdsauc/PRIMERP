import React from "react";

export default function ViewBoloDetailsModal({ bolo, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl w-full max-w-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">BOLO Details</h2>

        <div className="space-y-2 text-sm">
          <p><strong>Type:</strong> {bolo.boloType}</p>

          {bolo.boloType === "vehicle" ? (
            <>
              <p><strong>Vehicle Description:</strong> {bolo.vehicleDescription}</p>
              {bolo.vehiclePlate && <p><strong>Plate #:</strong> {bolo.vehiclePlate}</p>}
            </>
          ) : (
            <>
              <p><strong>Person Description:</strong> {bolo.personDescription}</p>
              {bolo.personName && <p><strong>Name:</strong> {bolo.personName}</p>}
            </>
          )}

          <p><strong>Last Known Location:</strong> {bolo.location}</p>
          <p><strong>Additional Details:</strong> {bolo.details}</p>
          <p><strong>Created At:</strong> {new Date(bolo.createdAt).toLocaleString()}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end mt-4 space-y-2 sm:space-y-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
          >Close</button>
        </div>
      </div>
    </div>
  );
}
