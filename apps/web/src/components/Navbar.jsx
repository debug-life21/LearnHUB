import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";

const navigationItems = [
    { to: "/courses", label: "Courses", i18nKey: "courses" },
    { to: "/how-it-works", label: "How it works", i18nKey: "navHowItWorks" },
    { to: "/instructors", label: "Instructors", i18nKey: "navInstructors" },
    { to: "/faq", label: "FAQ", i18nKey: "faq" },
    { to: "/contact", label: "Contact", i18nKey: "contact" },
];

function navLinkClass({ isActive }) {
    return `rounded-xl px-3 py-2 text-[13px] font-semibold transition-all whitespace-nowrap ${
        isActive
            ? "bg-white text-emerald-950 shadow-sm ring-1 ring-emerald-900/5"
            : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
    }`;
}

function NavigationLinks({ onNavigate, mobile = false }) {
    const { t } = useTranslation();

    return navigationItems.map(({ to, label, i18nKey, end }) => {
        const translated = i18nKey ? t(i18nKey) : label;
        const displayText = translated && translated !== i18nKey ? translated : label;
        return (
            <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) => mobile
                    ? `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isActive ? "bg-emerald-50 text-emerald-900" : "text-slate-700 hover:bg-slate-50"
                    }`
                    : navLinkClass({ isActive })}
            >
                {displayText}
                {mobile ? <span aria-hidden="true" className="text-slate-400">→</span> : null}
            </NavLink>
        );
    });
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
        <header className="editorial-nav sticky top-0 z-40 border-b border-emerald-950/10 bg-[#fffdf8]/95 shadow-[0_8px_30px_rgba(27,43,33,0.07)] backdrop-blur-xl">
            <div className="mx-auto flex min-h-[4.5rem] max-w-[88rem] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="nav-brand shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
                    aria-label="LearnHUB home"
                >
                    <BrandLogo />
                </Link>

                <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-2xl border border-slate-200/70 bg-slate-100/80 p-1 lg:flex">
                    <NavigationLinks />
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                    {user ? (
                        <div className="hidden items-center gap-2 lg:flex">
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#25362d] px-3.5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
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
                        <div className="hidden items-center gap-1.5 lg:flex">
                            <Link
                                to="/sign-in"
                                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
                            >
                                {t("signIn")}
                            </Link>
                            <Link
                                to="/register/student"
                                className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white shadow-[0_5px_14px_rgba(6,78,59,0.2)] transition-all hover:-translate-y-0.5 hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                            >
                                {t("studentSignUp")}
                            </Link>
                        </div>
                    )}

                    <button
                        onClick={() => setMobileMenuState({ pathname: location.pathname, open: !mobileMenuOpen })}
                        type="button"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 lg:hidden"
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
                <div id="mobile-navigation" className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 shadow-lg shadow-slate-900/5 lg:hidden">
                    <nav aria-label="Mobile navigation" className="grid gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                        <NavigationLinks onNavigate={closeMobileMenu} mobile />
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
                                    className="rounded-xl bg-[#25362d] px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-900"
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
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 lg:hidden">
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
                                className="rounded-xl bg-emerald-800 px-3 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-900"
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
