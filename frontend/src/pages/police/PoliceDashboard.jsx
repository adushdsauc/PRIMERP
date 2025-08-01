// Police Dashboard UI (Styled to match reference image)
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import api from "../../utils/axios";
import CreateCallModal from "../../components/CreateCallModal";
import ViewCallDetailsModal from "../../components/ViewCallDetailsModal";
import TenCodesModal from "../../components/TenCodesModal";
import CreateBoloModal from "../../components/CreateBoloModal";
import SelectSubdivisionModal from "../../components/SelectSubdivisionModal";
import ViewBoloDetailsModal from "../../components/ViewBoloDetailsModal";
import OfficerSetupModal from "../../components/OfficerSetupModal";

export default function PoliceDashboard() {
  const [time, setTime] = useState(dayjs().format("HH:mm:ss"));
  const [callsign, setCallsign] = useState("Loading...");
  const [badgeNumber, setBadgeNumber] = useState("N/A");
  const [status, setStatus] = useState("10-8");
  const [subdivision, setSubdivision] = useState("None");
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCallDetails, setShowCallDetails] = useState(null);
  const [showTenCodes, setShowTenCodes] = useState(false);
  const [showBoloModal, setShowBoloModal] = useState(false);
  const [showSubdivisionModal, setShowSubdivisionModal] = useState(false);
  const [calls, setCalls] = useState([]);
  const [bolos, setBolos] = useState([]);
  const [selectedBolo, setSelectedBolo] = useState(null);
  const [showOfficerModal, setShowOfficerModal] = useState(false);

  const statuses = [
    "10-8 | In Service",
    "10-7 | Out of Service",
    "10-6 | Busy / Unavailable",
    "10-11 | Traffic Stop",
    "10-41 | Beginning of Tour",
    "10-42 | End of Tour",
    "Signal 11 | Running Radar"
  ];

  useEffect(() => {
    const interval = setInterval(() => setTime(dayjs().format("HH:mm:ss")), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCallsign = async () => {
      try {
        const res = await api.get("/api/auth/me");
        const officerRes = await api.get(`/api/officers/${res.data.discordId}`);
        if (!officerRes.data || !officerRes.data.callsign) {
          setShowOfficerModal(true);
          return;
        }
        setCallsign(officerRes.data.callsign || "N/A");
        setBadgeNumber(officerRes.data.badgeNumber || "N/A");
      } catch (err) {
        console.error("Failed to fetch officer info", err);
        setShowOfficerModal(true);
      }
    };
  
    fetchCallsign().catch((err) => {
      console.error("❌ Unhandled error in fetchCallsign:", err);
      setShowOfficerModal(true);
    });
  }, []);  

  const refreshCalls = async () => {
    try {
      const res = await api.get("/api/calls");
      setCalls(res.data.calls || []);
    } catch (err) {
      console.error("Failed to fetch calls", err);
    }
  };
  
  const refreshBolos = async () => {
    try {
      const res = await api.get("/api/bolos");
      setBolos(res.data.bolos || []);
    } catch (err) {
      console.error("Failed to fetch BOLOs", err);
    }
  };  

  const handleStatusChange = async (selectedStatus) => {
    setStatus(selectedStatus);
    try {
      if (selectedStatus === "10-8 | In Service" || selectedStatus === "10-41 | Beginning of Tour") {
        await api.post("/api/clock/in");
      } else if (selectedStatus === "10-7 | Out of Service" || selectedStatus === "10-42 | End of Tour") {
        await api.post("/api/clock/out");
      }
    } catch (err) {
      console.error("Clock API error:", err);
    }
  };

  useEffect(() => {
    refreshCalls();
    refreshBolos();
  }, []);

  if (showOfficerModal) {
    return <OfficerSetupModal onCreated={() => window.location.reload()} />;
  }



  return (
    <div className="p-4 sm:p-6">

      {/* Officer Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 p-6 rounded-xl shadow-md">
          <h4 className="text-white text-xl font-semibold mb-2">Officer Information</h4>
          <p className="text-white text-5xl font-mono mb-2">{time}</p>
          <p className="text-white text-sm"><strong>Identifier:</strong> {callsign}</p>
          <p className="text-white text-sm"><strong>Badge Number:</strong> {badgeNumber}</p>
          <p className="text-white text-sm"><strong>Status:</strong> {status}</p>
          <p className="text-white text-sm"><strong>Subdivision:</strong> {subdivision}</p>
        </div>

        <div className="col-span-2 bg-gray-900 p-6 rounded-xl shadow-md">
          <h4 className="text-white text-xl font-semibold mb-4 text-center">Control Panel</h4>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {statuses.map((s, i) => (
              <button
                key={i}
                onClick={() => handleStatusChange(s)}
                className={`text-xs font-medium py-2 px-3 rounded text-center ${
                  status === s ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"
                } text-white`}
              >
                {s}
              </button>
            ))}
          </div>
          <h5 className="text-white font-semibold mt-4 mb-2 text-center">Quick Actions</h5>
          <div className="flex justify-center flex-wrap gap-2">
            <button onClick={() => setShowTenCodes(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 text-xs font-medium rounded">10 Codes</button>
            <button onClick={() => setShowSubdivisionModal(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 text-xs font-medium rounded">Select Subdivision</button>
            <button onClick={() => setShowBoloModal(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 text-xs font-medium rounded">Create BOLO</button>
            <button onClick={() => setShowCallModal(true)} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 text-xs font-medium rounded">Create Call</button>
            <button className="bg-red-700 hover:bg-red-600 text-white px-3 py-2 text-xs font-medium rounded">Panic Button</button>
          </div>
        </div>
      </div>

      {/* Active Calls */}
      <div className="bg-gray-900 p-6 rounded-xl shadow-md mb-6">
        <h4 className="text-white text-xl font-semibold mb-2">Your Calls</h4>
        <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-white">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800">
            <tr>
              <th className="px-2 py-1">#</th>
              <th className="px-2 py-1">Type</th>
              <th className="px-2 py-1">Location</th>
              <th className="px-2 py-1">Postal</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="px-2 py-1">{call.callNumber}</td>
                <td className="px-2 py-1">{call.type}</td>
                <td className="px-2 py-1">{call.location}</td>
                <td className="px-2 py-1">{call.postal}</td>
                <td className="px-2 py-1">
                  <button onClick={() => setShowCallDetails(call)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Active BOLOs */}
      <div className="bg-gray-900 p-6 rounded-xl shadow-md mb-6">
        <h4 className="text-white text-xl font-semibold mb-2">Active BOLOs</h4>
        <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-white">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800">
            <tr>
              <th className="px-2 py-1">Type</th>
              <th className="px-2 py-1">Description</th>
              <th className="px-2 py-1">Location</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bolos.map((b, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="px-2 py-1 capitalize">{b.boloType}</td>
                <td className="px-2 py-1">{b.boloType === "vehicle" ? b.vehicleDescription : b.personDescription}</td>
                <td className="px-2 py-1">{b.location}</td>
                <td className="px-2 py-1">
                  <button
                    onClick={() => setSelectedBolo(b)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs"
                  >View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Live Units */}
      <div className="bg-gray-900 p-6 rounded-xl shadow-md">
        <h4 className="text-white text-xl font-semibold mb-2">Live Units</h4>
        <p className="text-gray-400 text-sm italic">(Filtered list by platform and live status will be shown here)</p>
      </div>

      {showCallModal && (
        <CreateCallModal onClose={() => setShowCallModal(false)} onSuccess={refreshCalls} />
      )}

      {showCallDetails && (
        <ViewCallDetailsModal call={showCallDetails} onClose={() => setShowCallDetails(null)} />
      )}

      {showTenCodes && (
        <TenCodesModal onClose={() => setShowTenCodes(false)} />
      )}

      {showBoloModal && (
        <CreateBoloModal onClose={() => setShowBoloModal(false)} onSuccess={refreshBolos} />
      )}

      {showSubdivisionModal && (
        <SelectSubdivisionModal onClose={() => setShowSubdivisionModal(false)} onSave={setSubdivision} />
      )}

      {selectedBolo && (
        <ViewBoloDetailsModal bolo={selectedBolo} onClose={() => setSelectedBolo(null)} />
      )}
    </div>
  );
}
