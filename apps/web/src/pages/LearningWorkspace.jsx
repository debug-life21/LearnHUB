import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest, API_BASE_URL } from "../lib/api";
import { Modal } from "../components/UIComponents";
import { LiveSessionButton } from "../components/LiveSessionButton";
import { formatSessionTime } from "../lib/sessionTime";
import { OfficeDocumentPreview } from "../components/OfficeDocumentPreview";
import { DashboardSidebar } from "../components/DashboardSidebar";

export function getYouTubeVideoId(url) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("youtu.be")) {
            return parsed.pathname.slice(1).split(/[?#]/)[0];
        }
        if (parsed.pathname.includes("/embed/")) {
            return parsed.pathname.split("/embed/")[1]?.split(/[?#]/)[0];
        }
        if (parsed.pathname.includes("/shorts/")) {
            return parsed.pathname.split("/shorts/")[1]?.split(/[?#]/)[0];
        }
        return parsed.searchParams.get("v");
    } catch {
        const match = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([A-Za-z0-9_-]{11})/);
        return match ? match[1] : null;
    }
}

function VideoThumbnail({ resource, lesson, className = "", aspect = "aspect-video" }) {
    const [imgFailed, setImgFailed] = useState(false);
    const ytUrl = resource?.sourceUrl || resource?.externalUrl || lesson?.videoUrl;
    const isYouTube = resource?.sourceType === "youtube" || (ytUrl && (ytUrl.includes("youtube.com") || ytUrl.includes("youtu.be")));
    const ytId = isYouTube ? getYouTubeVideoId(ytUrl) : null;
    const directVideoUrl = resource?.storedKey
        ? `${API_BASE_URL}/api/resources/${resource.storedKey}/file`
        : lesson?.videoUrl && !isYouTube
            ? lesson.videoUrl
            : null;

    if (ytId && !imgFailed) {
        return (
            <div className={`relative overflow-hidden rounded-xl bg-slate-900 ${aspect} ${className}`}>
                <img
                    src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                    alt={resource?.title || lesson?.title || "Video thumbnail"}
                    onError={() => setImgFailed(true)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white shadow-md transition group-hover:scale-110">
                        <svg className="h-3 w-3 fill-current ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </span>
                </div>
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[8px] font-bold text-white tracking-wider">
                    YouTube
                </span>
            </div>
        );
    }

    if (directVideoUrl) {
        return (
            <div className={`relative overflow-hidden rounded-xl bg-slate-950 ${aspect} ${className}`}>
                <video
                    src={`${directVideoUrl}#t=1`}
                    preload="metadata"
                    muted
                    playsInline
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700/90 text-white shadow-md transition group-hover:scale-110">
                        <svg className="h-3 w-3 fill-current ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </span>
                </div>
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[8px] font-bold text-emerald-300">
                    VIDEO
                </span>
            </div>
        );
    }

    return (
        <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white ${aspect} ${className}`}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-emerald-400">
                <svg className="h-3 w-3 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                </svg>
            </span>
            <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-[8px] font-bold text-slate-300">
                VIDEO
            </span>
        </div>
    );
}

const isVideoResource = (resource) => (
    resource.sourceType === "youtube" ||
    resource.category === "video" ||
    resource.mimeType?.startsWith("video/")
);

export function LearningWorkspace() {
    const { classroomId } = useParams();
    const { user } = useAuth();
    const isAdmin = Boolean(user && (user.role === "admin" || user.role === "hub_admin"));
    const isStudent = Boolean(user?.role === "student");

    const [classroom, setClassroom] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [resources, setResources] = useState([]);
    const [discussions, setDiscussions] = useState([]);
    const [trackingStats, setTrackingStats] = useState(null);
    const [trackingData, setTrackingData] = useState(null); // full tracking response
    // Honour ?tab=tracking (admin deep-link from AdminDashboard)
    const [activeTab, setActiveTab] = useState(() => {
        const tab = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;
        return tab || "player";
    });
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState("");
    const [workspaceNow, setWorkspaceNow] = useState(() => Date.now());

    // Video Player state
    const [currentLesson, setCurrentLesson] = useState(null);
    const [playbackRate, setPlaybackRate] = useState(1);
    const videoRef = useRef(null);
    const [selectedVideoResource, setSelectedVideoResource] = useState(null);

    // Discussion modal / form state
    const [newThreadModal, setNewThreadModal] = useState(false);
    const [threadTitle, setThreadTitle] = useState("");
    const [threadContent, setThreadContent] = useState("");
    const [threadCategory, setThreadCategory] = useState("general");
    const [replyContent, setReplyContent] = useState({});

    // Document Viewer state
    const [selectedDoc, setSelectedDoc] = useState(null);
    const videoResources = useMemo(() => resources.filter(isVideoResource), [resources]);
    const courseMaterials = useMemo(
        () => resources.filter((resource) => !isVideoResource(resource)),
        [resources],
    );

    // Load workspace data
    const loadWorkspace = useCallback(async () => {
        try {
            setLoading(true);
            const isTeacher = user?.role === "teacher";
            const apiPrefix = isAdmin ? "/api/admin" : isTeacher ? "/api/teacher" : "/api/student";

            // Fetch classes list to find this classroom
            const classesRes = await apiRequest(`${apiPrefix}/classes`);
            const matchedClass = (classesRes.classes || []).find((c) => c._id === classroomId);

            if (!matchedClass) {
                setFeedback("Classroom not found or you are not enrolled.");
                setLoading(false);
                return;
            }
            setClassroom(matchedClass);

            if (isAdmin) {
                try {
                    const trackRes = await apiRequest(`/api/admin/classes/${classroomId}/tracking`);
                    if (trackRes?.stats) {
                        setTrackingStats(trackRes.stats);
                    }
                    setTrackingData(trackRes || null);
                } catch {
                    // Non-blocking for oversight view
                }
            }

            // Fetch classroom sessions if available
            if (classesRes.sessions) {
                setSessions(classesRes.sessions.filter((session) => (
                    (session.classroom?._id || session.classroom)?.toString() === classroomId
                )));
            }

            // Fetch resources
            const resRes = await apiRequest("/api/resources");
            const classResources = (resRes.resources || []).filter(
                (r) => r.classroom?._id === classroomId || r.classroom === classroomId
            );
            setResources(classResources);
            const targetResId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("resourceId") : null;
            const targetRes = targetResId ? classResources.find((r) => r._id === targetResId) : null;
            if (targetRes) {
                if (isVideoResource(targetRes)) {
                    setSelectedVideoResource(targetRes);
                    setActiveTab("player");
                } else {
                    setSelectedDoc(targetRes);
                    setActiveTab("documents");
                }
            } else {
                setSelectedDoc((current) => current || classResources.find((resource) => !isVideoResource(resource)) || null);
                setSelectedVideoResource((current) => current || classResources.find(isVideoResource) || null);
            }

            // Fetch discussions
            const discRes = await apiRequest(`${apiPrefix}/classes/${classroomId}/discussions`);
            setDiscussions(discRes.discussions || []);

            // Set default lesson
            if (matchedClass.course?.modules?.[0]?.lessons?.[0]) {
                setCurrentLesson(matchedClass.course.modules[0].lessons[0]);
            } else {
                setCurrentLesson({
                    title: "Welcome to " + (matchedClass.title || "Course"),
                    description: "Orientation, learning objectives, and cohort introduction.",
                    durationMinutes: 30,
                    videoUrl: "",
                });
            }
        } catch (err) {
            setFeedback(err.message || "Failed to load classroom workspace.");
        } finally {
            setLoading(false);
        }
    }, [classroomId, user, isAdmin]);

    useEffect(() => {
        void loadWorkspace();
    }, [loadWorkspace]);

    useEffect(() => {
        const timer = window.setInterval(() => setWorkspaceNow(Date.now()), 15_000);
        return () => window.clearInterval(timer);
    }, []);

    // Resume video progress
    useEffect(() => {
        if (!videoRef.current) return;
        const progressId = selectedVideoResource?._id || currentLesson?.title;
        if (!progressId) return;
        const savedTime = localStorage.getItem(`tlh_video_progress_${progressId}`);
        if (savedTime && parseFloat(savedTime) > 0) {
            videoRef.current.currentTime = parseFloat(savedTime);
        }
    }, [currentLesson, selectedVideoResource]);

    const nextSession = useMemo(() => {
        const activeSession = sessions.find((session) => (
            session.status === "scheduled" &&
            new Date(session.startsAt).getTime() <= workspaceNow &&
            new Date(session.endsAt).getTime() > workspaceNow
        ));
        return activeSession || sessions.find((session) => (
            session.status === "scheduled" && new Date(session.endsAt).getTime() > workspaceNow
        ));
    }, [sessions, workspaceNow]);

    const handleTimeUpdate = () => {
        const progressId = selectedVideoResource?._id || currentLesson?.title;
        if (videoRef.current && progressId) {
            localStorage.setItem(
                `tlh_video_progress_${progressId}`,
                String(videoRef.current.currentTime)
            );
        }
    };

    // Helper to build an absolute API resource URL so browser-native requests
    // (e.g. <a download>, <video src>, <iframe src>) always reach the backend
    // regardless of whether a Vite proxy is active or not.
    const resUrl = (path) => `${API_BASE_URL}${path}`;

    const handleSpeedChange = (rate) => {
        setPlaybackRate(rate);
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
        }
    };

    // Discussion thread submission
    const handleCreateThread = async (e) => {
        e.preventDefault();
        try {
            const apiPrefix = isAdmin ? "/api/admin" : user?.role === "teacher" ? "/api/teacher" : "/api/student";
            const res = await apiRequest(`${apiPrefix}/classes/${classroomId}/discussions`, {
                method: "POST",
                body: JSON.stringify({
                    title: threadTitle,
                    content: threadContent,
                    category: threadCategory,
                }),
            });
            setDiscussions([res.discussion, ...discussions]);
            setNewThreadModal(false);
            setThreadTitle("");
            setThreadContent("");
            setFeedback("Discussion thread created.");
        } catch (err) {
            setFeedback(err.message || "Could not create discussion topic.");
        }
    };

    const handleAddReply = async (discussionId) => {
        const text = replyContent[discussionId];
        if (!text || !text.trim()) return;
        try {
            const apiPrefix = isAdmin ? "/api/admin" : user?.role === "teacher" ? "/api/teacher" : "/api/student";
            const res = await apiRequest(`${apiPrefix}/classes/${classroomId}/discussions/${discussionId}/reply`, {
                method: "POST",
                body: JSON.stringify({ content: text.trim() }),
            });
            setDiscussions(discussions.map((d) => (d._id === discussionId ? res.discussion : d)));
            setReplyContent({ ...replyContent, [discussionId]: "" });
        } catch (err) {
            setFeedback(err.message || "Could not post reply.");
        }
    };

    const handleDeleteThread = async (discussionId) => {
        if (!window.confirm("Remove this discussion topic as an administrator?")) return;
        try {
            await apiRequest(`/api/admin/classes/${classroomId}/discussions/${discussionId}`, {
                method: "DELETE",
            });
            setDiscussions((prev) => prev.filter((d) => d._id !== discussionId));
            setFeedback("Discussion topic removed by administrator.");
        } catch (err) {
            setFeedback(err.message || "Failed to remove discussion topic.");
        }
    };

    if (loading) {
        return (
            <div className="editorial-page flex min-h-[60vh] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent"></div>
                    <span className="text-sm font-bold text-stone-700">Loading learning workspace…</span>
                </div>
            </div>
        );
    }

    if (!classroom) {
        return (
            <div className="editorial-page mx-auto max-w-3xl px-4 py-20 text-center">
                <div className="rounded-3xl bg-white p-12 ring-1 ring-stone-200 shadow-sm">
                    <h2 className="text-2xl font-bold text-stone-900">Workspace Unavailable</h2>
                    <p className="mt-2 text-xs text-stone-500">{feedback || "You do not have access to this classroom."}</p>
                    <Link to="/dashboard" className="editorial-button mt-6 text-xs font-bold">
                        ← Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="editorial-page min-h-screen pb-24 lg:pl-72">
            <DashboardSidebar
                title="Learning space"
                user={user}
                backHref="/dashboard"
                tabs={[
                    { id: "player", label: "Interactive Video", icon: "🎬" },
                    { id: "documents", label: `Course Materials (${courseMaterials.length})`, icon: "📄" },
                    { id: "discussions", label: `Cohort Discussions (${discussions.length})`, icon: "💬" },
                    ...(isAdmin ? [{ id: "tracking", label: `Cohort Tracking (${classroom.students?.length || 0})`, icon: "📊" }] : []),
                ]}
                activeTab={activeTab}
                onSelect={setActiveTab}
            />
            {/* Workspace Header Topbar */}
            <div className="sticky top-16 z-30 border-b border-stone-200/90 bg-white/95 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link to="/dashboard" className="text-xs font-bold text-stone-500 hover:text-stone-900">
                                ← Back to Dashboard
                            </Link>
                            <span className="text-stone-300">/</span>
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                {classroom.course?.title || "Cohort Workspace"}
                            </span>
                        </div>
                        <h1 className="editorial-display mt-0.5 text-xl font-bold text-stone-900 sm:text-2xl">
                            {classroom.title}
                        </h1>
                    </div>

                    {/* Live Meeting Action */}
                    <div className="flex items-center gap-3">
                        {nextSession ? (
                            <div className="flex flex-col items-end gap-1">
                                <p className="text-right text-[11px] font-semibold text-stone-600">
                                    {nextSession.title} · {formatSessionTime(nextSession.startsAt)}
                                </p>
                                <LiveSessionButton session={nextSession} />
                                {nextSession.meetingUrl ? (
                                    <span className="text-[10px] text-stone-500">Google Meet opens in a new tab.</span>
                                ) : null}
                            </div>
                        ) : (
                            <span className="rounded-xl bg-stone-100 px-3 py-1.5 text-[11px] font-semibold text-stone-500">
                                No upcoming live session
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
                {isAdmin && (
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-300 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50/60 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] text-xs font-black text-white shadow-sm">
                                TLH
                            </span>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-slate-900">
                                    Administrator Oversight Mode
                                </p>
                                <p className="text-xs text-[#0066ff]">
                                    You have full administrative visibility to track live sessions, lesson media, student attendance, and discussions in this cohort.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("tracking")}
                                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${activeTab === "tracking" ? "bg-gradient-to-r from-[#0066ff] to-[#0099ff] text-white shadow-sm" : "bg-white text-blue-900 border border-sky-200 hover:bg-sky-50"}`}
                            >
                                📊 Track Cohort Space
                            </button>
                            <Link
                                to="/dashboard"
                                className="rounded-xl border border-sky-300 bg-white px-3.5 py-2 text-xs font-bold text-blue-900 transition hover:bg-sky-50"
                            >
                                ← Admin Dashboard
                            </Link>
                        </div>
                    </div>
                )}

                {feedback && (
                    <div className="mt-4 rounded-2xl bg-sky-50 p-3.5 text-xs font-bold text-blue-900 ring-1 ring-sky-200 flex justify-between items-center">
                        <span>{feedback}</span>
                        <button onClick={() => setFeedback("")} className="text-blue-600 hover:text-blue-900">✕</button>
                    </div>
                )}

                {/* TAB 1: Lessons & Video Player */}
                {activeTab === "player" && (
                    <div className="mt-6 grid gap-8 lg:grid-cols-3">
                        {/* Video Player Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl ring-1 ring-white/10">
                                {selectedVideoResource?.sourceType === "youtube" ? (
                                    <iframe
                                        src={selectedVideoResource.externalUrl}
                                        title={selectedVideoResource.title}
                                        className="w-full aspect-video border-0 bg-black"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                    />
                                ) : selectedVideoResource ? (
                                    <video
                                        ref={videoRef}
                                        src={resUrl(`/api/resources/${selectedVideoResource.storedKey}/file`)}
                                        controls
                                        controlsList={isStudent ? "nodownload" : undefined}
                                        onContextMenu={(e) => { if (isStudent) e.preventDefault(); }}
                                        onTimeUpdate={handleTimeUpdate}
                                        className="w-full aspect-video bg-black"
                                    />
                                ) : currentLesson?.videoUrl ? (
                                    <video
                                        ref={videoRef}
                                        src={currentLesson.videoUrl}
                                        controls
                                        controlsList={isStudent ? "nodownload" : undefined}
                                        onContextMenu={(e) => { if (isStudent) e.preventDefault(); }}
                                        onTimeUpdate={handleTimeUpdate}
                                        className="w-full aspect-video bg-black"
                                    />
                                ) : (
                                    <div className="aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-8 text-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-800/30 text-2xl text-emerald-400 mb-3">
                                            📺
                                        </div>
                                        <h3 className="text-base font-bold text-white">{currentLesson?.title}</h3>
                                        <p className="mt-1 text-xs text-slate-400 max-w-sm">
                                            Guided lesson notes and teacher live instructions are provided in scheduled Google Meet sessions.
                                        </p>
                                    </div>
                                )}

                                {/* Custom Player Controls Toolbar */}
                                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-slate-900/90 px-6 py-3 text-xs">
                                    {selectedVideoResource?.sourceType !== "youtube" && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400">Speed:</span>
                                            {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                                                <button
                                                    key={spd}
                                                    type="button"
                                                    onClick={() => handleSpeedChange(spd)}
                                                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold transition ${
                                                        playbackRate === spd
                                                            ? "bg-emerald-500 text-slate-950"
                                                            : "bg-white/10 text-white hover:bg-white/20"
                                                    }`}
                                                >
                                                    {spd}x
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <span className="text-[11px] text-slate-400 font-mono">
                                        {selectedVideoResource?.sourceType === "youtube" ? "YouTube video" : "Progress Auto-Saved"}
                                    </span>
                                </div>
                            </div>

                            {/* Lesson Overview Card */}
                            <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-stone-200">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                                    {selectedVideoResource ? "VIDEO RESOURCE" : "CURRENT LESSON"}
                                </span>
                                <h2 className="editorial-display mt-1 text-2xl font-bold text-stone-900">
                                    {selectedVideoResource?.title || currentLesson?.title}
                                </h2>
                                <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                                    {selectedVideoResource?.description || currentLesson?.description || "In this session, learners review core concepts, discuss practice exercises, and interact with the instructor."}
                                </p>
                            </div>
                        </div>

                        {/* Lessons Syllabus Sidebar */}
                        <div className="space-y-4">
                            {videoResources.length > 0 && (
                                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-stone-500">
                                            Interactive Videos ({videoResources.length})
                                        </h3>
                                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                            Lessons
                                        </span>
                                    </div>
                                    <div className="space-y-2.5 max-h-[30rem] overflow-y-auto pr-1">
                                        {videoResources.map((resource) => {
                                            const isSelected = selectedVideoResource?._id === resource._id;
                                            return (
                                                <button
                                                    key={resource._id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedVideoResource(resource);
                                                        setCurrentLesson(null);
                                                    }}
                                                    className={`group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-all ${
                                                        isSelected
                                                            ? "bg-gradient-to-r from-[#0066ff] to-[#0099ff] text-white shadow-md ring-2 ring-blue-500/40"
                                                            : "bg-stone-50 text-stone-800 hover:bg-stone-100"
                                                    }`}
                                                >
                                                    <div className="w-24 shrink-0 sm:w-28">
                                                        <VideoThumbnail resource={resource} aspect="aspect-video" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`line-clamp-2 text-xs font-bold ${isSelected ? "text-white" : "text-stone-900 group-hover:text-emerald-950"}`}>
                                                            {resource.title}
                                                        </p>
                                                        <p className={`mt-1 text-[10px] ${isSelected ? "text-emerald-200" : "text-stone-500"}`}>
                                                            {resource.sourceType === "youtube" ? "YouTube Stream" : "Uploaded Lesson"}
                                                        </p>
                                                        {isSelected && (
                                                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                                Now Playing
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                                <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-4">
                                    Syllabus Modules
                                </h3>
                                <div className="space-y-3">
                                    {classroom.course?.modules?.length > 0 ? (
                                        classroom.course.modules.map((mod, mIdx) => (
                                            <div key={mIdx} className="space-y-1.5">
                                                <div className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                                                    {mod.title}
                                                </div>
                                                <div className="space-y-1.5">
                                                    {mod.lessons.map((les, lIdx) => {
                                                        const isSelected = currentLesson?.title === les.title;
                                                        return (
                                                            <button
                                                                key={lIdx}
                                                                type="button"
                                                                onClick={() => {
                                                                    setCurrentLesson(les);
                                                                    setSelectedVideoResource(null);
                                                                }}
                                                                className={`group flex w-full items-center gap-3 rounded-2xl p-2 text-left text-xs transition ${
                                                                    isSelected
                                                                        ? "bg-emerald-800 text-white font-bold"
                                                                        : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                                                                }`}
                                                            >
                                                                {les.videoUrl ? (
                                                                    <div className="w-16 shrink-0">
                                                                        <VideoThumbnail lesson={les} aspect="aspect-video" />
                                                                    </div>
                                                                ) : (
                                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/60 text-xs text-stone-500 shadow-2xs">
                                                                        📄
                                                                    </span>
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="line-clamp-1">{les.title}</p>
                                                                    <span className={`text-[10px] font-mono ${isSelected ? "text-emerald-200" : "text-stone-400"}`}>
                                                                        {les.durationMinutes}m
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-stone-500">
                                            Teacher conducts live lessons according to the cohort schedule.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: In-Browser Document & PDF Viewer */}
                {activeTab === "documents" && (
                    <div className="mt-6 grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-4">
                            {selectedDoc ? (
                                <div className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-stone-900 text-base">{selectedDoc.title}</h3>
                                            <p className="text-xs text-stone-500">{selectedDoc.description || selectedDoc.originalFilename}</p>
                                        </div>
                                        {!isStudent ? (
                                            <a
                                                href={resUrl(`/api/resources/${selectedDoc._id}/download`)}
                                                className={`rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:from-[#0052cc] hover:to-[#0088e6] ${selectedDoc.sourceType !== "upload" ? "hidden" : ""}`}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                ⬇ Download file
                                            </a>
                                        ) : (
                                            <span className="rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
                                                🔒 Protected Workspace View
                                            </span>
                                        )}
                                    </div>

                                    {/* In-Browser PDF / Document Preview */}
                                    <div className="aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl bg-stone-100 overflow-hidden ring-1 ring-stone-200">
                                        {selectedDoc.sourceType === "google_drive" ? (
                                            <iframe
                                                src={selectedDoc.externalUrl}
                                                title={selectedDoc.title}
                                                className="h-full w-full border-0 bg-white"
                                                referrerPolicy="no-referrer"
                                                allow="autoplay"
                                            />
                                        ) : selectedDoc.mimeType?.startsWith("video/") ? (
                                            <video
                                                src={resUrl(`/api/resources/${selectedDoc.storedKey}/file`)}
                                                controls
                                                preload="metadata"
                                                className="h-full w-full bg-black"
                                                aria-label={selectedDoc.title}
                                            />
                                        ) : selectedDoc.mimeType?.includes("pdf") ? (
                                            <iframe
                                                src={resUrl(`/api/resources/${selectedDoc.storedKey}/file`)}
                                                title={selectedDoc.title}
                                                className="w-full h-full border-0"
                                            />
                                        ) : selectedDoc.mimeType?.includes("image") ? (
                                            <img
                                                src={resUrl(`/api/resources/${selectedDoc.storedKey}/file`)}
                                                alt={selectedDoc.title}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : /\.(docx|xlsx|pptx)$/i.test(selectedDoc.originalFilename || "") ? (
                                            <OfficeDocumentPreview resource={selectedDoc} />
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                                                <span className="text-4xl mb-2">📁</span>
                                                <h4 className="font-bold text-stone-800 text-sm">{selectedDoc.originalFilename || selectedDoc.title}</h4>
                                                <p className="text-xs text-stone-500 mt-1">
                                                    In-browser preview is optimized for PDF and images.
                                                </p>
                                                {!isStudent ? (
                                                    <a
                                                        href={resUrl(`/api/resources/${selectedDoc._id}/download`)}
                                                        className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white"
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Download resource
                                                    </a>
                                                ) : (
                                                    <span className="mt-4 inline-block rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
                                                        🔒 In-Workspace View Only
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-stone-200">
                                    <p className="text-xs text-stone-500">No course materials have been added for this cohort yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Resources List Sidebar — all resource types */}
                        <div className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 shadow-sm space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-2">
                                Available Materials ({resources.length})
                            </h3>
                            {resources.length === 0 && (
                                <p className="text-xs text-stone-400">No materials have been added for this cohort yet.</p>
                            )}
                            {resources.map((res) => {
                                const isVideo = isVideoResource(res);
                                const isSelected = isVideo
                                    ? selectedVideoResource?._id === res._id
                                    : selectedDoc?._id === res._id;
                                const fileIcon = res.sourceType === "google_drive" ? "☁️"
                                    : res.mimeType?.includes("pdf") ? "📕"
                                    : res.mimeType?.includes("image") ? "🖼️"
                                    : res.mimeType?.includes("spreadsheet") || res.category === "spreadsheet" ? "📊"
                                    : "📄";
                                return (
                                    <button
                                        key={res._id}
                                        type="button"
                                        onClick={() => {
                                            if (isVideo) {
                                                setSelectedVideoResource(res);
                                                setActiveTab("player");
                                            } else {
                                                setSelectedDoc(res);
                                                setActiveTab("documents");
                                            }
                                        }}
                                        className={`group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition ${
                                            isSelected
                                                ? "bg-emerald-50 ring-2 ring-emerald-400"
                                                : "bg-stone-50 hover:bg-stone-100"
                                        }`}
                                    >
                                        {isVideo ? (
                                            <div className="w-20 sm:w-24 shrink-0">
                                                <VideoThumbnail resource={res} aspect="aspect-video" />
                                            </div>
                                        ) : (
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-xs ring-1 ring-stone-200">
                                                {fileIcon}
                                            </span>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-stone-900 line-clamp-1 group-hover:text-emerald-950">{res.title}</p>
                                            <p className="text-[10px] text-stone-500">
                                                {res.sourceType === "youtube" ? "YouTube video"
                                                    : res.sourceType === "google_drive" ? `Google Drive · ${res.category}`
                                                    : res.fileSize ? `${(res.fileSize / 1024 / 1024).toFixed(1)} MB · ${res.category}`
                                                    : res.category}
                                            </p>
                                        </div>
                                        {isVideo && (
                                            <span className="shrink-0 text-[9px] font-black uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800 px-1.5 py-0.5">
                                                Watch
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 3: Cohort Discussions */}
                {activeTab === "discussions" && (
                    <div className="mt-6 max-w-4xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Cohort Discussion Board</h2>
                                <p className="text-xs text-stone-500">Collaborate with fellow students and your instructor.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setNewThreadModal(true)}
                                className="rounded-2xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:from-[#0052cc] hover:to-[#0088e6]"
                            >
                                + New Discussion Topic
                            </button>
                        </div>

                        {discussions.length === 0 ? (
                            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-stone-200">
                                <span className="text-3xl block mb-2">💬</span>
                                <h3 className="font-bold text-stone-900 text-sm">No discussions yet</h3>
                                <p className="text-xs text-stone-500 mt-1">Start a conversation or ask your teacher a question.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {discussions.map((disc) => (
                                    <div
                                        key={disc._id}
                                        className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 shadow-sm space-y-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700 uppercase">
                                                        {disc.category}
                                                    </span>
                                                    {disc.isPinned && (
                                                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                                            PINNED
                                                        </span>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteThread(disc._id)}
                                                            className="ml-auto text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline"
                                                        >
                                                            ✕ Delete Topic (Admin)
                                                        </button>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-stone-900 text-base mt-1.5">{disc.title}</h3>
                                                <p className="text-xs text-stone-500">
                                                    By <strong>{disc.author?.fullName || "Member"}</strong> ({disc.author?.role}) ·{" "}
                                                    {new Date(disc.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                                            {disc.content}
                                        </p>

                                        {/* Replies list */}
                                        {disc.replies?.length > 0 && (
                                            <div className="border-t border-stone-100 pt-3 space-y-2.5">
                                                <p className="text-[11px] font-bold text-stone-500">
                                                    Replies ({disc.replies.length}):
                                                </p>
                                                {disc.replies.map((rep, rIdx) => (
                                                    <div key={rIdx} className="rounded-2xl bg-stone-50 p-3 text-xs">
                                                        <div className="font-bold text-stone-800 flex items-center justify-between">
                                                            <span>{rep.author?.fullName || "Member"}</span>
                                                            <span className="text-[10px] font-normal text-stone-400">
                                                                {new Date(rep.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-stone-600">{rep.content}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Reply Input */}
                                        <div className="flex gap-2 pt-2 border-t border-stone-100">
                                            <input
                                                type="text"
                                                value={replyContent[disc._id] || ""}
                                                onChange={(e) =>
                                                    setReplyContent({ ...replyContent, [disc._id]: e.target.value })
                                                }
                                                placeholder="Write a reply…"
                                                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs outline-none focus:border-emerald-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddReply(disc._id)}
                                                className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shrink-0"
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4 (Admin only): Cohort Tracking */}
                {isAdmin && activeTab === "tracking" && (
                    <div className="mt-6 space-y-8">
                        {/* ── KPI Cards ── */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                            {[
                                { icon: "🎓", label: "Learners", value: trackingStats?.totalStudents ?? "—", sub: `of ${trackingStats?.capacity ?? "—"} capacity` },
                                { icon: "📊", label: "Fill Rate", value: trackingStats?.fillRate != null ? `${trackingStats.fillRate}%` : "—", sub: "enrolled" },
                                { icon: "📅", label: "Sessions", value: trackingStats?.totalSessions ?? "—", sub: `${trackingStats?.completedSessions ?? 0} completed` },
                                { icon: "📁", label: "Resources", value: trackingStats?.totalResources ?? "—", sub: "uploaded" },
                                { icon: "📝", label: "Assignments", value: trackingStats?.totalAssignments ?? "—", sub: "created" },
                                { icon: "💬", label: "Discussions", value: trackingStats?.discussionsCount ?? "—", sub: "threads" },
                            ].map((kpi) => (
                                <div key={kpi.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 flex flex-col gap-1">
                                    <span className="text-xl">{kpi.icon}</span>
                                    <p className="text-2xl font-black text-stone-900">{kpi.value}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{kpi.label}</p>
                                    <p className="text-[10px] text-stone-400">{kpi.sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Fill-rate bar ── */}
                        {trackingStats?.fillRate != null && (
                            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">Cohort Capacity Fill</span>
                                    <span className="text-xs font-bold text-[#0066ff]">{trackingStats.fillRate}%</span>
                                </div>
                                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#0066ff] to-[#00d2ff] transition-all"
                                        style={{ width: `${Math.min(trackingStats.fillRate, 100)}%` }}
                                    />
                                </div>
                                <p className="mt-1.5 text-[11px] text-stone-500">
                                    {trackingStats.totalStudents} learners enrolled out of {trackingStats.capacity} seats
                                </p>
                            </div>
                        )}

                        {/* ── Instructor Info ── */}
                        {(trackingData?.cohort?.teacher) && (
                            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                                <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-3">Assigned Instructor</h3>
                                <div className="flex items-center gap-3">
                                    {trackingData.cohort.teacher.avatarUrl ? (
                                        <img
                                            src={trackingData.cohort.teacher.avatarUrl}
                                            alt={trackingData.cohort.teacher.fullName}
                                            className="h-11 w-11 rounded-xl object-cover ring-1 ring-stone-200"
                                        />
                                    ) : (
                                        <div className="h-11 w-11 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] flex items-center justify-center text-xs font-black text-white shadow-sm">
                                            {(trackingData.cohort.teacher.fullName || "T").slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-stone-900">{trackingData.cohort.teacher.fullName || trackingData.cohort.teacher.name}</p>
                                        <p className="text-xs text-stone-500">{trackingData.cohort.teacher.email}</p>
                                    </div>
                                    <span className="ml-auto rounded-lg bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-800 ring-1 ring-sky-200">
                                        Instructor
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ── Enrolled Learners Roster ── */}
                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                            <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-4">
                                Enrolled Learners ({trackingData?.cohort?.students?.length || 0})
                            </h3>
                            {(trackingData?.cohort?.students?.length ?? 0) === 0 ? (
                                <p className="text-xs text-stone-400">No learners enrolled yet.</p>
                            ) : (
                                <div className="divide-y divide-stone-100">
                                    {trackingData.cohort.students.map((student, idx) => (
                                        <div key={student._id || idx} className="flex items-center gap-3 py-3">
                                            {student.avatarUrl ? (
                                                <img
                                                    src={student.avatarUrl}
                                                    alt={student.fullName}
                                                    className="h-9 w-9 rounded-xl object-cover ring-1 ring-stone-200"
                                                />
                                            ) : (
                                                <div className="h-9 w-9 shrink-0 rounded-xl bg-stone-200 flex items-center justify-center text-[10px] font-black text-stone-600">
                                                    {(student.fullName || student.name || "S").slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-stone-900 truncate">{student.fullName || student.name}</p>
                                                <p className="text-[10px] text-stone-500 truncate">{student.email}</p>
                                            </div>
                                            <span className="rounded-lg bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                                                Enrolled
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Live Session Tracker ── */}
                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
                            <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-4">
                                Session Schedule ({trackingData?.sessions?.length || 0} sessions)
                            </h3>
                            {(trackingData?.sessions?.length ?? 0) === 0 ? (
                                <p className="text-xs text-stone-400">No sessions scheduled for this cohort.</p>
                            ) : (
                                <div className="space-y-3">
                                    {trackingData.sessions.map((sess) => {
                                        const start = new Date(sess.startsAt);
                                        const end = new Date(sess.endsAt);
                                        const isLiveNow = Date.now() >= start.getTime() && Date.now() < end.getTime();
                                        const isCompleted = sess.status === "completed" || end.getTime() < Date.now();
                                        return (
                                            <div key={sess._id} className={`flex items-center gap-3 rounded-xl p-3 ${
                                                isLiveNow ? "bg-emerald-50 ring-1 ring-emerald-300" : isCompleted ? "bg-stone-50" : "bg-stone-50"
                                            }`}>
                                                <div className="flex flex-col items-center justify-center gap-1 w-12 shrink-0">
                                                    {isLiveNow ? (
                                                        <>
                                                            <span className="relative flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                                            </span>
                                                            <span className="text-[9px] font-black uppercase text-emerald-700">LIVE</span>
                                                        </>
                                                    ) : isCompleted ? (
                                                        <span className="text-lg">✅</span>
                                                    ) : (
                                                        <span className="text-lg">📅</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-stone-900 truncate">{sess.title}</p>
                                                    <p className="text-[10px] text-stone-500">
                                                        {start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} ·{" "}
                                                        {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        {classroom?.timeZone ? ` (${classroom.timeZone})` : ""}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <span className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                                        isLiveNow ? "bg-emerald-700 text-white" : isCompleted ? "bg-stone-200 text-stone-600" : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                        {isLiveNow ? "In Progress" : isCompleted ? "Completed" : "Scheduled"}
                                                    </span>
                                                    {sess.meetingUrl && (
                                                        <a
                                                            href={sess.meetingUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg bg-emerald-800 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                                                        >
                                                            Inspect Meet →
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Discussion Topic Modal */}
            <Modal
                isOpen={newThreadModal}
                onClose={() => setNewThreadModal(false)}
                title="Start a Discussion Topic"
            >
                <form onSubmit={handleCreateThread} className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        Topic Title
                        <input
                            required
                            type="text"
                            value={threadTitle}
                            onChange={(e) => setThreadTitle(e.target.value)}
                            placeholder="E.g. Question on Module 2 homework"
                            className="mt-1.5 w-full rounded-2xl border border-stone-200 px-4 py-3 text-xs font-medium outline-none focus:border-emerald-700"
                        />
                    </label>

                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        Category
                        <select
                            value={threadCategory}
                            onChange={(e) => setThreadCategory(e.target.value)}
                            className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-700"
                        >
                            <option value="general">General</option>
                            <option value="lesson">Lesson Question</option>
                            <option value="assignment">Assignment Help</option>
                            <option value="announcement">Announcement</option>
                        </select>
                    </label>

                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        Message Content
                        <textarea
                            required
                            rows={4}
                            value={threadContent}
                            onChange={(e) => setThreadContent(e.target.value)}
                            placeholder="Type your question or message for your cohort…"
                            className="mt-1.5 w-full rounded-2xl border border-stone-200 px-4 py-3 text-xs font-medium outline-none focus:border-emerald-700"
                        />
                    </label>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setNewThreadModal(false)}
                            className="rounded-2xl border border-stone-200 px-4 py-2 text-xs font-bold text-stone-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-2xl bg-gradient-to-r from-[#0066ff] to-[#0099ff] px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:from-[#0052cc] hover:to-[#0088e6]"
                        >
                            Post Topic
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
