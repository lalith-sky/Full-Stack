// Central API Configuration for Frontend

// Production backend live URL on Render
const PRODUCTION_API_URL = "https://full-stack-07s3.onrender.com/api";

const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;

const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0'
);

const getFallbackHost = () => {
    if (isCapacitor) return "http://10.0.2.2:8080";
    if (isLocalhost) return "http://localhost:8080";
    return PRODUCTION_API_URL;
};

const rawEnvUrl = (process.env.REACT_APP_API_URL || getFallbackHost()).trim();
const cleanUrl = rawEnvUrl.replace(/\/+$/, "");

// If the env URL already includes /api, separate backend host and API base
export const API_BASE_URL = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
export const BACKEND_URL = cleanUrl.endsWith("/api") ? cleanUrl.slice(0, -4) : cleanUrl;

export default API_BASE_URL;

