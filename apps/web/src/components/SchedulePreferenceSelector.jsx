import React, { useState, useEffect } from "react";

const DAYS_OF_WEEK = [
    { id: "mon", label: "Mon", full: "Monday" },
    { id: "tue", label: "Tue", full: "Tuesday" },
    { id: "wed", label: "Wed", full: "Wednesday" },
    { id: "thu", label: "Thu", full: "Thursday" },
    { id: "fri", label: "Fri", full: "Friday" },
    { id: "sat", label: "Sat", full: "Saturday" },
    { id: "sun", label: "Sun", full: "Sunday" },
];

const TIME_SLOTS = [
    { id: "morning", label: "Morning", sub: "8:00 AM – 12:00 PM", icon: "🌅" },
    { id: "afternoon", label: "Afternoon", sub: "1:00 PM – 5:00 PM", icon: "☀️" },
    { id: "evening", label: "Evening", sub: "6:00 PM – 9:00 PM", icon: "🌆" },
    { id: "night", label: "Late Night", sub: "9:00 PM – 11:00 PM", icon: "🌙" },
];

const SESSION_TYPES = [
    { id: "live_group", label: "Live Interactive (Google Meet)", desc: "Interactive group class with instructor" },
    { id: "mentorship", label: "1-on-1 Mentorship / Check-in", desc: "Dedicated guidance and progress feedback" },
    { id: "weekend", label: "Weekend Intensive", desc: "Focused Saturday/Sunday deep dives" },
    { id: "self_paced", label: "Self-Paced + Live Q&A", desc: "Flexible practice with weekly live office hours" },
];

function parseScheduleString(str = "") {
    const s = String(str || "").toLowerCase();
    const days = [];
    DAYS_OF_WEEK.forEach((d) => {
        if (s.includes(d.full.toLowerCase()) || s.includes(d.label.toLowerCase())) {
            days.push(d.full);
        }
    });
    if (s.includes("weekday") && days.length === 0) {
        days.push("Monday", "Tuesday", "Wednesday", "Thursday", "Friday");
    }
    if (s.includes("weekend") && !days.includes("Saturday") && !days.includes("Sunday")) {
        days.push("Saturday", "Sunday");
    }

    const times = [];
    TIME_SLOTS.forEach((t) => {
        if (s.includes(t.label.toLowerCase()) || s.includes(t.id)) {
            times.push(t.label);
        }
    });

    const sessions = [];
    SESSION_TYPES.forEach((st) => {
        if (s.includes(st.id) || s.includes(st.label.toLowerCase().slice(0, 10))) {
            sessions.push(st.label);
        }
    });

    return { days, times, sessions };
}

export function SchedulePreferenceSelector({ value = "", onChange }) {
    const [selectedDays, setSelectedDays] = useState(() => parseScheduleString(value).days);
    const [selectedTimes, setSelectedTimes] = useState(() => parseScheduleString(value).times);
    const [selectedSessions, setSelectedSessions] = useState(() => parseScheduleString(value).sessions);
    const [customNotes, setCustomNotes] = useState("");

    // Sync upward whenever checkboxes change
    const updateParent = (days, times, sessions, notes) => {
        const parts = [];
        if (days.length > 0) parts.push(`Days: ${days.join(", ")}`);
        if (times.length > 0) parts.push(`Time: ${times.join(", ")}`);
        if (sessions.length > 0) parts.push(`Format: ${sessions.join(", ")}`);
        if (notes.trim()) parts.push(`Note: ${notes.trim()}`);
        const result = parts.join(" | ");
        onChange(result);
    };

    const toggleDay = (dayFull) => {
        const next = selectedDays.includes(dayFull)
            ? selectedDays.filter((d) => d !== dayFull)
            : [...selectedDays, dayFull];
        setSelectedDays(next);
        updateParent(next, selectedTimes, selectedSessions, customNotes);
    };

    const selectWeekdays = () => {
        const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        setSelectedDays(weekdays);
        updateParent(weekdays, selectedTimes, selectedSessions, customNotes);
    };

    const selectWeekends = () => {
        const weekends = ["Saturday", "Sunday"];
        setSelectedDays(weekends);
        updateParent(weekends, selectedTimes, selectedSessions, customNotes);
    };

    const clearDays = () => {
        setSelectedDays([]);
        updateParent([], selectedTimes, selectedSessions, customNotes);
    };

    const toggleTime = (timeLabel) => {
        const next = selectedTimes.includes(timeLabel)
            ? selectedTimes.filter((t) => t !== timeLabel)
            : [...selectedTimes, timeLabel];
        setSelectedTimes(next);
        updateParent(selectedDays, next, selectedSessions, customNotes);
    };

    const toggleSession = (sessionLabel) => {
        const next = selectedSessions.includes(sessionLabel)
            ? selectedSessions.filter((s) => s !== sessionLabel)
            : [...selectedSessions, sessionLabel];
        setSelectedSessions(next);
        updateParent(selectedDays, selectedTimes, next, customNotes);
    };

    const handleNotesChange = (e) => {
        const val = e.target.value;
        setCustomNotes(val);
        updateParent(selectedDays, selectedTimes, selectedSessions, val);
    };

    return (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            {/* 1. Preferred Days Checkboxes */}
            <div>
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                        1. Preferred Days <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2 text-[11px] font-semibold text-blue-600">
                        <button type="button" onClick={selectWeekdays} className="hover:underline">
                            Mon–Fri
                        </button>
                        <span>•</span>
                        <button type="button" onClick={selectWeekends} className="hover:underline">
                            Weekends
                        </button>
                        <span>•</span>
                        <button type="button" onClick={clearDays} className="text-slate-400 hover:text-slate-600">
                            Clear
                        </button>
                    </div>
                </div>
                <div className="mt-2 grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                        const isChecked = selectedDays.includes(day.full);
                        return (
                            <label
                                key={day.id}
                                className={`flex flex-col items-center justify-center rounded-xl border p-2 cursor-pointer transition select-none ${
                                    isChecked
                                        ? "border-blue-600 bg-blue-600 text-white shadow-xs font-bold"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleDay(day.full)}
                                    className="sr-only"
                                />
                                <span className="text-xs font-bold">{day.label}</span>
                                <span className={`text-[9px] ${isChecked ? "text-blue-100" : "text-slate-400"}`}>
                                    {day.full.slice(0, 3)}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* 2. Preferred Time Slots Checkboxes */}
            <div>
                <label className="text-xs font-bold text-slate-800 block">
                    2. Preferred Time of Day <span className="text-rose-500">*</span>
                </label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TIME_SLOTS.map((slot) => {
                        const isChecked = selectedTimes.includes(slot.label);
                        return (
                            <label
                                key={slot.id}
                                className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition select-none ${
                                    isChecked
                                        ? "border-blue-600 bg-blue-50/70 text-blue-950 font-semibold"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleTime(slot.label)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-base">{slot.icon}</span>
                                <div>
                                    <div className="text-xs font-bold">{slot.label}</div>
                                    <div className="text-[10px] text-slate-500">{slot.sub}</div>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* 3. Session Format Checkboxes */}
            <div>
                <label className="text-xs font-bold text-slate-800 block">
                    3. Preferred Session Format
                </label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SESSION_TYPES.map((session) => {
                        const isChecked = selectedSessions.includes(session.label);
                        return (
                            <label
                                key={session.id}
                                className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition select-none ${
                                    isChecked
                                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleSession(session.label)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div>
                                    <div className="text-xs font-bold">{session.label}</div>
                                    <div className="text-[10px] text-slate-500">{session.desc}</div>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* 4. Additional Note (Optional) */}
            <div>
                <label className="text-[11px] font-bold text-slate-600 block">
                    Additional Schedule Flexibility or Notes (Optional)
                </label>
                <input
                    type="text"
                    value={customNotes}
                    onChange={handleNotesChange}
                    placeholder="e.g. Can also attend weekends if announced in advance"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-blue-600"
                />
            </div>

            {/* Active Summary pill */}
            {value && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5 text-xs text-blue-900 font-medium">
                    <span className="font-bold text-blue-700">Selected Schedule:</span> {value}
                </div>
            )}
        </div>
    );
}
