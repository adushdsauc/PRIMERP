import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import api from "../utils/axios";
import CreateCivilianModal from "../components/CreateCivilianModal";

export default function Home() {
  const { roles } = useUser();
  const navigate = useNavigate();

  const [hasCivilian, setHasCivilian] = useState(null); // null = loading
  const [showModal, setShowModal] = useState(false);

  const POLICE_ROLE_ID = "1370878407856099408";
  const FIRE_EMS_ROLE_ID = "1370878410364162058";

  useEffect(() => {
    const fetchCivilians = async () => {
      try {
        const res = await api.get("/api/civilians");
        const list = res.data.civilians || [];
        setHasCivilian(list.length > 0);
      } catch (err) {
        console.error("Failed to fetch civilians:", err);
        setHasCivilian(false);
      }
    };

    fetchCivilians().catch((err) => {
      console.error("❌ Unhandled error in fetchCivilians:", err);
      setHasCivilian(false);
    });
  }, []);

  // Redirect if civilian exists
  useEffect(() => {
    if (hasCivilian === true) {
      navigate("/dashboard/civilian");
    }
  }, [hasCivilian, navigate]);

  if (hasCivilian === null) {
    return (
      <div className="text-white text-center mt-40">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex flex-col items-center justify-center px-4 sm:px-6">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">Begin Your Journey</h1>
      <p className="text-gray-400 mb-6">
        Create your first civilian character to get started.
      </p>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg w-full sm:w-auto"
      >
        Create Civilian
      </button>

      {(roles?.includes(POLICE_ROLE_ID) || roles?.includes(FIRE_EMS_ROLE_ID)) && (
        <div className="mt-10">
          <p className="text-gray-400 mb-2">You also have department access:</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {roles.includes(POLICE_ROLE_ID) && (
              <button
                onClick={() => navigate("/dashboard/pso")}
                className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded w-full sm:w-auto"
              >
                Public Safety Office
              </button>
            )}
            {roles.includes(FIRE_EMS_ROLE_ID) && (
              <button
                onClick={() => navigate("/dashboard/safr")}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded w-full sm:w-auto"
              >
                SAFR Dashboard
              </button>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <CreateCivilianModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setHasCivilian(true); // triggers redirect
          }}
        />
      )}
    </div>
  );
}
