// src/pages/pso/ReportsPage.jsx
import React, { useState } from "react";
import UseOfForceModal from "../../components/UseOfForceModal";
import CreateAccidentReportModal from "../../components/CreateAccidentReportModal";
import CreateSceneReportModal from "../../components/CreateSceneReportModal";

export default function PSOReportsPage() {
  const [showUseOfForceModal, setShowUseOfForceModal] = useState(false);
  const [showSceneReportModal, setShowSceneReportModal] = useState(false);
  const [showAccidentReportModal, setShowAccidentReportModal] = useState(false);

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">Public Safety Reports</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Use of Force */}
        <div className="bg-gray-800 rounded-xl p-4 shadow text-white">
          <h3 className="text-xl font-semibold mb-2">Use of Force Report</h3>
          <p className="text-sm mb-4">Submit a ballistic discharge report involving force.</p>
          <button
            onClick={() => setShowUseOfForceModal(true)}
            className="bg-purple-700 hover:bg-purple-600 text-white py-2 px-4 rounded text-sm"
          >
            Fill Out Form
          </button>
        </div>

        {/* Scene Report */}
        <div className="bg-gray-800 rounded-xl p-4 shadow text-white">
          <h3 className="text-xl font-semibold mb-2">Scene Report</h3>
          <p className="text-sm mb-4">Submit details of a scene investigation or activity.</p>
          <button
            onClick={() => setShowSceneReportModal(true)}
            className="bg-indigo-700 hover:bg-indigo-600 text-white py-2 px-4 rounded text-sm"
          >
            Fill Out Form
          </button>
        </div>

        {/* Accident Report */}
        <div className="bg-gray-800 rounded-xl p-4 shadow text-white">
          <h3 className="text-xl font-semibold mb-2">10-50 Accident Report</h3>
          <p className="text-sm mb-4">Submit details about a vehicle accident or collision.</p>
          <button
            onClick={() => setShowAccidentReportModal(true)}
            className="bg-indigo-700 hover:bg-indigo-600 text-white py-2 px-4 rounded text-sm"
          >
            Fill Out Form
          </button>
        </div>
      </div>

      {/* Modals */}
      {showUseOfForceModal && (
        <UseOfForceModal
          onClose={() => setShowUseOfForceModal(false)}
          onSubmit={() => setShowUseOfForceModal(false)}
        />
      )}
      {showSceneReportModal && (
        <CreateSceneReportModal
          onClose={() => setShowSceneReportModal(false)}
          onSubmit={() => setShowSceneReportModal(false)}
        />
      )}
      {showAccidentReportModal && (
        <CreateAccidentReportModal
          onClose={() => setShowAccidentReportModal(false)}
          onSubmit={() => setShowAccidentReportModal(false)}
        />
      )}
    </div>
  );
}
