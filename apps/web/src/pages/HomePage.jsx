import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { SectionHeading, MetricCard } from "../components/UIComponents";

function getCategoryIcon(name = "") {
    const lower = name.toLowerCase();
    if (lower.includes("code") || lower.includes("soft") || lower.includes("dev") || lower.includes("web") || lower.includes("program")) return "💻";
    if (lower.includes("design") || lower.includes("ui") || lower.includes("ux") || lower.includes("art")) return "🎨";
    if (lower.includes("data") || lower.includes("ai") || lower.includes("machine") || lower.includes("python")) return "📊";
    if (lower.includes("mobile") || lower.includes("app") || lower.includes("flutter")) return "📱";
    if (lower.includes("biz") || lower.includes("bus") || lower.includes("manage") || lower.includes("market")) return "💼";
    if (lower.includes("lang") || lower.includes("speak") || lower.includes("english")) return "🗣️";
    if (lower.includes("science") || lower.includes("math")) return "🔬";
    return "💡";
}

const HERO_SLIDES = [
    {
        id: 1,
        src: "/hero-1.jpg",
        tagEn: "Collaborative Tech & Coding Studio",
        badge: "HANDS-ON PRACTICE",
        highlight: "Build through guided projects",
        animClass: "animate-kenburns-1",
    },
    {
        id: 2,
        src: "/hero-2.jpg",
        tagEn: "Expert Teacher-Led Live Classes",
        badge: "LIVE INSTRUCTION",
        highlight: "Learn with expert instructors",
        animClass: "animate-kenburns-2",
    },
    {
        id: 3,
        src: "/hero-3.jpg",
        tagEn: "Verified Progress & Mastery",
        badge: "VISIBLE PROGRESS",
        highlight: "See the progress you make",
        animClass: "animate-kenburns-3",
    },
    {
        id: 4,
        src: "/hero-4.jpg",
        tagEn: "Connected Education Network",
        badge: "LEARNING COMMUNITY",
        highlight: "Move forward together",
        animClass: "animate-kenburns-4",
    },
];

// Extract a YouTube video ID from various YouTube URL formats
function extractYouTubeId(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        // youtu.be/VIDEO_ID
        if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
        // youtube.com/watch?v=VIDEO_ID
        const v = u.searchParams.get("v");
        if (v) return v;
        // youtube.com/embed/VIDEO_ID
        const parts = u.pathname.split("/");
        const embedIdx = parts.indexOf("embed");
        if (embedIdx !== -1) return parts[embedIdx + 1];
    } catch {
        // fallback: bare ID
        const match = url.match(/[\w-]{11}/);
        if (match) return match[0];
    }
    return null;
}

const DEFAULT_PROMO_TITLE = "See How TedbabeLearnHUB Works";
const DEFAULT_PROMO_LABEL = "PLATFORM OVERVIEW";

// Normalise the admin-managed promo video setting into { title, label, url }
function normalizePromoVideo(raw) {
    if (!raw) return null;
    if (typeof raw === "string") {
        const url = raw.trim();
        return url ? { title: DEFAULT_PROMO_TITLE, label: DEFAULT_PROMO_LABEL, url } : null;
    }
    if (typeof raw === "object") {
        const url = String(raw.url || "").trim();
        if (!url) return null;
        return {
            title: String(raw.title || "").trim() || DEFAULT_PROMO_TITLE,
            label: String(raw.label || "").trim() || DEFAULT_PROMO_LABEL,
            url,
        };
    }
    return null;
}

export function HomePage() {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [promoVideo, setPromoVideo] = useState(null);

    // Selected category state for interactive drill-down
    const programsRef = useRef(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryProgramsMap, setCategoryProgramsMap] = useState({});
    const [loadingPrograms, setLoadingPrograms] = useState(false);

    useEffect(() => {
        apiRequest("/api/public/home")
            .then((res) => setData(res))
            .catch((err) => console.error("Error fetching homepage data:", err));
        // Fetch public settings to get the admin-managed public video
        apiRequest("/api/public/settings")
            .then((res) => {
                const promo = normalizePromoVideo(res?.settings?.promo_video);
                if (promo) {
                    console.log("[TedbabeLearnHUB] Promo video loaded:", promo.title);
                    setPromoVideo(promo);
                }
            })
            .catch((err) => console.error("[TedbabeLearnHUB] Error loading settings:", err));
    }, []);

    const handleCategorySelect = async (cat) => {
        if (selectedCategory?._id === cat._id) {
            setSelectedCategory(null);
            return;
        }
        setSelectedCategory(cat);
        setTimeout(() => {
            programsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 80);

        if (categoryProgramsMap[cat._id]) {
            return;
        }

        setLoadingPrograms(true);
        try {
            const res = await apiRequest(`/api/public/courses?category=${cat._id}&limit=20`);
            setCategoryProgramsMap((prev) => ({
                ...prev,
                [cat._id]: res?.courses || [],
            }));
        } catch (err) {
            console.error("Failed to load category courses:", err);
            const fallback = (data?.featuredCourses || []).filter(
                (c) => c.category?._id === cat._id || c.category === cat._id
            );
            setCategoryProgramsMap((prev) => ({
                ...prev,
                [cat._id]: fallback,
            }));
        } finally {
            setLoadingPrograms(false);
        }
    };

    // Auto-advance slides every 6 seconds
    useEffect(() => {
        if (isPaused)
            return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [isPaused]);
    const activeSlide = HERO_SLIDES[currentSlide];
    return (<div className="editorial-page space-y-24 pb-20">
      {/* 1. Hero Section with Ultra-Clear & Dynamic Multi-Image Carousel */}
      <section onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} className="relative overflow-hidden bg-slate-950 py-24 sm:py-32 text-white min-h-[700px] lg:min-h-[760px] flex items-center select-none">
        {/* Multi-Image Animated Crossfade Layers with Ultra Clarity */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === currentSlide;
            return (<div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-90 z-1" : "opacity-0 z-0 pointer-events-none"}`}>
                <img src={slide.src} alt={slide.tagEn} className={`w-full h-full object-cover object-center filter saturate-115 contrast-105 brightness-100 ${isActive ? slide.animClass : ""}`}/>
              </div>);
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
            <p className="font-bold text-white">Learn with a live cohort</p>
            <p className="text-emerald-400 font-semibold">{data?.stats?.activeClasses ?? 0} active cohorts</p>
          </div>
        </div>

        <div className="hidden xl:flex absolute bottom-24 left-8 z-20 items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/75 p-3.5 backdrop-blur-xl shadow-2xl animate-hud-float-delayed">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white text-sm shadow-md">
            ✓
          </div>
          <div className="text-left text-xs">
            <p className="font-bold text-white">Practice with purpose</p>
            <p className="text-cyan-300 font-semibold">Projects, feedback, and steady progress</p>
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
              <span className="font-bold text-white">{activeSlide.tagEn}</span>
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
              <Link to="/register/student" className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-cyan-500/30 hover:from-blue-500 hover:to-cyan-400 transition-all hover:scale-105 active:scale-95">
                <span className="relative z-10">{t("heroPrimary")}</span>
                <span className="relative z-10 transition-transform group-hover:translate-x-1 font-bold">→</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </Link>
              <Link to="/categories" className="rounded-2xl border border-white/20 bg-slate-900/80 px-8 py-4 text-sm font-bold text-slate-100 backdrop-blur-md hover:bg-slate-800 hover:border-cyan-400 hover:text-white transition-all shadow-lg">
                {t("heroSecondary")}
              </Link>
            </div>
          </div>

          {/* Interactive Slide Preview Cards & Navigation Controls */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-4xl w-full px-2">
              {HERO_SLIDES.map((slide, idx) => {
            const isCurrent = idx === currentSlide;
            return (<button key={slide.id} onClick={() => setCurrentSlide(idx)} type="button" className={`relative group overflow-hidden rounded-2xl p-2 transition-all flex items-center gap-2.5 text-left border ${isCurrent
                    ? "bg-slate-900/90 border-cyan-400 shadow-lg shadow-cyan-500/25 scale-102 ring-1 ring-cyan-400"
                    : "bg-slate-950/70 border-white/10 hover:border-white/30 hover:bg-slate-900/80"}`}>
                    <div className="relative h-10 w-12 rounded-lg overflow-hidden shrink-0 border border-white/20">
                      <img src={slide.src} alt="" className="w-full h-full object-cover"/>
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
                  </button>);
        })}
            </div>

            {/* Quick Arrow controls & progress dots */}
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <button onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} className="h-8 w-8 rounded-full bg-slate-900/80 border border-white/15 flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-colors" title="Previous Slide" type="button">
                ‹
              </button>
              <div className="flex gap-2">
                {HERO_SLIDES.map((_, i) => (<button key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition-all duration-500 ${i === currentSlide ? "w-8 bg-cyan-400 shadow-sm shadow-cyan-400" : "w-2 bg-slate-600 hover:bg-slate-400"}`} aria-label={`Go to slide ${i + 1}`}></button>))}
              </div>
              <button onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)} className="h-8 w-8 rounded-full bg-slate-900/80 border border-white/15 flex items-center justify-center hover:bg-cyan-500 hover:text-white transition-colors" title="Next Slide" type="button">
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Slide Progress Bar across bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900 z-10 overflow-hidden">
          <div key={currentSlide} className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300 transition-all" style={{
            animation: isPaused ? "none" : "progressFill 6000ms linear",
        }}></div>
        </div>
      </section>

      {/* 2. Modern Bento Grid: Architectural Pillars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <SectionHeading badge="THE TEDBABELEARNHUB (TLH) DIFFERENCE" title="A more human way to build real-world skills" subtitle="TedbabeLearnHUB (TLH) combines expert instruction, hands-on practice, and steady support to help you keep moving forward." centered/>

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
              <span>Find a cohort that fits your goals</span>
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
              <span>Join your instructor and cohort live</span>
              <span>✓</span>
            </div>
          </div>

          {/* Bento Card 3: 40/40/20 Grading */}
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 hover:shadow-lg hover:ring-blue-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-blue-600 text-2xl">
                📊
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900">{t("bentoGradingTitle")}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {t("bentoGradingDesc")}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600">
              <span>Understand what you have mastered</span>
              <span>✓</span>
            </div>
          </div>

          {/* Bento Card 4: Verified Educators (Spans 2 cols on lg) */}
          <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-[#0c234b] via-[#091b3b] to-[#061124] p-8 sm:p-10 text-white shadow-xl ring-1 ring-white/10 flex flex-col justify-between">
            <div className="max-w-2xl">
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-bold text-sky-300 border border-sky-400/30">
                LEARN WITH CONFIDENCE
              </span>
              <h3 className="mt-4 text-2xl sm:text-3xl font-black">{t("bentoVettedTitle")}</h3>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                {t("bentoVettedDesc")} We bring structure, care, and accountability to every learning experience.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register/student" className="rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-blue-500/25 hover:from-[#0052cc] hover:to-[#0088e6] transition-all">
                {t("becomeStudent")}
              </Link>
              <Link to="/apply/teacher" className="rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-colors">
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
              <h3 className="mt-5 text-xl font-bold text-slate-900">A focused learning space</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Keep your classes, resources, assignments, and progress together in one secure workspace.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-600">
              <span>Your learning, organized in one place</span>
              <span>✓</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3b. Admin-Managed Public Video — shown before "Find your next skill" */}
      {(() => {
        if (!promoVideo) return null;
        const videoId = extractYouTubeId(promoVideo.url);
        if (!videoId) return null;
        const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&controls=1&fs=1`;
        return (
          <section className="w-full bg-slate-950 py-0 overflow-hidden">
            {/* Top decorative gradient fade */}
            <div className="h-10 bg-gradient-to-b from-white to-slate-950 pointer-events-none" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
              {/* Section header */}
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-slate-900/90 px-4 py-1.5 text-xs font-semibold text-cyan-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  {promoVideo.label}
                </span>
                <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {promoVideo.title}
                </h2>
                <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                  Watch a quick walkthrough of the platform — from enrollment to live sessions, resources, and progress tracking.
                </p>
              </div>

              {/* Cinematic video player frame */}
              <div className="relative mx-auto w-full rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
                style={{ aspectRatio: "16/9" }}
                onContextMenu={(e) => e.preventDefault()}
              >
                {/* Glowing border accent */}
                <div className="absolute inset-0 rounded-3xl ring-2 ring-inset ring-cyan-400/20 pointer-events-none z-10" />
                {/* Corner accent dots */}
                <div className="absolute top-3 left-3 h-3 w-3 rounded-full bg-cyan-400/60 z-20 blur-sm" />
                <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-blue-400/60 z-20 blur-sm" />

                <iframe
                  title={promoVideo.title}
                  src={embedSrc}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              </div>

              {/* Sub-label below video */}
              <p className="mt-5 text-center text-xs text-slate-500 font-medium">
                Official platform overview · Permanently maintained by administrator
              </p>
            </div>

            {/* Bottom decorative gradient fade */}
            <div className="h-10 bg-gradient-to-t from-white to-slate-950 pointer-events-none" />
          </section>
        );
      })()}

      {/* 4. Curated Learning Categories (Click to reveal programs) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="LEARNING TRACKS"
          title={t("categoriesTitle")}
          subtitle={t("categoriesSubtitle")}
          centered
        />

        {/* Categories Grid - clickable cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.categories ?? []).map((cat) => {
            const isSelected = selectedCategory?._id === cat._id;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                aria-expanded={isSelected}
                className={`group text-left rounded-3xl p-6 transition-all flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isSelected
                    ? "bg-sky-50/80 ring-2 ring-blue-600 shadow-xl -translate-y-1"
                    : "bg-white shadow-sm ring-1 ring-slate-200/90 hover:ring-blue-500 hover:shadow-lg hover:-translate-y-0.5"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-[#0066ff] to-[#0099ff] text-white shadow-md shadow-blue-500/25 scale-105"
                          : "bg-sky-50 text-blue-700 group-hover:scale-110 group-hover:bg-gradient-to-r group-hover:from-[#0066ff] group-hover:to-[#0099ff] group-hover:text-white"
                      }`}
                    >
                      {getCategoryIcon(cat.name)}
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-3 py-1 text-xs font-bold text-white shadow-sm">
                        <span>✓</span>
                        <span>{t("activeTrack")}</span>
                      </span>
                    )}
                  </div>
                  <h3
                    className={`mt-4 text-xl font-bold transition-colors ${
                      isSelected ? "text-blue-950" : "text-slate-900 group-hover:text-blue-600"
                    }`}
                  >
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div
                  className={`mt-6 flex items-center justify-between border-t pt-4 text-xs font-bold transition-colors ${
                    isSelected
                      ? "border-sky-200/80 text-blue-700"
                      : "border-slate-100 text-blue-600 group-hover:text-blue-800"
                  }`}
                >
                  <span className="font-semibold text-slate-500">
                    {isSelected ? t("hidePrograms") : t("clickToViewPrograms")}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-extrabold transition-transform ${
                      isSelected ? "translate-y-[-2px]" : "group-hover:translate-x-1"
                    }`}
                  >
                    {isSelected ? "↑" : "↓"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Category Programs Drill-Down Display */}
        {selectedCategory && (
          <div
            ref={programsRef}
            className="mt-10 rounded-3xl border border-sky-500/20 bg-gradient-to-b from-[#f8fafc] to-white p-6 sm:p-10 shadow-xl transition-all animate-fadeIn"
          >
            {/* Header banner */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-blue-700 ring-1 ring-sky-200/60">
                    {getCategoryIcon(selectedCategory.name)} {t("activeTrack")}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                    {(categoryProgramsMap[selectedCategory._id] || []).length} {t("courses")}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl sm:text-3xl font-black text-slate-950">
                  {t("programsInCategory")}: {selectedCategory.name}
                </h3>
                <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                  {selectedCategory.description}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to={`/courses?category=${selectedCategory._id}`}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:border-blue-600 hover:text-blue-700 transition-colors shadow-sm"
                >
                  {t("allProgramsInCatalog")} →
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 transition-colors"
                >
                  ✕ {t("hidePrograms")}
                </button>
              </div>
            </div>

            {/* Programs Content */}
            <div className="mt-8">
              {loadingPrograms && !categoryProgramsMap[selectedCategory._id] ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-600 border-t-transparent mb-4"></div>
                  <p className="text-sm font-bold text-slate-600">{t("loadingPrograms")}</p>
                </div>
              ) : (categoryProgramsMap[selectedCategory._id] || []).length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {(categoryProgramsMap[selectedCategory._id] || []).map((course) => (
                    <div
                      key={course._id}
                      className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/90 hover:shadow-lg hover:ring-blue-500 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-blue-700 border border-sky-200/60">
                            {course.skillLevel || "All Levels"}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {course.modules?.length ? `${course.modules.length} modules` : "Cohort Based"}
                          </span>
                        </div>
                        <h4 className="mt-4 text-xl font-bold text-slate-900 leading-snug">
                          {course.title}
                        </h4>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {course.description}
                        </p>

                        {course.learningObjectives?.length > 0 && (
                          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              {t("objectives")}:
                            </p>
                            {course.learningObjectives.slice(0, 2).map((obj, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <span className="text-blue-600 font-bold">✓</span>
                                <span className="line-clamp-1">{obj}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
                        <Link
                          to={`/courses/${course.slug || course._id}`}
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                        >
                          {t("viewDetails") || "Details"}
                        </Link>
                        <Link
                          to="/register/student"
                          className="flex-1 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] hover:from-[#0052cc] hover:to-[#0088e6] px-3 py-2.5 text-center text-xs font-bold text-white shadow-md shadow-blue-500/25 transition-all hover:-translate-y-0.5"
                        >
                          {t("enrollNow")}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600 mb-3">
                    🚀
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {t("noProgramsFound")}
                  </h4>
                  <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                    We are actively finalizing new curriculums and teacher schedules for this track. Check our other tracks or register to get notified.
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Link
                      to="/courses"
                      className="rounded-xl bg-slate-950 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-600 transition-colors shadow-sm"
                    >
                      {t("allCourses")}
                    </Link>
                    <Link
                      to="/contact"
                      className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {t("contact")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 5. How LearnHUB Works: 4-Step Journey */}
      <section className="bg-slate-50/70 border-y border-slate-200/80 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading badge="STEP-BY-STEP JOURNEY" title={t("howItWorks")} subtitle={t("howItWorksSubtitle")} centered/>
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
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] text-white font-black text-sm shadow-md shadow-blue-500/20">
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
      {(data?.featuredCourses?.length ?? 0) > 0 ? (<section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading badge="ACTIVE COHORTS" title={t("featuredCourses")} subtitle={t("featuredCoursesSubtitle")}/>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.featuredCourses.map((course) => (<div key={course._id} className="flex flex-col justify-between rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200/90 hover:shadow-lg transition-all">
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
                    {course.learningObjectives?.slice(0, 3).map((obj, i) => (<div key={i} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                        <span className="text-blue-600 font-bold">✓</span>
                        <span>{obj}</span>
                      </div>))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <Link to="/register/student" className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white hover:bg-blue-600 transition-colors shadow-sm">
                    {t("enrollNow")}
                  </Link>
                </div>
              </div>))}
          </div>
        </section>) : null}

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
              <Link to="/register/student" className="inline-block rounded-2xl bg-cyan-400 px-6 py-3 text-xs font-black text-slate-950 hover:bg-cyan-300 transition-all shadow-md">
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
              <Link to="/apply/teacher" className="inline-block rounded-2xl bg-teal-400 px-6 py-3 text-xs font-black text-slate-950 hover:bg-teal-300 transition-all shadow-md">
                {t("teacherApply")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Standalone Community & Impact Statistics Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/70 to-slate-100/50 p-8 sm:p-12 shadow-sm ring-1 ring-slate-200/60">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3.5 py-1 text-xs font-bold text-blue-700 border border-sky-200 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              OUR GROWING COMMUNITY
            </span>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Proven Learning Milestones
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Real engagement, expert mentorship, and supportive cohort-based environments driving measurable growth.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {/* Active Learners */}
            <div className="group relative overflow-hidden rounded-2xl border border-blue-200/80 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:border-blue-400">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl shadow-inner border border-blue-100">
                🎓
              </div>
              <div className="mt-5 font-mono text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                200+
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900">
                Active Learners
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Students actively acquiring modern digital & technical capabilities.
              </p>
            </div>

            {/* Instructors */}
            <div className="group relative overflow-hidden rounded-2xl border border-teal-200/80 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:border-teal-400">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-400" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-2xl shadow-inner border border-teal-100">
                👨‍🏫
              </div>
              <div className="mt-5 font-mono text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                50+
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900">
                Instructors
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Industry veterans, certified mentors, and passionate subject educators.
              </p>
            </div>

            {/* Cohorts */}
            <div className="group relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:border-indigo-400">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-400" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl shadow-inner border border-indigo-100">
                📚
              </div>
              <div className="mt-5 font-mono text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                20+
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900">
                Cohorts
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Interactive live classroom groups learning and practicing together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Modern Call-to-Action Banner */}
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
              <Link to="/register/student" className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-4 text-sm font-black text-white shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all">
                {t("studentSignUp")}
              </Link>
              <Link to="/apply/teacher" className="rounded-2xl border border-white/20 bg-slate-900/90 px-8 py-4 text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-md">
                {t("teacherApply")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>);
}
