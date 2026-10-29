import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "./BrandLogo";

const currentYear = new Date().getFullYear();

export function Footer() {
    const { t } = useTranslation();
    return (
      <footer className="editorial-footer border-t border-slate-200 bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:mb-12 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-8">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300 sm:text-xs">Your next step starts here</p>
              <h2 className="mt-1 text-base font-bold tracking-tight text-white sm:mt-2 sm:text-2xl">Ready to learn with TedbabeLearnHUB (TLH)?</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:mt-2 sm:text-sm">Explore courses, build your skills, and find the support that fits your goals.</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link to="/courses" className="inline-flex min-h-9 items-center justify-center rounded-full bg-emerald-300 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-200 sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-sm">
                Explore courses
              </Link>
              <Link to="/register/student" className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-white/50 hover:bg-white/10 sm:min-h-11 sm:px-5 sm:py-2.5 sm:text-sm">
                {t("studentSignUp")}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-x-2.5 gap-y-6 border-b border-white/10 pb-8 sm:grid-cols-2 sm:gap-10 sm:pb-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
            <div className="col-span-3 space-y-2 sm:col-span-2 sm:space-y-4 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <BrandLogo appearance="dark"/>
              </div>
              <p className="max-w-xs text-xs leading-relaxed text-slate-400 sm:text-sm sm:text-slate-300">
                {t("brandTagline")}
              </p>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-white sm:text-xs sm:tracking-[0.14em]">
                Learn
              </h3>
              <ul className="mt-2 space-y-1.5 text-[11px] font-medium sm:mt-4 sm:space-y-3 sm:text-sm">
                <li><Link to="/courses" className="footer-link">{t("allCourses")}</Link></li>
                <li><Link to="/categories" className="footer-link">{t("categoriesTitle")}</Link></li>
                <li><Link to="/how-it-works" className="footer-link">How it works</Link></li>
                <li><Link to="/pricing" className="footer-link">Options</Link></li>
                <li><Link to="/instructors" className="footer-link">Instructors</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-white sm:text-xs sm:tracking-[0.14em]">
                Get involved
              </h3>
              <ul className="mt-2 space-y-1.5 text-[11px] font-medium sm:mt-4 sm:space-y-3 sm:text-sm">
                <li><Link to="/register/student" className="footer-link">{t("studentSignUp")}</Link></li>
                <li><Link to="/apply/teacher" className="footer-link">{t("teacherApply")}</Link></li>
                <li><Link to="/about" className="footer-link">{t("about")}</Link></li>
                <li><Link to="/verify-certificate" className="footer-link">Certificates</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-white sm:text-xs sm:tracking-[0.14em]">
                Support
              </h3>
              <ul className="mt-2 space-y-1.5 text-[11px] font-medium sm:mt-4 sm:space-y-3 sm:text-sm">
                <li><Link to="/faq" className="footer-link">{t("faq")}</Link></li>
                <li><Link to="/help" className="footer-link">Help center</Link></li>
                <li><Link to="/contact" className="footer-link">{t("contact")}</Link></li>
                <li><Link to="/privacy" className="footer-link">{t("privacy")}</Link></li>
                <li><Link to="/terms" className="footer-link">{t("terms")}</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:pt-6 sm:text-xs">
            <p>© {currentYear} TedbabeLearnHUB (TLH). All rights reserved.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 sm:gap-x-5 sm:gap-y-2">
              <Link to="/cookies" className="footer-link">{t("cookies")}</Link>
              <Link to="/acceptable-use" className="footer-link">{t("acceptableUse")}</Link>
              <Link to="/contact" className="footer-link">Contact support</Link>
            </div>
          </div>
        </div>
      </footer>);
}
