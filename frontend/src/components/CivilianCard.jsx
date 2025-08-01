import React, { useState } from "react";
import AddLicenseModal from "./AddLicenseModal";

const CivilianCard = ({
  civilian,
  refreshData,
  onEdit,
  onDelete,
  onClose,
  onRecords,
}) => {
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  return (
    <div className="bg-gray-800 text-white p-4 sm:p-6 rounded-xl shadow-lg max-w-2xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-2">{civilian.firstName} {civilian.lastName}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-sm">
        <p><strong>DOB:</strong> {civilian.dob || civilian.dateOfBirth || "N/A"}</p>
        <p><strong>Age:</strong> {civilian.age || "N/A"}</p>
        <p><strong>Sex:</strong> {civilian.sex || "N/A"}</p>
        <p><strong>Hair:</strong> {civilian.hair || "N/A"}</p>
        <p><strong>Eyes:</strong> {civilian.eyes || "N/A"}</p>
        <p><strong>Height:</strong> {civilian.height || "N/A"}</p>
        <p><strong>Weight:</strong> {civilian.weight || "N/A"}</p>
        <p><strong>Zip Code:</strong> {civilian.zipCode || "N/A"}</p>
        <p><strong>Skin Tone:</strong> {civilian.skinTone || "N/A"}</p>
        <p><strong>Residence:</strong> {civilian.residence || "N/A"}</p>
        <p><strong>Occupation:</strong> {civilian.occupation || "N/A"}</p>
      </div>

      <div className="mt-4 text-sm">
        <p className="mb-1 font-semibold flex items-center gap-2">
          ✅ Licenses:
          <span className="font-normal">
            {civilian.licenses?.length > 0
              ? civilian.licenses.join(", ")
              : "None"}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={() => setShowLicenseModal(true)}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          Add License
        </button>
        <button
          onClick={onRecords}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white w-full sm:w-auto"
        >
          View Records
        </button>
        <button
          onClick={onEdit}
          className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-white w-full sm:w-auto"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white w-full sm:w-auto"
        >
          Delete
        </button>
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white w-full sm:w-auto"
        >
          Close
        </button>
      </div>

      {showLicenseModal && (
        <AddLicenseModal
          civilian={civilian}
          onClose={() => setShowLicenseModal(false)}
          onSuccess={() => {
            setShowLicenseModal(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
};

export default CivilianCard;
