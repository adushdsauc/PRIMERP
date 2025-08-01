import React from "react";

export default function CivilianEditForm({ civilian }) {
  if (!civilian) return <p className="text-gray-400">No civilian data available.</p>;

  return (
    <div className="mt-6 p-4 sm:p-6 bg-gray-800 border border-gray-700 rounded-lg text-white max-w-xl">
      <h3 className="text-xl font-semibold mb-4">
        Editing: {civilian.firstName} {civilian.lastName}
      </h3>

      {/* Placeholder for actual form fields */}
      <p className="text-gray-300">Form fields coming soon...</p>
    </div>
  );
}
