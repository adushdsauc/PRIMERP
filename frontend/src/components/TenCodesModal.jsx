// components/TenCodesModal.jsx
import React from "react";

const CODES = [
  "10-0 - Disappeared",
  "10-1 - Frequency Change",
  "10-3 - Stop Transmitting",
  "10-4 - Affirmative",
  "10-5 - Meal Break (Burger Shot, etc)",
  "10-6 - Busy",
  "10-7 - Out of Service",
  "10-8 - In-Service",
  "10-9 - Repeat",
  "10-10 - Fight in Progress",
  "10-11 - Traffic Stop",
  "10-12 - Active Ride Along",
  "10-13 - Shots Fired",
  "10-15 - Subject in custody en route to Station",
  "10-16 - Stolen Vehicle",
  "10-17 - Suspicious Person",
  "10-20 - Location",
  "10-22 - Disregard",
  "10-23 - Arrived on Scene",
  "10-25 - Domestic Dispute",
  "10-26 - ETA",
  "10-27 - Drivers License Check for Valid",
  "10-28 - Vehicle License Plate Check",
  "10-29 - NCIC Warrant Check",
  "10-30 - Wanted Person",
  "10-31 - Not Wanted, No Warrants",
  "10-32 - Request Backup (Code 1-2-3)",
  "10-35 - Wrap the Scene Up",
  "10-41 - Beginning Tour of Duty",
  "10-42 - Ending Tour of Duty",
  "10-43 - Information",
  "10-49 - Homicide",
  "10-50 - Vehicle Accident: PD: Property Damage Only, PI: Person/s Injured, F: Fatal",
  "10-51 - Request Towing Service",
  "10-52 - Request EMS",
  "10-53 - Request Fire Department",
  "10-55 - Intoxicated Driver",
  "10-56 - Intoxicated Pedestrian",
  "10-60 - Armed with a Gun",
  "10-61 - Armed with a Knife",
  "10-62 - Kidnapping",
  "10-64 - Sexual Assault",
  "10-65 - Escorting Prisoner",
  "10-66 - Reckless Driver",
  "10-67 - Fire",
  "10-68 - Armed Robbery",
  "10-70 - Foot Pursuit",
  "10-71 - Request Supervisor at Scene",
  "10-73 - Advise Status",
  "10-80 - Vehicle Pursuit",
  "10-90 - In-Game Warning",
  "10-91 - Asking For Invite To Session",
  "10-92 - Vehicle Impoundment",
  "10-93 - Removed from Game",
  "10-94 - Drag Racing",
  "10-95 - Weather Condition",
  "10-97 - In Route",
  "10-99 - Officer in Distress, Extreme Emergency Only",
  "11-44 - Person Deceased",
  "51-50 - Mental Health Hold",
  "Signal 100 - HOLD ALL BUT EMERGENCY TRAFFIC",
  "Signal 60 - Drugs",
  "Signal 11 - Running Radar",
  "Code Zero - Game Crash",
  "Code 4 - Under Control",
  "Code 5 - Felony Stop/High-Risk Stop"
];

export default function TenCodesModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-white p-4 sm:p-6 rounded-xl w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">10 Codes Reference</h2>
          <button
            onClick={onClose}
            className="text-sm px-3 py-1 bg-red-600 hover:bg-red-500 rounded"
          >
            Close
          </button>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {CODES.map((code, i) => (
            <li key={i} className="bg-gray-800 rounded px-3 py-2 border border-gray-700">
              {code}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
