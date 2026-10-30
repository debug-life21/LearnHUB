import { useEffect, useState } from "react";

// The session link should only activate when 10 minutes are left; before that, it must be disabled.
const TEN_MINUTES_MS = 10 * 60 * 1000;

function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m ${String(seconds).padStart(2, "0")}s`;
    }
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
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
    const unlockTime = startsAt - TEN_MINUTES_MS;

    const isLiveOrReady = session.status === "scheduled" && now >= unlockTime && now < endsAt;
    const isLocked = session.status === "scheduled" && now < unlockTime;
    const isEnded = session.status === "completed" || now >= endsAt;
    const isCancelled = session.status === "cancelled";

    if (isLiveOrReady) {
        const isStarted = now >= startsAt;
        return (
            <a
                href={session.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-5 ${
                    compact ? "py-2.5 text-xs" : "py-3.5 text-sm"
                } font-black uppercase tracking-wider text-white shadow-xl shadow-teal-500/30 ring-2 ring-emerald-400/50 transition-all duration-300 hover:scale-[1.03] hover:from-emerald-500 hover:to-cyan-500 active:scale-[0.98] ${className}`}
                id={`live-session-join-${session._id || "btn"}`}
            >
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-base">📹</span>
                <span className="font-extrabold tracking-wide">
                    {isStarted ? "Enter Live Class Now" : "Enter Room (Active 10m Prior)"}
                </span>
                <span className="text-xs opacity-90 transition-transform group-hover:translate-x-1">→</span>
            </a>
        );
    }

    if (isLocked) {
        const msUntilUnlock = unlockTime - now;
        return (
            <div
                className={`inline-flex flex-col sm:flex-row items-center justify-center gap-2 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50/70 px-4 ${
                    compact ? "py-2 text-xs" : "py-3 text-xs"
                } font-bold text-amber-900 shadow-sm cursor-not-allowed select-none ${className}`}
                title="Session link activates exactly 10 minutes before class start"
                id={`live-session-locked-${session._id || "btn"}`}
            >
                <div className="flex items-center gap-1.5">
                    <span className="text-amber-600 text-sm">🔒</span>
                    <span className="text-amber-800">Opens 10m before class in:</span>
                </div>
                <span className="font-mono font-black text-amber-950 bg-amber-200/90 px-2.5 py-0.5 rounded-lg border border-amber-300">
                    {formatCountdown(msUntilUnlock)}
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
