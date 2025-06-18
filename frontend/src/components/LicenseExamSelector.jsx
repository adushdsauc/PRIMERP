import React from "react";

const LicenseExamSelector = ({ onSelect }) => {
  const examTypes = [
    "Standard Driver's License",
    "Motorcycle License",
    "CDL Class A",
    "CDL Class B",
  ];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold mb-2">🚘 Choose License Type</h2>
      {examTypes.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded"
        >
          {type}
        </button>
      ))}
    </div>
  );
};

export default LicenseExamSelector;
