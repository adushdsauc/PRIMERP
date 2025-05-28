import axios from "axios";

const api = axios.create({
  baseURL: "https://primerp-production-6780.up.railway.app",
  withCredentials: true,
});

export default api;
