import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./i18n";
import "./index.css";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
createRoot(document.getElementById("root")).render(<StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}><App /></GoogleOAuthProvider> : <App />}
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>);
