import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "./BrandLogo";

const currentYear = new Date().getFullYear();

export function Footer() {
    const { t } = useTranslation();
    return (<footer className="editorial-footer border-t border-slate-200 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-12 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Your next step starts here</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">Ready to learn with LearnHUB?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">Explore courses, build your skills, and find the support that fits your goals.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/courses" className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200">
              Explore courses
            </Link>
            <Link to="/register/student" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10">
              {t("studentSignUp")}
            </Link>
          </div>
        </div>

        <div className="grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo appearance="dark"/>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-300">
              {t("brandTagline")}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
              Learn
            </h3>
            <ul className="mt-4 space-y-3 text-sm font-medium">
              <li><Link to="/courses" className="footer-link">{t("allCourses")}</Link></li>
              <li><Link to="/categories" className="footer-link">{t("categoriesTitle")}</Link></li>
              <li><Link to="/how-it-works" className="footer-link">How it works</Link></li>
              <li><Link to="/pricing" className="footer-link">Learning options</Link></li>
              <li><Link to="/instructors" className="footer-link">Meet our instructors</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
              Get involved
            </h3>
            <ul className="mt-4 space-y-3 text-sm font-medium">
              <li><Link to="/register/student" className="footer-link">{t("studentSignUp")}</Link></li>
              <li><Link to="/apply/teacher" className="footer-link">{t("teacherApply")}</Link></li>
              <li><Link to="/about" className="footer-link">{t("about")}</Link></li>
              <li><Link to="/verify-certificate" className="footer-link">Verify a certificate</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
              Support & policies
            </h3>
            <ul className="mt-4 space-y-3 text-sm font-medium">
              <li><Link to="/faq" className="footer-link">{t("faq")}</Link></li>
              <li><Link to="/help" className="footer-link">Help center</Link></li>
              <li><Link to="/contact" className="footer-link">{t("contact")}</Link></li>
              <li><Link to="/privacy" className="footer-link">{t("privacy")}</Link></li>
              <li><Link to="/terms" className="footer-link">{t("terms")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} LearnHUB. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/cookies" className="footer-link">{t("cookies")}</Link>
            <Link to="/acceptable-use" className="footer-link">{t("acceptableUse")}</Link>
            <Link to="/contact" className="footer-link">Contact support</Link>
          </div>
        </div>
      </div>
    </footer>);
}
