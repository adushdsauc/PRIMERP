import React, { useState, Fragment, useMemo } from "react";
import axios from "axios";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const ALL_LICENSE_OPTIONS = [
  "Class C - Standard Drivers License",
  "Class M - Motorcycle License",
  "Class A - CDL Class A License",
  "Class B - CDL Class B License",
];


const AddLicenseModal = ({ civilian, onClose, onSuccess }) => {
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const availableLicenses = useMemo(() => {
    return ALL_LICENSE_OPTIONS.filter(
      (license) => !civilian.licenses?.includes(license)
    );
  }, [civilian]);

  const handleAddLicense = async () => {
    setMessage("");
    if (!selectedLicense) {
      setMessage("Please select a license type.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `/api/civilians/${civilian._id}/add-license`,
        { license: selectedLicense },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        setMessage("License successfully added.");
        setTimeout(() => {
          setLoading(false);
          onSuccess(); // Refresh parent
          onClose();   // Close modal
        }, 1000);
      } else {
        setLoading(false);
        setMessage(res.data.message || "Failed to add license.");
      }
    } catch (err) {
      console.error("Add license error:", err);
      setLoading(false);
      setMessage("An error occurred while adding the license.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-center">Add New License</h2>

        <Listbox value={selectedLicense} onChange={setSelectedLicense} disabled={availableLicenses.length === 0}>
          <div className="relative mb-4">
            <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gray-700 py-2 pl-4 pr-10 text-left shadow focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <span className="block truncate text-sm">
                {selectedLicense || "Select a license"}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {availableLicenses.length === 0 ? (
                  <div className="px-4 py-2 text-gray-400">No licenses available</div>
                ) : (
                  availableLicenses.map((license) => (
                    <Listbox.Option
                      key={license}
                      value={license}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                          active ? "bg-indigo-600 text-white" : "text-gray-100"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                            {license}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                              <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))
                )}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        {message && (
          <p
            className={`mb-3 text-center text-sm ${
              message.includes("success") ? "text-green-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm disabled:opacity-50"
            onClick={handleAddLicense}
            disabled={loading || availableLicenses.length === 0}
          >
            {loading ? "Adding..." : "Add License"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLicenseModal;
