import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLang = i18n.language === "am" ? "en" : "am";
    void i18n.changeLanguage(nextLang);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl transition-all shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-3">
          <BrandLogo />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/70 p-1 text-sm font-semibold text-slate-600 backdrop-blur-md">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-blue-600 shadow-xs"
                  : "hover:text-slate-950 hover:bg-white/60"
              }`
            }
          >
            {t("home")}
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-blue-600 shadow-xs"
                  : "hover:text-slate-950 hover:bg-white/60"
              }`
            }
          >
            {t("explore")}
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-blue-600 shadow-xs"
                  : "hover:text-slate-950 hover:bg-white/60"
              }`
            }
          >
            {t("about")}
          </NavLink>
          <NavLink
            to="/faq"
            className={({ isActive }) =>
              `rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-blue-600 shadow-xs"
                  : "hover:text-slate-950 hover:bg-white/60"
              }`
            }
          >
            {t("faq")}
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-white text-blue-600 shadow-xs"
                  : "hover:text-slate-950 hover:bg-white/60"
              }`
            }
          >
            {t("contact")}
          </NavLink>
        </nav>

        {/* Right CTA / Language Switcher / Auth Profile */}
        <div className="flex items-center gap-2.5">
          {/* Modern Language Toggle */}
          <button
            onClick={toggleLanguage}
            type="button"
            className="group relative flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 transition-all"
            title="Switch Language / ቋንቋ ቀይር"
          >
            <span className="text-sm">🌐</span>
            <span className="font-extrabold text-blue-600">
              {i18n.language === "am" ? "English" : "አማርኛ"}
            </span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="group flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-600 transition-all"
              >
                <span>{t("dashboard")}</span>
                <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-[9px] font-black text-slate-950 uppercase tracking-wider">
                  {user.role === "hub_admin" ? "Admin" : user.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                type="button"
                className="rounded-xl border border-slate-200 p-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                title={t("signOut")}
              >
                🚪
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/sign-in"
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all"
              >
                {t("signIn")}
              </Link>
              <Link
                to="/register/student"
                className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-102"
              >
                <span>{t("studentSignUp")}</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="md:hidden rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              {t("home")}
            </Link>
            <Link
              to="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              {t("explore")}
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              {t("about")}
            </Link>
            <Link
              to="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              {t("faq")}
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              {t("contact")}
            </Link>
          </nav>

          {!user && (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {t("signIn")}
              </Link>
              <Link
                to="/register/student"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
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
