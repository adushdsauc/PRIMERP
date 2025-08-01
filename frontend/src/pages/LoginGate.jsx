import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";

const LoginGate = () => {
  const { discordId, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && discordId) {
      navigate("/home");
    }
  }, [discordId, loading, navigate]);

  const handleLogin = () => {
    const baseUrl =
      process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
    try {
      window.location.href = `${baseUrl}/auth/discord`;
    } catch (err) {
      console.error("❌ Redirect failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center text-white">
        <p>Checking session...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col items-center justify-center text-white px-4 sm:px-6 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6">Welcome to Prime RolePlay CAD!</h1>
      <p className="mb-4 text-gray-300">You must log in with Discord to continue</p>
      <button
        onClick={handleLogin}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg w-full sm:w-auto"
      >
        Login with Discord
      </button>
    </div>
  );
};

export default LoginGate;
