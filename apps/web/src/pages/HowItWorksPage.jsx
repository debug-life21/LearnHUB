import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function HowItWorksPage() {
    const { t } = useTranslation();

    const studentSteps = [
        {
            number: "01",
            title: "Register & Share Learning Goals",
            description: "Sign up with email or Google. Choose your subject of interest (Languages, Grades 1–12, Computing, Business), your starting skill level, and your preferred learning schedule.",
            tag: "GETTING STARTED",
        },
        {
            number: "02",
            title: "Hub Administrator Placement",
            description: "To prevent overcrowded classrooms and ensure balanced groups, a LearnHUB Administrator reviews your profile and matches you to an active cohort led by an approved, specialized instructor.",
            tag: "CURATED COHORTS",
        },
        {
            number: "03",
            title: "Interactive Live Classes via Google Meet",
            description: "Join scheduled live sessions directly from your student dashboard. Participate in real-time discussions, ask questions, and download lesson presentations and PDF worksheets.",
            tag: "LIVE INSTRUCTION",
        },
        {
            number: "04",
            title: "Guided Assignments & Instant Quizzes",
            description: "Complete homework tasks reviewed and graded by your teacher. Take timed multiple-choice assessments with server-side auto-grading to reinforce concepts immediately.",
            tag: "HANDS-ON PRACTICE",
        },
        {
            number: "05",
            title: "Continuous Progress & Verified Certificate",
            description: "Your progress is calculated using a real weighted formula: 40% live attendance + 40% submitted assignments + 20% assessment scores. Achieve 70%+ to earn an official certificate.",
            tag: "CREDENTIAL",
        },
    ];

    const teacherSteps = [
        {
            number: "01",
            title: "Submit Teaching Application",
            description: "Educators apply with their background, experience, and subjects of expertise. Verification codes guarantee authentic contact info.",
        },
        {
            number: "02",
            title: "Administrative Review & Approval",
            description: "LearnHUB administrators thoroughly review qualifications before approving accounts, guaranteeing exceptional instruction.",
        },
        {
            number: "03",
            title: "Cohort Management & Teaching",
            description: "Conduct lessons, create assignments, grade student work, record attendance, and share learning resources from a dedicated portal.",
        },
    ];

    return (
        <div className="editorial-page min-h-screen pb-24">
            {/* Header Hero */}
            <div className="editorial-hero border-b border-stone-200/80 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl text-center">
                    <span className="editorial-kicker text-emerald-800">
                        LEARNING ARCHITECTURE
                    </span>
                    <h1 className="editorial-display mt-3 text-4xl font-extrabold text-stone-900 sm:text-5xl">
                        How LearnHUB Works
                    </h1>
                    <p className="mx-auto mt-4 max-w-3xl text-base text-stone-600 sm:text-lg leading-relaxed">
                        LearnHUB bridges self-paced online materials with real teacher accountability, structured cohort placement,
                        live interactive classes, and verified credentials.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Link to="/register/student" className="editorial-button text-xs font-black">
                            Join as a Student →
                        </Link>
                        <Link to="/apply/teacher" className="editorial-button-secondary text-xs font-bold">
                            Teach with LearnHUB
                        </Link>
                    </div>
                </div>
            </div>

            {/* Student Journey Steps */}
            <div className="mx-auto max-w-5xl px-4 pt-16 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                        THE LEARNER JOURNEY
                    </span>
                    <h2 className="editorial-display mt-2 text-3xl font-bold text-stone-900">
                        From Registration to Certified Mastery
                    </h2>
                </div>

                <div className="space-y-6">
                    {studentSteps.map((step, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col sm:flex-row items-start gap-6 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200/80 transition hover:shadow-md"
                        >
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-stone-900 font-mono text-xl font-black text-emerald-400">
                                {step.number}
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                                    {step.tag}
                                </span>
                                <h3 className="editorial-display text-xl font-bold text-stone-900">
                                    {step.title}
                                </h3>
                                <p className="text-xs text-stone-600 leading-relaxed max-w-3xl">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Educator Quality Section */}
            <div className="mx-auto max-w-5xl px-4 pt-20 sm:px-6 lg:px-8">
                <div className="rounded-3xl bg-stone-900 p-8 sm:p-12 text-white shadow-xl">
                    <div className="max-w-3xl">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                            TEACHER RECRUITMENT & EXCELLENCE
                        </span>
                        <h2 className="editorial-display mt-2 text-3xl font-bold text-white">
                            Vetted, Dedicated Educators
                        </h2>
                        <p className="mt-3 text-xs text-stone-300 leading-relaxed">
                            Unlike open marketplace platforms where anyone can post courses, LearnHUB instructors are vetted and approved by our academic administrators. Every class is actively guided by a passionate educator.
                        </p>
                    </div>

                    <div className="mt-8 grid gap-6 sm:grid-cols-3">
                        {teacherSteps.map((tStep, i) => (
                            <div key={i} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                                <div className="font-mono text-lg font-black text-emerald-400 mb-2">
                                    {tStep.number}
                                </div>
                                <h4 className="text-sm font-bold text-white mb-2">{tStep.title}</h4>
                                <p className="text-xs text-stone-400 leading-relaxed">{tStep.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center pt-4 border-t border-white/10">
                        <Link
                            to="/apply/teacher"
                            className="inline-flex rounded-xl bg-emerald-500 px-6 py-3 text-xs font-extrabold text-stone-950 transition hover:bg-emerald-400"
                        >
                            Apply to Teach on LearnHUB →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
