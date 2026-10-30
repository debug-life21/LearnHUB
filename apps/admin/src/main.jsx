import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "../../web/src/i18n.js";
import "../../web/src/index.css";
import { AuthProvider } from "../../web/src/context/AuthContext.jsx";
import { AdminApp } from "./AdminApp.jsx";

const publicAppUrl = import.meta.env.VITE_PUBLIC_URL;

/* Links inside the shared Navbar and Footer point at the public site. Keep an
   administrator inside this portal when no public URL is configured, otherwise
   hand the route over to the public TedbabeLearnHUB app. */
function PublicAppRedirect() {
    const { pathname, search } = useLocation();

    React.useEffect(() => {
        if (!publicAppUrl) return;
        const base = String(publicAppUrl).replace(/\/+$/, "");
        window.location.replace(`${base}${pathname}${search}`);
    }, [pathname, search]);

    if (!publicAppUrl) return <Navigate to="/" replace />;

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
            Opening TedbabeLearnHUB…
        </div>
    );
}

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18n}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<AdminApp />} />
                        <Route path="*" element={<PublicAppRedirect />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </I18nextProvider>
    </React.StrictMode>,
);
