import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(new Error(error.response?.data?.message || "Request failed. Please try again.")),
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
    });
    return response.data;
}
