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
      <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-xl ring-1 ring-slate-200/90">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 text-lg font-black text-cyan-300 shadow-md shadow-blue-500/20 ring-1 ring-white/20">
            LH
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">{subtitle}</p>
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
      setFeedback(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("LearnHub2026!");
  };

  return (
    <AuthShell
      title={t("signIn")}
      subtitle="Access your LearnHUB learning and management portal"
    >
      {feedback ? (
        <div className="mb-5 rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 flex items-center gap-2">
          <span>⚠</span>
          <span>{feedback}</span>
        </div>
      ) : null}

      {/* Quick Demo Logins Bar */}
      <div className="mb-6 rounded-2xl bg-slate-50 p-4 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">
            {t("quickDemoLogin")}
          </p>
          <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200/60">
            Pre-seeded Accounts
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => quickLogin("admin@learnhub.et")}
            className="rounded-xl bg-white border border-slate-200/90 px-2.5 py-2 text-[11px] font-bold text-slate-800 hover:bg-slate-100 hover:border-slate-300 shadow-2xs transition-all text-center"
          >
            🛡️ Admin
          </button>
          <button
            type="button"
            onClick={() => quickLogin("teacher@learnhub.et")}
            className="rounded-xl bg-white border border-slate-200/90 px-2.5 py-2 text-[11px] font-bold text-slate-800 hover:bg-slate-100 hover:border-slate-300 shadow-2xs transition-all text-center"
          >
            👨‍🏫 Teacher
          </button>
          <button
            type="button"
            onClick={() => quickLogin("student@learnhub.et")}
            className="rounded-xl bg-white border border-slate-200/90 px-2.5 py-2 text-[11px] font-bold text-slate-800 hover:bg-slate-100 hover:border-slate-300 shadow-2xs transition-all text-center"
          >
            🎓 Student
          </button>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("email")}</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="e.g. user@learnhub.et"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("password")}</label>
            <span className="text-[11px] text-slate-400 font-medium">Default: LearnHub2026!</span>
          </div>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="••••••••"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-101"
        >
          {loading ? t("loading") : t("signIn")}
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2.5 text-center text-xs text-slate-600 border-t border-slate-100 pt-5">
        <Link to="/register/student" className="font-bold text-blue-600 hover:underline">
          New Student? Register & Request Placement →
        </Link>
        <Link to="/apply/teacher" className="font-bold text-teal-600 hover:underline">
          Want to Teach? Submit Educator Application →
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
    preferredSchedule: "Evenings",
    languagePreference: "en",
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
      setFeedback(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("studentSignUp")}
      subtitle="Complete your profile to request administrative cohort placement"
    >
      {feedback ? (
        <div className="mb-4 rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
          {feedback}
        </div>
      ) : null}

      <div className="mb-5 rounded-2xl bg-blue-50/80 p-3.5 text-xs text-blue-900 leading-relaxed border border-blue-200/80">
        💡 <strong>Placement Note:</strong> LearnHUB operates on guided cohort placement. Once registered, our Hub Admin reviews your preferences and assigns you to the right live class cohort and teacher.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("fullName")}</label>
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="e.g. Yonas Haile"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("email")}</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="yonas@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("password")}</label>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="Minimum 8 characters"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("learningInterests")}</label>
            <select
              value={form.learningInterests}
              onChange={(e) => setForm({ ...form, learningInterests: e.target.value })}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3 py-3 text-xs font-semibold outline-none bg-white"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("skillLevel")}</label>
            <select
              value={form.currentSkillLevel}
              onChange={(e) => setForm({ ...form, currentSkillLevel: e.target.value })}
              className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3 py-3 text-xs font-semibold outline-none bg-white"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("preferredSchedule")}</label>
          <input
            type="text"
            value={form.preferredSchedule}
            onChange={(e) => setForm({ ...form, preferredSchedule: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none"
            placeholder="e.g. Evenings after 6:00 PM EAT"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("learningGoals")}</label>
          <textarea
            rows={2}
            value={form.learningGoals}
            onChange={(e) => setForm({ ...form, learningGoals: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none"
            placeholder="What skills or projects do you want to accomplish?"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-101"
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
      setFeedback(err.message || "Application failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell
        title="Application Received"
        subtitle="Your educator application was submitted successfully"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-3xl text-emerald-600 shadow-sm">
            ✓
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            Your application is currently under administrative evaluation by the Hub Admin team. Once approved and verified, you will receive activation notification to manage your assigned classes.
          </p>
          <div className="pt-4">
            <Link
              to="/sign-in"
              className="inline-block rounded-2xl bg-slate-950 px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-600 transition-colors shadow-md"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("teacherApply")}
      subtitle="Submit your academic credentials and experience for administrative review"
    >
      {feedback ? (
        <div className="mb-4 rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
          {feedback}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("fullName")}</label>
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            placeholder="e.g. Almaz Kebede"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("email")}</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            placeholder="almaz@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("password")}</label>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            placeholder="Minimum 8 characters"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("teachingCategories")}</label>
          <select
            value={form.teachingCategories}
            onChange={(e) => setForm({ ...form, teachingCategories: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3 py-3 text-xs font-semibold outline-none bg-white"
          >
            <option value="Web Development">Web Development</option>
            <option value="Programming">Programming</option>
            <option value="Languages">Languages</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Digital Marketing">Digital Marketing</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("qualifications")}</label>
          <textarea
            required
            rows={2}
            value={form.qualifications}
            onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none"
            placeholder="e.g. M.Sc. in Computer Science, Certified AWS Architect"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("experience")}</label>
          <textarea
            required
            rows={2}
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none"
            placeholder="Summary of teaching and industry experience"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-2xl bg-teal-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-teal-500/20 hover:bg-teal-700 disabled:opacity-50 transition-all hover:scale-101"
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
      setFeedback(err.message || "Admin provisioning failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t("adminSetup")}
      subtitle="Initial provisioning for Hub Administrator master account"
    >
      {feedback ? (
        <div className="mb-4 rounded-2xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
          {feedback}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("fullName")}</label>
          <input
            required
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none"
            placeholder="Hub Admin"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("email")}</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none"
            placeholder="admin@learnhub.et"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("password")}</label>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">{t("setupKey")}</label>
          <input
            required
            type="text"
            value={form.setupKey}
            onChange={(e) => setForm({ ...form, setupKey: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-2xl bg-slate-950 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all hover:scale-101"
        >
          {loading ? t("loading") : "Provision Master Admin"}
        </button>
      </form>
    </AuthShell>
  );
}
