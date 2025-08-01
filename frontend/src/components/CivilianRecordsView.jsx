import React from "react";

const CivilianRecordsView = ({ civilian, onClose }) => {
  if (!civilian) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div
        className="bg-gray-800 text-white p-4 sm:p-6 rounded-lg w-full max-w-2xl shadow-lg"
        data-ignore-click
      >
        <h2 className="text-2xl font-semibold mb-4">
          {civilian.firstName} {civilian.lastName} - Civilian Records
        </h2>

        <p className="text-gray-400 text-sm">
          This section is reserved for future records and citations.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CivilianRecordsView;
