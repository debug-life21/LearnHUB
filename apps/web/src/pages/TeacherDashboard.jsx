import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL, apiRequest } from "../lib/api";
import { MetricCard, DashboardCard, EmptyState, Badge, Modal } from "../components/UIComponents";
export function TeacherDashboard({ user }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("overview");
    const [classes, setClasses] = useState([]);
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [resources, setResources] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [feedback, setFeedback] = useState("");
    // Attendance state
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [attendanceRecords, setAttendanceRecords] = useState({});
    // Submissions state
    const [submissionsModal, setSubmissionsModal] = useState({
        open: false,
        assignment: null,
        list: [],
    });
    const [gradingState, setGradingState] = useState({
        subId: "",
        score: 0,
        feedback: "",
    });
    // Create Assignment Modal
    const [createAssignModal, setCreateAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({
        classroomId: "",
        title: "",
        description: "",
        instructions: "",
        dueDate: "",
        maxScore: 100,
    });
    // Create Assessment Modal
    const [createQuizModal, setCreateQuizModal] = useState(false);
    const [quizForm, setQuizForm] = useState({
        classroomId: "",
        title: "",
        description: "",
        timeLimitMinutes: 30,
        passingScorePercentage: 70,
        prompt: "",
        opt0: "",
        opt1: "",
        opt2: "",
        opt3: "",
        correctIdx: 0,
        explanation: "",
    });
    // Upload Resource Modal
    const [uploadModal, setUploadModal] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        title: "",
        description: "",
        classroomId: "",
        category: "document",
        originalFilename: "",
        mimeType: "application/pdf",
        base64Data: "",
    });
    const loadTeacherData = async () => {
        try {
            const [dash, classesRes, assignRes, quizRes, resRes] = await Promise.all([
                apiRequest("/api/teacher/dashboard"),
                apiRequest("/api/teacher/classes"),
                apiRequest("/api/teacher/assignments"),
                apiRequest("/api/teacher/assessments"),
                apiRequest("/api/resources"),
            ]);
            setClasses(classesRes.classes);
            setUpcomingLessons(dash.upcomingLessons);
            setAssignments(assignRes.assignments);
            setAssessments(quizRes.assessments);
            setResources(resRes.resources);
            setNotifications(dash.notifications);
            if (dash.upcomingLessons[0] && !selectedSessionId) {
                setSelectedSessionId(dash.upcomingLessons[0]._id);
            }
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    useEffect(() => {
        void loadTeacherData();
    }, []);
    // Handle Attendance Change
    const setStudentAttendance = (studentId, status) => {
        setAttendanceRecords((prev) => ({
            ...prev,
            [studentId]: {
                status,
                notes: prev[studentId]?.notes || "",
            },
        }));
    };
    const saveAttendance = async () => {
        if (!selectedSessionId)
            return;
        const records = Object.entries(attendanceRecords).map(([studentId, data]) => ({
            studentId,
            status: data.status,
            notes: data.notes,
        }));
        try {
            await apiRequest(`/api/teacher/sessions/${selectedSessionId}/attendance`, {
                method: "POST",
                body: JSON.stringify({ records }),
            });
            setFeedback("የመገኘት መረጃ በስኬት ተመዝግቧል! / Attendance recorded.");
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Create Assignment
    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        try {
            await apiRequest("/api/teacher/assignments", {
                method: "POST",
                body: JSON.stringify({
                    classroomId: assignForm.classroomId || classes[0]?._id,
                    title: assignForm.title,
                    description: assignForm.description,
                    instructions: assignForm.instructions,
                    dueDate: new Date(assignForm.dueDate).toISOString(),
                    maxScore: Number(assignForm.maxScore),
                }),
            });
            setCreateAssignModal(false);
            setFeedback("አዲስ የተግባር ስራ ተፈጥሯል! / Assignment created.");
            void loadTeacherData();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // View Submissions
    const openSubmissions = async (assignment) => {
        try {
            const res = await apiRequest(`/api/teacher/assignments/${assignment._id}/submissions`);
            setSubmissionsModal({
                open: true,
                assignment,
                list: res.submissions,
            });
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Grade Submission
    const handleGradeSubmission = async () => {
        try {
            await apiRequest(`/api/teacher/submissions/${gradingState.subId}/grade`, {
                method: "PATCH",
                body: JSON.stringify({
                    score: Number(gradingState.score),
                    feedback: gradingState.feedback,
                }),
            });
            setFeedback("ውጤት ተመዝግቧል! / Grade saved.");
            setGradingState({ subId: "", score: 0, feedback: "" });
            if (submissionsModal.assignment) {
                openSubmissions(submissionsModal.assignment);
            }
            void loadTeacherData();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Create Quiz
    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        try {
            await apiRequest("/api/teacher/assessments", {
                method: "POST",
                body: JSON.stringify({
                    classroomId: quizForm.classroomId || classes[0]?._id,
                    title: quizForm.title,
                    description: quizForm.description,
                    timeLimitMinutes: Number(quizForm.timeLimitMinutes),
                    passingScorePercentage: Number(quizForm.passingScorePercentage),
                    questions: [
                        {
                            prompt: quizForm.prompt,
                            options: [quizForm.opt0, quizForm.opt1, quizForm.opt2, quizForm.opt3].filter(Boolean),
                            correctOptionIndex: Number(quizForm.correctIdx),
                            explanation: quizForm.explanation,
                            points: 1,
                        },
                    ],
                }),
            });
            setCreateQuizModal(false);
            setFeedback("አዲስ ፈተና ተዘጋጅቷል! / Assessment created.");
            void loadTeacherData();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // File Upload
    const handleFileUpload = async (e) => {
        e.preventDefault();
        try {
            await apiRequest("/api/resources/upload", {
                method: "POST",
                body: JSON.stringify({
                    title: uploadForm.title,
                    description: uploadForm.description,
                    classroomId: uploadForm.classroomId || classes[0]?._id,
                    category: uploadForm.category,
                    originalFilename: uploadForm.originalFilename || "document.pdf",
                    mimeType: uploadForm.mimeType || "application/pdf",
                    base64Data: uploadForm.base64Data || btoa("LearnHUB Sample Resource Content"),
                    visibility: "class_only",
                }),
            });
            setUploadModal(false);
            setFeedback("የትምህርት ፋይል ተጭኗል! / Resource uploaded.");
            void loadTeacherData();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    const currentClassForAttendance = classes.find((c) => c.students?.length > 0);
    return (<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            {t("teacherOverview")}
          </span>
          <h1 className="mt-2 text-3xl font-black">{user.fullName}</h1>
          <p className="mt-1 text-sm text-slate-400">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreateAssignModal(true)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold hover:bg-blue-500 transition-colors">
            + {t("createAssignment")}
          </button>
          <button onClick={() => setCreateQuizModal(true)} className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold hover:bg-cyan-500 transition-colors">
            + {t("createAssessment")}
          </button>
          <button onClick={() => setUploadModal(true)} className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold hover:bg-slate-700 transition-colors">
            + {t("uploadResource")}
          </button>
        </div>
      </div>

      {feedback ? (<div className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-900 ring-1 ring-blue-200 flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback("")} className="text-blue-500 hover:text-blue-800">✕</button>
        </div>) : null}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
            { id: "overview", label: "አጠቃላይ / Overview", icon: "📊" },
            { id: "classes", label: `የእኔ ክፍሎች / Classes (${classes.length})`, icon: "🏫" },
            { id: "schedule", label: `የቀጥታ ትምህርት / Live Lessons (${upcomingLessons.length})`, icon: "📹" },
            { id: "attendance", label: "መገኘት / Attendance Tracker", icon: "📝" },
            { id: "assignments", label: `ስራዎች / Assignments (${assignments.length})`, icon: "📚" },
            { id: "assessments", label: `ፈተናዎች / Quizzes (${assessments.length})`, icon: "⏱️" },
            { id: "resources", label: `ፋይሎች / Resources (${resources.length})`, icon: "📁" },
        ].map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200"}`}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>))}
      </div>

      {/* 1. OVERVIEW */}
      {activeTab === "overview" ? (<div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="የተመደቡ ክፍሎች / Assigned Classes" value={classes.length} icon="🏫"/>
            <MetricCard label="የቀጣይ ክፍለ ጊዜዎች / Upcoming" value={upcomingLessons.length} icon="📹"/>
            <MetricCard label="ጠቅላላ ተማሪዎች / Students" value={classes.reduce((acc, c) => acc + (c.students?.length || 0), 0)} icon="🎓"/>
            <MetricCard label="የተሰሩ ስራዎች / Assignments Posted" value={assignments.length} icon="📚"/>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <DashboardCard title="የቀጣይ ክፍለ ጊዜዎች / Next Live Lessons">
              <div className="space-y-4">
                {upcomingLessons.length === 0 ? (<EmptyState title="ምንም የታቀደ ክፍለ ጊዜ የለም"/>) : (upcomingLessons.map((session) => (<div key={session._id} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">{session.title}</h4>
                        <Badge variant="cyan">{new Date(session.startsAt).toLocaleTimeString()}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(session.startsAt).toLocaleDateString()}
                      </p>
                      {session.meetingUrl ? (<div className="pt-2">
                          <a href={session.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 transition-colors">
                            <span>📹</span>
                            <span>{t("joinMeeting")}</span>
                          </a>
                        </div>) : null}
                    </div>)))}
              </div>
            </DashboardCard>

            <DashboardCard title="የቅርብ ጊዜ ማሳወቂያዎች / Recent Notifications">
              <div className="space-y-3">
                {notifications.length === 0 ? (<EmptyState title="ምንም ማሳወቂያ የለም"/>) : (notifications.map((n) => (<div key={n._id} className="rounded-xl bg-slate-50 p-3 text-xs">
                      <p className="font-bold text-slate-900">{n.title}</p>
                      <p className="mt-1 text-slate-600">{n.message}</p>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>)))}
              </div>
            </DashboardCard>
          </div>
        </div>) : null}

      {/* 2. CLASSES */}
      {activeTab === "classes" ? (<div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {classes.map((cls) => (<div key={cls._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900">{cls.title}</h4>
                  <Badge variant="emerald">{cls.status}</Badge>
                </div>
                <p className="text-xs text-slate-600"><strong>ኮርስ:</strong> {cls.course?.title || "General"}</p>
                <div className="border-t border-slate-100 pt-3">
                  <h5 className="text-xs font-bold text-slate-700 mb-2">
                    የተመደቡ ተማሪዎች ({cls.students?.length || 0}):
                  </h5>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {cls.students?.map((s) => (<div key={s._id} className="rounded-lg bg-slate-50 p-2 text-xs flex justify-between">
                        <span className="font-semibold text-slate-800">{s.fullName}</span>
                        <span className="text-slate-400">{s.email}</span>
                      </div>))}
                  </div>
                </div>
              </div>))}
          </div>
        </div>) : null}

      {/* 3. SCHEDULE */}
      {activeTab === "schedule" ? (<div className="space-y-6">
          <DashboardCard title="የቀጥታ ትምህርት መርሃ ግብር (Google Meet)">
            <div className="space-y-4">
              {upcomingLessons.map((session) => (<div key={session._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5">
                  <div>
                    <h4 className="font-bold text-slate-900">{session.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(session.startsAt).toLocaleString()} — {new Date(session.endsAt).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{session.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {session.meetingUrl ? (<a href={session.meetingUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700">
                        {t("joinMeeting")}
                      </a>) : null}
                  </div>
                </div>))}
            </div>
          </DashboardCard>
        </div>) : null}

      {/* 4. ATTENDANCE TRACKER */}
      {activeTab === "attendance" ? (<div className="space-y-6">
          <DashboardCard title="የክፍለ ጊዜ መገኘት መዝገብ (Attendance Tracker)" subtitle="የክፍለ ጊዜ ተማሪዎችን መገኘት Present, Absent, Late ወይም Excused በማለት መዝግቡ">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ክፍለ ጊዜ ይምረጡ / Session</label>
                <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="w-full sm:w-96 rounded-xl border border-slate-200 p-2.5 text-xs outline-none bg-white">
                  {upcomingLessons.map((s) => (<option key={s._id} value={s._id}>
                      {s.title} ({new Date(s.startsAt).toLocaleDateString()})
                    </option>))}
                </select>
              </div>

              {currentClassForAttendance ? (<div className="divide-y divide-slate-100">
                  {currentClassForAttendance.students.map((stud) => {
                    const currentStatus = attendanceRecords[stud._id]?.status || "present";
                    return (<div key={stud._id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-sm text-slate-900">{stud.fullName}</p>
                          <p className="text-xs text-slate-400">{stud.email}</p>
                        </div>
                        <div className="flex gap-1.5">
                          {["present", "absent", "late", "excused"].map((st) => (<button key={st} type="button" onClick={() => setStudentAttendance(stud._id, st)} className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${currentStatus === st
                                ? st === "present"
                                    ? "bg-emerald-600 text-white"
                                    : st === "absent"
                                        ? "bg-rose-600 text-white"
                                        : st === "late"
                                            ? "bg-amber-500 text-white"
                                            : "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                              {t(st)}
                            </button>))}
                        </div>
                      </div>);
                })}
                </div>) : (<EmptyState title="ምንም ተማሪዎች በዚህ ክፍል ውስጥ የሉም"/>)}

              <button onClick={saveAttendance} className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800">
                {t("markAttendance")}
              </button>
            </div>
          </DashboardCard>
        </div>) : null}

      {/* 5. ASSIGNMENTS */}
      {activeTab === "assignments" ? (<div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">የተሰጡ ስራዎች (Assignments)</h3>
            <button onClick={() => setCreateAssignModal(true)} className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
              + {t("createAssignment")}
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {assignments.map((asgn) => (<div key={asgn._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{asgn.title}</h4>
                  <Badge variant="blue">{asgn.maxScore} pts</Badge>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{asgn.instructions}</p>
                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span>ማስረከቢያ: {new Date(asgn.dueDate).toLocaleDateString()}</span>
                  <span className="font-bold text-blue-600">
                    {asgn.submissionCount || 0} ገብቷል ({asgn.gradedCount || 0} ታርሟል)
                  </span>
                </div>
                <button onClick={() => openSubmissions(asgn)} className="w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200">
                  የተማሪ ስራዎችን ተመልከት / Submissions
                </button>
              </div>))}
          </div>
        </div>) : null}

      {/* 6. ASSESSMENTS / QUIZZES */}
      {activeTab === "assessments" ? (<div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">ፈተናዎች እና ጥያቄዎች (Quizzes)</h3>
            <button onClick={() => setCreateQuizModal(true)} className="rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-cyan-700">
              + {t("createAssessment")}
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {assessments.map((qz) => (<div key={qz._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{qz.title}</h4>
                  <Badge variant="cyan">{qz.timeLimitMinutes} ደቂቃ</Badge>
                </div>
                <p className="text-xs text-slate-600">{qz.description}</p>
                <div className="text-xs text-slate-500 border-t border-slate-100 pt-2 flex justify-between">
                  <span>የጥያቄዎች ብዛት: {qz.questions?.length || 0}</span>
                  <span>ማለፊያ: {qz.passingScorePercentage}%</span>
                </div>
              </div>))}
          </div>
        </div>) : null}

      {/* 7. RESOURCES */}
      {activeTab === "resources" ? (<div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">የትምህርት ፋይሎች እና ሰነዶች</h3>
            <button onClick={() => setUploadModal(true)} className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
              + {t("uploadResource")}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((res) => (<div key={res._id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 flex flex-col justify-between">
                <div>
                  <Badge variant="indigo">{res.category}</Badge>
                  <h4 className="font-bold text-slate-900 mt-2">{res.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{res.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400">{(res.fileSize / 1024).toFixed(1)} KB</span>
                  <a href={`${API_BASE_URL}/api/resources/${res._id}/download`} className="font-bold text-blue-600 hover:underline">
                    {t("download")} ↓
                  </a>
                </div>
              </div>))}
          </div>
        </div>) : null}

      {/* MODAL: View Submissions & Grade */}
      <Modal title={`የተማሪ ስራዎች: ${submissionsModal.assignment?.title || ""}`} isOpen={submissionsModal.open} onClose={() => setSubmissionsModal({ open: false, assignment: null, list: [] })}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {submissionsModal.list.length === 0 ? (<EmptyState title="እስካሁን ምንም የተላከ ስራ የለም"/>) : (submissionsModal.list.map((sub) => (<div key={sub._id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{sub.student?.fullName}</span>
                  <Badge variant={sub.status === "graded" ? "emerald" : "amber"}>
                    {sub.status === "graded" ? `${sub.score} pts` : "Submitted"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">{sub.textResponse || "ፋይል ተያይዟል"}</p>
                {sub.feedback ? <p className="text-xs text-blue-700">አስተያየት: {sub.feedback}</p> : null}

                {/* Inline Grading Form */}
                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <input type="number" max={submissionsModal.assignment?.maxScore || 100} placeholder="ውጤት" className="w-20 rounded-lg border border-slate-200 p-1 text-xs" onChange={(e) => setGradingState({ ...gradingState, subId: sub._id, score: Number(e.target.value) })}/>
                  <input type="text" placeholder="አስተያየት / Feedback" className="flex-1 rounded-lg border border-slate-200 p-1 text-xs" onChange={(e) => setGradingState({ ...gradingState, subId: sub._id, feedback: e.target.value })}/>
                  <button onClick={handleGradeSubmission} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700">
                    {t("saveGrade")}
                  </button>
                </div>
              </div>)))}
        </div>
      </Modal>

      {/* MODAL: Create Assignment */}
      <Modal title={t("createAssignment")} isOpen={createAssignModal} onClose={() => setCreateAssignModal(false)}>
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">ክፍል / Classroom</label>
            <select value={assignForm.classroomId} onChange={(e) => setAssignForm({ ...assignForm, classroomId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
              {classes.map((c) => (<option key={c._id} value={c._id}>{c.title}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("title")}</label>
            <input required type="text" value={assignForm.title} onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">መመሪያዎች / Instructions</label>
            <textarea required rows={3} value={assignForm.instructions} onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">{t("dueDate")}</label>
              <input required type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">ከፍተኛ ነጥብ / Max Score</label>
              <input required type="number" value={assignForm.maxScore} onChange={(e) => setAssignForm({ ...assignForm, maxScore: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none"/>
            </div>
          </div>
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white">
            {t("createAssignment")}
          </button>
        </form>
      </Modal>

      {/* MODAL: Create Quiz */}
      <Modal title={t("createAssessment")} isOpen={createQuizModal} onClose={() => setCreateQuizModal(false)}>
        <form onSubmit={handleCreateQuiz} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("title")}</label>
            <input required type="text" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">ጥያቄ (Question Prompt)</label>
            <input required type="text" value={quizForm.prompt} onChange={(e) => setQuizForm({ ...quizForm, prompt: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none" placeholder="ለምሳሌ፡ React Hook ምንድን ነው?"/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input required type="text" placeholder="ምርጫ 1 (Option A)" value={quizForm.opt0} onChange={(e) => setQuizForm({ ...quizForm, opt0: e.target.value })} className="rounded-xl border border-slate-200 p-2 text-xs outline-none"/>
            <input required type="text" placeholder="ምርጫ 2 (Option B)" value={quizForm.opt1} onChange={(e) => setQuizForm({ ...quizForm, opt1: e.target.value })} className="rounded-xl border border-slate-200 p-2 text-xs outline-none"/>
            <input type="text" placeholder="ምርጫ 3 (Option C)" value={quizForm.opt2} onChange={(e) => setQuizForm({ ...quizForm, opt2: e.target.value })} className="rounded-xl border border-slate-200 p-2 text-xs outline-none"/>
            <input type="text" placeholder="ምርጫ 4 (Option D)" value={quizForm.opt3} onChange={(e) => setQuizForm({ ...quizForm, opt3: e.target.value })} className="rounded-xl border border-slate-200 p-2 text-xs outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">ትክክለኛ ምርጫ / Correct Option</label>
            <select value={quizForm.correctIdx} onChange={(e) => setQuizForm({ ...quizForm, correctIdx: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
              <option value={0}>ምርጫ 1 (Option A)</option>
              <option value={1}>ምርጫ 2 (Option B)</option>
              <option value={2}>ምርጫ 3 (Option C)</option>
              <option value={3}>ምርጫ 4 (Option D)</option>
            </select>
          </div>
          <button type="submit" className="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white">
            {t("createAssessment")}
          </button>
        </form>
      </Modal>

      {/* MODAL: Upload Resource */}
      <Modal title={t("uploadResource")} isOpen={uploadModal} onClose={() => setUploadModal(false)}>
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("title")}</label>
            <input required type="text" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("description")}</label>
            <textarea rows={2} value={uploadForm.description} onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">ፋይል ይምረጡ / Choose File</label>
            <input type="file" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(",")[1];
                    setUploadForm({
                        ...uploadForm,
                        originalFilename: file.name,
                        mimeType: file.type || "application/pdf",
                        base64Data: base64,
                    });
                };
                reader.readAsDataURL(file);
            }
        }} className="mt-1 w-full text-xs"/>
          </div>
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white">
            {t("uploadResource")}
          </button>
        </form>
      </Modal>
    </div>);
}
