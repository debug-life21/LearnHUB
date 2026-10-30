import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "learnhub_token";

export function getAuthToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function setAuthToken(token) {
    try {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    } catch {
        // localStorage not available
    }
}

export function clearAuthToken() {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch {
        // localStorage not available
    }
}

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        if (response.data && typeof response.data === "object" && response.data.token) {
            setAuthToken(response.data.token);
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // If session expired or invalid, clear stored token
            clearAuthToken();
        }
        const message = error.response?.data?.message
            || (typeof error.response?.data === "string" && error.response.data.trim() ? error.response.data.trim() : "")
            || error.message
            || "Request failed. Please try again.";
        return Promise.reject(new Error(message));
    },
);

export async function apiRequest(path, options = {}) {
    let data = options.body;
    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch {
            throw new Error("Request data must be valid JSON.");
        }
    }
    const response = await api.request({
        url: path,
        method: options.method ?? "GET",
        data,
        headers: options.headers,
        responseType: options.responseType,
    });
    return response.data;
}

export async function loadPublicCourses() {
    const firstPage = await apiRequest("/api/public/courses?page=1&limit=50");
    const pageCount = Math.ceil((firstPage.pagination?.total || firstPage.courses.length) / 50);
    const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
            apiRequest(`/api/public/courses?page=${index + 2}&limit=50`),
        ),
    );
    return [...(firstPage.courses || []), ...remainingPages.flatMap((page) => page.courses || [])];
}
