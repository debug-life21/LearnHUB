import { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { SessionNotificationControl } from "./SessionSchedule";
import { DashboardCard } from "./UIComponents";

export function DashboardSettings({ user, sessions = [], onSaved }) {
    const { i18n } = useTranslation();
    const { refreshUser } = useAuth();
    const [language, setLanguage] = useState(user.languagePreference || i18n.language || "am");
    const [feedback, setFeedback] = useState("");
    const [saving, setSaving] = useState(false);

    const saveLanguage = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFeedback("");
        try {
            await apiRequest("/api/auth/profile", {
                method: "PATCH",
                body: JSON.stringify({ languagePreference: language }),
            });
            await i18n.changeLanguage(language);
            await refreshUser();
            setFeedback("Language preference saved.");
            onSaved?.();
        } catch (error) {
            setFeedback(error.message || "Could not save language preference.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid max-w-3xl gap-6">
            <DashboardCard title="Language preference" subtitle="Choose the language used by TedbabeLearnHUB.">
                <form onSubmit={saveLanguage} className="flex flex-wrap items-end gap-3">
                    <label className="min-w-48 flex-1 text-xs font-bold text-slate-700">Interface language
                        <select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm">
                            <option value="am">አማርኛ (Amharic)</option>
                            <option value="en">English</option>
                        </select>
                    </label>
                    <button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save language"}</button>
                </form>
                {feedback ? <p role="status" className="mt-3 text-xs font-semibold text-emerald-800">{feedback}</p> : null}
            </DashboardCard>
            <DashboardCard title="Class reminders" subtitle="Manage alerts for upcoming live sessions.">
                <SessionNotificationControl sessions={sessions} userId={user.id} />
            </DashboardCard>
            <DashboardCard title="Account and privacy" subtitle="Keep your sign-in secure and your profile information up to date.">
                <p className="text-sm text-slate-600">Update your password in Account security. Your email address is used for sign-in and cannot be changed here.</p>
            </DashboardCard>
        </div>
    );
}
