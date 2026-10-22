import React from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "../../web/src/i18n.js";
import "../../web/src/index.css";
import { AdminApp } from "./AdminApp.jsx";
import "./admin.css";

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18n}>
            <AdminApp />
        </I18nextProvider>
    </React.StrictMode>,
);
