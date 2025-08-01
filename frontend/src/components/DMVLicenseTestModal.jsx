// components/DMVLicenseTestModal.jsx
import React, { useState, Fragment, useEffect } from "react";
import api from "../utils/axios";
import { DMV_EXAMS } from "../data/dmvExamQuestions";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const LICENSE_TYPES = Object.keys(DMV_EXAMS);

const DMVLicenseTestModal = ({ onClose }) => {
  const [licenseType, setLicenseType] = useState("");
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem("dmv_answers");
    return saved ? JSON.parse(saved) : {};
  });
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [startTime] = useState(Date.now());

  const questions = DMV_EXAMS[licenseType] || [];
  const score = questions.reduce(
    (acc, q, idx) => acc + (answers[idx] === q.answer ? 1 : 0),
    0
  );

  useEffect(() => {
    const saveProgress = () => {
      localStorage.setItem("dmv_answers", JSON.stringify(answers));
    };
    saveProgress();
  }, [answers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!submitted) {
        setMessage("❌ Time limit exceeded. Test closed.");
        setSubmitted(true);
        localStorage.removeItem("dmv_answers");
        setTimeout(() => onClose(), 5000);
      }
    }, 15 * 60 * 1000); // 15-minute limit
    return () => clearTimeout(timeout);
  }, [submitted, onClose]);

  useEffect(() => {
    if (submitted && message.includes("✅")) {
      const timeout = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timeout);
    }
  }, [submitted, message, onClose]);

  const handleAnswerChange = (idx, value) => {
    setAnswers(prev => ({ ...prev, [idx]: value }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    try {
      await api.post("/api/licenses/save-test", {
        licenseType,
        score,
        passed: score >= 7,
        answers,
      });
      setMessage("✅ Your test result has been saved.");
      localStorage.removeItem("dmv_answers");
    } catch (err) {
      console.error("Failed to save test result:", err);
      setMessage("❌ Error saving test result.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl w-full max-w-3xl shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-4 text-center">📋 Take DMV Test</h2>

        <Listbox value={licenseType} onChange={(val) => {
          setLicenseType(val);
          setAnswers({});
          setSubmitted(false);
          setMessage("");
          localStorage.removeItem("dmv_answers");
        }}>
          <div className="relative mb-4">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-gray-700 py-2 pl-4 pr-10 text-left shadow-md focus:outline-none">
              <span className="block truncate">{licenseType || "Select License Type"}</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {LICENSE_TYPES.map((type) => (
                  <Listbox.Option key={type} value={type} className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? "bg-indigo-600 text-white" : "text-gray-100"}`}>
                    {({ selected }) => (
                      <>
                        <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{type}</span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        {licenseType && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-gray-800 p-4 rounded">
                <p className="font-semibold mb-2">{idx + 1}. {q.question}</p>
                <Listbox
                  value={answers[idx] || ""}
                  onChange={(value) => handleAnswerChange(idx, value)}
                  disabled={submitted}
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-default rounded-md bg-gray-700 py-2 pl-4 pr-10 text-left text-sm">
                      <span className="block truncate">{answers[idx] || "Select Answer"}</span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
                      </span>
                    </Listbox.Button>
                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {q.options.map((opt, i) => (
                          <Listbox.Option key={i} value={opt} className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? "bg-indigo-600 text-white" : "text-gray-100"}`}>
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{opt}</span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                  </span>
                                )}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
              </div>
            ))}

            {!submitted && (
              <button className="mt-4 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded" onClick={handleSubmit}>
                Submit Test
              </button>
            )}

            {submitted && (
              <div className="mt-4 text-center">
                <p className="text-lg">✅ You scored {score} / {questions.length}</p>
                <p className="text-sm text-yellow-400">({score >= 7 ? "You Passed!" : "You Failed"})</p>
                {message && <p className="mt-2 text-sm">{message}</p>}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-right">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DMVLicenseTestModal;
