import { useCallback, useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

function AuthShell({ title, subtitle, children }) {
    return (
        <div className="editorial-page auth-page mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
            <div className="rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-200/90 sm:p-10">
                <div className="mb-7 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#285b45] text-lg font-black text-[#e7d5ad] shadow-md shadow-emerald-950/20 ring-1 ring-white/20">
                        LH
                    </div>
                    <h1 className="editorial-display mt-4 text-3xl tracking-tight text-stone-900 sm:text-4xl">{title}</h1>
                    <p className="mt-1.5 text-sm font-medium text-slate-500">{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    );
}

function Feedback({ children }) {
    if (!children) return null;
    const success = children.startsWith("A new code has been sent");
    return <div role={success ? "status" : "alert"} className={`mb-5 rounded-2xl p-3.5 text-sm font-semibold ring-1 ${success ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>{children}</div>;
}

function GoogleSignIn({ onCredential, disabled }) {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        return <p className="mb-5 text-center text-xs text-slate-500">Google sign-in is not configured.</p>;
    }
    return (
        <div className={`mb-5 flex justify-center ${disabled ? "pointer-events-none opacity-60" : ""}`}>
            <GoogleLogin
                onSuccess={(response) => {
                    if (response.credential) onCredential(response.credential);
                }}
                onError={() => onCredential(null)}
                text="continue_with"
                shape="pill"
                width="360"
                useOneTap={false}
            />
        </div>
    );
}

export function SignInPage() {
    const { t } = useTranslation();
    const { login, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState("");

    const continueWithGoogle = useCallback(async (credential) => {
        if (!credential) {
            setFeedback("Google sign-in could not be completed. Please try again.");
            return;
        }
        setLoading(true);
        setFeedback("");
        try {
            await apiRequest("/api/auth/google", {
                method: "POST",
                body: JSON.stringify({ credential }),
            });
            await refreshUser();
            navigate("/dashboard");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    }, [navigate, refreshUser]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setFeedback("");
        try {
            const response = await login({ email, password });
            if (response.user) {
                await refreshUser();
                navigate("/dashboard");
                return;
            }
            sessionStorage.setItem("learnhub_pending_email", response.email);
            sessionStorage.setItem("learnhub_pending_purpose", response.purpose);
            navigate("/verify-code", { state: { email: response.email, purpose: response.purpose } });
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title={t("signIn")} subtitle="Access your LearnHUB learning and management portal">
            <Feedback>{feedback}</Feedback>
            <GoogleSignIn onCredential={continueWithGoogle} disabled={loading} />
            <div className="mb-5 flex items-center gap-3 text-xs font-semibold text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />OR CONTINUE WITH EMAIL<span className="h-px flex-1 bg-slate-200" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("email")}
                    <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="name@example.com" />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    <div className="flex items-center justify-between">
                        <span>{t("password")}</span>
                        <Link to="/forgot-password" className="text-[11px] font-semibold text-blue-600 hover:underline lowercase first-letter:uppercase">
                            Forgot password?
                        </Link>
                    </div>
                    <input required autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="Your password" />
                </label>
                <button disabled={loading} type="submit" className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50">
                    {loading ? t("loading") : "Continue"}
                </button>
            </form>
            <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
                New to LearnHUB? <Link to="/signup" className="font-bold text-blue-600 hover:underline">Create an account</Link>
            </p>
        </AuthShell>
    );
}
export function SignupPage({ initialRole = "student" }) {
    const { t } = useTranslation();
    const { refreshUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState(initialRole);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState("");

    const continueWithGoogle = useCallback(async (credential) => {
        if (!credential) {
            setFeedback("Google sign-up could not be completed. Please try again.");
            return;
        }
        setLoading(true);
        setFeedback("");
        try {
            await apiRequest("/api/auth/google", {
                method: "POST",
                body: JSON.stringify({ credential, role }),
            });
            await refreshUser();
            await navigate("/dashboard");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    }, [navigate, refreshUser, role]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setFeedback("");
        try {
            const response = await apiRequest("/api/auth/signup", {
                method: "POST",
                body: JSON.stringify({ name, email, password, role }),
            });
            sessionStorage.setItem("learnhub_pending_email", response.email);
            sessionStorage.setItem("learnhub_pending_purpose", response.purpose);
            navigate("/verify-code", { state: { email: response.email, purpose: response.purpose } });
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Create your account" subtitle="Create your account to start learning or teaching">
            <Feedback>{feedback}</Feedback>
            <GoogleSignIn onCredential={continueWithGoogle} disabled={loading} />
            <div className="mb-5 flex items-center gap-3 text-xs font-semibold text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />OR SIGN UP WITH EMAIL<span className="h-px flex-1 bg-slate-200" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("fullName")}
                    <input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="Your name" />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("email")}
                    <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="name@example.com" />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("password")}
                    <input required minLength={8} maxLength={128} autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="At least 8 characters" />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    I want to join as
                    <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                </label>
                {role === "teacher" && <p className="rounded-2xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">Teacher accounts need admin approval after email verification.</p>}
                <button disabled={loading} type="submit" className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50">
                    {loading ? t("loading") : "Create account"}
                </button>
            </form>
            <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
                Already have an account? <Link to="/sign-in" className="font-bold text-blue-600 hover:underline">Sign in</Link>
            </p>
        </AuthShell>
    );
}

export function VerifyCodePage() {
    const { t } = useTranslation();
    const { refreshUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState(location.state?.email || sessionStorage.getItem("learnhub_pending_email") || "");
    const [purpose] = useState(location.state?.purpose || sessionStorage.getItem("learnhub_pending_purpose") || "signup");
    const [code, setCode] = useState("");
    const [secondsLeft, setSecondsLeft] = useState(60);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (secondsLeft <= 0) return undefined;
        const timer = window.setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [secondsLeft]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setFeedback("");
        try {
            await apiRequest("/api/auth/verify-code", {
                method: "POST",
                body: JSON.stringify({ email, code }),
            });
            sessionStorage.removeItem("learnhub_pending_email");
            sessionStorage.removeItem("learnhub_pending_purpose");
            await refreshUser();
            navigate("/dashboard");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        setFeedback("");
        try {
            await apiRequest("/api/auth/resend-code", {
                method: "POST",
                body: JSON.stringify({ email, purpose }),
            });
            setSecondsLeft(60);
            setFeedback("A new code has been sent if the account is eligible.");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Verify your email" subtitle="Enter the 6-digit code sent to your inbox">
            <Feedback>{feedback}</Feedback>
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {t("email")}
                    <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Verification code
                    <input required minLength={6} maxLength={6} pattern="[0-9]{6}" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-4 text-center font-mono text-2xl font-black tracking-[0.5em] outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="000000" aria-label="6-digit verification code" />
                </label>
                <button disabled={loading || code.length !== 6} type="submit" className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50">
                    {loading ? t("loading") : "Verify and continue"}
                </button>
            </form>
            <div className="mt-5 flex flex-col items-center gap-3 text-sm text-slate-600">
                <button type="button" disabled={loading || secondsLeft > 0 || !email} onClick={handleResend} className="font-bold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline">
                    {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
                </button>
                <Link to="/sign-in" className="font-semibold text-slate-500 hover:text-slate-800">Back to sign in</Link>
            </div>
        </AuthShell>
    );
}

export function StudentRegistrationPage() {
    return <SignupPage initialRole="student" />;
}

export function TeacherApplicationPage() {
    return <SignupPage initialRole="teacher" />;
}

export function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setFeedback("");
        try {
            const res = await apiRequest("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            setSubmitted(true);
            setFeedback(res.message || "A reset link and code have been sent if an account matches.");
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Reset your password" subtitle="Enter your email to receive recovery instructions">
            <Feedback>{feedback}</Feedback>
            {submitted ? (
                <div className="space-y-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">
                        ✓
                    </div>
                    <p className="text-sm text-slate-600">
                        Check your email inbox for the reset link and 6-digit code.
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                        <Link
                            to={`/reset-password?email=${encodeURIComponent(email)}`}
                            className="w-full rounded-2xl bg-blue-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-blue-700"
                        >
                            Enter Reset Code
                        </Link>
                        <Link to="/sign-in" className="text-xs font-bold text-slate-500 hover:text-slate-800">
                            Back to sign in
                        </Link>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        {t("email")}
                        <input
                            required
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            placeholder="name@example.com"
                        />
                    </label>
                    <button
                        disabled={loading || !email}
                        type="submit"
                        className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50"
                    >
                        {loading ? t("loading") : "Send Reset Instructions"}
                    </button>
                    <div className="pt-2 text-center text-xs">
                        <Link to="/sign-in" className="font-bold text-slate-600 hover:text-blue-600">
                            ← Return to sign in
                        </Link>
                    </div>
                </form>
            )}
        </AuthShell>
    );
}

export function ResetPasswordPage() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const initialEmail = searchParams.get("email") || "";
    const initialToken = searchParams.get("token") || "";

    const [email, setEmail] = useState(initialEmail);
    const [tokenOrCode, setTokenOrCode] = useState(initialToken);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) {
            setFeedback("Passwords do not match.");
            return;
        }
        setLoading(true);
        setFeedback("");
        try {
            const res = await apiRequest("/api/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ email, tokenOrCode, newPassword }),
            });
            setSuccess(true);
            setFeedback(res.message || "Password reset successful.");
            setTimeout(() => {
                navigate("/sign-in");
            }, 2500);
        } catch (error) {
            setFeedback(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Set new password" subtitle="Choose a strong password for your LearnHUB account">
            <Feedback>{feedback}</Feedback>
            {success ? (
                <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                        ✓
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Password Changed!</h2>
                    <p className="text-xs text-slate-600">Redirecting to sign-in page…</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        {t("email")}
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Reset Code or Token
                        <input
                            required
                            type="text"
                            value={tokenOrCode}
                            onChange={(e) => setTokenOrCode(e.target.value)}
                            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-mono tracking-wider normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            placeholder="6-digit code or link token"
                        />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        New Password
                        <input
                            required
                            minLength={8}
                            maxLength={128}
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            placeholder="At least 8 characters"
                        />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Confirm New Password
                        <input
                            required
                            minLength={8}
                            maxLength={128}
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium normal-case outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            placeholder="Re-enter password"
                        />
                    </label>
                    <button
                        disabled={loading || !newPassword || !confirmPassword || !tokenOrCode}
                        type="submit"
                        className="w-full rounded-2xl bg-blue-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50"
                    >
                        {loading ? t("loading") : "Update Password"}
                    </button>
                    <div className="pt-2 text-center text-xs">
                        <Link to="/sign-in" className="font-bold text-slate-600 hover:text-blue-600">
                            ← Return to sign in
                        </Link>
                    </div>
                </form>
            )}
        </AuthShell>
    );
}
