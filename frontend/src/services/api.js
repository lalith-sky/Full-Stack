import { API_BASE_URL } from "../config/apiConfig";

export const api = async (path, options = {}) => {
    const token = localStorage.getItem("token");
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    return fetch(`${API_BASE_URL}${cleanPath}`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...options
    });
};

