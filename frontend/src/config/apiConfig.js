// Central API Configuration for Frontend

const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
const defaultHost = isCapacitor ? "http://10.0.2.2:8080" : "http://localhost:8080";

const rawEnvUrl = (process.env.REACT_APP_API_URL || defaultHost).trim();
const cleanUrl = rawEnvUrl.replace(/\/+$/, "");

// If the env URL already includes /api, separate backend host and API base
export const API_BASE_URL = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
export const BACKEND_URL = cleanUrl.endsWith("/api") ? cleanUrl.slice(0, -4) : cleanUrl;

export default API_BASE_URL;
