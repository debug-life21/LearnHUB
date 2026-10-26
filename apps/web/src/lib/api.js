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
