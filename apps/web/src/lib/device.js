const DEVICE_KEY = "learnhub_device_id";

function randomId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// A stable per-browser identifier persisted in localStorage so the backend can
// recognise previously verified devices and skip the email verification step.
export function getDeviceId() {
    try {
        let id = localStorage.getItem(DEVICE_KEY);
        if (!id) {
            id = randomId();
            localStorage.setItem(DEVICE_KEY, id);
        }
        return id;
    } catch {
        return `session-${randomId()}`;
    }
}

export function getDeviceLabel() {
    if (typeof navigator === "undefined") return "Unknown device";
    const ua = navigator.userAgent || "";
    const platform = /iPhone|iPad|iPod/i.test(ua) ? "iOS"
        : /Android/i.test(ua) ? "Android"
        : /Macintosh|Mac OS X/i.test(ua) ? "macOS"
        : /Windows/i.test(ua) ? "Windows"
        : /Linux/i.test(ua) ? "Linux"
        : "Unknown OS";
    const browser = /Edg\//i.test(ua) ? "Edge"
        : /OPR\//i.test(ua) ? "Opera"
        : /Chrome\//i.test(ua) ? "Chrome"
        : /Firefox\//i.test(ua) ? "Firefox"
        : /Safari\//i.test(ua) ? "Safari"
        : "Browser";
    return `${browser} on ${platform}`;
}

export function getDevicePayload() {
    return {
        deviceId: getDeviceId(),
        label: getDeviceLabel(),
        userAgent: typeof navigator !== "undefined" ? (navigator.userAgent || "").slice(0, 500) : "",
    };
}
