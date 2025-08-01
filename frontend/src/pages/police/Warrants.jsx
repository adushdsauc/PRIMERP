import React, { useEffect, useState } from "react";
import api from "../../utils/axios";
import CreateWarrantModal from "../../components/CreateWarrantModal";

export default function Warrants() {
  const [warrants, setWarrants] = useState([]);
  const [officer, setOfficer] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWarrants = async () => {
    try {
      setLoading(true);
      setError("");

      const session = await api.get("/api/auth/me");
      const officerRes = await api.get(`/api/officers/${session.data.discordId}`);
      const warrantRes = await api.get("/api/warrants/all");

      setOfficer(officerRes.data);

      const filtered = warrantRes.data.filter(
        (w) => w?.platform === officerRes.data?.department
      );

      setWarrants(filtered);
    } catch (err) {
      console.error("❌ Failed to fetch warrants:", err);
      setError("Failed to load warrants. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarrants().catch((err) => {
      console.error("❌ Unhandled fetchWarrants error:", err);
      setError("Unexpected error while loading warrants.");
    });
  }, []);

  const handleResolve = async (id) => {
    try {
      await api.post(`/api/warrants/resolve/${id}`);
      await fetchWarrants(); // ✅ Ensure we await this call for error catching
    } catch (err) {
      console.error("❌ Failed to resolve warrant:", err);
      setError("Failed to resolve warrant.");
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">Warrants & BOLOs</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded w-full sm:w-auto"
        >
          + Create Warrant
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading warrants...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-4">
        {warrants.map((warrant) => (
          <div
            key={warrant._id}
            className="bg-gray-800 p-4 rounded border border-gray-700 text-white"
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-xl font-semibold">
                {warrant.civilianId?.firstName} {warrant.civilianId?.lastName}
              </h3>
              <span
                className={`text-sm font-medium ${
                  warrant.status === "Active" ? "text-yellow-400" : "text-green-400"
                }`}
              >
                {warrant.status}
              </span>
            </div>
            <p className="text-sm text-gray-400">Reason: {warrant.reason}</p>
            <p className="text-sm text-gray-400">
              Issued By: {warrant.officerName} ({warrant.officerCallsign})
            </p>
            <p className="text-sm text-gray-500">
              Issued At: {new Date(warrant.createdAt).toLocaleString()}
            </p>
            {warrant.expiresAt && (
              <p className="text-sm text-gray-500">
                Expires: {new Date(warrant.expiresAt).toLocaleString()}
              </p>
            )}

            {warrant.status === "Active" && (
              <button
                onClick={() => handleResolve(warrant._id)}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
              >
                Resolve Warrant
              </button>
            )}
          </div>
        ))}
      </div>

      {showCreateModal && officer && (
        <CreateWarrantModal
          officer={officer}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchWarrants}
        />
      )}
    </div>
  );
}
