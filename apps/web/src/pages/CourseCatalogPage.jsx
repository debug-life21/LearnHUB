import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { EmptyState } from "../components/UIComponents";

export function CourseCatalogPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const initialSearch = searchParams.get("search") || "";
    const initialCategory = searchParams.get("category") || "";
    const initialLevel = searchParams.get("level") || "all";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedLevel, setSelectedLevel] = useState(initialLevel);

    // Fetch categories once
    useEffect(() => {
        apiRequest("/api/public/categories")
            .then((res) => setCategories(res.categories || []))
            .catch(() => {});
    }, []);

    // Fetch courses on filter/page change
    useEffect(() => {
        setLoading(true);
        setError("");
        const query = new URLSearchParams();
        if (searchTerm) query.set("search", searchTerm);
        if (selectedCategory) query.set("category", selectedCategory);
        if (selectedLevel && selectedLevel !== "all") query.set("skillLevel", selectedLevel);
        query.set("page", String(currentPage));
        query.set("limit", "12");

        apiRequest(`/api/public/courses?${query.toString()}`)
            .then((res) => {
                setCourses(res.courses || []);
                setPagination(res.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
            })
            .catch((err) => {
                setError(err.message || "Could not load courses.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [searchTerm, selectedCategory, selectedLevel, currentPage]);

    const handleCategoryClick = (catId) => {
        const next = selectedCategory === catId ? "" : catId;
        setSelectedCategory(next);
        const params = new URLSearchParams(searchParams);
        if (next) params.set("category", next);
        else params.delete("category");
        params.set("page", "1");
        setSearchParams(params);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchTerm) params.set("search", searchTerm);
        else params.delete("search");
        params.set("page", "1");
        setSearchParams(params);
    };

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(newPage));
        setSearchParams(params);
        window.scrollTo({ top: 200, behavior: "smooth" });
    };

    return (
        <div className="editorial-page min-h-screen pb-24">
            {/* Catalog Hero Banner */}
            <div className="editorial-hero border-b border-stone-200/80 px-4 py-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <span className="editorial-kicker text-emerald-800">
                        UNIVERSAL LEARNING DIRECTORY
                    </span>
                    <h1 className="editorial-display mt-3 text-4xl text-stone-900 sm:text-5xl">
                        Comprehensive Course Catalog
                    </h1>
                    <p className="mt-3 max-w-3xl text-base text-stone-600 sm:text-lg">
                        Explore verified courses across Languages, Primary & Secondary School curriculum (Grades 1–12),
                        University foundations, Programming, Web Development, and Professional Careers.
                    </p>

                    {/* Search & Filter Bar */}
                    <div className="mt-8 max-w-2xl">
                        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search courses by subject, skill, or keyword…"
                                className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-3.5 pr-28 text-sm font-medium text-stone-900 shadow-sm outline-none transition focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-emerald-900"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Skill Level Filter Pills */}
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-stone-500 mr-2">Level:</span>
                        {["all", "Beginner", "Intermediate", "Grade-level", "All levels"].map((lvl) => (
                            <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                    setSelectedLevel(lvl);
                                    const params = new URLSearchParams(searchParams);
                                    if (lvl !== "all") params.set("level", lvl);
                                    else params.delete("level");
                                    params.set("page", "1");
                                    setSearchParams(params);
                                }}
                                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                                    selectedLevel === lvl
                                        ? "bg-stone-900 text-white shadow-sm"
                                        : "bg-white/80 text-stone-700 ring-1 ring-stone-200 hover:bg-white"
                                }`}
                            >
                                {lvl === "all" ? "All Levels" : lvl}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
                {/* Category Quick Selector */}
                {categories.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between pb-3">
                            <h2 className="text-xs font-black uppercase tracking-wider text-stone-500">
                                Filter by Category ({categories.length})
                            </h2>
                            {selectedCategory && (
                                <button
                                    onClick={() => handleCategoryClick("")}
                                    className="text-xs font-bold text-emerald-800 hover:underline"
                                >
                                    Clear category filter ✕
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => {
                                const isSelected = selectedCategory === cat._id;
                                return (
                                    <button
                                        key={cat._id}
                                        type="button"
                                        onClick={() => handleCategoryClick(cat._id)}
                                        className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                                            isSelected
                                                ? "bg-emerald-800 text-white shadow-md shadow-emerald-950/20"
                                                : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Course Listing Header */}
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-600">
                        Showing <strong className="text-stone-900">{courses.length}</strong> of{" "}
                        <strong className="text-stone-900">{pagination.total}</strong> courses
                    </p>
                </div>

                {/* Course Grid */}
                {loading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="animate-pulse rounded-3xl bg-white p-6 ring-1 ring-stone-200">
                                <div className="h-4 w-24 rounded bg-stone-200 mb-4"></div>
                                <div className="h-6 w-3/4 rounded bg-stone-200 mb-3"></div>
                                <div className="h-16 w-full rounded bg-stone-100 mb-4"></div>
                                <div className="h-4 w-1/2 rounded bg-stone-200"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-3xl bg-rose-50 p-8 text-center ring-1 ring-rose-200">
                        <p className="font-bold text-rose-700">{error}</p>
                    </div>
                ) : courses.length === 0 ? (
                    <EmptyState
                        title="No courses found"
                        description="Try adjusting your search keywords, category filters, or skill level."
                        action={
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedCategory("");
                                    setSelectedLevel("all");
                                    setSearchParams(new URLSearchParams());
                                }}
                                className="editorial-button text-xs"
                            >
                                Reset All Filters
                            </button>
                        }
                    />
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <div
                                key={course._id}
                                className="group flex flex-col justify-between rounded-3xl bg-white p-7 shadow-sm ring-1 ring-stone-200/80 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:ring-emerald-600/30"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                                            {course.category?.name || "Subject"}
                                        </span>
                                        <span className="text-[11px] font-semibold text-stone-500">
                                            {course.skillLevel || "All levels"}
                                        </span>
                                    </div>
                                    <h3 className="editorial-display text-xl font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="mt-2.5 text-xs text-stone-600 leading-relaxed line-clamp-3">
                                        {course.description}
                                    </p>

                                    {/* Objectives Snippet */}
                                    {course.learningObjectives?.length > 0 && (
                                        <div className="mt-4 border-t border-stone-100 pt-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                                                Key Outcomes:
                                            </p>
                                            <ul className="space-y-1 text-xs text-stone-600">
                                                {course.learningObjectives.slice(0, 2).map((obj, idx) => (
                                                    <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                                                        <span className="text-emerald-700">✓</span>
                                                        <span>{obj}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
                                    <span className="text-[11px] font-semibold text-stone-500">
                                        {course.estimatedDuration || "8 weeks · Cohort"}
                                    </span>
                                    <Link
                                        to={`/courses/${course.slug || course._id}`}
                                        className="rounded-xl bg-stone-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-800"
                                    >
                                        View Syllabus →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            disabled={pagination.page <= 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 disabled:opacity-40"
                        >
                            ← Previous
                        </button>
                        <span className="px-3 text-xs font-semibold text-stone-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 disabled:opacity-40"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
