function groupCoursesByCategory(courses) {
    const groups = new Map();
    courses.forEach((course) => {
        const categoryName = course.category?.name || "Other courses";
        if (!groups.has(categoryName)) groups.set(categoryName, []);
        groups.get(categoryName).push(course);
    });
    return [...groups.entries()].sort(([first], [second]) => {
        const firstIsMarketing = first.toLowerCase().includes("digital marketing");
        const secondIsMarketing = second.toLowerCase().includes("digital marketing");
        if (firstIsMarketing !== secondIsMarketing) return firstIsMarketing ? -1 : 1;
        return first.localeCompare(second);
    });
}

export function CategoryCoursePicker({ courses, selectedCourseIds, onChange }) {
    const groups = groupCoursesByCategory(courses);
    const selectedIds = new Set(selectedCourseIds);

    function toggleCourse(courseId) {
        onChange(
            selectedIds.has(courseId)
                ? selectedCourseIds.filter((selectedId) => selectedId !== courseId)
                : [...selectedCourseIds, courseId],
        );
    }

    if (!courses.length) {
        return <p className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Course categories are loading or currently unavailable. Please try again shortly.</p>;
    }

    return (
        <div className="mt-1.5 space-y-2">
            {groups.map(([categoryName, categoryCourses], index) => {
                const categorySelectedCount = categoryCourses.filter((course) => selectedIds.has(course._id)).length;
                const displayName = categoryName.toLowerCase().includes("digital marketing")
                    ? `Digital Marketing · ${categoryName}`
                    : categoryName;
                return (
                    <details key={categoryName} open={index === 0} className="rounded-xl border border-slate-200 bg-white">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-bold text-slate-800">
                            <span>{displayName}</span>
                            <span className="text-xs font-medium text-slate-500">
                                {categorySelectedCount ? `${categorySelectedCount} selected · ` : ""}{categoryCourses.length} courses
                            </span>
                        </summary>
                        <div className="grid gap-2 border-t border-slate-100 p-3 sm:grid-cols-2">
                            {categoryCourses.map((course) => (
                                <label key={course._id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-xs hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(course._id)}
                                        onChange={() => toggleCourse(course._id)}
                                        className="mt-0.5 accent-emerald-700"
                                    />
                                    <span>
                                        <span className="block font-semibold text-slate-800">{course.title}</span>
                                        <span className="mt-0.5 block text-slate-500">{course.skillLevel || "All levels"}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </details>
                );
            })}
        </div>
    );
}
