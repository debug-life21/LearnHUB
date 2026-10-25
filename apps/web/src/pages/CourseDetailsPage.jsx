import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { Badge, EmptyState } from "../components/UIComponents";

export function CourseDetailsPage() {
    const { slug } = useParams();
    const { t } = useTranslation();
    const [course, setCourse] = useState(null);
    const [activeCohortsCount, setActiveCohortsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeModuleIndex, setActiveModuleIndex] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError("");
        apiRequest(`/api/public/courses/${slug}`)
            .then((res) => {
                setCourse(res.course);
                setActiveCohortsCount(res.activeCohortsCount || 0);
            })
            .catch((err) => {
                setError(err.message || "Course details could not be loaded.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [slug]);

    if (loading) {
        return (
            <div className="editorial-page flex min-h-[60vh] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent"></div>
                    <span className="text-sm font-bold text-stone-700">Loading course curriculum…</span>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="editorial-page mx-auto max-w-4xl px-4 py-20 text-center">
                <EmptyState
                    title="Course Not Found"
                    description={error || "The requested course could not be located in the catalog."}
                    action={
                        <Link to="/courses" className="editorial-button text-xs">
                            ← Return to Course Catalog
                        </Link>
                    }
                />
            </div>
        );
    }

    // Default syllabus modules if none explicitly configured in DB
    const modules = course.modules && course.modules.length > 0 ? course.modules : [
        {
            title: "Module 1: Foundations & Core Concepts",
            description: "Essential principles, key vocabulary, and foundational orientation.",
            lessons: [
                { title: "Introduction & Learning Roadmap", durationMinutes: 30 },
                { title: "Core Conceptual Deep-Dive", durationMinutes: 45 },
                { title: "Interactive Guided Practice", durationMinutes: 60 },
            ],
        },
        {
            title: "Module 2: Practical Application & Workflows",
            description: "Hands-on projects, real-world examples, and guided problem solving.",
            lessons: [
                { title: "Techniques and Best Practices", durationMinutes: 45 },
                { title: "Collaborative Cohort Exercise", durationMinutes: 60 },
                { title: "Knowledge Check & Feedback", durationMinutes: 30 },
            ],
        },
        {
            title: "Module 3: Advanced Mastery & Assessment",
            description: "Culminating tasks, comprehensive assessment, and certificate readiness.",
            lessons: [
                { title: "Specialized Topics & Synthesis", durationMinutes: 50 },
                { title: "Course Assignment & Review", durationMinutes: 60 },
                { title: "Final Evaluation & Certification", durationMinutes: 40 },
            ],
        },
    ];

    return (
        <div className="editorial-page min-h-screen pb-24">
            {/* Header Hero */}
            <div className="editorial-hero border-b border-stone-200/80 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <Link to="/courses" className="text-xs font-bold text-stone-500 hover:text-stone-900">
                            ← Courses
                        </Link>
                        <span className="text-stone-300">/</span>
                        <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                            {course.category?.name || "Category"}
                        </span>
                        <span className="rounded-lg bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                            {course.skillLevel || "All levels"}
                        </span>
                    </div>

                    <h1 className="editorial-display text-3xl font-extrabold text-stone-900 sm:text-4xl lg:text-5xl">
                        {course.title}
                    </h1>

                    <p className="mt-4 max-w-3xl text-base text-stone-600 sm:text-lg leading-relaxed">
                        {course.description}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-6 text-xs font-semibold text-stone-600">
                        <div className="flex items-center gap-2">
                            <span className="text-base">⏱️</span>
                            <span>{course.estimatedDuration || "8-week teacher-led program"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-base">🏫</span>
                            <span>{activeCohortsCount} active cohorts running</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-base">🎓</span>
                            <span>Verified Certificate upon completion</span>
                        </div>
                    </div>

                    {/* Primary Call to Action */}
                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                            to={`/register/student`}
                            className="editorial-button text-xs font-extrabold"
                        >
                            Request Cohort Placement →
                        </Link>
                        <Link
                            to="/how-it-works"
                            className="editorial-button-secondary text-xs font-bold"
                        >
                            How Placement Works
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content Sections */}
            <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6 lg:px-8 space-y-12">
                {/* Learning Objectives */}
                {course.learningObjectives && course.learningObjectives.length > 0 && (
                    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
                        <h2 className="editorial-display text-2xl font-bold text-stone-900">
                            What You Will Master in This Course
                        </h2>
                        <p className="mt-1 text-xs text-stone-500">
                            Key skills and verifiable learning outcomes developed through guided live lessons and assignments.
                        </p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            {course.learningObjectives.map((obj, i) => (
                                <div key={i} className="flex items-start gap-3 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/60">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white">
                                        ✓
                                    </span>
                                    <span className="text-xs font-semibold text-stone-800 leading-relaxed">
                                        {obj}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Course Syllabus / Curriculum Accordion */}
                <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="editorial-display text-2xl font-bold text-stone-900">
                                Structured Course Syllabus
                            </h2>
                            <p className="mt-1 text-xs text-stone-500">
                                Guided module-by-module learning path with lessons, live discussions, and assessments.
                            </p>
                        </div>
                        <span className="rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-700">
                            {modules.length} Modules Total
                        </span>
                    </div>

                    <div className="space-y-4">
                        {modules.map((mod, index) => {
                            const isOpen = activeModuleIndex === index;
                            return (
                                <div
                                    key={index}
                                    className="overflow-hidden rounded-2xl border border-stone-200 transition"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setActiveModuleIndex(isOpen ? -1 : index)}
                                        className="flex w-full items-center justify-between bg-stone-50 px-6 py-4 text-left font-bold text-stone-900 hover:bg-stone-100"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-900 text-xs font-black text-white">
                                                {index + 1}
                                            </span>
                                            <div>
                                                <div className="text-sm">{mod.title}</div>
                                                <div className="text-[11px] font-normal text-stone-500">
                                                    {mod.description}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-stone-400 font-mono">
                                            {isOpen ? "▲" : "▼"}
                                        </span>
                                    </button>

                                    {isOpen && mod.lessons && (
                                        <div className="divide-y divide-stone-100 bg-white px-6 py-3">
                                            {mod.lessons.map((lesson, lIdx) => (
                                                <div key={lIdx} className="flex items-center justify-between py-3 text-xs">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-stone-400">📖</span>
                                                        <span className="font-semibold text-stone-800">{lesson.title}</span>
                                                    </div>
                                                    <span className="font-mono text-stone-400">
                                                        {lesson.durationMinutes} min
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Enrollment & Placement Notice */}
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                                HOW ENROLLMENT WORKS
                            </span>
                            <h3 className="mt-1 text-xl font-black text-emerald-950">
                                Want to join this course?
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-emerald-900/80 max-w-2xl">
                                To ensure high learning quality and personal teacher guidance, students register their interest and schedule preferences.
                                The LearnHUB administrator assigns you to an active cohort with an expert instructor.
                            </p>
                        </div>
                        <Link
                            to="/register/student"
                            className="rounded-2xl bg-emerald-800 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-950/20 hover:bg-emerald-900 whitespace-nowrap"
                        >
                            Register as Student
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
