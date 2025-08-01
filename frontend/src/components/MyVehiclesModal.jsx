import React, { useEffect, useState } from "react";
import api from "../utils/axios";
import EditVehicleModal from "./EditVehicleModal";

const MyVehiclesModal = ({ onClose }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingVehicle, setEditingVehicle] = useState(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/api/vehicles/my");
        setVehicles(res.data.vehicles || []);
      } catch (err) {
        console.error("❌ Failed to load vehicles:", err);
        console.trace();
        setError("Unable to load vehicles.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchVehicles().catch((err) => {
      console.error("🔥 Unhandled rejection in fetchVehicles:", err);
      console.trace();
    });
  }, []);
  

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      setVehicles((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
      alert("Delete failed.");
    }
  };

  const handleEditSuccess = (updated) => {
    if (!updated || !updated._id) return; // ⛑ Prevent crash if undefined
    setVehicles((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
    setEditingVehicle(null);
  };
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl shadow-xl w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4 text-center">My Registered Vehicles</h2>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-400">{error}</p>
        ) : vehicles.length === 0 ? (
          <p className="text-center text-gray-400">No vehicles registered.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            {vehicles.map((vehicle) => (
              <div key={vehicle._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold mb-1">
                  {vehicle.plate.toUpperCase()} - {vehicle.make} {vehicle.model} ({vehicle.year})
                </h3>
                <p><span className="font-semibold">Type:</span> {vehicle.type}</p>
                <p><span className="font-semibold">Color:</span> {vehicle.color}</p>
                <p><span className="font-semibold">Registered To:</span> {vehicle.civilianName || "Unknown"}</p>
                <p><span className="font-semibold">Insurance:</span> {vehicle.insured ? "✅ Yes" : "❌ No"}</p>

                <div className="flex gap-2 mt-3">
                  <button
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    onClick={() => setEditingVehicle(vehicle)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-sm"
                    onClick={() => handleDelete(vehicle._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {editingVehicle && (
        <EditVehicleModal
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default MyVehiclesModal;
