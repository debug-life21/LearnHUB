import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { Modal } from "../components/UIComponents";
import { LiveSessionButton } from "../components/LiveSessionButton";
import { formatSessionTime } from "../lib/sessionTime";
import { OfficeDocumentPreview } from "../components/OfficeDocumentPreview";
import { DashboardSidebar } from "../components/DashboardSidebar";

const isVideoResource = (resource) => (
    resource.sourceType === "youtube" ||
    resource.category === "video" ||
    resource.mimeType?.startsWith("video/")
);

export function LearningWorkspace() {
    const { classroomId } = useParams();
    const { user } = useAuth();

    const [classroom, setClassroom] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [resources, setResources] = useState([]);
    const [discussions, setDiscussions] = useState([]);
    const [activeTab, setActiveTab] = useState("player");
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
            const apiPrefix = isTeacher ? "/api/teacher" : "/api/student";

            // Fetch classes list to find this classroom
            const classesRes = await apiRequest(`${apiPrefix}/classes`);
            const matchedClass = (classesRes.classes || []).find((c) => c._id === classroomId);

            if (!matchedClass) {
                setFeedback("Classroom not found or you are not enrolled.");
                setLoading(false);
                return;
            }
            setClassroom(matchedClass);

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
            setSelectedDoc((current) => current || classResources.find((resource) => !isVideoResource(resource)) || null);
            setSelectedVideoResource((current) => current || classResources.find(isVideoResource) || null);

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
    }, [classroomId, user?.role]);

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
        const savedTime = localStorage.getItem(`learnhub_video_progress_${progressId}`);
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
                `learnhub_video_progress_${progressId}`,
                String(videoRef.current.currentTime)
            );
        }
    };

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
            const apiPrefix = user?.role === "teacher" ? "/api/teacher" : "/api/student";
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
            const apiPrefix = user?.role === "teacher" ? "/api/teacher" : "/api/student";
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
                {feedback && (
                    <div className="mt-4 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 flex justify-between items-center">
                        <span>{feedback}</span>
                        <button onClick={() => setFeedback("")} className="text-emerald-600 hover:text-emerald-900">✕</button>
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
                                        src={`/api/resources/${selectedVideoResource.storedKey}/file`}
                                        controls
                                        onTimeUpdate={handleTimeUpdate}
                                        className="w-full aspect-video bg-black"
                                    />
                                ) : currentLesson?.videoUrl ? (
                                    <video
                                        ref={videoRef}
                                        src={currentLesson.videoUrl}
                                        controls
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
                                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-4">
                                        Interactive Videos ({videoResources.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {videoResources.map((resource) => (
                                            <button
                                                key={resource._id}
                                                type="button"
                                                onClick={() => setSelectedVideoResource(resource)}
                                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs transition ${
                                                    selectedVideoResource?._id === resource._id
                                                        ? "bg-emerald-800 text-white font-bold"
                                                        : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                                                }`}
                                            >
                                                <span aria-hidden="true">▶</span>
                                                <span className="line-clamp-2">{resource.title}</span>
                                            </button>
                                        ))}
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
                                                <div className="space-y-1">
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
                                                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                                                                    isSelected
                                                                        ? "bg-emerald-800 text-white font-bold"
                                                                        : "bg-stone-50 text-stone-700 hover:bg-stone-100"
                                                                }`}
                                                            >
                                                                <span className="line-clamp-1">{les.title}</span>
                                                                <span className="text-[10px] opacity-75 font-mono">
                                                                    {les.durationMinutes}m
                                                                </span>
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
                                        <a
                                            href={`/api/resources/${selectedDoc._id}/download`}
                                            className={`rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-900 ${selectedDoc.sourceType !== "upload" ? "hidden" : ""}`}
                                            download
                                        >
                                            ⬇ Download file
                                        </a>
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
                                                src={`/api/resources/${selectedDoc.storedKey}/file`}
                                                controls
                                                preload="metadata"
                                                className="h-full w-full bg-black"
                                                aria-label={selectedDoc.title}
                                            />
                                        ) : selectedDoc.mimeType?.includes("pdf") ? (
                                            <iframe
                                                src={`/api/resources/${selectedDoc.storedKey}/file`}
                                                title={selectedDoc.title}
                                                className="w-full h-full border-0"
                                            />
                                        ) : selectedDoc.mimeType?.includes("image") ? (
                                            <img
                                                src={`/api/resources/${selectedDoc.storedKey}/file`}
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
                                                    In-browser preview is optimized for PDF and images. Download file to view locally.
                                                </p>
                                                <a
                                                    href={`/api/resources/${selectedDoc._id}/download`}
                                                    className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white"
                                                    download
                                                >
                                                    Download resource
                                                </a>
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

                        {/* Resources List Sidebar */}
                        <div className="rounded-3xl bg-white p-6 ring-1 ring-stone-200 shadow-sm space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-2">
                                Available Materials ({courseMaterials.length})
                            </h3>
                            {courseMaterials.map((res) => {
                                const isSelected = selectedDoc?._id === res._id;
                                return (
                                    <button
                                        key={res._id}
                                        type="button"
                                        onClick={() => setSelectedDoc(res)}
                                        className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left transition ${
                                            isSelected
                                                ? "bg-emerald-50 ring-1 ring-emerald-300"
                                                : "bg-stone-50 hover:bg-stone-100"
                                        }`}
                                    >
                                        <span className="text-lg">{res.sourceType === "youtube" ? "🎬" : "📄"}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-stone-900 line-clamp-1">{res.title}</p>
                                            <p className="text-[10px] text-stone-500">
                                                {res.sourceType === "youtube" ? "YouTube video" : res.sourceType === "google_drive" ? `Google Drive ${res.category}` : `${(res.fileSize / 1024 / 1024).toFixed(1)} MB · ${res.category}`}
                                            </p>
                                        </div>
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
                                className="rounded-2xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900"
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
                            className="rounded-2xl bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-900"
                        >
                            Post Topic
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
