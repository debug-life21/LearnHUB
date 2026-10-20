import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { SectionHeading, MetricCard } from "../components/UIComponents";

type HomeData = {
  brand: { name: string; tagline: string };
  categories: Array<{ _id: string; name: string; description: string; slug: string }>;
  featuredCourses: Array<{
    _id: string;
    title: string;
    description: string;
    skillLevel: string;
    learningObjectives: string[];
    category?: { name: string };
  }>;
  stats: {
    activeStudents: number;
    activeTeachers: number;
    activeClasses: number;
    pendingTeacherApplications: number;
  };
};

const HERO_SLIDES = [
  {
    id: 1,
    src: "/hero-1.jpg",
    tagEn: "Collaborative Tech & Coding Studio",
    tagAm: "የቴክኖሎጂ እና የኮዲንግ ላብራቶሪ",
    badge: "💻 Interactive Lab",
    highlight: "Addis Ababa Coding Innovation Hub",
    animClass: "animate-kenburns-1",
  },
  {
    id: 2,
    src: "/hero-2.jpg",
    tagEn: "Expert Teacher-Led Live Classes",
    tagAm: "የቀጥታ አስተማሪ መስተጋብር",
    badge: "👨‍🏫 Live Instruction",
    highlight: "Real-Time Google Meet Sessions & Data",
    animClass: "animate-kenburns-2",
  },
  {
    id: 3,
    src: "/hero-3.jpg",
    tagEn: "Verified Progress & Mastery",
    tagAm: "የተረጋገጠ የተማሪ እድገት",
    badge: "🎓 Verified Outcomes",
    highlight: "Accredited Cohorts & Placement",
    animClass: "animate-kenburns-3",
  },
  {
    id: 4,
    src: "/hero-4.jpg",
    tagEn: "Connected Education Network",
    tagAm: "የተቀናጀ የዲጂታል ትምህርት መረብ",
    badge: "🌐 Modern Platform",
    highlight: "State-of-the-Art Digital Campus",
    animClass: "animate-kenburns-4",
  },
];

export function HomePage() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<HomeData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    apiRequest<HomeData>("/api/public/home")
      .then((res) => setData(res))
      .catch((err) => console.error("Error fetching homepage data:", err));
  }, []);

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <div className="space-y-24 pb-20">
      {/* 1. Hero Section with Ultra-Clear & Dynamic Multi-Image Carousel */}
      <section
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden bg-slate-950 py-24 sm:py-32 text-white min-h-[700px] lg:min-h-[760px] flex items-center select-none"
      >
        {/* Multi-Image Animated Crossfade Layers with Ultra Clarity */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-90 z-1" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={slide.src}
                  alt={slide.tagEn}
                  className={`w-full h-full object-cover object-center filter saturate-115 contrast-105 brightness-100 ${
                    isActive ? slide.animClass : ""
                  }`}
                />
              </div>
            );
          })}

          {/* Calibrated Crisp Framing Overlays - preserving 100% image clarity */}
          <div className="absolute top-0 inset-x-0 h-44 z-2 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 inset-x-0 h-52 z-2 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none"></div>
          <div className="absolute inset-0 z-2 bg-slate-950/30 pointer-events-none"></div>
          <div className="absolute inset-0 z-2 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(2,6,23,0.65)_100%)] pointer-events-none"></div>

          {/* Dynamic Light Beam Sweep */}
          <div className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent blur-xl pointer-events-none z-2 animate-beam-sweep"></div>
        </div>

        {/* Floating Animated Atmospheric Glowing Orbs */}
        <div className="absolute top-1/6 left-1/12 w-80 h-80 rounded-full bg-cyan-400/25 blur-3xl pointer-events-none animate-float-1 z-3"></div>
        <div className="absolute bottom-1/6 right-1/12 w-96 h-96 rounded-full bg-blue-600/30 blur-3xl pointer-events-none animate-float-2 z-3"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none animate-pulse-glow z-3"></div>

        {/* Floating Live Interactive HUD Badges (Desktop) */}
        <div className="hidden xl:flex absolute top-28 right-8 z-20 items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/75 p-3.5 backdrop-blur-xl shadow-2xl animate-hud-float">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-white">🔴 Live Cohorts in Session</p>
            <p className="text-emerald-400 font-semibold">{data?.stats?.activeClasses || 12} Classes Active Today</p>
          </div>
        </div>

        <div className="hidden xl:flex absolute bottom-24 left-8 z-20 items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/75 p-3.5 backdrop-blur-xl shadow-2xl animate-hud-float-delayed">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-md">
            ✓
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-white">Verified Outcomes</p>
            <p className="text-cyan-300 font-semibold">98.4% Course Completion Rate</p>
          </div>
        </div>

        {/* Central Frosted Glass Content Card */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center w-full">
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/15 bg-slate-950/50 p-6 sm:p-10 lg:p-12 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition-all">
            {/* Active Slide Theme Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/40 bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-xl shadow-cyan-950/50 backdrop-blur-md transition-all">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="font-bold text-white">
                {i18n.language === "am" ? activeSlide.tagAm : activeSlide.tagEn}
              </span>
              <span className="rounded-md bg-cyan-950/90 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                {activeSlide.badge}
              </span>
            </div>

            <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.14] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-100 bg-clip-text text-transparent">
                {t("heroTitle")}
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-100 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-medium">
              {t("heroDescription")}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register/student"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-cyan-500/30 hover:from-blue-500 hover:to-cyan-400 transition-all hover:scale-105 active:scale-95"
              >
                <span className="relative z-10">{t("heroPrimary")}</span>
                <span className="relative z-10 transition-transform group-hover:translate-x-1 font-bold">→</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </Link>
              <Link
                to="/categories"
                className="rounded-2xl border border-white/20 bg-slate-900/80 px-8 py-4 text-sm font-bold text-slate-100 backdrop-blur-md hover:bg-slate-800 hover:border-cyan-400 hover:text-white transition-all shadow-lg"
              >
                {t("heroSecondary")}
              </Link>
            </div>
          </div>

          {/* Interactive Slide Preview Cards & Navigation Controls */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-4xl w-full px-2">
              {HERO_SLIDES.map((slide, idx) => {
                const isCurrent = idx === currentSlide;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    type="button"
                    className={`relative group overflow-hidden rounded-2xl p-2 transition-all flex items-center gap-2.5 text-left border ${
                      isCurrent
                        ? "bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/25 scale-102 ring-1 ring-cyan-400"
                        : "bg-slate-950/70 border-white/10 hover:border-white/30 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="relative h-10 w-12 rounded-lg overflow-hidden shrink-0 border border-white/20">
                      <img src={slide.src} alt="" className="w-full h-full object-cover" />
                      {isCurrent && <div className="absolute inset-0 bg-cyan-500/20 ring-1 ring-inset ring-cyan-400"></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-cyan-400">0{slide.id}</span>
                        <span className="text-[11px] font-bold text-white truncate">
                          {slide.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                        {slide.highlight}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Arrow controls & progress dots */}
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                className="h-8 w-8 rounded-full bg-slate-900/80 border border-white/15 flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-colors"
                title="Previous Slide"
                type="button"
              >
                ‹
              </button>
              <div className="flex gap-2">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i === currentSlide ? "w-8 bg-cyan-400 shadow-sm shadow-cyan-400" : "w-2 bg-slate-600 hover:bg-slate-400"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  ></button>
                ))}
              </div>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
                className="h-8 w-8 rounded-full bg-slate-900/80 border border-white/15 flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-colors"
                title="Next Slide"
                type="button"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Slide Progress Bar across bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900 z-10 overflow-hidden">
          <div
            key={currentSlide}
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 transition-all"
            style={{
              animation: isPaused ? "none" : "progressFill 6000ms linear",
            }}
          ></div>
        </div>
      </section>

      {/* 2. Platform Real-Time Statistics */}
      {data?.stats ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label={t("students")}
              value={data.stats.activeStudents}
              subtext="Verified enrolled learners"
              icon="🎓"
              trend="+14% this month"
            />
            <MetricCard
              label={t("teachers")}
              value={data.stats.activeTeachers}
              subtext="Approved & certified educators"
              icon="👨‍🏫"
              trend="100% credential verified"
            />
            <MetricCard
              label={t("classes")}
              value={data.stats.activeClasses}
              subtext="Active learning cohorts"
              icon="📚"
              trend="Daily Google Meet live sync"
            />
            <MetricCard
              label={t("pendingApplications")}
              value={data.stats.pendingTeacherApplications}
              subtext="Under administrative review"
              icon="📝"
              trend="Rigorous quality vetting"
            />
          </div>
        </section>
      ) : null}

      {/* 3. Modern Bento Grid: Architectural Pillars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="ARCHITECTURE"
          title="Engineered for Measurable Educational Excellence"
          subtitle="LearnHUB solves the high dropout rate of online learning by blending personalized human placement with live synchronous classrooms and objective assessment."
          centered
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Bento Card 1: Placement */}
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 hover:shadow-lg hover:ring-blue-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-2xl">
                🧭
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{t("bentoPlacementTitle")}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {t("bentoPlacementDesc")}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600">
              <span>Rule 2: Admin-Controlled Placement</span>
              <span>✓</span>
            </div>
          </div>

          {/* Bento Card 2: Live Google Meet */}
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 hover:shadow-lg hover:ring-blue-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 text-2xl">
                📹
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{t("bentoMeetTitle")}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {t("bentoMeetDesc")}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-cyan-600">
              <span>Verified Google Meet Links & Schedules</span>
              <span>✓</span>
            </div>
          </div>

          {/* Bento Card 3: 40/40/20 Grading */}
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 hover:shadow-lg hover:ring-blue-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-2xl">
                📊
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{t("bentoGradingTitle")}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {t("bentoGradingDesc")}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600">
              <span>Persistent MongoDB Grade Records</span>
              <span>✓</span>
            </div>
          </div>

          {/* Bento Card 4: Verified Educators (Spans 2 cols on lg) */}
          <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 sm:p-10 text-white shadow-md flex flex-col justify-between">
            <div className="max-w-2xl">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-400/30">
                EDUCATOR QUALITY GUARANTEE
              </span>
              <h3 className="mt-4 text-2xl sm:text-3xl font-black">{t("bentoVettedTitle")}</h3>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                {t("bentoVettedDesc")} Hub Admins approve applications with documented reasoning, manage cohort limits, and audit all classroom activities to maintain top pedagogical standards.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register/student"
                className="rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-cyan-300 transition-colors"
              >
                {t("becomeStudent")}
              </Link>
              <Link
                to="/apply/teacher"
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                {t("applyToTeach")}
              </Link>
            </div>
          </div>

          {/* Bento Card 5: Security & RBAC */}
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 hover:shadow-lg hover:ring-blue-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 text-2xl">
                🛡️
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">Server-Enforced RBAC</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Strict security: Teachers only access assigned classes. Students only access authorized enrolled cohorts. Audited at every single API endpoint.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-600">
              <span>Rule 5: Zero-Trust Backend</span>
              <span>✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Curated Learning Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="LEARNING TRACKS"
          title={t("categoriesTitle")}
          subtitle={t("categoriesSubtitle")}
          centered
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.categories ?? []).map((cat) => (
            <Link
              key={cat._id}
              to={`/categories?selected=${cat._id}`}
              className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/90 hover:ring-blue-500 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  💡
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {cat.description}
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-blue-600">
                <span>{t("exploreNow")}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. How LearnHUB Works: 4-Step Journey */}
      <section className="bg-slate-50/70 border-y border-slate-200/80 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="STEP-BY-STEP JOURNEY"
            title={t("howItWorks")}
            subtitle={t("howItWorksSubtitle")}
            centered
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200/90 flex flex-col justify-between">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white font-black text-sm shadow-md shadow-blue-500/20">
                  01
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{t("step1Title")}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t("step1Desc")}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200/90 flex flex-col justify-between">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600 text-white font-black text-sm shadow-md shadow-cyan-500/20">
                  02
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{t("step2Title")}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t("step2Desc")}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200/90 flex flex-col justify-between">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-md shadow-emerald-500/20">
                  03
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{t("step3Title")}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t("step3Desc")}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200/90 flex flex-col justify-between">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-md shadow-indigo-500/20">
                  04
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{t("step4Title")}</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{t("step4Desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Featured Courses */}
      {(data?.featuredCourses?.length ?? 0) > 0 ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge="ACTIVE COHORTS"
            title={t("featuredCourses")}
            subtitle={t("featuredCoursesSubtitle")}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data!.featuredCourses.map((course) => (
              <div
                key={course._id}
                className="flex flex-col justify-between rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200/90 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 border border-cyan-200/60">
                      {course.category?.name ?? "Course"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {course.skillLevel}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-slate-900 leading-snug">{course.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed">{course.description}</p>
                  
                  <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("objectives")}:</p>
                    {course.learningObjectives?.slice(0, 3).map((obj, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <Link
                    to="/register/student"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white hover:bg-blue-600 transition-colors shadow-sm"
                  >
                    {t("enrollNow")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 7. Dual Value Proposition (Students vs Teachers) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Student Card */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 p-8 sm:p-10 text-white shadow-xl flex flex-col justify-between">
            <div>
              <span className="rounded-full bg-blue-500/30 px-3 py-1 text-xs font-bold text-cyan-300 border border-blue-400/30">
                FOR LEARNERS
              </span>
              <h3 className="mt-4 text-2xl sm:text-3xl font-black">{t("benefitsStudents")}</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-blue-500/40 p-1 text-cyan-300 font-bold">✓</span>
                  <span>{t("studentBenefit1")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-blue-500/40 p-1 text-cyan-300 font-bold">✓</span>
                  <span>{t("studentBenefit2")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-blue-500/40 p-1 text-cyan-300 font-bold">✓</span>
                  <span>{t("studentBenefit3")}</span>
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link
                to="/register/student"
                className="inline-block rounded-2xl bg-cyan-400 px-6 py-3 text-xs font-black text-slate-950 hover:bg-cyan-300 transition-all shadow-md"
              >
                {t("studentSignUp")}
              </Link>
            </div>
          </div>

          {/* Teacher Card */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 p-8 sm:p-10 text-white shadow-xl flex flex-col justify-between">
            <div>
              <span className="rounded-full bg-teal-500/30 px-3 py-1 text-xs font-bold text-teal-300 border border-teal-400/30">
                FOR EDUCATORS
              </span>
              <h3 className="mt-4 text-2xl sm:text-3xl font-black">{t("benefitsTeachers")}</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-teal-500/40 p-1 text-teal-300 font-bold">✓</span>
                  <span>{t("teacherBenefit1")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-teal-500/40 p-1 text-teal-300 font-bold">✓</span>
                  <span>{t("teacherBenefit2")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="rounded-full bg-teal-500/40 p-1 text-teal-300 font-bold">✓</span>
                  <span>{t("teacherBenefit3")}</span>
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link
                to="/apply/teacher"
                className="inline-block rounded-2xl bg-teal-400 px-6 py-3 text-xs font-black text-slate-950 hover:bg-teal-300 transition-all shadow-md"
              >
                {t("teacherApply")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Modern Call-to-Action Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-8 py-16 sm:px-16 text-center text-white ring-1 ring-white/10 shadow-2xl">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="rounded-full bg-cyan-400/20 px-3.5 py-1 text-xs font-bold text-cyan-300 border border-cyan-400/30">
              JOIN THE FUTURE OF LEARNING
            </span>
            <h2 className="mt-5 text-3xl font-black sm:text-4xl lg:text-5xl tracking-tight leading-tight">
              {t("ctaTitle")}
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              {t("ctaSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register/student"
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all"
              >
                {t("studentSignUp")}
              </Link>
              <Link
                to="/apply/teacher"
                className="rounded-2xl border border-white/20 bg-slate-900/90 px-8 py-4 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-md"
              >
                {t("teacherApply")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
