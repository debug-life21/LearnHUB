import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { Badge, EmptyState } from "../components/UIComponents";

export function InstructorsPage() {
    const { t } = useTranslation();
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        apiRequest("/api/public/instructors")
            .then((res) => setInstructors(res.instructors || []))
            .catch((err) => setError(err.message || "Failed to load educators."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="editorial-page min-h-screen pb-24">
            {/* Header Hero */}
            <div className="editorial-hero border-b border-stone-200/80 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-5xl text-center">
                    <span className="editorial-kicker text-emerald-800">
                        ACADEMIC FACULTY & MENTORS
                    </span>
                    <h1 className="editorial-display mt-3 text-4xl font-extrabold text-stone-900 sm:text-5xl">
                        Learn from Verified Educators
                    </h1>
                    <p className="mx-auto mt-4 max-w-3xl text-base text-stone-600 sm:text-lg leading-relaxed">
                        Every LearnHUB educator is vetted by our academic administration. Our teachers combine subject-matter depth with empathetic, interactive live guidance.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Link to="/courses" className="editorial-button text-xs font-black">
                            Explore Courses →
                        </Link>
                        <Link to="/apply/teacher" className="editorial-button-secondary text-xs font-bold">
                            Join Our Teaching Team
                        </Link>
                    </div>
                </div>
            </div>

            {/* Instructors Grid */}
            <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="animate-pulse rounded-3xl bg-white p-7 ring-1 ring-stone-200">
                                <div className="h-16 w-16 rounded-2xl bg-stone-200 mb-4"></div>
                                <div className="h-5 w-3/4 rounded bg-stone-200 mb-2"></div>
                                <div className="h-12 w-full rounded bg-stone-100"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-3xl bg-rose-50 p-8 text-center ring-1 ring-rose-200">
                        <p className="font-bold text-rose-700">{error}</p>
                    </div>
                ) : instructors.length === 0 ? (
                    <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-stone-200">
                        <span className="text-4xl mb-3 block">👩‍🏫</span>
                        <h3 className="editorial-display text-xl font-bold text-stone-900">
                            Our Educator Network is Expanding
                        </h3>
                        <p className="mt-2 text-xs text-stone-500 max-w-md mx-auto">
                            We are actively reviewing teacher applications across multiple languages and academic disciplines.
                        </p>
                        <Link to="/apply/teacher" className="editorial-button mt-6 text-xs">
                            Apply to Become an Instructor →
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {instructors.map((instructor) => (
                            <div
                                key={instructor.id}
                                className="flex flex-col justify-between rounded-3xl bg-white p-7 shadow-sm ring-1 ring-stone-200/80 transition hover:shadow-lg"
                            >
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-lg font-black text-emerald-200 shadow-md">
                                            {instructor.name ? instructor.name.slice(0, 2).toUpperCase() : "LH"}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-stone-900">{instructor.name}</h3>
                                                <span className="text-emerald-700 font-bold text-xs" title="Verified Instructor">✓</span>
                                            </div>
                                            <p className="text-xs text-stone-500">{instructor.qualifications}</p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                                        {instructor.bio}
                                    </p>

                                    {instructor.expertise && instructor.expertise.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {instructor.expertise.map((exp, eIdx) => (
                                                <span
                                                    key={eIdx}
                                                    className="rounded-lg bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700"
                                                >
                                                    {exp}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-emerald-800">
                                        Verified Teacher
                                    </span>
                                    <Link
                                        to="/register/student"
                                        className="text-xs font-bold text-stone-900 hover:text-emerald-800"
                                    >
                                        Learn in Cohort →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
