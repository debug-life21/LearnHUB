import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../lib/api";
import { MetricCard, DashboardCard, EmptyState, Badge, Modal } from "../components/UIComponents";
export function AdminDashboard({ user }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("overview");
    // State collections
    const [metrics, setMetrics] = useState({});
    const [applications, setApplications] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [reportsData, setReportsData] = useState(null);
    const [reportsLoaded, setReportsLoaded] = useState(false);
    const [isReportsLoading, setIsReportsLoading] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [loadError, setLoadError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [teacherSearch, setTeacherSearch] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [courseSearch, setCourseSearch] = useState("");
    const [courseCategory, setCourseCategory] = useState("");
    const [coursePage, setCoursePage] = useState(1);
    // Modals
    const [rejectionModal, setRejectionModal] = useState({
        open: false,
        appId: "",
        reason: "",
    });
    const [placementModal, setPlacementModal] = useState({ open: false, studentId: "", studentName: "", classId: "" });
    const [teacherAssignmentModal, setTeacherAssignmentModal] = useState({ open: false, classId: "", classTitle: "", teacherId: "" });
    const [deleteUserModal, setDeleteUserModal] = useState(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);
    const [deleteUserError, setDeleteUserError] = useState("");
    const [createCourseModal, setCreateCourseModal] = useState(false);
    const [createClassModal, setCreateClassModal] = useState(false);
    const [createCategoryModal, setCreateCategoryModal] = useState(false);
    const [createSessionModal, setCreateSessionModal] = useState(false);
    const [createAnnouncementModal, setCreateAnnouncementModal] = useState(false);
    // Forms
    const [courseForm, setCourseForm] = useState({
        title: "",
        description: "",
        categoryId: "",
        skillLevel: "Beginner",
        objectives: "",
    });
    const [classForm, setClassForm] = useState({
        title: "",
        courseId: "",
        teacherId: "",
        capacity: 20,
        timeZone: "Africa/Addis_Ababa",
        description: "",
    });
    const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
    const [sessionForm, setSessionForm] = useState({
        classId: "",
        title: "",
        description: "",
        startsAt: "",
        endsAt: "",
        meetingUrl: "",
    });
    const [announcementForm, setAnnouncementForm] = useState({
        title: "",
        content: "",
        target: "all_students",
        priority: "normal",
    });
    const availableClasses = useMemo(
        () => classes.filter((classroom) => classroom.students?.length < classroom.capacity),
        [classes],
    );
    const schedulableClasses = useMemo(
        () => classes.filter((classroom) => classroom.teacher?._id),
        [classes],
    );
    const activeTeachers = useMemo(
        () => teachers.filter((teacher) => teacher.accountStatus === "active"),
        [teachers],
    );
    const getPlacementClasses = useCallback(
        (studentId) => availableClasses.filter((classroom) => !classroom.students?.some((student) => String(student?._id ?? student) === studentId)),
        [availableClasses],
    );
    const placementClasses = useMemo(
        () => getPlacementClasses(placementModal.studentId),
        [getPlacementClasses, placementModal.studentId],
    );
    const visibleTeachers = useMemo(() => {
        const query = teacherSearch.trim().toLowerCase();
        return teachers.filter((teacher) => `${teacher.fullName} ${teacher.email}`.toLowerCase().includes(query));
    }, [teacherSearch, teachers]);
    const visibleStudents = useMemo(() => {
        const query = studentSearch.trim().toLowerCase();
        return students.filter((student) => `${student.fullName} ${student.email}`.toLowerCase().includes(query));
    }, [studentSearch, students]);
    const pendingApplications = useMemo(
        () => applications.filter((application) => application.status === "pending"),
        [applications],
    );
    const pendingStudents = useMemo(
        () => students.filter((student) => student.studentProfile?.placementStatus === "pending"),
        [students],
    );
    const visibleCourses = useMemo(() => {
        const query = courseSearch.trim().toLowerCase();
        return courses.filter((course) => {
            const matchesCategory = !courseCategory || course.category?._id === courseCategory;
            const matchesSearch = !query || `${course.title} ${course.description} ${course.category?.name || ""}`.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [courseCategory, courseSearch, courses]);
    const coursesPerPage = 12;
    const totalCoursePages = Math.ceil(visibleCourses.length / coursesPerPage);
    const pagedCourses = visibleCourses.slice((coursePage - 1) * coursesPerPage, coursePage * coursesPerPage);

    const loadAll = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const [dash, appsRes, teachRes, studRes, catRes, courseRes, classRes, annRes] = await Promise.all([
                apiRequest("/api/admin/dashboard"),
                apiRequest("/api/admin/teacher-applications"),
                apiRequest("/api/admin/teachers"),
                apiRequest("/api/admin/students"),
                apiRequest("/api/admin/categories"),
                apiRequest("/api/admin/courses"),
                apiRequest("/api/admin/classes"),
                apiRequest("/api/admin/announcements"),
            ]);
            setMetrics(dash.metrics);
            setApplications(appsRes.applications);
            setTeachers(teachRes.teachers);
            setStudents(studRes.students);
            setCategories(catRes.categories);
            setCourses(courseRes.courses);
            setClasses(classRes.classes);
            setAnnouncements(annRes.announcements);
            return true;
        }
        catch (err) {
            setLoadError(err instanceof Error ? err.message : "Unable to load admin dashboard data.");
            return false;
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const loadReports = useCallback(async () => {
        setIsReportsLoading(true);
        setLoadError("");
        try {
            const [auditRes, reportsRes] = await Promise.all([
                apiRequest("/api/admin/audit-logs"),
                apiRequest("/api/admin/reports"),
            ]);
            setAuditLogs(auditRes.logs);
            setReportsData(reportsRes);
            setReportsLoaded(true);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : "Unable to load reports and activity.");
        } finally {
            setIsReportsLoading(false);
        }
    }, []);
    useEffect(() => {
        void loadAll();
    }, [loadAll]);
    // Action: Approve / Reject teacher
    const handleTeacherApprove = async (appId) => {
        try {
            await apiRequest(`/api/admin/teacher-applications/${appId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "approved" }),
            });
            setFeedback("Instructor approved.");
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    const handleTeacherReject = async () => {
        try {
            await apiRequest(`/api/admin/teacher-applications/${rejectionModal.appId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "rejected", rejectionReason: rejectionModal.reason }),
            });
            setRejectionModal({ open: false, appId: "", reason: "" });
            setFeedback("Application declined.");
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Action: Toggle teacher status
    const handleToggleTeacherStatus = async (teacherId, currentStatus) => {
        const nextStatus = currentStatus === "active" ? "suspended" : "active";
        try {
            await apiRequest(`/api/admin/teachers/${teacherId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: nextStatus }),
            });
            setFeedback(`Instructor status updated: ${nextStatus}`);
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    const handleDeleteUser = async () => {
        if (!deleteUserModal || isDeletingUser) return;
        setIsDeletingUser(true);
        setDeleteUserError("");
        try {
            const response = await apiRequest(`/api/admin/users/${deleteUserModal.id}`, { method: "DELETE" });
            setDeleteUserModal(null);
            setFeedback(response.message);
            await loadAll();
        } catch (err) {
            setDeleteUserError(err instanceof Error ? err.message : "Could not delete the account. Please try again.");
        } finally {
            setIsDeletingUser(false);
        }
    };
    // Action: Place Student
    const handlePlaceStudent = async () => {
        if (!placementModal.classId)
            return;
        try {
            await apiRequest(`/api/admin/classes/${placementModal.classId}/assign-student`, {
                method: "POST",
                body: JSON.stringify({ studentId: placementModal.studentId }),
            });
            setPlacementModal({ open: false, studentId: "", studentName: "", classId: "" });
            setFeedback("Learner placed in the cohort.");
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    const handleAssignTeacher = async (event) => {
        event.preventDefault();
        if (!teacherAssignmentModal.classId || !teacherAssignmentModal.teacherId)
            return;
        try {
            await apiRequest(`/api/admin/classes/${teacherAssignmentModal.classId}/assign-teacher`, {
                method: "POST",
                body: JSON.stringify({ teacherId: teacherAssignmentModal.teacherId }),
            });
            setTeacherAssignmentModal({ open: false, classId: "", classTitle: "", teacherId: "" });
            setFeedback("Instructor assigned.");
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Action: Create Course
    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            await apiRequest("/api/admin/courses", {
                method: "POST",
                body: JSON.stringify({
                    title: courseForm.title,
                    description: courseForm.description,
                    categoryId: courseForm.categoryId || categories[0]?._id,
                    skillLevel: courseForm.skillLevel,
                    learningObjectives: courseForm.objectives.split("\n").filter((o) => o.trim()),
                    status: "published",
                }),
            });
            setCreateCourseModal(false);
            setCourseForm({ title: "", description: "", categoryId: "", skillLevel: "Beginner", objectives: "" });
            setFeedback("Program created.");
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Action: Create Category
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await apiRequest("/api/admin/categories", {
                method: "POST",
                body: JSON.stringify({ name: categoryForm.name, description: categoryForm.description }),
            });
            setCreateCategoryModal(false);
            setCategoryForm({ name: "", description: "" });
            setFeedback("Category created.");
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Action: Create Class
    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await apiRequest("/api/admin/classes", {
                method: "POST",
                body: JSON.stringify({
                    title: classForm.title,
                    courseId: classForm.courseId || courses[0]?._id,
                    teacherId: classForm.teacherId || undefined,
                    capacity: Number(classForm.capacity),
                    timeZone: classForm.timeZone,
                    description: classForm.description,
                    status: "active",
                }),
            });
            setCreateClassModal(false);
            setClassForm({ title: "", courseId: "", teacherId: "", capacity: 20, timeZone: "Africa/Addis_Ababa", description: "" });
            setFeedback("Cohort created.");
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Action: Schedule Session
    const handleScheduleSession = async (e) => {
        e.preventDefault();
        try {
            await apiRequest("/api/admin/sessions", {
                method: "POST",
                body: JSON.stringify({
                    classId: sessionForm.classId || classes[0]?._id,
                    title: sessionForm.title,
                    description: sessionForm.description,
                    startsAt: new Date(sessionForm.startsAt).toISOString(),
                    endsAt: new Date(sessionForm.endsAt).toISOString(),
                    meetingUrl: sessionForm.meetingUrl,
                }),
            });
            setCreateSessionModal(false);
            setSessionForm({
                classId: "",
                title: "",
                description: "",
                startsAt: "",
                endsAt: "",
                meetingUrl: "",
            });
            setFeedback("Session scheduled.");
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    // Action: Create Announcement
    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        try {
            await apiRequest("/api/admin/announcements", {
                method: "POST",
                body: JSON.stringify(announcementForm),
            });
            setCreateAnnouncementModal(false);
            setAnnouncementForm({ title: "", content: "", target: "all_students", priority: "normal" });
            setFeedback("Announcement sent.");
            void loadAll();
        }
        catch (err) {
            setFeedback(err.message);
        }
    };
    return (<div className="admin-workspace min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
      {/* Top Welcome Card */}
      <div className="admin-welcome relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-900/5 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="admin-eyebrow text-xs font-bold uppercase tracking-[0.16em]">
            LearnHUB · {t("adminOverview")}
          </span>
          <h1 className="editorial-display mt-3 text-4xl text-stone-950 sm:text-5xl">Good to see you, {user.fullName?.split(" ")[0]}.</h1>
          <p className="mt-2 text-sm text-stone-500">Your learning community, at a glance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => activeTab === "reports" ? void loadReports() : void loadAll()}
            disabled={isLoading || isReportsLoading}
            type="button"
            className="rounded-full border border-stone-300 bg-white/70 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading || isReportsLoading ? "Refreshing..." : "↻ Refresh"}
          </button>
          <button
            onClick={() => setCreateCategoryModal(true)}
            type="button"
            className="rounded-full border border-stone-300 bg-white/70 px-4 py-2.5 text-xs font-bold text-stone-700 transition-colors hover:bg-white"
          >
            + {t("createCategory")}
          </button>
          <button onClick={() => setCreateCourseModal(true)} className="rounded-full bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-900">
            + {t("createCourse")}
          </button>
          <button onClick={() => setCreateClassModal(true)} className="rounded-full bg-[#8a6c3e] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#745a34]">
            + {t("createClass")}
          </button>
          <button
            onClick={() => {
                setSessionForm((form) => ({ ...form, classId: schedulableClasses[0]?._id || "" }));
                setCreateSessionModal(true);
            }}
            disabled={schedulableClasses.length === 0}
            title={schedulableClasses.length === 0 ? "Assign an active teacher to a class before scheduling a session." : undefined}
            className="rounded-full border border-stone-300 bg-white/70 px-4 py-2.5 text-xs font-bold text-stone-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            + {t("scheduleSession")}
          </button>
        </div>
        </div>
      </div>

      {isLoading && (
        <div role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
          Loading the latest admin data...
        </div>
      )}
      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          <span>Dashboard data could not be loaded: {loadError}</span>
          <button onClick={() => activeTab === "reports" ? void loadReports() : void loadAll()} type="button" className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-800">
            Retry
          </button>
        </div>
      )}

      {feedback ? (<div className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-900 ring-1 ring-blue-200 flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback("")} className="text-blue-500 hover:text-blue-800">✕</button>
        </div>) : null}

      {/* Tabs Bar */}
      <div role="tablist" aria-label="Admin dashboard sections" className="admin-tabs flex gap-2 overflow-x-auto">
        {[
            { id: "overview", label: "Overview", icon: "📊" },
            { id: "teachers", label: `Instructors (${teachers.length})`, icon: "👨‍🏫" },
            { id: "students", label: `Learners (${students.length})`, icon: "🎓" },
            { id: "courses", label: `Programs (${courses.length})`, icon: "📚" },
            { id: "classes", label: `Cohorts (${classes.length})`, icon: "🏫" },
            { id: "announcements", label: `Announcements (${announcements.length})`, icon: "📢" },
            { id: "reports", label: "Reports & activity", icon: "📑" },
        ].map((tab) => (<button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "reports" && !reportsLoaded) void loadReports();
            }} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${activeTab === tab.id
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200"}`}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>))}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" ? (<div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Learners" value={metrics.totalStudents ?? 0} icon="🎓"/>
            <MetricCard label="Active instructors" value={metrics.activeTeachers ?? 0} icon="👨‍🏫"/>
            <MetricCard label="Cohorts" value={metrics.activeClasses ?? 0} icon="🏫"/>
            <MetricCard label="Awaiting placement" value={metrics.pendingStudentPlacement ?? 0} icon="⏳"/>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <DashboardCard title="Instructor applications awaiting review" subtitle="Pending Teacher Applications">
              <div className="space-y-4">
                {pendingApplications.length === 0 ? (<EmptyState title="No applications are waiting for review."/>) : (pendingApplications
                .map((app) => (<div key={app._id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900">{app.user?.fullName}</h4>
                            <p className="text-xs text-slate-500">{app.user?.email}</p>
                          </div>
                          <Badge variant="amber">Pending</Badge>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2"><strong>Qualifications:</strong> {app.qualifications}</p>
                        <p className="text-xs text-slate-600 line-clamp-2"><strong>Experience:</strong> {app.experience}</p>
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button onClick={() => handleTeacherApprove(app._id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                            ✓ {t("approve")}
                          </button>
                          <button onClick={() => setRejectionModal({ open: true, appId: app._id, reason: "" })} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700">
                            ✕ {t("reject")}
                          </button>
                        </div>
                      </div>)))}
              </div>
            </DashboardCard>

            <DashboardCard title="Learners awaiting placement" subtitle="Students Awaiting Placement">
              <div className="space-y-4">
                {pendingStudents.length === 0 ? (<EmptyState title="All learners have been placed."/>) : (pendingStudents
                .map((stud) => (<div key={stud._id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                        <div>
                          <h4 className="font-bold text-slate-900">{stud.fullName}</h4>
                          <p className="text-xs text-slate-500">{stud.email}</p>
                          <p className="mt-1 text-xs text-slate-600">
                            Interests: {stud.studentProfile?.learningInterests?.join(", ") || "General"}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                              const classesForStudent = getPlacementClasses(stud._id);
                              setPlacementModal({ open: true, studentId: stud._id, studentName: stud.fullName, classId: classesForStudent[0]?._id || "" });
                          }}
                          disabled={getPlacementClasses(stud._id).length === 0}
                          className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          title={getPlacementClasses(stud._id).length === 0 ? "Create a class with available capacity first." : undefined}
                        >
                          Assign cohort
                        </button>
                      </div>)))}
              </div>
            </DashboardCard>
          </div>
        </div>) : null}

      {/* 2. TEACHERS TAB */}
      {activeTab === "teachers" ? (<div className="space-y-6">
          <DashboardCard
            title="All instructors"
            subtitle="All Registered Teachers"
            action={<input value={teacherSearch} onChange={(event) => setTeacherSearch(event.target.value)} aria-label="Search teachers" placeholder="Search name or email" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:w-56" />}
          >
            <div className="divide-y divide-slate-100">
              {visibleTeachers.map((teach) => (<div key={teach._id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <h4 className="font-bold text-slate-900">{teach.fullName}</h4>
                    <p className="text-xs text-slate-500">{teach.email}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Expertise: {teach.teacherProfile?.expertise?.join(", ") || "General"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={teach.accountStatus === "active" ? "emerald" : "rose"}>
                      {teach.accountStatus}
                    </Badge>
                    <button onClick={() => handleToggleTeacherStatus(teach._id, teach.accountStatus)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${teach.accountStatus === "active"
                    ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
                      {teach.accountStatus === "active" ? "Suspend" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                          setDeleteUserError("");
                          setDeleteUserModal({ id: teach._id, name: teach.fullName, role: "teacher" });
                      }}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>))}
              {visibleTeachers.length === 0 && <EmptyState title={teachers.length ? "No teachers match your search" : "No teachers yet"} />}
            </div>
          </DashboardCard>
        </div>) : null}

      {/* 3. STUDENTS TAB */}
      {activeTab === "students" ? (<div className="space-y-6">
          <DashboardCard
            title="All learners"
            subtitle="All Registered Students"
            action={<input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} aria-label="Search students" placeholder="Search name or email" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:w-56" />}
          >
            <div className="divide-y divide-slate-100">
              {visibleStudents.map((stud) => (<div key={stud._id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">{stud.fullName}</h4>
                      <Badge variant={stud.studentProfile?.placementStatus === "assigned" ? "emerald" : "amber"}>
                        {stud.studentProfile?.placementStatus || "pending"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{stud.email}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Goals: {stud.studentProfile?.learningGoals || "None specified"} | Level: {stud.studentProfile?.currentSkillLevel || "Beginner"}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                          const classesForStudent = getPlacementClasses(stud._id);
                          setPlacementModal({ open: true, studentId: stud._id, studentName: stud.fullName, classId: classesForStudent[0]?._id || "" });
                      }}
                      disabled={getPlacementClasses(stud._id).length === 0}
                      className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      title={availableClasses.length === 0 ? "No classes have available capacity." : undefined}
                    >
                      {stud.studentProfile?.placementStatus === "assigned" ? "Add another class" : "Assign to class"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                          setDeleteUserError("");
                          setDeleteUserModal({ id: stud._id, name: stud.fullName, role: "student" });
                      }}
                      className="ml-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>))}
              {visibleStudents.length === 0 && <EmptyState title={students.length ? "No students match your search" : "No students yet"} />}
            </div>
          </DashboardCard>
        </div>) : null}

      {/* 4. COURSES TAB */}
      {activeTab === "courses" ? (<div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Programs and categories</h3>
            <div className="flex gap-2">
              <button onClick={() => setCreateCategoryModal(true)} className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                + {t("createCategory")}
              </button>
              <button onClick={() => setCreateCourseModal(true)} disabled={categories.length === 0} title={categories.length === 0 ? "Create a category first." : undefined} className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                + {t("createCourse")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row">
            <input
              value={courseSearch}
              onChange={(event) => {
                  setCourseSearch(event.target.value);
                  setCoursePage(1);
              }}
              aria-label="Search courses"
              placeholder="Search title, description, or category"
              className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            />
            <select
              value={courseCategory}
              onChange={(event) => {
                  setCourseCategory(event.target.value);
                  setCoursePage(1);
              }}
              aria-label="Filter courses by category"
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All categories ({courses.length})</option>
              {categories.map((category) => {
                  const count = courses.filter((course) => course.category?._id === category._id).length;
                  return count > 0 ? <option key={category._id} value={category._id}>{category.name} ({count})</option> : null;
              })}
            </select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pagedCourses.map((course) => (<div key={course._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="cyan">{course.category?.name || "General"}</Badge>
                  <span className="text-xs font-semibold text-slate-500">{course.skillLevel}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900">{course.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-3">{course.description}</p>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold text-slate-500">Objectives:</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    {course.learningObjectives?.slice(0, 2).map((o, idx) => (<li key={idx} className="flex gap-1"><span>•</span><span>{o}</span></li>))}
                  </ul>
                </div>
              </div>))}
            {visibleCourses.length === 0 && <EmptyState title={courses.length ? "No courses match those filters" : "No courses yet"} description={courses.length ? "Try a different search or category." : "Run the catalog seed or create a course after setting up a learning category."} />}
          </div>
          {totalCoursePages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-stone-500">Showing {(coursePage - 1) * coursesPerPage + 1}–{Math.min(coursePage * coursesPerPage, visibleCourses.length)} of {visibleCourses.length}</p>
              <div className="flex gap-2">
                <button type="button" disabled={coursePage === 1} onClick={() => setCoursePage((page) => page - 1)} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 disabled:opacity-40">Previous</button>
                <button type="button" disabled={coursePage === totalCoursePages} onClick={() => setCoursePage((page) => page + 1)} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>) : null}

      {/* 5. CLASSES TAB */}
      {activeTab === "classes" ? (<div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Active cohorts</h3>
            <button onClick={() => setCreateClassModal(true)} className="rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-cyan-700">
              + {t("createClass")}
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {classes.map((cls) => (<div key={cls._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900">{cls.title}</h4>
                  <Badge variant={cls.status === "active" ? "emerald" : "slate"}>{cls.status}</Badge>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p><strong>Program:</strong> {cls.course?.title || "Unassigned"}</p>
                  <p><strong>Instructor:</strong> {cls.teacher?.fullName || "Unassigned"}</p>
                  <p><strong>Learners:</strong> {cls.students?.length || 0} / {cls.capacity} (capacity)</p>
                  <p><strong>Time zone:</strong> {cls.timeZone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTeacherAssignmentModal({
                      open: true,
                      classId: cls._id,
                      classTitle: cls.title,
                      teacherId: cls.teacher?._id || "",
                  })}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  {cls.teacher ? "Change teacher" : "Assign teacher"}
                </button>
              </div>))}
            {classes.length === 0 && <EmptyState title="No classes yet" description="Create a class and assign an active teacher to begin scheduling lessons." />}
          </div>
        </div>) : null}

      {/* 6. ANNOUNCEMENTS TAB */}
      {activeTab === "announcements" ? (<div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Announcements</h3>
            <button onClick={() => setCreateAnnouncementModal(true)} className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
              + New announcement
            </button>
          </div>

          <div className="space-y-4">
            {announcements.length === 0 ? (<EmptyState title="No announcements yet."/>) : (announcements.map((ann) => (<div key={ann._id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">{ann.title}</h4>
                    <Badge variant={ann.priority === "urgent" ? "rose" : ann.priority === "high" ? "amber" : "slate"}>
                      {ann.priority}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 leading-relaxed">{ann.content}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                    <span>Audience: {ann.target}</span>
                    <span>•</span>
                    <span>Date: {new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>)))}
          </div>
        </div>) : null}

      {/* 7. REPORTS & AUDIT LOGS TAB */}
      {activeTab === "reports" ? (<div className="space-y-8">
          {isReportsLoading && <div role="status" className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600">Loading reports and recent activity…</div>}
          <DashboardCard title="System overview and workloads">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Cohort placement and capacity</h4>
                <div className="space-y-2">
                  {reportsData?.classes?.map((c) => (<div key={c._id} className="rounded-xl border border-slate-200 p-3 text-xs flex justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{c.title}</span>
                        <p className="text-slate-500">Instructor: {c.teacher}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-blue-600">{c.enrolledCount} / {c.capacity}</span>
                        <p className="text-[10px] text-slate-400">{Math.round((c.enrolledCount / c.capacity) * 100)}% filled</p>
                      </div>
                    </div>))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Attendance overview</h4>
                <div className="space-y-2">
                  {reportsData?.attendanceStats?.map((s) => (<div key={s._id} className="rounded-xl bg-slate-50 p-3 text-xs flex justify-between">
                      <span className="font-bold capitalize text-slate-800">{s._id}:</span>
                      <span className="font-extrabold text-slate-900">{s.count} sessions</span>
                    </div>))}
                </div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Recent activity">
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (<div key={log._id} className="py-3 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-500 ml-2">({log.targetType})</span>
                    <p className="text-slate-400">By: {log.actor?.fullName || "System"}</p>
                  </div>
                  <span className="text-slate-400 text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>
                </div>))}
            </div>
          </DashboardCard>
        </div>) : null}

      {/* MODAL: Reject Teacher */}
      <Modal title={t("reject")} isOpen={rejectionModal.open} onClose={() => setRejectionModal({ open: false, appId: "", reason: "" })}>
        <div className="space-y-4">
          <p className="text-xs text-slate-600">Please tell us why this application is being declined.</p>
          <textarea required minLength={5} rows={3} value={rejectionModal.reason} onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none" placeholder="Add a reason…"/>
          <div className="flex justify-end gap-2">
            <button onClick={() => setRejectionModal({ open: false, appId: "", reason: "" })} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">
              Cancel
            </button>
            <button onClick={handleTeacherReject} disabled={rejectionModal.reason.trim().length < 5} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
              Decline application
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Place Student */}
      <Modal title="Place learner in a cohort" isOpen={placementModal.open} onClose={() => setPlacementModal({ open: false, studentId: "", studentName: "", classId: "" })}>
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-900">Learner: {placementModal.studentName}</p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select a cohort</label>
            <select value={placementModal.classId} onChange={(e) => setPlacementModal({ ...placementModal, classId: e.target.value })} className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none bg-white">
              {placementClasses.map((c) => (<option key={c._id} value={c._id}>
                  {c.title} — ({c.students?.length || 0}/{c.capacity} learners)
                </option>))}
            </select>
            {placementClasses.length === 0 && (
              <p className="mt-2 text-sm text-rose-700">There are no classes with open capacity. Increase class capacity or create another class before placing students.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setPlacementModal({ open: false, studentId: "", studentName: "", classId: "" })} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">
              Cancel
            </button>
            <button onClick={handlePlaceStudent} disabled={!placementModal.classId || placementClasses.length === 0} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              Confirm placement
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        title={`Assign teacher · ${teacherAssignmentModal.classTitle}`}
        isOpen={teacherAssignmentModal.open}
        onClose={() => setTeacherAssignmentModal({ open: false, classId: "", classTitle: "", teacherId: "" })}
      >
        {activeTeachers.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">There are no active teachers available. Approve a teacher application or reactivate a teacher before assigning this class.</p>
            <button
              type="button"
              onClick={() => {
                  setTeacherAssignmentModal({ open: false, classId: "", classTitle: "", teacherId: "" });
                  setActiveTab("teachers");
              }}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              View teachers
            </button>
          </div>
        ) : (
          <form onSubmit={handleAssignTeacher} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700" htmlFor="class-teacher">
              Active teacher
            </label>
            <select
              id="class-teacher"
              required
              value={teacherAssignmentModal.teacherId}
              onChange={(event) => setTeacherAssignmentModal({ ...teacherAssignmentModal, teacherId: event.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
            >
              <option value="">Choose a teacher</option>
              {activeTeachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>{teacher.fullName} ({teacher.email})</option>
              ))}
            </select>
            <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
              Save teacher assignment
            </button>
          </form>
        )}
      </Modal>

      <Modal
        title={`Delete ${deleteUserModal?.role === "teacher" ? "instructor" : "learner"} account?`}
        isOpen={Boolean(deleteUserModal)}
        onClose={() => {
            if (!isDeletingUser) setDeleteUserModal(null);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-slate-700">
            This will deactivate <strong>{deleteUserModal?.name}</strong>’s sign-in access, anonymize their profile, and remove them from active class rosters. Historical learning records will be retained.
          </p>
          <p className="text-xs leading-5 text-rose-700">
            This cannot be undone. Confirm that you selected the right account.
          </p>
          {deleteUserError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">{deleteUserError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" disabled={isDeletingUser} onClick={() => setDeleteUserModal(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">
              Cancel
            </button>
            <button type="button" disabled={isDeletingUser} onClick={() => void handleDeleteUser()} className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60">
              {isDeletingUser ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Create Course */}
      <Modal title={t("createCourse")} isOpen={createCourseModal} onClose={() => setCreateCourseModal(false)}>
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("title")}</label>
            <input required minLength={3} type="text" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("description")}</label>
            <textarea required minLength={10} rows={2} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("category")}</label>
            <select required value={courseForm.categoryId} onChange={(e) => setCourseForm({ ...courseForm, categoryId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
              <option value="">Select a category</option>
              {categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
            </select>
            {categories.length === 0 && <p className="mt-1 text-xs text-rose-700">Create a category before creating a course.</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("skillLevel")}</label>
            <select value={courseForm.skillLevel} onChange={(e) => setCourseForm({ ...courseForm, skillLevel: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">Objectives (one per line)</label>
            <textarea rows={2} value={courseForm.objectives} onChange={(e) => setCourseForm({ ...courseForm, objectives: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <button type="submit" disabled={categories.length === 0} className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            {t("createCourse")}
          </button>
        </form>
      </Modal>

      {/* MODAL: Create Class */}
      <Modal title={t("createClass")} isOpen={createClassModal} onClose={() => setCreateClassModal(false)}>
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("title")}</label>
            <input required minLength={3} type="text" value={classForm.title} onChange={(e) => setClassForm({ ...classForm, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("course")}</label>
            <select required value={classForm.courseId} onChange={(e) => setClassForm({ ...classForm, courseId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
              <option value="">Select a course</option>
              {courses.map((c) => (<option key={c._id} value={c._id}>{c.title}</option>))}
            </select>
            {courses.length === 0 && <p className="mt-1 text-xs text-rose-700">Create a course before creating a class.</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("teacher")}</label>
            <select value={classForm.teacherId} onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
              <option value="">-- Select an instructor --</option>
              {teachers.filter((t) => t.accountStatus === "active").map((tch) => (<option key={tch._id} value={tch._id}>{tch.fullName} ({tch.email})</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">Cohort capacity</label>
            <input type="number" min={1} max={100} value={classForm.capacity} onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <button type="submit" disabled={courses.length === 0} className="w-full rounded-xl bg-cyan-600 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            {t("createClass")}
          </button>
        </form>
      </Modal>

      {/* MODAL: Create Category */}
      <Modal title={t("createCategory")} isOpen={createCategoryModal} onClose={() => setCreateCategoryModal(false)}>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">Category name</label>
            <input required minLength={2} type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">Description</label>
            <textarea rows={2} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white">
            {t("createCategory")}
          </button>
        </form>
      </Modal>

      {/* MODAL: Schedule Session */}
      <Modal title={t("scheduleSession")} isOpen={createSessionModal} onClose={() => setCreateSessionModal(false)}>
        <form onSubmit={handleScheduleSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("course")} / cohort</label>
            <select value={sessionForm.classId} onChange={(e) => setSessionForm({ ...sessionForm, classId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
              <option value="">Select a class with a teacher</option>
              {schedulableClasses.map((c) => (<option key={c._id} value={c._id}>{c.title}</option>))}
            </select>
            {schedulableClasses.length === 0 && <p className="mt-1 text-xs text-rose-700">Assign an active teacher to a class before scheduling sessions.</p>}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("title")}</label>
            <input required minLength={3} type="text" value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none" placeholder="Example: Live session 1 — Introduction to React"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">{t("startTime")}</label>
              <input required type="datetime-local" value={sessionForm.startsAt} onChange={(e) => setSessionForm({ ...sessionForm, startsAt: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">{t("endTime")}</label>
              <input required type="datetime-local" min={sessionForm.startsAt || undefined} value={sessionForm.endsAt} onChange={(e) => setSessionForm({ ...sessionForm, endsAt: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("meetingUrl")}</label>
            <input required type="url" value={sessionForm.meetingUrl} onChange={(e) => setSessionForm({ ...sessionForm, meetingUrl: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none" placeholder="https://meet.google.com/..."/>
          </div>
          <button type="submit" disabled={schedulableClasses.length === 0} className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
            Schedule session
          </button>
        </form>
      </Modal>

      {/* MODAL: Create Announcement */}
      <Modal title="Send an announcement" isOpen={createAnnouncementModal} onClose={() => setCreateAnnouncementModal(false)}>
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("title")}</label>
            <input required minLength={3} type="text" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700">{t("message")}</label>
            <textarea required minLength={5} rows={3} value={announcementForm.content} onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Audience</label>
              <select value={announcementForm.target} onChange={(e) => setAnnouncementForm({ ...announcementForm, target: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
                <option value="all_students">All learners</option>
                <option value="all_teachers">All instructors</option>
                <option value="all">All users</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Priority</label>
              <select value={announcementForm.priority} onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs outline-none bg-white">
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white">
            Send announcement
          </button>
        </form>
      </Modal>
      </div>
    </div>);
}
