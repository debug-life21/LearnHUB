import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";

const navigationItems = [
    { to: "/", label: "home", end: true },
    { to: "/categories", label: "explore" },
    { to: "/about", label: "about" },
    { to: "/faq", label: "faq" },
    { to: "/contact", label: "contact" },
];

function navLinkClass({ isActive }) {
    return `rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
        isActive
            ? "bg-blue-50 text-blue-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;
}

function NavigationLinks({ onNavigate }) {
    const { t } = useTranslation();

    return navigationItems.map(({ to, label, end }) => (
        <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={navLinkClass}
        >
            {t(label)}
        </NavLink>
    ));
}

export function Navbar() {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuState, setMobileMenuState] = useState({ pathname: location.pathname, open: false });
    const [logoutError, setLogoutError] = useState("");
    const [loggingOut, setLoggingOut] = useState(false);
    const mobileMenuOpen = mobileMenuState.pathname === location.pathname && mobileMenuState.open;
    const closeMobileMenu = useCallback(
        () => setMobileMenuState({ pathname: location.pathname, open: false }),
        [location.pathname],
    );

    useEffect(() => {
        if (!mobileMenuOpen) return undefined;

        function handleKeyDown(event) {
            if (event.key === "Escape") closeMobileMenu();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closeMobileMenu, mobileMenuOpen]);

    const handleLogout = async () => {
        setLoggingOut(true);
        setLogoutError("");
        try {
            await logout();
            closeMobileMenu();
            navigate("/");
        } catch (error) {
            setLogoutError(error instanceof Error ? error.message : "Could not sign out. Please try again.");
        } finally {
            setLoggingOut(false);
        }
    };

    const roleLabel = user?.role === "hub_admin" || user?.role === "admin"
        ? "Admin"
        : user?.role === "teacher"
            ? "Teacher"
            : "Student";
    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
            <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                    aria-label="LearnHUB home"
                >
                    <BrandLogo />
                </Link>

                <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-2xl bg-slate-50 p-1 md:flex">
                    <NavigationLinks />
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                    {user ? (
                        <div className="hidden items-center gap-2 md:flex">
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                <span className="max-w-32 truncate">{user.fullName || t("dashboard")}</span>
                                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-100">
                                    {roleLabel}
                                </span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                type="button"
                                disabled={loggingOut}
                                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-60"
                                title={t("signOut")}
                                aria-label={t("signOut")}
                            >
                                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                    <path d="M10 17l5-5-5-5M15 12H3m9-8h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="hidden items-center gap-1.5 sm:flex">
                            <Link
                                to="/sign-in"
                                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                            >
                                {t("signIn")}
                            </Link>
                            <Link
                                to="/register/student"
                                className="rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                {t("studentSignUp")}
                            </Link>
                        </div>
                    )}

                    <button
                        onClick={() => setMobileMenuState({ pathname: location.pathname, open: !mobileMenuOpen })}
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:hidden"
                        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-navigation"
                    >
                        {mobileMenuOpen ? (
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        ) : (
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {logoutError && (
                <p role="alert" className="mx-auto max-w-7xl px-4 pb-3 text-sm font-medium text-rose-700 sm:px-6 lg:px-8">
                    {logoutError}
                </p>
            )}

            {mobileMenuOpen && (
                <div id="mobile-navigation" className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-lg shadow-slate-900/5 md:hidden">
                    <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
                        <NavigationLinks onNavigate={closeMobileMenu} />
                    </nav>

                    {user ? (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700" aria-hidden="true">
                                    {(user.fullName || "U").trim().charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">{user.fullName || t("dashboard")}</p>
                                    <p className="text-xs font-medium text-slate-500">{roleLabel}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    to="/dashboard"
                                    onClick={closeMobileMenu}
                                    className="rounded-xl bg-slate-950 px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700"
                                >
                                    {t("dashboard")}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    type="button"
                                    disabled={loggingOut}
                                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-60"
                                >
                                    {loggingOut ? t("loading") : t("signOut")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:hidden">
                            <Link
                                to="/sign-in"
                                onClick={closeMobileMenu}
                                className="rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50"
                            >
                                {t("signIn")}
                            </Link>
                            <Link
                                to="/register/student"
                                onClick={closeMobileMenu}
                                className="rounded-xl bg-blue-600 px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-blue-700"
                            >
                                {t("studentSignUp")}
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
