// Centralized list of IANA time zones with formatted labels
export const TIME_ZONES = (() => {
    try {
        const now = new Date();
        return Intl.supportedValuesOf("timeZone").map((tz) => {
            const offset = new Intl.DateTimeFormat("en", {
                timeZone: tz,
                timeZoneName: "shortOffset",
            }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value || "";
            return {
                value: tz,
                label: `${tz.replace(/_/g, " ")} (${offset})`,
            };
        });
    } catch {
        const fallback = [
            "Africa/Addis_Ababa", "Africa/Cairo", "Africa/Casablanca", "Africa/Johannesburg",
            "Africa/Lagos", "Africa/Nairobi", "America/Chicago", "America/Denver",
            "America/Los_Angeles", "America/Mexico_City", "America/New_York", "America/Sao_Paulo",
            "America/Toronto", "Asia/Almaty", "Asia/Baghdad", "Asia/Bangkok",
            "Asia/Calcutta", "Asia/Dhaka", "Asia/Dubai", "Asia/Hong_Kong",
            "Asia/Istanbul", "Asia/Jakarta", "Asia/Karachi", "Asia/Riyadh",
            "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Tokyo",
            "Atlantic/Reykjavik", "Australia/Melbourne", "Australia/Perth", "Australia/Sydney",
            "Europe/Berlin", "Europe/London", "Europe/Moscow", "Europe/Paris",
            "Europe/Rome", "Pacific/Auckland", "Pacific/Honolulu", "UTC"
        ];
        return fallback.map((tz) => ({
            value: tz,
            label: tz.replace(/_/g, " "),
        }));
    }
})();
