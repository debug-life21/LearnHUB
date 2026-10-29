import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { SectionHeading, EmptyState } from "../components/UIComponents";
export function FAQPage() {
    const { t } = useTranslation();
    const [faqs, setFaqs] = useState([]);
    const [query, setQuery] = useState("");
    const [openId, setOpenId] = useState(null);
    const [status, setStatus] = useState("loading");
    const [retryCount, setRetryCount] = useState(0);
    useEffect(() => {
        let isActive = true;
        apiRequest("/api/public/faqs")
        .then((res) => {
            if (!Array.isArray(res?.faqs) || !res.faqs.every((faq) =>
                faq &&
                typeof faq._id === "string" &&
                typeof faq.question === "string" &&
                typeof faq.answer === "string")) {
                throw new Error("FAQ response did not contain a valid list.");
            }
            if (!isActive) return;
            setFaqs(res.faqs);
            if (res.faqs.length > 0) {
                setOpenId(res.faqs[0]._id);
            }
            setStatus("success");
        })
        .catch((err) => {
            console.error("Failed to load FAQs:", err);
            if (isActive) setStatus("error");
        });
        return () => {
        isActive = false;
        };
    }, [retryCount]);
    const filtered = faqs.filter((f) => f.question.toLowerCase().includes(query.toLowerCase()) ||
        f.answer.toLowerCase().includes(query.toLowerCase()));
    return (<div className="editorial-page mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <SectionHeading badge="HELP CENTER" title="Good questions. Clear answers." subtitle="Find out how TedbabeLearnHUB (TLH) works for learners and instructors, from getting started to joining your first live session." centered/>

      {/* Search Input */}
      <div className="relative">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("faqSearchPlaceholder")} aria-label={t("faqSearchPlaceholder")} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pl-12 text-sm font-semibold shadow-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"/>
        <span aria-hidden="true" className="absolute left-4 top-4 text-slate-400 text-lg">🔍</span>
      </div>

      {/* Accordion FAQ list */}
      {status === "loading" ? (
        <p role="status" className="py-12 text-center text-sm font-semibold text-slate-600">{t("faqLoading")}</p>
      ) : status === "error" ? (
        <div role="alert" className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-sm font-semibold text-rose-800">{t("faqLoadError")}</p>
          <button type="button" onClick={() => {
              setStatus("loading");
              setRetryCount((count) => count + 1);
          }} className="mt-4 rounded-2xl bg-rose-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-800">
            {t("faqRetry")}
          </button>
        </div>
      ) : (
        <div className="space-y-4" aria-live="polite">
          {filtered.length === 0 ? (<EmptyState title={t("faqNotFoundTitle")} description={t("faqNotFoundDesc")}/>) : (filtered.map((item) => {
              const isOpen = openId === item._id;
              const answerId = `faq-answer-${item._id}`;
              return (<div key={item._id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/90 transition-all hover:shadow-md">
                  <button type="button" id={`faq-question-${item._id}`} aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpenId(isOpen ? null : item._id)} className="flex w-full items-center justify-between p-6 text-left text-base font-bold text-slate-900 hover:text-blue-600 transition-colors">
                    <span className="pr-4">{item.question}</span>
                    <span aria-hidden="true" className={`h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 font-bold transition-transform ${isOpen ? "rotate-180 bg-blue-50 text-blue-600" : ""}`}>
                      ▾
                    </span>
                  </button>
                  <div id={answerId} role="region" aria-labelledby={`faq-question-${item._id}`} hidden={!isOpen} className="border-t border-slate-100 px-6 pb-6 pt-4 text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                    {item.answer}
                  </div>
                </div>);
          }))}
        </div>
      )}

      {/* Support Box */}
      <div className="rounded-3xl border border-sky-500/25 bg-gradient-to-br from-[#0c234b] via-[#091b3b] to-[#061124] p-8 text-center text-white shadow-xl ring-1 ring-white/10">
        <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300">
          NEED A HAND?
        </span>
        <h4 className="mt-3 text-xl font-black text-white">{t("faqNeedHelp")}</h4>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          From choosing a learning path to finding your way around your account, our team is ready to help.
        </p>
        <Link to="/contact" className="mt-5 inline-block rounded-2xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/25 hover:from-[#0052cc] hover:to-[#0088e6] transition-all hover:-translate-y-0.5">
          {t("faqContactTeam")} →
        </Link>
      </div>
    </div>);
}
