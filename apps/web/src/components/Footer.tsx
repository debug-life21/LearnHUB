import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-cyan-400">
                LH
              </div>
              <span className="text-lg font-black text-slate-900">LearnHUB</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t("brandTagline")}
            </p>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} LearnHUB. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">{t("explore")}</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/categories" className="hover:text-blue-600 transition-colors">
                  {t("categoriesTitle")}
                </Link>
              </li>
              <li>
                <Link to="/register/student" className="hover:text-blue-600 transition-colors">
                  {t("studentSignUp")}
                </Link>
              </li>
              <li>
                <Link to="/apply/teacher" className="hover:text-blue-600 transition-colors">
                  {t("teacherApply")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">{t("about")}</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/about" className="hover:text-blue-600 transition-colors">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-blue-600 transition-colors">
                  {t("faq")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-600 transition-colors">
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link to="/setup/admin" className="hover:text-blue-600 transition-colors text-slate-400">
                  {t("adminSetup")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">ሕጋዊ / Legal</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-blue-600 transition-colors">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-600 transition-colors">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-blue-600 transition-colors">
                  {t("cookies")}
                </Link>
              </li>
              <li>
                <Link to="/acceptable-use" className="hover:text-blue-600 transition-colors">
                  {t("acceptableUse")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
