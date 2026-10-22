import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "./BrandLogo";

const currentYear = new Date().getFullYear();

export function Footer() {
    const { t } = useTranslation();
    return (<footer className="editorial-footer border-t border-slate-200 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <BrandLogo appearance="dark"/>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("brandTagline")}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/40 px-3 py-1 text-[11px] font-semibold text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-400"></span>
              <span>Learn with purpose. Grow with support.</span>
            </div>
            <p className="text-[11px] text-slate-400">
              © {currentYear} LearnHUB. All rights reserved.
            </p>
          </div>

          {/* Learn & Explore */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {t("explore")}
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/categories" className="hover:text-cyan-400 transition-colors">
                  {t("categoriesTitle")}
                </Link>
              </li>
              <li>
                <Link to="/register/student" className="hover:text-cyan-400 transition-colors">
                  {t("studentSignUp")}
                </Link>
              </li>
              <li>
                <Link to="/apply/teacher" className="hover:text-cyan-400 transition-colors">
                  {t("teacherApply")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {t("about")} & Support
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/about" className="hover:text-cyan-400 transition-colors">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-cyan-400 transition-colors">
                  {t("faq")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-400 transition-colors">
                  {t("contact")}
                </Link>
              </li>
              <li><Link to="/contact" className="hover:text-cyan-400 transition-colors">Talk with our team</Link></li>
            </ul>
          </div>

          {/* Legal Compliance */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Compliance & Legal
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs font-medium">
              <li>
                <Link to="/privacy" className="hover:text-cyan-400 transition-colors">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-cyan-400 transition-colors">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-cyan-400 transition-colors">
                  {t("cookies")}
                </Link>
              </li>
              <li>
                <Link to="/acceptable-use" className="hover:text-cyan-400 transition-colors">
                  {t("acceptableUse")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>);
}
