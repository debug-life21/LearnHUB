import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL, apiRequest } from "../lib/api";
import { MetricCard, DashboardCard, EmptyState, Badge, Modal } from "../components/UIComponents";
export function StudentDashboard({ user }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("overview");
    const [classes, setClasses] = useState([]);
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [resources, setResources] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [progressData, setProgressData] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [feedback, setFeedback] = useState("");
    // Submit Assignment Modal
    const [submitModal, setSubmitModal] = useState({
        open: false,
        assignment: null,
        textResponse: "",
    });
    // Take Quiz Modal
    const [quizModal, setQuizModal] = useState({
        open: false,
        assessment: null,
        answers: {},
        result: null,
    });
    // Profile preferences form
    const [profileForm, setProfileForm] = useState({
        learningGoals: "",
        learningInterests: "Web Development",
        currentSkillLevel: "Beginner",
        preferredSchedule: "",
    });
    const loadStudentData = async () => {
        try {
            const [dash, classesRes, assignRes, quizRes, resRes, attendRes, progRes,] = await Promise.all([
                apiRequest("/api/student/dashboard"),
                apiRequest("/api/student/classes"),
                apiRequest("/api/student/assignments"),
                apiRequest("/api/student/assessments"),
                apiRequest("/api/resources"),
                apiRequest("/api/student/attendance"),
                apiRequest("/api/student/progress"),
            ]);
            setClasses(classesRes.classes);
            setUpcomingLessons(dash.upcomingLessons);
            setAssignments(assignRes.assignments);
            setAssessments(quizRes.assessments);
            setResources(resRes.resources);
            setAttendanceRecords(attendRes.records);
            setProgressData(progRes.progress);
            setNotifications(dash.notifications);
            if (dash.student?.studentProfile) {
                setProfileForm({
                    learningGoals: dash.student.studentProfile.learningGoals || "",
                    learningInterests: dash.student.studentProfile.learningInterests?.[0] || "Web Development",
                    currentSkillLevel: dash.student.studentProfile.currentSkillLevel || "Beginner",
                    preferredSchedule: dash.student.studentProfile.preferredSchedule || "",
                });
            }
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    useEffect(() => {
        void loadStudentData();
    }, []);
    // Submit Assignment Action
    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        if (!submitModal.assignment)
            return;
        try {
            await apiRequest(`/api/student/assignments/${submitModal.assignment._id}/submit`, {
                method: "POST",
                body: JSON.stringify({
                    textResponse: submitModal.textResponse,
                }),
            });
            setSubmitModal({ open: false, assignment: null, textResponse: "" });
            setFeedback("Assignment submitted.");
            void loadStudentData();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Open Quiz Modal
    const startQuiz = async (assessment) => {
        try {
            const res = await apiRequest(`/api/student/assessments/${assessment._id}`);
            setQuizModal({
                open: true,
                assessment: res.assessment,
                answers: {},
                result: null,
            });
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Submit Quiz Action
    const handleSubmitQuiz = async () => {
        if (!quizModal.assessment)
            return;
        const answersPayload = Object.entries(quizModal.answers).map(([questionId, selectedOption]) => ({
            questionId,
            selectedOption,
        }));
        try {
            const res = await apiRequest(`/api/student/assessments/${quizModal.assessment._id}/attempt`, {
                method: "POST",
                body: JSON.stringify({ answers: answersPayload }),
            });
            setQuizModal((prev) => ({
                ...prev,
                result: res.attempt,
            }));
            setFeedback("Assessment completed.");
            void loadStudentData();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Save Preferences Action
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            await apiRequest("/api/student/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    learningGoals: profileForm.learningGoals,
                    learningInterests: [profileForm.learningInterests],
                    currentSkillLevel: profileForm.currentSkillLevel,
                    preferredSchedule: profileForm.preferredSchedule,
                }),
            });
            setFeedback("Learning preferences updated.");
            void loadStudentData();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    const nextSession = upcomingLessons[0];
    return (<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Next Lesson Banner */}
      {nextSession ? (<div className="rounded-3xl bg-gradient-to-r from-blue-900 via-slate-900 to-cyan-950 p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-6 border border-cyan-500/20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Next live session</span>
            </div>
            <h2 className="mt-3 text-2xl font-black">{nextSession.title}</h2>
            <p className="mt-1 text-xs text-slate-300">
              {new Date(nextSession.startsAt).toLocaleString()} — {new Date(nextSession.endsAt).toLocaleTimeString()}
            </p>
          </div>
          {nextSession.meetingUrl ? (<a href={nextSession.meetingUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-cyan-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 transition-all hover:scale-105">
              📹 {t("joinMeeting")}
            </a>) : null}
        </div>) : null}

      {/* Student Welcome Card */}
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            {t("studentOverview")}
          </span>
          <h1 className="mt-1 text-3xl font-black text-slate-900">{user.fullName}</h1>
          <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={user.studentProfile?.placementStatus === "assigned" ? "emerald" : "amber"}>
            {user.studentProfile?.placementStatus === "assigned" ? "Cohort assigned" : "Awaiting cohort placement"}
          </Badge>
        </div>
      </div>

      {feedback ? (<div className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-900 ring-1 ring-blue-200 flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback("")} className="text-blue-500 hover:text-blue-800">✕</button>
        </div>) : null}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "classes", label: `My cohorts (${classes.length})`, icon: "🏫" },
            { id: "assignments", label: `Assignments (${assignments.length})`, icon: "📚" },
            { id: "assessments", label: `Assessments (${assessments.length})`, icon: "⏱️" },
            { id: "resources", label: `Learning resources (${resources.length})`, icon: "📁" },
            { id: "progress", label: "My progress", icon: "📈" },
            { id: "profile", label: "Learning preferences", icon: "⚙️" },
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
            <MetricCard label="My cohorts" value={classes.length} icon="📚"/>
            <MetricCard label="Upcoming sessions" value={upcomingLessons.length} icon="📹"/>
            <MetricCard label="Overall progress" value={`${progressData?.overallProgress ?? 0}%`} icon="📈"/>
            <MetricCard label="Attendance rate" value={`${progressData?.attendance?.percentage ?? 100}%`} icon="✅"/>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <DashboardCard title="My cohorts">
              <div className="space-y-4">
                {classes.length === 0 ? (<EmptyState title="No cohort assigned yet." description="Our team is reviewing your profile and will match you with a cohort soon."/>) : (classes.map((c) => (<div key={c._id} className="rounded-2xl border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">{c.title}</h4>
                        <Badge variant="blue">{c.course?.title || "General"}</Badge>
                      </div>
                      <p className="text-xs text-slate-600">
                        👨‍🏫 Instructor: <strong>{c.teacher?.fullName || "To be assigned"}</strong> ({c.teacher?.email || ""})
                      </p>
                    </div>)))}
              </div>
            </DashboardCard>

            <DashboardCard title="Recent notifications">
              <div className="space-y-3">
                {notifications.length === 0 ? (<EmptyState title="No new notifications."/>) : (notifications.map((n) => (<div key={n._id} className="rounded-xl bg-slate-50 p-3 text-xs">
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
            {classes.map((cls) => (<div key={cls._id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-slate-900">{cls.title}</h4>
                  <Badge variant="emerald">{cls.status}</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {cls.description || "Live sessions and practical learning with your cohort."}
                </p>
                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                  <p><strong>Program:</strong> {cls.course?.title}</p>
                  <p><strong>Instructor:</strong> {cls.teacher?.fullName || "Not assigned"}</p>
                  <p><strong>Time zone:</strong> {cls.timeZone}</p>
                </div>
              </div>))}
          </div>
        </div>) : null}

      {/* 3. ASSIGNMENTS */}
      {activeTab === "assignments" ? (<div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {assignments.length === 0 ? (<EmptyState title="No assignments yet."/>) : (assignments.map((asgn) => {
                const sub = asgn.submission;
                return (<div key={asgn._id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{asgn.title}</h4>
                      <Badge variant={sub ? (sub.status === "graded" ? "emerald" : "blue") : "amber"}>
                        {sub ? (sub.status === "graded" ? `Score: ${sub.score}/${asgn.maxScore}` : "Submitted") : "Not Submitted"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{asgn.instructions}</p>
                    <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span>Due: {new Date(asgn.dueDate).toLocaleDateString()}</span>
                      <span>Max score: {asgn.maxScore}</span>
                    </div>

                    {sub?.feedback ? (<div className="rounded-xl bg-blue-50 p-3 text-xs text-blue-900">
                        <strong>Instructor feedback:</strong> {sub.feedback}
                      </div>) : null}

                    {(!sub || sub.status !== "graded") ? (<button onClick={() => setSubmitModal({ open: true, assignment: asgn, textResponse: sub?.textResponse || "" })} className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors">
                        {sub ? "Resubmit" : t("submitWork")}
                      </button>) : null}
                  </div>);
            }))}
          </div>
        </div>) : null}

      {/* 4. ASSESSMENTS / QUIZZES */}
      {activeTab === "assessments" ? (<div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {assessments.length === 0 ? (<EmptyState title="No assessments yet."/>) : (assessments.map((qz) => {
                const att = qz.latestAttempt;
                return (<div key={qz._id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900">{qz.title}</h4>
                      {att ? (<Badge variant={att.passed ? "emerald" : "rose"}>
                          {att.percentage}% ({att.passed ? t("passed") : t("failed")})
                        </Badge>) : (<Badge variant="cyan">{qz.timeLimitMinutes} min</Badge>)}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{qz.description}</p>
                    <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span>Questions: {qz.questions?.length || 0}</span>
                      <span>Passing score: {qz.passingScorePercentage}%</span>
                    </div>

                    <button onClick={() => startQuiz(qz)} className="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 transition-colors">
                      {att ? "Try again" : t("takeAssessment")}
                    </button>
                  </div>);
            }))}
          </div>
        </div>) : null}

      {/* 5. RESOURCES */}
      {activeTab === "resources" ? (<div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.length === 0 ? (<EmptyState title="No resources have been added yet."/>) : (resources.map((res) => (<div key={res._id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 flex flex-col justify-between">
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
                </div>)))}
          </div>
        </div>) : null}

      {/* 6. PROGRESS & ATTENDANCE */}
      {activeTab === "progress" ? (<div className="space-y-8">
          <DashboardCard title="How your progress is measured">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 mb-2">
                  <span>Weighted progress</span>
                  <span className="text-blue-600">{progressData?.overallProgress ?? 0}%</span>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500 rounded-full" style={{ width: `${progressData?.overallProgress ?? 0}%` }}></div>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Progress combines attendance (40%), assignments (40%), and assessments (20%).
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-slate-100">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">Attendance (40%)</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {progressData?.attendance?.percentage ?? 100}%
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {progressData?.attendance?.attended ?? 0} of {progressData?.attendance?.total ?? 0} sessions
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">Assignments (40%)</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {progressData?.assignments?.percentage ?? 100}%
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {progressData?.assignments?.submitted ?? 0} of {progressData?.assignments?.total ?? 0} assignments
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">Assessments passed (20%)</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {progressData?.assessments?.passed ?? 0} assessments
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {progressData?.assessments?.totalAttempts ?? 0} assessment attempts
                  </p>
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Attendance history">
            <div className="divide-y divide-slate-100">
              {attendanceRecords.length === 0 ? (<EmptyState title="No attendance records yet."/>) : (attendanceRecords.map((rec) => (<div key={rec._id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{rec.session?.title || "Class Session"}</span>
                      <p className="text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={rec.status === "present" ? "emerald" : rec.status === "absent" ? "rose" : "amber"}>
                      {t(rec.status)}
                    </Badge>
                  </div>)))}
            </div>
          </DashboardCard>
        </div>) : null}

      {/* 7. PROFILE & PREFERENCES */}
      {activeTab === "profile" ? (<div className="max-w-xl mx-auto">
          <DashboardCard title="Learning goals and preferences">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200">
                💡 <strong>Note:</strong>Updating your preferences does not automatically change your cohort. Our team will review your goals and follow up if a change is needed.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">{t("learningInterests")}</label>
                <select value={profileForm.learningInterests} onChange={(e) => setProfileForm({ ...profileForm, learningInterests: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
                  <option value="Web Development">Web Development</option>
                  <option value="Programming">Programming</option>
                  <option value="Languages">Languages</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">{t("skillLevel")}</label>
                <select value={profileForm.currentSkillLevel} onChange={(e) => setProfileForm({ ...profileForm, currentSkillLevel: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">{t("preferredSchedule")}</label>
                <input type="text" value={profileForm.preferredSchedule} onChange={(e) => setProfileForm({ ...profileForm, preferredSchedule: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">{t("learningGoals")}</label>
                <textarea rows={3} value={profileForm.learningGoals} onChange={(e) => setProfileForm({ ...profileForm, learningGoals: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
              </div>

              <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
                Save preferences
              </button>
            </form>
          </DashboardCard>
        </div>) : null}

      {/* MODAL: Submit Assignment */}
      <Modal title={`Submit assignment: ${submitModal.assignment?.title || ""}`} isOpen={submitModal.open} onClose={() => setSubmitModal({ open: false, assignment: null, textResponse: "" })}>
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{submitModal.assignment?.instructions}</p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your response</label>
            <textarea required rows={4} value={submitModal.textResponse} onChange={(e) => setSubmitModal({ ...submitModal, textResponse: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none" placeholder="Write your response or share a link to your work…"/>
          </div>
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
            {t("submitWork")}
          </button>
        </form>
      </Modal>

      {/* MODAL: Take Quiz */}
      <Modal title={`Assessment: ${quizModal.assessment?.title || ""}`} isOpen={quizModal.open} onClose={() => setQuizModal({ open: false, assessment: null, answers: {}, result: null })}>
        {quizModal.result ? (<div className="space-y-4 text-center py-4">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${quizModal.result.passed ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
              {quizModal.result.passed ? "✓" : "!"}
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Score: {quizModal.result.score} / {quizModal.result.maxScore} ({quizModal.result.percentage}%)
            </h3>
            <p className="text-sm font-semibold text-slate-600">
              {quizModal.result.passed ? "Well done—you passed!" : "You did not reach the passing score this time. Review your work and try again."}
            </p>
            <button onClick={() => setQuizModal({ open: false, assessment: null, answers: {}, result: null })} className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white">
              Done
            </button>
          </div>) : (<div className="space-y-6">
            <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 pb-2">
              <span>Time limit: {quizModal.assessment?.timeLimitMinutes} min</span>
              <span>Passing score: {quizModal.assessment?.passingScorePercentage}%</span>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
              {quizModal.assessment?.questions?.map((q, idx) => (<div key={q._id} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                  <p className="font-bold text-sm text-slate-900">
                    {idx + 1}. {q.prompt}
                  </p>
                  <div className="space-y-2">
                    {q.options?.map((opt, optIdx) => {
                    const isSelected = quizModal.answers[q._id] === optIdx;
                    return (<button key={optIdx} type="button" onClick={() => setQuizModal((prev) => ({
                            ...prev,
                            answers: { ...prev.answers, [q._id]: optIdx },
                        }))} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs font-semibold transition-colors ${isSelected
                            ? "border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isSelected ? "bg-blue-600 text-white" : "border border-slate-300"}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>);
                })}
                  </div>
                </div>))}
            </div>

            <button onClick={handleSubmitQuiz} className="w-full rounded-xl bg-cyan-600 py-3 text-xs font-bold text-white hover:bg-cyan-700 shadow-sm">
              {t("submitAnswers")}
            </button>
          </div>)}
      </Modal>
    </div>);
}
