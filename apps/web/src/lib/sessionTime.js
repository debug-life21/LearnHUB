function dateParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export function formatDateTimeInput(value, timeZone) {
    const parts = dateParts(new Date(value), timeZone);
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function dateTimeInputToISOString(value, timeZone) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
    if (!match) throw new Error("Enter a valid session date and time.");
    const [, year, month, day, hour, minute] = match.map(Number);
    const targetTime = Date.UTC(year, month - 1, day, hour, minute);
    let timestamp = targetTime;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const parts = dateParts(new Date(timestamp), timeZone);
        const observedTime = Date.UTC(
            Number(parts.year),
            Number(parts.month) - 1,
            Number(parts.day),
            Number(parts.hour),
            Number(parts.minute),
        );
        timestamp += targetTime - observedTime;
    }

    const resolved = dateParts(new Date(timestamp), timeZone);
    if (
        Number(resolved.year) !== year ||
        Number(resolved.month) !== month ||
        Number(resolved.day) !== day ||
        Number(resolved.hour) !== hour ||
        Number(resolved.minute) !== minute
    ) {
        throw new Error("That local time does not exist in the selected cohort time zone. Choose another time.");
    }
    return new Date(timestamp).toISOString();
}

export function formatSessionTime(value, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
    return new Intl.DateTimeFormat(undefined, {
        timeZone,
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
    }).format(new Date(value));
}
