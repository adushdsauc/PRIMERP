// src/pages/police/CreateReport.jsx
import React, { useState } from "react";

export default function CreateReport() {
  const [form, setForm] = useState({
    title: "",
    officer: "",
    type: "",
    description: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting report:", form);
    // TODO: Replace with API call
    alert("Report submitted!");
    setForm({ title: "", officer: "", type: "", description: "" });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h2 className="text-3xl sm:text-4xl font-bold mb-6">Create Report</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          placeholder="Report Title"
          value={form.title}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        />
        <input
          name="officer"
          placeholder="Officer Name"
          value={form.officer}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        />
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        >
          <option value="">Select Report Type</option>
          <option value="Arrest">Arrest</option>
          <option value="Incident">Incident</option>
          <option value="Traffic Stop">Traffic Stop</option>
        </select>
        <textarea
          name="description"
          placeholder="Detailed Description"
          value={form.description}
          onChange={handleChange}
          rows={6}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white w-full sm:w-auto"
        >
          Submit Report
        </button>
      </form>
    </div>
  );
}
