import React, { useState, useEffect } from "react";
import AddLicenseModal from "../components/AddLicenseModal";
import AddVehicleModal from "../components/AddVehicleModal";
import AddMedicalModal from "../components/AddMedicalModal";
import AddWeaponModal from "../components/AddWeaponModal";
import DMVLicenseTestModal from "../components/DMVLicenseTestModal";
import api from "../utils/axios";
import EditVehicleModal from "../components/EditVehicleModal";
import EditWeaponModal from "../components/EditWeaponModal";


const LICENSE_ROLE_MAP = {
  "Class C - Standard Drivers License": "1372243631766896680",
  "Class M - Motorcycle License": "1372243630613598258",
  "Class A - CDL Class A License": "1370192296162885672",
  "Class B - CDL Class B License": "1370192299195236352",
};

const CivilianDetailView = ({ civilian, onEdit, onDelete, onClose }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddLicense, setShowAddLicense] = useState(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddMedical, setShowAddMedical] = useState(false);
  const [showAddWeapon, setShowAddWeapon] = useState(false);
  const [showDMVExam, setShowDMVExam] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [editVehicle, setEditVehicle] = useState(null);
  const [editWeaponId, setEditWeaponId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setUserRoles(res.data.roles || []);
      } catch (err) {
        console.error("❌ Failed to fetch user roles:", err);
        console.trace();
      }
    };
  
    fetchUser().catch((err) => {
      console.error("🔥 Unhandled rejection in fetchUser:", err);
      console.trace();
    });
  }, []);
  

  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const vehicleRes = await api.get(`/api/vehicles/by-civilian/${civilian._id}`);
        const weaponRes = await api.get(`/api/weapons/by-civilian/${civilian._id}`);
        setVehicles(vehicleRes.data.vehicles || []);
        setWeapons(weaponRes.data.weapons || []);
      } catch (err) {
        console.error("❌ Error fetching related data:", err);
        console.trace();
      }
    };
  
    if (civilian?._id) {
      fetchRelatedData().catch((err) => {
        console.error("🔥 Unhandled rejection in fetchRelatedData:", err);
        console.trace();
      });
    }
  }, [civilian]);
  

  const handleDeleteVehicle = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this vehicle?");
    if (!confirmed) return;
  
    try {
      await api.delete(`/api/vehicles/${id}`);
      setVehicles((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      console.error("Failed to delete vehicle", err);
    }
  };
  
  
  const handleDeleteWeapon = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this weapon?");
    if (!confirmed) return;
  
    try {
      await api.delete(`/api/weapons/${id}`);
      setWeapons((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      console.error("Failed to delete weapon", err);
    }
  };
  
  
  if (!civilian) return null;

  const canAddLicense = (type) =>
    userRoles.includes(LICENSE_ROLE_MAP[type]) && !civilian.licenses.includes(type);  

  const filteredAddButtons = Object.keys(LICENSE_ROLE_MAP).filter((type) => canAddLicense(type));
  const needsDMVExam = Object.keys(LICENSE_ROLE_MAP).some((type) => !civilian.licenses.includes(type));

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-2xl w-full max-w-6xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-gray-700 pb-2">
          <h2 className="text-3xl font-bold">{civilian.firstName} {civilian.lastName}</h2>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
            >
              &#8942;
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
                <button onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full text-left px-4 py-2 hover:bg-gray-700">Edit Citizen</button>
                <button onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full text-left px-4 py-2 hover:bg-gray-700 text-red-400">Delete Citizen</button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-700 text-yellow-400">Mark Citizen Deceased</button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-300">
          <p><strong>DOB:</strong> {civilian.dateOfBirth || "N/A"}</p>
          <p><strong>Age:</strong> {civilian.age || "N/A"}</p>
          <p><strong>Sex:</strong> {civilian.sex || "N/A"}</p>
          <p><strong>Hair:</strong> {civilian.hairColor || "N/A"}</p>
          <p><strong>Eyes:</strong> {civilian.eyeColor || "N/A"}</p>
          <p><strong>Height:</strong> {civilian.height || "N/A"}</p>
          <p><strong>Weight:</strong> {civilian.weight || "N/A"}</p>
          <p><strong>Skin Tone:</strong> {civilian.skinTone || "N/A"}</p>
          <p><strong>Zip Code:</strong> {civilian.zipCode || "N/A"}</p>
          <p><strong>Occupation:</strong> {civilian.occupation || "N/A"}</p>
          <p className="col-span-2"><strong>Residence:</strong> {civilian.residence || "N/A"}</p>
        </div>

        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-semibold">Licenses</h3>
            <div className="flex gap-2">
              {filteredAddButtons.length > 0 && (
                <button
                  onClick={() => setShowAddLicense(filteredAddButtons[0])}
                  className="text-xs bg-green-600 hover:bg-green-500 px-2 py-1 rounded"
                >
                  Add License
                </button>
              )}
              {needsDMVExam && (
                <button
                  onClick={() => setShowDMVExam(true)}
                  className="text-xs bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded"
                >
                  DMV Exam
                </button>
              )}
            </div>
          </div>
          <div className="text-sm">
            {civilian.licenses?.length > 0 ? (
              civilian.licenses.map((lic, idx) => <p key={idx}> {lic}</p>)
            ) : (
              <p className="text-yellow-400">⚠️ No licenses on file.</p>
            )}
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-semibold">Vehicles</h3>
            <button onClick={() => setShowAddVehicle(true)} className="text-xs bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded">Add Vehicle</button>
          </div>
          {vehicles.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th className="px-2 py-1">Plate</th>
                  <th className="px-2 py-1">Make</th>
                  <th className="px-2 py-1">Model</th>
                  <th className="px-2 py-1">Color</th>
                  <th className="px-2 py-1">Year</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id} className="border-t border-gray-700">
                    <td className="px-2 py-1">{v.plate}</td>
                    <td className="px-2 py-1">{v.make}</td>
                    <td className="px-2 py-1">{v.model}</td>
                    <td className="px-2 py-1">{v.color}</td>
                    <td className="px-2 py-1">{v.year}</td>
                    <td className="px-2 py-1 space-x-1">
<button
onClick={() => setEditVehicle(v)}  className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs"
>
  Edit
</button>
<button
  onClick={() => handleDeleteVehicle(v._id)}
  className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
>
  Delete
</button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <p className="text-sm italic">No vehicles registered yet.</p>
          )}
        </div>

        {/* Weapons Table */}
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-semibold">Weapons</h3>
            <button onClick={() => setShowAddWeapon(true)} className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded">Add Weapon</button>
          </div>
          {weapons.length > 0 ? (
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th className="px-2 py-1">Model</th>
                  <th className="px-2 py-1">Serial</th>
                  <th className="px-2 py-1">Registered To</th>
                  <th className="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {weapons.map((w) => (
                  <tr key={w._id} className="border-t border-gray-700">
                    <td className="px-2 py-1">{w.weaponType}</td>
                    <td className="px-2 py-1">{w.serialNumber}</td>
                    <td className="px-2 py-1">{w.registeredName}</td>
                    <td className="px-2 py-1 space-x-1">
                    <button
  onClick={() => setEditWeaponId(w._id)}
  className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs"
>
  Edit
</button>
<button
  onClick={() => handleDeleteWeapon(w._id)}
  className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
>
  Delete
</button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <p className="text-sm italic">No weapons registered yet.</p>
          )}
        </div>

        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <h3 className="text-base font-semibold mb-1">Records</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-300 italic">Tickets: None</p>
            <p className="text-gray-300 italic">Written Warnings: None</p>
            <p className="text-gray-300 italic">Arrest Reports: None</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end pt-2 space-y-2 sm:space-y-0">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 px-4 py-1 rounded text-sm">Close</button>
        </div>
      </div>

      {typeof showAddLicense === "string" && (
        <AddLicenseModal
          civilian={civilian}
          licenseType={showAddLicense}
          onClose={() => setShowAddLicense(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
      {showAddMedical && (
        <AddMedicalModal
          civilianId={civilian._id}
          onClose={() => setShowAddMedical(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
      {showAddVehicle && (
        <AddVehicleModal
          civilianId={civilian._id}
          onClose={() => setShowAddVehicle(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
      {showAddWeapon && (
        <AddWeaponModal
          civilianId={civilian._id}
          onClose={() => setShowAddWeapon(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
      {showDMVExam && (
        <DMVLicenseTestModal
          civilianId={civilian._id}
          onClose={() => setShowDMVExam(false)}
        />
      )}
{editVehicle && (
  <EditVehicleModal
    vehicle={editVehicle}
    onClose={() => setEditVehicle(null)}
    onSuccess={() => window.location.reload()}
  />
)}

{editWeaponId && (
  <EditWeaponModal
    weaponId={editWeaponId}
    onClose={() => setEditWeaponId(null)}
    onSuccess={() => window.location.reload()}
  />
)}

    </div>
  );
};

export default CivilianDetailView;
