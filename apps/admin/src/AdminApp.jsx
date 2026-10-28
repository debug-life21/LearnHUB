import { useState } from "react";
import { useAuth } from "../../web/src/context/AuthContext.jsx";
import { apiRequest } from "../../web/src/lib/api.js";
import { AdminDashboard } from "../../web/src/pages/AdminDashboard.jsx";

const publicAppUrl = import.meta.env.VITE_PUBLIC_URL ?? "/";

export function AdminApp() {
    const { logout } = useAuth();
    const [adminUser, setAdminUser] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setMessage("");
        try {
            const response = await apiRequest("/api/auth/admin-login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });
            if (response.user && (response.user.role === "admin" || response.user.role === "hub_admin")) {
                setAdminUser(response.user);
                setPassword("");
            } else {
                setMessage("Access denied. Administrator privileges are required.");
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSignOut = async () => {
        setSubmitting(true);
        setMessage("");
        try {
            await logout();
        } catch {
            // ignore logout error
        } finally {
            setAdminUser(null);
            setSubmitting(false);
        }
    };

    if (adminUser) {
        return (
            <div className="admin-app-shell">
                <header className="admin-app-header">
                    <a className="admin-app-brand" href={publicAppUrl} aria-label="TedbabeLearnHUB administration">
                        <span className="admin-brand-mark">TLH</span>
                        <span><strong>TedbabeLearnHUB</strong><small>Administration</small></span>
                    </a>
                    <div className="admin-account">
                        <span>{adminUser.fullName || adminUser.email}</span>
                        <button type="button" onClick={handleSignOut} disabled={submitting}>
                            {submitting ? "Please wait…" : "Sign out"}
                        </button>
                    </div>
                </header>
                {message && <p role="alert" className="admin-app-message">{message}</p>}
                <AdminDashboard user={adminUser} />
            </div>
        );
    }

    return (
        <main className="admin-login-page">
            <section className="admin-login-card" aria-labelledby="admin-login-title">
                <a className="admin-app-brand" href={publicAppUrl} aria-label="TedbabeLearnHUB home">
                    <span className="admin-brand-mark">TLH</span>
                    <span><strong>TedbabeLearnHUB</strong><small>Administrator portal</small></span>
                </a>
                <p className="admin-login-eyebrow">PRIVATE WORKSPACE</p>
                <h1 id="admin-login-title">Administrator sign in</h1>
                <p className="admin-login-description">Use your provisioned administrator account to manage the TedbabeLearnHUB learning community.</p>
                {message && <p role="alert" className="admin-login-error">{message}</p>}
                <form onSubmit={handleSubmit}>
                    <label>
                        Administrator email
                        <input
                            required
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </label>
                    <label>
                        Password
                        <input
                            required
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </label>
                    <button type="submit" disabled={submitting}>
                        {submitting ? "Signing in…" : "Sign in securely"}
                    </button>
                </form>
                <p className="admin-login-footnote">Administrator accounts are provisioned by TedbabeLearnHUB. Public sign-up is not available here.</p>
            </section>
        </main>
    );
}
