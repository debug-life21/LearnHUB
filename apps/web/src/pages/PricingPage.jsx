import { Link } from "react-router-dom";

export function PricingPage() {

    const plans = [
        {
            name: "Community Explorer",
            price: "Free",
            period: "Forever",
            description: "Full access to our public catalog, foundational resources, and open learning community.",
            highlight: false,
            features: [
                "Browse complete 119+ course catalog",
                "Preview course syllabi and learning objectives",
                "Access public learning resources & PDFs",
                "Full bilingual support (English & Amharic)",
                "Self-paced explore mode",
            ],
            buttonText: "Browse Courses Free",
            buttonLink: "/courses",
            buttonStyle: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
        },
        {
            name: "Guided Cohort",
            price: "Cohort Plan",
            period: "Per Subject Course",
            badge: "MOST POPULAR",
            description: "Direct teacher guidance, structured cohort schedule, live Google Meet sessions, and certification.",
            highlight: true,
            features: [
                "All Community Explorer features",
                "Admin placement into a dedicated learning cohort",
                "Scheduled live classes via Google Meet",
                "Teacher grading with personal feedback",
                "Interactive multiple-choice quizzes",
                "Cohort discussions & resource vault",
                "Official Certificate of Completion",
            ],
            buttonText: "Apply for Placement",
            buttonLink: "/register/student",
            buttonStyle: "bg-gradient-to-r from-[#0066ff] to-[#0099ff] text-white hover:from-[#0052cc] hover:to-[#0088e6] shadow-md shadow-blue-500/25",
        },
        {
            name: "Academic Foundation",
            price: "School Track",
            period: "Per Semester / Academic Term",
            description: "Comprehensive Grade 1–12 curriculum or university foundational support with dedicated mentors.",
            highlight: false,
            features: [
                "All Guided Cohort features",
                "Curriculum coverage for Grade 1–12 subjects",
                "Continuous attendance & performance reports",
                "Priority teacher assignment",
                "Direct student-teacher messaging support",
                "Quarterly evaluation certificates",
            ],
            buttonText: "Register as Student",
            buttonLink: "/register/student",
            buttonStyle: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
        },
    ];

    return (
        <div className="editorial-page min-h-screen pb-24">
            {/* Header Hero */}
            <div className="editorial-hero border-b border-slate-200/80 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl text-center">
                    <span className="editorial-kicker text-blue-600 font-extrabold tracking-widest">
                        TRANSPARENT ACCESS
                    </span>
                    <h1 className="editorial-display mt-3 text-4xl font-extrabold text-slate-900 sm:text-5xl">
                        Accessible Education for Every Learner
                    </h1>
                    <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600 sm:text-lg leading-relaxed">
                        Choose the right level of support. From open self-guided catalog exploration to intensive teacher-led live cohorts with verified certificates.
                    </p>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-3 items-stretch">
                    {plans.map((plan, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col justify-between rounded-3xl p-8 transition-all ${
                                plan.highlight
                                    ? "bg-white ring-2 ring-blue-600 shadow-xl shadow-blue-500/10 lg:-translate-y-2 relative"
                                    : "bg-white/90 ring-1 ring-slate-200/80 shadow-sm"
                            }`}
                        >
                            {plan.badge && (
                                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-4 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/25">
                                    {plan.badge}
                                </span>
                            )}

                            <div>
                                <h3 className="editorial-display text-xl font-bold text-slate-900">{plan.name}</h3>
                                <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[36px]">
                                    {plan.description}
                                </p>

                                <div className="mt-6 border-y border-slate-100 py-4">
                                    <div className="text-3xl font-black text-slate-900 font-mono">
                                        {plan.price}
                                    </div>
                                    <div className="text-xs font-semibold text-slate-400 mt-0.5">
                                        {plan.period}
                                    </div>
                                </div>

                                <ul className="mt-6 space-y-3 text-xs text-slate-700">
                                    {plan.features.map((feat, fIdx) => (
                                        <li key={fIdx} className="flex items-start gap-2.5">
                                            <span className="text-blue-600 font-bold shrink-0">✓</span>
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-8 pt-4">
                                <Link
                                    to={plan.buttonLink}
                                    className={`w-full block text-center rounded-2xl py-3.5 text-xs font-black uppercase tracking-wider transition ${plan.buttonStyle}`}
                                >
                                    {plan.buttonText}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Placement Policy Note */}
                <div className="mt-16 rounded-3xl bg-slate-50 p-8 text-center ring-1 ring-slate-200/80">
                    <h4 className="text-sm font-bold text-slate-900">Need specific cohort scheduling or group placement?</h4>
                    <p className="mt-2 text-xs text-slate-600 max-w-xl mx-auto">
                        Our Hub Administrators work directly with schools, parent groups, and individual learners to arrange convenient morning, afternoon, or weekend class schedules.
                    </p>
                    <Link to="/contact" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:underline">
                        Contact Support for Placement Inquiries →
                    </Link>
                </div>
            </div>
        </div>
    );
}
