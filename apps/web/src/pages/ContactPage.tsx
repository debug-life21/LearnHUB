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
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setFeedback("");

    try {
      const res = await apiRequest<{ message: string }>("/api/public/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setStatus("success");
      setFeedback(res.message);
      setForm({ fullName: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setStatus("error");
      setFeedback(err.message || "መልዕክት መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        title={t("contactTitle")}
        subtitle={t("contactDescription")}
      />

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Contact Form */}
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {status === "success" ? (
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
                ✓ {feedback}
              </div>
            ) : null}

            {status === "error" ? (
              <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-800 ring-1 ring-rose-200">
                ⚠ {feedback}
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold text-slate-700">{t("fullName")}</label>
              <input
                required
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                placeholder="ለምሳሌ፡ አበበ ከበደ"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">{t("email")}</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                placeholder="abebe@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">{t("subject")}</label>
              <input
                required
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                placeholder="የትምህርት መረጃ ጥያቄ"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">{t("message")}</label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                placeholder="መልዕክትዎን እዚህ ይጻፉ..."
              />
            </div>

            <button
              disabled={status === "submitting"}
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {status === "submitting" ? t("loading") : t("submit")}
            </button>
          </form>
        </div>

        {/* Contact Info & Office */}
        <div className="space-y-8">
          <div className="rounded-3xl bg-slate-900 p-8 text-white">
            <h3 className="text-xl font-bold">የቀጥታ ድጋፍ ማዕከል</h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              ስለ ምዝገባ፣ ክፍለ ጊዜዎች እና የአስተማሪነት ማመልከቻ ማንኛውንም ጥያቄ በኢሜይል ወይም በቅጹ በኩል መላክ ይችላሉ።
            </p>

            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-center gap-3 text-slate-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-cyan-400">
                  ✉️
                </span>
                <span>support@learnhub.et</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-cyan-400">
                  📍
                </span>
                <span>Addis Ababa, Ethiopia</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-cyan-400">
                  ⏰
                </span>
                <span>ሰኞ - ቅዳሜ / Mon - Sat (8:30 AM - 6:00 PM EAT)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
