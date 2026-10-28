import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatSessionTime } from "../lib/sessionTime";
import { LiveSessionButton } from "./LiveSessionButton";

function useSessionReminders(sessions, userId) {
    const [permission, setPermission] = useState(
        typeof Notification === "undefined" ? "unsupported" : Notification.permission,
    );

    useEffect(() => {
        if (permission !== "granted") return undefined;
        const notifyUpcomingSessions = () => {
            const now = Date.now();
            sessions.forEach((session) => {
                const start = new Date(session.startsAt).getTime();
                const remaining = start - now;
                if (session.status !== "scheduled" || remaining <= 0 || remaining > 10 * 60 * 1000) return;
                const storageKey = `learnhub-session-reminder:${userId}:${session._id}:${session.startsAt}`;
                if (localStorage.getItem(storageKey)) return;
                localStorage.setItem(storageKey, "sent");
                const classroom = session.classroom?.title ? ` · ${session.classroom.title}` : "";
                const notice = new Notification(`Class starts in 10 minutes${classroom}`, {
                    body: `${session.title}\n${formatSessionTime(session.startsAt)}${session.meetingUrl ? "\nSelect to open the class meeting." : ""}`,
                    icon: "/learnhub-icon.png",
                    tag: `learnhub-session-${session._id}`,
                });
                notice.onclick = () => {
                    window.focus();
                    if (session.meetingUrl) window.open(session.meetingUrl, "_blank", "noopener,noreferrer");
                    notice.close();
                };
            });
        };
        notifyUpcomingSessions();
        const timer = window.setInterval(notifyUpcomingSessions, 30_000);
        return () => window.clearInterval(timer);
    }, [permission, sessions, userId]);

    async function enableNotifications() {
        if (typeof Notification === "undefined") {
            setPermission("unsupported");
            return;
        }
        const result = await Notification.requestPermission();
        setPermission(result);
    }

    return { permission, enableNotifications };
}

export function SessionNotificationControl({ sessions, userId }) {
    const { permission, enableNotifications } = useSessionReminders(sessions, userId);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <div>
                <p className="text-sm font-bold text-cyan-950">10-minute class reminders</p>
                <p className="mt-1 text-xs text-cyan-900">
                    {permission === "granted"
                        ? "Device notifications are enabled while TedbabeLearnHUB is open."
                        : permission === "denied"
                            ? "Notifications are blocked. Allow them for TedbabeLearnHUB in your browser or device settings."
                            : permission === "unsupported"
                                ? "This browser does not support device notifications."
                                : "Enable device notifications to be alerted shortly before a class."}
                </p>
            </div>
            {permission === "default" ? (
                <button type="button" onClick={enableNotifications} className="rounded-xl bg-cyan-700 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800">
                    Enable notifications
                </button>
            ) : null}
        </div>
    );
}

export function SessionSchedule({ sessions }) {
    const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <div className="space-y-4">
            {sessions.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No upcoming live classes are scheduled.</p>
            ) : sessions.map((session) => {
                const cohortTimeZone = session.classroom?.timeZone;
                return (
                    <article key={session._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-900">{session.title}</h3>
                            </div>
                            {session.classroom?.title ? <p className="mt-1 text-xs font-semibold text-slate-600">{session.classroom.title}</p> : null}
                            <p className="mt-2 text-sm font-semibold text-slate-700">Your device: {formatSessionTime(session.startsAt, deviceTimeZone)}</p>
                            {cohortTimeZone && cohortTimeZone !== deviceTimeZone ? (
                                <p className="mt-1 text-xs text-slate-500">Cohort time ({cohortTimeZone}): {formatSessionTime(session.startsAt, cohortTimeZone)}</p>
                            ) : null}
                            <p className="mt-1 text-xs text-slate-500">Ends: {formatSessionTime(session.endsAt, deviceTimeZone)}</p>
                            {session.description ? <p className="mt-2 text-xs text-slate-600">{session.description}</p> : null}
                        </div>
                        {session.meetingUrl ? (
                            <LiveSessionButton session={session} compact />
                        ) : session.classroom?._id ? (
                            <Link to={`/workspace/${session.classroom?._id}`} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-200">
                                Open class
                            </Link>
                        ) : null}
                    </article>
                );
            })}
        </div>
    );
}
