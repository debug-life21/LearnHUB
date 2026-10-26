const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_FILE_ID = /^[A-Za-z0-9_-]{10,}$/;
const GOOGLE_DOC_PATHS = new Map([
    ["document", "document"],
    ["spreadsheets", "spreadsheet"],
    ["presentation", "presentation"],
]);

export function normalizeExternalResource(sourceType, value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new Error("Enter a valid HTTPS resource link.");
    }
    if (url.protocol !== "https:") {
        throw new Error("Resource links must use HTTPS.");
    }

    if (sourceType === "youtube") {
        const host = url.hostname.toLowerCase();
        if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(host)) {
            throw new Error("Enter a YouTube video link.");
        }
        const videoId = host === "youtu.be"
            ? url.pathname.split("/").filter(Boolean)[0]
            : url.pathname === "/watch"
                ? url.searchParams.get("v")
                : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
        if (!videoId || !YOUTUBE_VIDEO_ID.test(videoId)) {
            throw new Error("The YouTube link does not contain a valid video ID.");
        }
        return {
            sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
            externalUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1`,
            mimeType: "video/youtube",
        };
    }

    if (sourceType === "google_drive") {
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        if (!["drive.google.com", "docs.google.com", "sheets.google.com", "slides.google.com"].includes(host)) {
            throw new Error("Enter a Google Drive file link.");
        }
        const docPath = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
        const googleDocType = docPath ? GOOGLE_DOC_PATHS.get(docPath[1]) : null;
        const fileId = docPath?.[2]
            || url.pathname.match(/^\/file\/d\/([^/]+)/)?.[1]
            || (url.pathname === "/open" || url.pathname === "/uc" ? url.searchParams.get("id") : null);
        if (!fileId || !DRIVE_FILE_ID.test(fileId)) {
            throw new Error("The Google Drive link does not contain a valid file ID.");
        }
        const previewUrl = googleDocType
            ? `https://docs.google.com/${googleDocType === "document" ? "document" : googleDocType === "spreadsheet" ? "spreadsheets" : "presentation"}/d/${fileId}/preview`
            : `https://drive.google.com/file/d/${fileId}/preview`;
        return {
            sourceUrl: url.toString(),
            externalUrl: previewUrl,
            mimeType: "application/pdf",
        };
    }

    throw new Error("Unsupported external resource type.");
}
