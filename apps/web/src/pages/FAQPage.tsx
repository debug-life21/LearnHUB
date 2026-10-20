import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { SectionHeading, EmptyState } from "../components/UIComponents";

type FAQ = {
  _id: string;
  question: string;
  answer: string;
};

export function FAQPage() {
  const { t } = useTranslation();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ faqs: FAQ[] }>("/api/public/faqs")
      .then((res) => setFaqs(res.faqs))
      .catch((err) => console.error(err));
  }, []);

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.answer.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
      <SectionHeading
        title="ተደጋግመው የሚጠየቁ ጥያቄዎች (FAQ)"
        subtitle="ስለ ምዝገባ፣ ክፍሎች፣ አስተማሪዎች እና የቀጥታ ትምህርት በተደጋጋሚ ለሚነሱ ጥያቄዎች የተዘጋጀ ምላሽ"
        centered
      />

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ጥያቄዎን ይፈልጉ... / Search questions..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 pl-12 text-sm shadow-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />
        <span className="absolute left-4 top-3.5 text-slate-400 text-lg">🔍</span>
      </div>

      {/* Accordion FAQ list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <EmptyState
            title="የተገኘ ጥያቄ የለም"
            description="እባክዎ ሌላ ቃል ፈልገው ይሞክሩ ወይም በቀጥታ አግኙን በሚለው ገጽ ያነጋግሩን።"
          />
        ) : (
          filtered.map((item) => {
            const isOpen = openId === item._id;
            return (
              <div
                key={item._id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item._id)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  <span>{item.question}</span>
                  <span className="ml-4 text-slate-400 font-extrabold">{isOpen ? "▲" : "▼"}</span>
                </button>
                {isOpen ? (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                    {item.answer}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Support Box */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 text-center text-blue-950">
        <h4 className="font-bold">የሚፈልጉትን ጥያቄ አላገኙም?</h4>
        <p className="mt-1 text-xs text-blue-800">
          ቡድናችን ዝግጁ ነው። በቀጥታ መልዕክት በመላክ ፈጣን ምላሽ ያግኙ።
        </p>
        <Link
          to="/contact"
          className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
        >
          {t("contactTitle")}
        </Link>
      </div>
    </div>
  );
}
