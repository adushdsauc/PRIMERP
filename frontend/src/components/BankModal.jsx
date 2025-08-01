import React from "react";

export default function BankModal({ isOpen, onClose, title, onSubmit, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {children}
          <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2 space-y-2 sm:space-y-0">
            <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
              Cancel
            </button>
            <button type="submit" className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
