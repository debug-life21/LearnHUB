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
    useEffect(() => {
        apiRequest("/api/public/faqs")
            .then((res) => {
            setFaqs(res.faqs);
            if (res.faqs.length > 0) {
                setOpenId(res.faqs[0]._id);
            }
        })
            .catch((err) => console.error(err));
    }, []);
    const filtered = faqs.filter((f) => f.question.toLowerCase().includes(query.toLowerCase()) ||
        f.answer.toLowerCase().includes(query.toLowerCase()));
    return (<div className="editorial-page mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <SectionHeading badge="HELP CENTER" title="Good questions. Clear answers." subtitle="Find out how LearnHUB works for learners and instructors, from getting started to joining your first live session." centered/>

      {/* Search Input */}
      <div className="relative">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("faqSearchPlaceholder")} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pl-12 text-sm font-semibold shadow-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"/>
        <span className="absolute left-4 top-4 text-slate-400 text-lg">🔍</span>
      </div>

      {/* Accordion FAQ list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (<EmptyState title={t("faqNotFoundTitle")} description={t("faqNotFoundDesc")}/>) : (filtered.map((item) => {
            const isOpen = openId === item._id;
            return (<div key={item._id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/90 transition-all hover:shadow-md">
                <button type="button" onClick={() => setOpenId(isOpen ? null : item._id)} className="flex w-full items-center justify-between p-6 text-left text-base font-bold text-slate-900 hover:text-blue-600 transition-colors">
                  <span className="pr-4">{item.question}</span>
                  <span className={`h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 font-bold transition-transform ${isOpen ? "rotate-180 bg-blue-50 text-blue-600" : ""}`}>
                    ▾
                  </span>
                </button>
                {isOpen ? (<div className="border-t border-slate-100 px-6 pb-6 pt-4 text-sm text-slate-600 leading-relaxed bg-slate-50/50">
                    {item.answer}
                  </div>) : null}
              </div>);
        }))}
      </div>

      {/* Support Box */}
      <div className="rounded-3xl border border-[#ded9ce] bg-gradient-to-r from-[#eeece3] to-[#e7eddf] p-8 text-center text-stone-950 shadow-xs">
        <h4 className="text-lg font-black">{t("faqNeedHelp")}</h4>
        <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          From choosing a learning path to finding your way around your account, our team is ready to help.
        </p>
        <Link to="/contact" className="mt-5 inline-block rounded-2xl bg-emerald-800 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-900 transition-colors shadow-md">
          {t("faqContactTeam")}
        </Link>
      </div>
    </div>);
}
