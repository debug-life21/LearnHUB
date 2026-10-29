import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";

function LanguageToggle({ compact = false }) {
    const { i18n } = useTranslation();
    const isAmharic = i18n.language === "am";

    const toggle = () => {
        const next = isAmharic ? "en" : "am";
        i18n.changeLanguage(next);
        localStorage.setItem("learnhub_user_language", next);
        localStorage.setItem("i18nextLng", next);
        if (typeof document !== "undefined") {
            document.documentElement.lang = next;
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            title={isAmharic ? "Switch to English" : "ወደ አማርኛ ቀይር"}
            aria-label={isAmharic ? "Switch to English" : "Switch to Amharic"}
            className={`flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 shadow-xs transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-[13px]"
            }`}
        >
            <span className="text-base leading-none" aria-hidden="true">{isAmharic ? "🇺🇸" : "🇪🇹"}</span>
            <span>{isAmharic ? "EN" : "አማ"}</span>
        </button>
    );
}

const navigationItems = [
    { to: "/courses", label: "Courses", i18nKey: "courses" },
    { to: "/how-it-works", label: "How it works", i18nKey: "navHowItWorks" },
    { to: "/instructors", label: "Instructors", i18nKey: "navInstructors" },
    { to: "/faq", label: "FAQ", i18nKey: "faq" },
    { to: "/contact", label: "Contact", i18nKey: "contact" },
];

function navLinkClass({ isActive }) {
    return `rounded-xl px-4 py-2.5 text-sm sm:text-[15px] font-bold transition-all whitespace-nowrap tracking-wide ${
        isActive
            ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-600/15 font-extrabold"
            : "text-slate-600 hover:bg-white/80 hover:text-slate-950 hover:shadow-xs"
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
                    ? `flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-bold transition-colors ${
                        isActive ? "bg-sky-50 text-blue-700 font-extrabold" : "text-slate-700 hover:bg-slate-50"
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
    const { t, i18n } = useTranslation();
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
        <header className="editorial-nav sticky top-0 z-40 border-b border-slate-200/80 shadow-[0_4px_20px_rgba(7,19,41,0.04)] backdrop-blur-xl">
            <div className="mx-auto flex min-h-[5.25rem] sm:min-h-[5.75rem] max-w-[90rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <Link
                    to="/"
                    className="nav-brand shrink-0 rounded-xl transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                    aria-label="TedbabeLearnHUB home"
                >
                    <BrandLogo />
                </Link>

                <nav aria-label="Main navigation" className="hidden items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-100/90 p-1.5 lg:flex shadow-inner">
                    <NavigationLinks />
                </nav>

                <div className="flex shrink-0 items-center gap-2.5">
                    {user ? (
                        <div className="hidden items-center gap-2.5 lg:flex">
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-4 py-2.5 text-sm sm:text-[15px] font-bold text-white shadow-md shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:from-[#0052cc] hover:to-[#0088e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                <span className="max-w-36 truncate">{user.fullName || t("dashboard")}</span>
                                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
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
                        <div className="hidden items-center gap-2 lg:flex">
                            <Link
                                to="/sign-in"
                                className="rounded-xl px-4 py-2.5 text-sm sm:text-[15px] font-bold text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-950"
                            >
                                {t("signIn")}
                            </Link>
                            <Link
                                to="/register/student"
                                className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-5 py-2.5 text-sm sm:text-[15px] font-extrabold text-white shadow-md shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:from-[#0052cc] hover:to-[#0088e6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            >
                                {t("studentSignUp")}
                            </Link>
                        </div>
                    )}

                    {/* Desktop Language Toggle */}
                    <LanguageToggle />

                    <button
                        onClick={() => setMobileMenuState({ pathname: location.pathname, open: !mobileMenuOpen })}
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden"
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
                                    className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-4 py-3 text-center text-base font-bold text-white shadow-md shadow-blue-500/25"
                                >
                                    {t("dashboard")}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    type="button"
                                    disabled={loggingOut}
                                    className="rounded-xl border border-slate-200 px-4 py-3 text-center text-base font-bold text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-wait disabled:opacity-60"
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
                                className="rounded-xl border border-slate-200 px-4 py-3 text-center text-base font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                            >
                                {t("signIn")}
                            </Link>
                            <Link
                                to="/register/student"
                                onClick={closeMobileMenu}
                                className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-4 py-3 text-center text-base font-bold text-white shadow-md shadow-blue-500/25"
                            >
                                {t("studentSignUp")}
                            </Link>
                        </div>
                    )}
                    {/* Mobile Language Toggle */}
                    <div className="mt-3 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-semibold text-slate-500">
                                {i18n.language === "am" ? "ቋንቋ" : "Language"}
                            </span>
                            <LanguageToggle compact />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
