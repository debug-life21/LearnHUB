import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const nextLang = i18n.language === "am" ? "en" : "am";
    void i18n.changeLanguage(nextLang);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-black text-cyan-400 shadow-sm transition-transform group-hover:scale-105">
            LH
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-950">LearnHUB</span>
              <span className="rounded-md bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold text-cyan-800">2026</span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">{t("brandTagline")}</p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-600">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 transition-colors ${isActive ? "bg-slate-100 text-slate-950 font-bold" : "hover:text-slate-950 hover:bg-slate-50"}`
            }
          >
            {t("home")}
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 transition-colors ${isActive ? "bg-slate-100 text-slate-950 font-bold" : "hover:text-slate-950 hover:bg-slate-50"}`
            }
          >
            {t("explore")}
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 transition-colors ${isActive ? "bg-slate-100 text-slate-950 font-bold" : "hover:text-slate-950 hover:bg-slate-50"}`
            }
          >
            {t("about")}
          </NavLink>
          <NavLink
            to="/faq"
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 transition-colors ${isActive ? "bg-slate-100 text-slate-950 font-bold" : "hover:text-slate-950 hover:bg-slate-50"}`
            }
          >
            {t("faq")}
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 transition-colors ${isActive ? "bg-slate-100 text-slate-950 font-bold" : "hover:text-slate-950 hover:bg-slate-50"}`
            }
          >
            {t("contact")}
          </NavLink>
        </nav>

        {/* Right CTA / Language / Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            title="Switch Language"
          >
            <span>🌐</span>
            <span>{i18n.language === "am" ? "English" : "አማርኛ"}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                <span>{t("dashboard")}</span>
                <span className="rounded-full bg-cyan-400 px-1.5 py-0.2 text-[10px] font-bold text-slate-950 uppercase">
                  {user.role === "hub_admin" ? "Admin" : user.role}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                title={t("signOut")}
              >
                🚪
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/sign-in"
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {t("signIn")}
              </Link>
              <Link
                to="/register/student"
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                {t("studentSignUp")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
