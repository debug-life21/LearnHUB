import { useEffect, useState } from "react";

const JOIN_EARLY_MS = 5 * 60 * 1000;

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
    const joinOpensAt = startsAt - JOIN_EARLY_MS;
    const isAvailable = session.status === "scheduled" && now >= joinOpensAt && now < endsAt;
    const isUpcoming = session.status === "scheduled" && now < joinOpensAt;
    const isInProgress = isAvailable && now >= startsAt;
    const label = isUpcoming
        ? `Join available in ${formatCountdown(joinOpensAt - now)}`
        : isInProgress
            ? "Join live class · In progress"
            : isAvailable
                ? `Join live class · Starts in ${formatCountdown(startsAt - now)}`
                : session.status === "cancelled"
                    ? "Class cancelled"
                    : session.status === "completed" || now >= endsAt
                        ? "Class ended"
                        : "Join live class";
    const buttonClasses = `inline-flex items-center justify-center gap-2 rounded-xl px-4 ${compact ? "py-2" : "py-3"} text-xs font-extrabold transition ${
        isAvailable
            ? "bg-cyan-600 text-white hover:bg-cyan-700"
            : "cursor-not-allowed bg-slate-200 text-slate-500"
    } ${className}`;

    if (!isAvailable) {
        return <button type="button" disabled className={buttonClasses}>{label}</button>;
    }

    return (
        <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses}>
            <span aria-hidden="true">📹</span>
            <span>{label}</span>
        </a>
    );
}
