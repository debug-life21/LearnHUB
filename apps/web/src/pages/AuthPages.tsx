import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-cyan-400">
            LH
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SignInPage() {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refreshUser();
      navigate("/dashboard");
    } catch (err: any) {
      setFeedback(err.message || "መግባት አልተቻለም።");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("LearnHub2026!");
  };

  return (
    <AuthShell title={t("signIn")} subtitle="ወደ LearnHUB መለያዎ ይግቡ">
      {feedback ? (
        <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
          {feedback}
        </div>
      ) : null}

      {/* Quick Demo Logins Bar */}
      <div className="mb-6 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
        <p className="text-[11px] font-bold text-slate-600 mb-2">{t("quickDemoLogin")}</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => quickLogin("admin@learnhub.et")}
            className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-100 shadow-2xs"
          >
            🛡️ {t("adminDemo")}
          </button>
          <button
            type="button"
            onClick={() => quickLogin("teacher@learnhub.et")}
            className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-100 shadow-2xs"
          >
            👨‍🏫 {t("teacherDemo")}
          </button>
          <button
            type="button"
            onClick={() => quickLogin("student@learnhub.et")}
            className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-100 shadow-2xs"
          >
            🎓 {t("studentDemo")}
          </button>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700">{t("email")}</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("password")}</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="••••••••"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t("loading") : t("signIn")}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
        <Link to="/register/student" className="font-semibold text-blue-600 hover:underline">
          አዲስ ተማሪ ነዎት? {t("studentSignUp")}
        </Link>
        <Link to="/apply/teacher" className="font-semibold text-teal-600 hover:underline">
          አስተማሪ መሆን ይፈልጋሉ? {t("teacherApply")}
        </Link>
      </div>
    </AuthShell>
  );
}

export function StudentRegistrationPage() {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    learningGoals: "",
    learningInterests: "Web Development",
    currentSkillLevel: "Beginner",
    preferredSchedule: "Evening",
    languagePreference: "am",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      await apiRequest("/api/auth/register/student", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          learningGoals: form.learningGoals,
          learningInterests: [form.learningInterests],
          currentSkillLevel: form.currentSkillLevel,
          preferredSchedule: form.preferredSchedule,
          languagePreference: form.languagePreference,
        }),
      });
      await refreshUser();
      navigate("/dashboard");
    } catch (err: any) {
      setFeedback(err.message || "ምዝገባው አልተሳካም።");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t("studentSignUp")} subtitle="ይመዝገቡ፤ መረጃዎ ተመርምሮ ተገቢው ክፍል ይመደብልዎታል">
      {feedback ? (
        <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
          {feedback}
        </div>
      ) : null}

      <div className="mb-4 rounded-xl bg-blue-50/70 p-3 text-xs text-blue-900 leading-relaxed border border-blue-200">
        💡 <strong>ማስታወሻ፡</strong> ምዝገባ ሲያጠናቅቁ የHub Admin ቡድን ፍላጎትዎን መርምሮ ወደሚስማማው ክፍል ይመድብዎታል።
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700">{t("fullName")}</label>
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="ዮናስ ኃይሌ"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("email")}</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="yonas@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("password")}</label>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="ቢያንስ 8 ፊደላት"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("learningInterests")}</label>
            <select
              value={form.learningInterests}
              onChange={(e) => setForm({ ...form, learningInterests: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none bg-white"
            >
              <option value="Web Development">Web Development</option>
              <option value="Programming">Programming</option>
              <option value="Languages">Languages</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Business Skills">Business Skills</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">{t("skillLevel")}</label>
            <select
              value={form.currentSkillLevel}
              onChange={(e) => setForm({ ...form, currentSkillLevel: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none bg-white"
            >
              <option value="Beginner">ጀማሪ (Beginner)</option>
              <option value="Intermediate">መካከለኛ (Intermediate)</option>
              <option value="Advanced">ከፍተኛ (Advanced)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("preferredSchedule")}</label>
          <input
            type="text"
            value={form.preferredSchedule}
            onChange={(e) => setForm({ ...form, preferredSchedule: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="ለምሳሌ፡ ምሽት ከ12:00 በኋላ / Evenings"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("learningGoals")}</label>
          <textarea
            rows={2}
            value={form.learningGoals}
            onChange={(e) => setForm({ ...form, learningGoals: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="ምን መማር ይፈልጋሉ?"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t("loading") : t("studentSignUp")}
        </button>
      </form>
    </AuthShell>
  );
}

export function TeacherApplicationPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    qualifications: "",
    experience: "",
    teachingCategories: "Web Development",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      await apiRequest("/api/auth/apply/teacher", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          qualifications: form.qualifications,
          experience: form.experience,
          teachingCategories: [form.teachingCategories],
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setFeedback(err.message || "ማመልከቻው አልተሳካም።");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell title="ማመልከቻዎ ደርሶናል" subtitle="የአስተማሪነት ማመልከቻ በስኬት ተልኳል">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
            ✓
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            ማመልከቻዎ በHub Admin እየተገመገመ ነው። ማመልከቻው ፀድቆ አካውንትዎ ሲነቃ በኢሜይል እና በመለያዎ መግባት ይችላሉ።
          </p>
          <div className="pt-4">
            <Link
              to="/sign-in"
              className="inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white"
            >
              ወደ መግቢያ ገጽ ተመለስ
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("teacherApply")} subtitle="የትምህርት እና ልምድ መረጃዎን ሞልተው ያመልክቱ">
      {feedback ? (
        <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
          {feedback}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700">{t("fullName")}</label>
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="አልማዝ ከበደ"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("email")}</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="almaz@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("password")}</label>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="ቢያንስ 8 ፊደላት"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("teachingCategories")}</label>
          <select
            value={form.teachingCategories}
            onChange={(e) => setForm({ ...form, teachingCategories: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none bg-white"
          >
            <option value="Web Development">Web Development</option>
            <option value="Programming">Programming</option>
            <option value="Languages">Languages</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Digital Marketing">Digital Marketing</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("qualifications")}</label>
          <textarea
            required
            rows={2}
            value={form.qualifications}
            onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="የትምህርት ደረጃ እና ማስረጃ (ለምሳሌ፡ M.Sc. in Computer Science)"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("experience")}</label>
          <textarea
            required
            rows={2}
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="የማስተማር እና የሙያ ልምድ ማብራሪያ"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {loading ? t("loading") : t("teacherApply")}
        </button>
      </form>
    </AuthShell>
  );
}

export function AdminSetupPage() {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    setupKey: "learnhub-setup-key",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      await apiRequest("/api/auth/provision-admin", {
        method: "POST",
        body: JSON.stringify(form),
      });
      await refreshUser();
      navigate("/dashboard");
    } catch (err: any) {
      setFeedback(err.message || "የአስተዳዳሪ ማዋቀር አልተሳካም።");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t("adminSetup")} subtitle="የመጀመሪያውን የHub Admin አካውንት ማዋቀር">
      {feedback ? (
        <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
          {feedback}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700">{t("fullName")}</label>
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="Hub Admin"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("email")}</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="admin@learnhub.et"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("password")}</label>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700">{t("setupKey")}</label>
          <input
            required
            type="text"
            value={form.setupKey}
            onChange={(e) => setForm({ ...form, setupKey: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {loading ? t("loading") : "አስተዳዳሪ አዋቅር / Provision Admin"}
        </button>
      </form>
    </AuthShell>
  );
}
