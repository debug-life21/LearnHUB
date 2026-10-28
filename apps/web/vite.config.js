import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// https://vite.dev/config/
export default defineConfig({
    plugins: [tailwindcss(), react()],
    server: {
        port: 5173,
        proxy: {
            // Forward all /api/* requests to the Express backend
            "/api": {
                target: "http://localhost:4000",
                changeOrigin: true,
                secure: false,
            },
            // Forward /uploads/* (local static file serving if any)
            "/uploads": {
                target: "http://localhost:4000",
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
