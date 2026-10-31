const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_PLAYLIST_ID = /^[A-Za-z0-9_-]{10,}$/;
const DRIVE_FILE_ID = /^[A-Za-z0-9_-]{10,}$/;
const GOOGLE_DOC_PATHS = new Map([
    ["document", "document"],
    ["spreadsheets", "spreadsheet"],
    ["presentation", "presentation"],
]);

export function normalizeExternalResource(sourceType, value, category = "document") {
    let url;
    try {
        url = new URL(String(value || "").trim());
    } catch {
        throw new Error("Enter a valid HTTPS resource link.");
    }
    if (url.protocol !== "https:") {
        throw new Error("Resource links must use HTTPS.");
    }

    if (sourceType === "youtube") {
        const host = url.hostname.toLowerCase();
        if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(host)) {
            throw new Error("Enter a YouTube video or playlist link.");
        }
        // Support playlist URLs
        const playlistId = url.searchParams.get("list");
        if ((url.pathname === "/playlist" || url.pathname === "/watch") && playlistId && YOUTUBE_PLAYLIST_ID.test(playlistId)) {
            const videoId = url.pathname === "/watch" ? url.searchParams.get("v") : null;
            if (videoId && YOUTUBE_VIDEO_ID.test(videoId)) {
                return {
                    sourceUrl: `https://www.youtube.com/watch?v=${videoId}&list=${playlistId}`,
                    externalUrl: `https://www.youtube-nocookie.com/embed/${videoId}?list=${playlistId}&rel=0&playsinline=1`,
                    mimeType: "video/youtube",
                };
            }
            return {
                sourceUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
                externalUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&playsinline=1`,
                mimeType: "video/youtube",
            };
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
            throw new Error("Enter a valid Google Drive, Docs, Sheets, or Slides link.");
        }
        const folderPath = url.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([^/?#]+)/);
        const isFolder = Boolean(folderPath);
        const docPath = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
        const googleDocType = docPath ? GOOGLE_DOC_PATHS.get(docPath[1]) : null;
        const fileId = folderPath?.[1]
            || docPath?.[2]
            || url.pathname.match(/^\/file\/d\/([^/]+)/)?.[1]
            || (url.pathname === "/open" || url.pathname === "/uc" ? url.searchParams.get("id") : null);
        if (!fileId || !DRIVE_FILE_ID.test(fileId)) {
            throw new Error("The Google Drive link does not contain a valid file or folder ID.");
        }
        const previewUrl = isFolder
            ? `https://drive.google.com/embeddedfolderview?id=${fileId}#list`
            : googleDocType
                ? `https://docs.google.com/${googleDocType === "document" ? "document" : googleDocType === "spreadsheet" ? "spreadsheets" : "presentation"}/d/${fileId}/preview`
                : `https://drive.google.com/file/d/${fileId}/preview`;

        const isVideo = category === "video";
        const isSpreadsheet = category === "spreadsheet" || googleDocType === "spreadsheet";
        const isPresentation = category === "slide" || googleDocType === "presentation";

        const mimeType = isFolder
            ? "application/vnd.google-apps.folder"
            : isVideo
                ? "video/mp4"
                : isSpreadsheet
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : isPresentation
                        ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        : "application/pdf";

        return {
            sourceUrl: url.toString(),
            externalUrl: previewUrl,
            mimeType,
        };
    }

    throw new Error("Unsupported external resource type.");
}
