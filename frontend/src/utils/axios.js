import axios from "axios";

// Allow overriding the API base URL via environment variable. If none is
// provided we assume a development setup when running locally (localhost or
// 127.x.x.x) and fall back to the production API for any other host. This avoids
// 400/500 errors when the frontend cannot reach the backend because the URL is
// incorrect.

export const defaultBaseURL = /^localhost$|^127\./.test(window.location.hostname)
  ? "http://localhost:8080"
  : "https://api.primerpcad.com";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || defaultBaseURL,
  withCredentials: true,
});

export default api;
