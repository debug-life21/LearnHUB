import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { SectionHeading, EmptyState } from "../components/UIComponents";

type Category = {
  _id: string;
  name: string;
  description: string;
  slug: string;
};

type Course = {
  _id: string;
  title: string;
  description: string;
  skillLevel: string;
  learningObjectives: string[];
  category?: { _id: string; name: string };
};

export function ExplorePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCat = searchParams.get("selected") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    Promise.all([
      apiRequest<{ categories: Category[] }>("/api/public/categories"),
      apiRequest<{ featuredCourses: Course[] }>("/api/public/home"),
    ])
      .then(([catsRes, homeRes]) => {
        setCategories(catsRes.categories);
        setCourses(homeRes.featuredCourses);
      })
      .catch((err) => console.error(err));
  }, []);

  const filteredCourses = selectedCat
    ? courses.filter((c) => c.category?._id === selectedCat)
    : courses;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      <div>
        <SectionHeading
          title={t("categoriesTitle")}
          subtitle={t("categoriesSubtitle")}
        />

        {/* Category Pills Filter */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setSearchParams({})}
            type="button"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
              !selectedCat
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            ሁሉም / All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSearchParams({ selected: cat._id })}
              type="button"
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                selectedCat === cat._id
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900">
          የተዘጋጁ ኮርሶች ({filteredCourses.length})
        </h3>

        {filteredCourses.length === 0 ? (
          <EmptyState
            title="በዚህ ምድብ እስካሁን ኮርስ አልተጨመረም"
            description="በቅርቡ አዳዲስ ኮርሶች ይጨመራሉ፤ እባክዎ ሌሎች ምድቦችን ይመልከቱ።"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <div
                key={course._id}
                className="flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {course.category?.name ?? "General"}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {course.skillLevel || "All Levels"}
                    </span>
                  </div>
                  <h4 className="mt-3 text-lg font-bold text-slate-900">{course.title}</h4>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {course.description}
                  </p>

                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                    <p className="text-xs font-bold text-slate-700">ምን ይማራሉ / Objectives:</p>
                    {course.learningObjectives?.slice(0, 3).map((obj, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                        <span className="text-emerald-500">✓</span>
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <Link
                    to={`/register/student`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                  >
                    ተመዝገብ እና ምደባ ጠይቅ / Register
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
