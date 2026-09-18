// Central API Configuration for Frontend

// Production backend live URL on Render
const PRODUCTION_API_URL = "https://full-stack-07s3.onrender.com/api";

const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;

const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0'
);

// Default to production API URL
let baseUrl = PRODUCTION_API_URL;

if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim() !== "") {
    baseUrl = process.env.REACT_APP_API_URL.trim();
}

// Only use local development URLs if explicitly running on a localhost domain or Capacitor
if (isLocalhost && (!process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL.includes("localhost"))) {
    baseUrl = "http://localhost:8080/api";
} else if (isCapacitor && (!process.env.REACT_APP_API_URL || process.env.REACT_APP_API_URL.includes("10.0.2.2"))) {
    baseUrl = "http://10.0.2.2:8080/api";
}

// Enforce production URL on live domains (Vercel, custom domain) if configured with localhost
if (typeof window !== 'undefined' && !isLocalhost && !isCapacitor && (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))) {
    baseUrl = PRODUCTION_API_URL;
}

const cleanUrl = baseUrl.replace(/\/+$/, "");

// If the env URL already includes /api, separate backend host and API base
export const API_BASE_URL = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
export const BACKEND_URL = cleanUrl.endsWith("/api") ? cleanUrl.slice(0, -4) : cleanUrl;

export default API_BASE_URL;


