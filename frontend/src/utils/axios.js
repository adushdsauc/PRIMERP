import axios from "axios";

const api = axios.create({
  baseURL: "https://primerp-production-6780.up.railway.app", // Railway backend
  withCredentials: true, // Required for cookie-based sessions
});

export default api;
