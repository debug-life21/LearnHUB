import { useEffect, useState } from "react";

// Strictly NO early entry: Users can only join at or after the scheduled start time.
const JOIN_EARLY_MS = 0;

function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function LiveSessionButton({ session, className = "", compact = false }) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    if (!session?.meetingUrl) return null;

    const startsAt = new Date(session.startsAt).getTime();
    const endsAt = new Date(session.endsAt).getTime();
    const isLiveNow = session.status === "scheduled" && now >= startsAt && now < endsAt;
    const isUpcoming = session.status === "scheduled" && now < startsAt;
    const isEnded = session.status === "completed" || now >= endsAt;
    const isCancelled = session.status === "cancelled";

    if (isLiveNow) {
        return (
            <a
                href={session.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-5 ${
                    compact ? "py-2.5 text-xs" : "py-3.5 text-sm"
                } font-black uppercase tracking-wider text-white shadow-xl shadow-teal-500/30 ring-2 ring-emerald-400/50 transition-all duration-300 hover:scale-[1.03] hover:from-emerald-500 hover:to-cyan-500 active:scale-[0.98] ${className}`}
            >
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-base">📹</span>
                <span className="font-extrabold tracking-wide">Enter Live Class Now</span>
                <span className="text-xs opacity-90 transition-transform group-hover:translate-x-1">→</span>
            </a>
        );
    }

    if (isUpcoming) {
        return (
            <div
                className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-100/90 px-4 ${
                    compact ? "py-2 text-xs" : "py-3 text-xs"
                } font-bold text-slate-700 shadow-sm ${className}`}
                title="Entry opens at the exact scheduled start time"
            >
                <span className="text-amber-500">🔒</span>
                <span>Opens at start time in</span>
                <span className="font-mono font-black text-cyan-800 bg-cyan-100/80 px-2 py-0.5 rounded-lg border border-cyan-200">
                    {formatCountdown(startsAt - now)}
                </span>
            </div>
        );
    }

    return (
        <button
            type="button"
            disabled
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 ${
                compact ? "py-2 text-xs" : "py-3 text-xs"
            } font-semibold text-slate-400 cursor-not-allowed ${className}`}
        >
            <span>{isCancelled ? "Class Cancelled" : isEnded ? "Class Ended" : "Session Unavailable"}</span>
        </button>
    );
}
