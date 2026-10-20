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
    tagAm: "የቴክኖሎጂ እና የኮዲንግ ላብራቶሪ",
    tagEn: "Collaborative Tech & Coding Studio",
    badge: "💻 Interactive Lab",
    highlight: "Addis Ababa Coding Innovation Hub",
    animClass: "animate-kenburns-1",
  },
  {
    id: 2,
    src: "/hero-2.jpg",
    tagAm: "የቀጥታ አስተማሪ መስተጋብር",
    tagEn: "Expert Teacher-Led Live Classes",
    badge: "👨‍🏫 Live Instruction",
    highlight: "Real-Time Google Meet Sessions & Data",
    animClass: "animate-kenburns-2",
  },
  {
    id: 3,
    src: "/hero-3.jpg",
    tagAm: "የተረጋገጠ የተማሪ እድገት",
    tagEn: "Verified Progress & Mastery",
    badge: "🎓 Verified Outcomes",
    highlight: "Accredited Cohorts & Placement",
    animClass: "animate-kenburns-3",
  },
  {
    id: 4,
    src: "/hero-4.jpg",
    tagAm: "የተቀናጀ የዲጂታል ትምህርት መረብ",
    tagEn: "Connected Education Network",
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
    <div className="space-y-20 pb-16">
      {/* Hero Section with Ultra-Clear & Dynamic Multi-Image Carousel */}
      <section
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden bg-slate-950 py-24 sm:py-32 text-white min-h-[680px] lg:min-h-[740px] flex items-center select-none"
      >
        {/* 1. Multi-Image Animated Crossfade Layers with Ultra Clarity */}
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

        {/* 2. Floating Animated Atmospheric Glowing Orbs */}
        <div className="absolute top-1/6 left-1/12 w-80 h-80 rounded-full bg-cyan-400/25 blur-3xl pointer-events-none animate-float-1 z-3"></div>
        <div className="absolute bottom-1/6 right-1/12 w-96 h-96 rounded-full bg-blue-600/30 blur-3xl pointer-events-none animate-float-2 z-3"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none animate-pulse-glow z-3"></div>

        {/* 3. Floating Live Interactive HUD Badges (Desktop) */}
        <div className="hidden xl:flex absolute top-28 right-8 z-20 items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/70 p-3.5 backdrop-blur-xl shadow-2xl animate-hud-float">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-white">🔴 የቀጥታ ክፍለ-ጊዜዎች | Live Classes</p>
            <p className="text-emerald-400 font-semibold">{data?.stats?.activeClasses || 12} Cohorts Active Now</p>
          </div>
        </div>

        <div className="hidden xl:flex absolute bottom-24 left-8 z-20 items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/70 p-3.5 backdrop-blur-xl shadow-2xl animate-hud-float-delayed">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-md">
            ✓
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-white">የተረጋገጠ ውጤት | Verified Outcomes</p>
            <p className="text-cyan-300 font-semibold">98.4% Course Completion Rate</p>
          </div>
        </div>

        {/* 4. Central Glassmorphic Content Card */}
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

            <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-100 bg-clip-text text-transparent">
                {t("heroTitle")}
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg lg:text-xl text-slate-100 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-medium">
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

          {/* 5. Dynamic Interactive Slide Preview Cards & Navigation Controls */}
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

      {/* Real Platform Statistics */}
      {data?.stats ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label={t("students")} value={data.stats.activeStudents} subtext="Active verified learners" icon="🎓" />
            <MetricCard label={t("teachers")} value={data.stats.activeTeachers} subtext="Approved educators" icon="👨‍🏫" />
            <MetricCard label={t("classes")} value={data.stats.activeClasses} subtext="Live learning cohorts" icon="📚" />
            <MetricCard label={t("pendingApplications")} value={data.stats.pendingTeacherApplications} subtext="Under administrative review" icon="📝" />
          </div>
        </section>
      ) : null}

      {/* Learning Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={t("categoriesTitle")}
          subtitle={t("categoriesSubtitle")}
          centered
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.categories ?? []).map((cat) => (
            <Link
              key={cat._id}
              to={`/categories?selected=${cat._id}`}
              className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:ring-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  💡
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {cat.description}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
                <span>ተመልከት / Explore</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How LearnHUB Works */}
      <section className="bg-slate-100/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={t("howItWorks")}
            subtitle="የተደራጀ እና አስተማማኝ የመማር ጉዞ"
            centered
          />
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-sm">
                1
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{t("step1Title")}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("step1Desc")}</p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white font-extrabold text-sm">
                2
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{t("step2Title")}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("step2Desc")}</p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-sm">
                3
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{t("step3Title")}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t("step3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {(data?.featuredCourses?.length ?? 0) > 0 ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title={t("featuredCourses")}
            subtitle="በተሞክሮ የበለጸጉ እና አሁን የሚሰጡ ኮርሶች"
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data!.featuredCourses.map((course) => (
              <div
                key={course._id}
                className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div>
                  <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">
                    {course.category?.name ?? "Course"}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{course.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3">{course.description}</p>
                  <div className="mt-4 space-y-1.5">
                    {course.learningObjectives?.slice(0, 3).map((obj, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                        <span className="text-emerald-500">✓</span>
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <Link
                    to="/register/student"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                  >
                    ተመዝገብ / Enroll
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Benefits Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl bg-gradient-to-br from-blue-900 to-slate-900 p-8 sm:p-10 text-white">
            <h3 className="text-2xl font-bold">{t("benefitsStudents")}</h3>
            <ul className="mt-6 space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="rounded-full bg-blue-500/30 p-1 text-cyan-300">✓</span>
                <span>{t("studentBenefit1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="rounded-full bg-blue-500/30 p-1 text-cyan-300">✓</span>
                <span>{t("studentBenefit2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="rounded-full bg-blue-500/30 p-1 text-cyan-300">✓</span>
                <span>{t("studentBenefit3")}</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link
                to="/register/student"
                className="inline-block rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-cyan-300 transition-colors"
              >
                {t("studentSignUp")}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-teal-950 p-8 sm:p-10 text-white">
            <h3 className="text-2xl font-bold">{t("benefitsTeachers")}</h3>
            <ul className="mt-6 space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="rounded-full bg-teal-500/30 p-1 text-teal-300">✓</span>
                <span>{t("teacherBenefit1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="rounded-full bg-teal-500/30 p-1 text-teal-300">✓</span>
                <span>{t("teacherBenefit2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="rounded-full bg-teal-500/30 p-1 text-teal-300">✓</span>
                <span>{t("teacherBenefit3")}</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link
                to="/apply/teacher"
                className="inline-block rounded-xl bg-teal-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-teal-300 transition-colors"
              >
                {t("teacherApply")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-950 p-8 sm:p-12 text-center text-white ring-1 ring-slate-800">
          <h2 className="text-3xl font-extrabold sm:text-4xl">የመማር ጉዞዎን ዛሬውኑ በLearnHUB ይጀምሩ</h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            ተገቢውን ትምህርት፣ ከአስተማሪ ጋር በቀጥታ በመገናኘት፣ በደረጃዎ የተመደበ ክፍል ያግኙ።
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/register/student"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
            >
              {t("studentSignUp")}
            </Link>
            <Link
              to="/apply/teacher"
              className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {t("teacherApply")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
