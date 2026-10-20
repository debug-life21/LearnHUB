import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      {/* Hero Narrative */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 mb-4 shadow-2xs">
          <span>📖</span>
          <span>ABOUT LEARNHUB</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          {t("aboutHeroTitle")}
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          {t("aboutHeroDesc")}
        </p>
      </div>

      {/* 3 Core Pillars: Mission, Vision, Values */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200/90 hover:shadow-lg transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600 shadow-xs">
            🎯
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">{t("missionTitle")}</h3>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {t("missionDesc")}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200/90 hover:shadow-lg transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-2xl text-cyan-600 shadow-xs">
            🔭
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">{t("visionTitle")}</h3>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {t("visionDesc")}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200/90 hover:shadow-lg transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600 shadow-xs">
            💎
          </div>
          <h3 className="mt-6 text-xl font-bold text-slate-900">{t("valuesTitle")}</h3>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {t("valuesDesc")}
          </p>
        </div>
      </div>

      {/* Unique Central Placement Model Explanation */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 sm:p-12 text-white shadow-2xl ring-1 ring-white/10">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <span className="rounded-full bg-cyan-400/20 px-3.5 py-1 text-xs font-bold text-cyan-300 border border-cyan-400/30">
            SYSTEM ARCHITECTURE & INTEGRITY
          </span>
          <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight">
            {t("architectureTitle")}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            {t("architectureDesc")}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/register/student"
              className="rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/20"
            >
              {t("becomeStudent")}
            </Link>
            <Link
              to="/apply/teacher"
              className="rounded-2xl border border-white/20 bg-slate-900 px-6 py-3 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {t("applyToTeach")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
