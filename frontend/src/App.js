// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useUser } from "./hooks/useUser";

// Pages
import LoginGate from "./pages/LoginGate";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import CivilianPage from "./pages/Civilian";
import BankLogin from "./pages/BankLogin";
import BankDashboard from "./pages/BankDashboard";

// Police Pages
import PoliceDashboard from "./pages/police/PoliceDashboard";
import CreateReport from "./pages/police/CreateReport";
import Warrants from "./pages/police/Warrants";
import SearchDatabase from "./pages/police/SearchDatabase";
import ReportsPage from "./pages/police/ReportsPage";

// SAFR Pages
import FireDashboard from "./pages/ems/FireDashboard";
import FireSearch from "./pages/ems/FireSearch";
import FireReports from "./pages/ems/FireReports";

export default function App() {
  const { discordId, loading } = useUser();
  const location = useLocation();

  // 🔐 Force HTTPS if accessed via HTTP (common issue on mobile)
  useEffect(() => {
    if (window.location.protocol !== "https:") {
      window.location.href = "https://" + window.location.hostname + window.location.pathname;
    }
  }, []);

  useEffect(() => {
    const handleRejection = (event) => {
      const filename = event?.filename || "";
      const stack = event?.reason?.stack || "";
      const message = event?.reason?.message || "";

      const isThirdPartyExtension =
        filename.includes("h1-vendors-main-popover") ||
        stack.includes("h1-vendors-main-popover") ||
        filename.includes("PayPal") ||
        stack.includes("PayPal") ||
        filename.includes("hot-update.js") ||
        navigator.userAgent.includes("PayPalHoney") ||
        !event.reason;

      if (isThirdPartyExtension) return;

      console.error("🔥 Unhandled Promise Rejection:");
      if (event.reason) {
        console.error("➡️ Reason:", event.reason);
        if (event.reason.stack) {
          console.error("🧠 Stack trace:", event.reason.stack);
        }
      } else {
        console.error("➡️ Rejection was undefined – possible bug in async code.");
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white bg-black text-xl">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LoginGate />} />
      <Route path="/bank" element={<BankLogin />} />
      <Route path="/bank/dashboard" element={<BankDashboard />} />

      {discordId ? (
        <>
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Navigate to="civilian" replace />} />
            <Route path="civilian" element={<CivilianPage />} />

            {/* PSO Routes */}
            <Route path="pso">
              <Route index element={<PoliceDashboard />} />
              <Route path="create-report" element={<CreateReport />} />
              <Route path="warrants" element={<Warrants />} />
              <Route path="search" element={<SearchDatabase />} />
              <Route path="/dashboard/pso/reports" element={<ReportsPage />} />
            </Route>

            {/* SAFR Routes */}
            <Route path="safr">
              <Route index element={<FireDashboard />} />
              <Route path="search" element={<FireSearch />} />
              <Route path="reports" element={<FireReports />} />
            </Route>
          </Route>
        </>
      ) : (
        <Route path="*" element={<Navigate to="/" state={{ from: location }} />} />
      )}

      <Route path="*" element={<div className="p-8 text-center text-xl">404 - Page not found</div>} />
    </Routes>
  );
}
