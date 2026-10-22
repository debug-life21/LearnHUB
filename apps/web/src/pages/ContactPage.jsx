import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { SectionHeading } from "../components/UIComponents";
export function ContactPage() {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        subject: "",
        message: "",
    });
    const [status, setStatus] = useState("idle");
    const [feedback, setFeedback] = useState("");
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("submitting");
        setFeedback("");
        try {
            const res = await apiRequest("/api/public/contact", {
                method: "POST",
                body: JSON.stringify(form),
            });
            setStatus("success");
            setFeedback(res.message);
            setForm({ fullName: "", email: "", subject: "", message: "" });
        }
        catch (err) {
            setStatus("error");
            setFeedback(err.message || "Failed to submit message. Please try again.");
        }
    };
    return (<div className="editorial-page mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <SectionHeading badge="WE’RE LISTENING" title={t("contactTitle")} subtitle={t("contactDescription")}/>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Contact Form */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-sm ring-1 ring-slate-200/90">
          <form onSubmit={handleSubmit} className="space-y-5">
            {status === "success" ? (<div className="rounded-2xl bg-emerald-50 p-4 text-xs sm:text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 flex items-center gap-2">
                <span>✓</span>
                <span>{feedback}</span>
              </div>) : null}

            {status === "error" ? (<div className="rounded-2xl bg-rose-50 p-4 text-xs sm:text-sm font-semibold text-rose-800 ring-1 ring-rose-200 flex items-center gap-2">
                <span>⚠</span>
                <span>{feedback}</span>
              </div>) : null}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("fullName")}</label>
              <input required type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="e.g. Samuel Haile"/>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("email")}</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="samuel@example.com"/>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("subject")}</label>
              <input required type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="How can we help?"/>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("message")}</label>
              <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="Tell us a little about what you need…"/>
            </div>

            <button disabled={status === "submitting"} type="submit" className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-101">
              {status === "submitting" ? t("loading") : t("submit")}
            </button>
          </form>
        </div>

        {/* Contact Info & Office Card */}
        <div className="space-y-8">
          <div className="rounded-3xl bg-[#25362d] p-8 sm:p-10 text-white shadow-xl ring-1 ring-white/10">
            <span className="rounded-full bg-[#e7d5ad]/15 px-3 py-1 text-xs font-bold text-[#e7d5ad] border border-[#e7d5ad]/30">
              OFFICIAL SUPPORT
            </span>
            <h3 className="mt-4 text-2xl font-black">{t("supportCenter")}</h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed font-normal">
              {t("supportCenterDesc")}
            </p>

            <div className="mt-8 space-y-5 text-sm">
              <div className="flex items-center gap-3.5 text-slate-200">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 text-lg">
                  ✉️
                </span>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">                  Email our team</p>
                  <p className="font-semibold text-white">support@learnhub.et</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-slate-200">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 text-lg">
                  📍
                </span>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Headquarters</p>
                  <p className="font-semibold text-white">{t("addisAbabaEthiopia")}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-slate-200">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 text-lg">
                  ⏰
                </span>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Support hours</p>
                  <p className="font-semibold text-white">{t("businessHours")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
