import mongoose from "mongoose";
import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth.js";
import { asyncHandler, ApiError } from "../lib/http.js";
import { AuditLogModel } from "../models/AuditLog.js";
import { ClassroomModel } from "../models/Classroom.js";
import { ClassSessionModel } from "../models/ClassSession.js";
import { ContactInquiryModel } from "../models/ContactInquiry.js";
import { CourseModel } from "../models/Course.js";
import { FAQModel } from "../models/FAQ.js";
import { LearningCategoryModel } from "../models/LearningCategory.js";
import { NotificationModel } from "../models/Notification.js";
import { TeacherApplicationModel } from "../models/TeacherApplication.js";
import { UserModel } from "../models/User.js";
import { AnnouncementModel } from "../models/Announcement.js";
import { PlatformSettingModel } from "../models/PlatformSetting.js";
import { AttendanceRecordModel } from "../models/AttendanceRecord.js";
import { slugify } from "../utils.js";
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("hub_admin"));
adminRouter.get("/teachers/pending", asyncHandler(async (_req, res) => {
    const teachers = await UserModel.find({ role: "teacher", teacherStatus: "pending", isVerified: { $ne: false } })
        .select("-password -passwordHash -verificationCode")
        .sort({ createdAt: 1 })
        .lean();
    res.json({ teachers });
}));
async function updateTeacherReview(req, res, status) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        throw new ApiError(400, "Invalid teacher ID.");
    }
    const teacher = await UserModel.findOne({ _id: req.params.id, role: "teacher" });
    if (!teacher) {
        throw new ApiError(404, "Teacher not found.");
    }
    if (!teacher.isVerified) {
        throw new ApiError(409, "The teacher must verify their email before approval.");
    }
    if (teacher.teacherStatus !== "pending") {
        throw new ApiError(409, "This teacher application has already been reviewed.");
    }
    teacher.teacherStatus = status;
    teacher.accountStatus = status === "approved" ? "active" : "suspended";
    await teacher.save();
    await TeacherApplicationModel.findOneAndUpdate(
        { user: teacher._id },
        { status, reviewedBy: new mongoose.Types.ObjectId(req.user.id), reviewedAt: new Date() },
    );
    await NotificationModel.create({
        user: teacher._id,
        title: status === "approved" ? "Teacher application approved" : "Teacher application update",
        message: status === "approved"
            ? "Your teacher account has been approved. You can now sign in."
            : "Your teacher application was rejected.",
        kind: "teacher_application",
        link: "/dashboard",
    });
    await writeAudit(req.user.id, `teacher_application_${status}`, "User", teacher._id.toString());
    res.json({ message: `Teacher application ${status}.` });
}
adminRouter.patch("/teachers/:id/approve", asyncHandler(async (req, res) => {
    const data = z.object({ status: z.enum(["approved", "rejected"]).default("approved") }).parse(req.body);
    await updateTeacherReview(req, res, data.status);
}));
adminRouter.patch("/teachers/:id/reject", asyncHandler(async (req, res) => {
    await updateTeacherReview(req, res, "rejected");
}));
async function writeAudit(actorId, action, targetType, targetId, details = {}) {
    await AuditLogModel.create({
        actor: actorId,
        action,
        targetType,
        targetId,
        details,
    });
}
adminRouter.get("/dashboard", asyncHandler(async (_req, res) => {
    const now = new Date();
    const [totalStudents, activeStudents, pendingStudentPlacement, totalTeachers, activeTeachers, pendingTeacherApplications, activeCourses, activeClasses, upcomingClasses, pendingSupportInquiries,] = await Promise.all([
        UserModel.countDocuments({ role: "student" }),
        UserModel.countDocuments({ role: "student", accountStatus: "active" }),
        UserModel.countDocuments({ role: "student", "studentProfile.placementStatus": "pending" }),
        UserModel.countDocuments({ role: "teacher" }),
        UserModel.countDocuments({ role: "teacher", accountStatus: "active" }),
        TeacherApplicationModel.countDocuments({ status: "pending" }),
        CourseModel.countDocuments({ status: "published" }),
        ClassroomModel.countDocuments({ status: { $in: ["planned", "active"] } }),
        ClassSessionModel.countDocuments({ startsAt: { $gte: now }, status: "scheduled" }),
        ContactInquiryModel.countDocuments({ status: { $ne: "closed" } }),
    ]);
    res.json({
        metrics: {
            totalStudents,
            activeStudents,
            pendingStudentPlacement,
            totalTeachers,
            activeTeachers,
            pendingTeacherApplications,
            activeCourses,
            activeClasses,
            upcomingClasses,
            pendingSupportInquiries,
        },
    });
}));
adminRouter.get("/teacher-applications", asyncHandler(async (_req, res) => {
    const applications = await TeacherApplicationModel.find()
        .populate("user", "fullName email accountStatus languagePreference isVerified")
        .sort({ createdAt: -1 })
        .lean();
    res.json({ applications: applications.filter((application) => application.user?.isVerified !== false) });
}));
adminRouter.patch("/teacher-applications/:applicationId", asyncHandler(async (req, res) => {
    const data = z.object({
        status: z.enum(["approved", "rejected"]),
        rejectionReason: z.string().trim().default(""),
    }).parse(req.body);
    if (data.status === "rejected" && data.rejectionReason.length < 5) {
        throw new ApiError(400, "Provide a rejection reason of at least 5 characters.");
    }
    const application = await TeacherApplicationModel.findById(req.params.applicationId);
    if (!application) {
        throw new ApiError(404, "Teacher application not found.");
    }
    const teacher = await UserModel.findById(application.user);
    if (!teacher) {
        throw new ApiError(404, "Teacher account not found.");
    }
    if (!teacher.isVerified) {
        throw new ApiError(409, "The teacher must verify their email before approval.");
    }
    application.status = data.status;
    application.rejectionReason = data.status === "rejected" ? data.rejectionReason : "";
    application.reviewedBy = new mongoose.Types.ObjectId(req.user.id);
    application.reviewedAt = new Date();
    await application.save();
    teacher.accountStatus = data.status === "approved" ? "active" : "suspended";
    teacher.teacherStatus = data.status;
    await teacher.save();
    await NotificationModel.create({
        user: teacher._id,
        title: data.status === "approved" ? "Teacher application approved" : "Teacher application update",
        message: data.status === "approved"
            ? "Your teacher account has been approved. You can now sign in."
            : `Your teacher application was rejected.${data.rejectionReason ? ` Reason: ${data.rejectionReason}` : ""}`,
        kind: "teacher_application",
        link: "/dashboard",
    });
    await writeAudit(req.user.id, `teacher_application_${data.status}`, "TeacherApplication", application._id.toString(), {
        teacherId: teacher._id.toString(),
    });
    res.json({ message: "Teacher application updated successfully." });
}));
adminRouter.get("/teachers", asyncHandler(async (_req, res) => {
    const teachers = await UserModel.find({ role: "teacher" })
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .lean();
    res.json({ teachers });
}));
adminRouter.get("/students", asyncHandler(async (_req, res) => {
    const students = await UserModel.find({ role: "student" })
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .lean();
    res.json({ students });
}));
adminRouter.post("/categories", asyncHandler(async (req, res) => {
    const data = z.object({
        name: z.string().min(2),
        description: z.string().default(""),
        sortOrder: z.number().int().default(0),
    }).parse(req.body);
    const category = await LearningCategoryModel.create({
        ...data,
        slug: slugify(data.name),
    });
    await writeAudit(req.user.id, "category_created", "LearningCategory", category._id.toString());
    res.status(201).json({ category });
}));
adminRouter.get("/categories", asyncHandler(async (_req, res) => {
    const categories = await LearningCategoryModel.find().sort({ sortOrder: 1 }).lean();
    res.json({ categories });
}));
adminRouter.post("/courses", asyncHandler(async (req, res) => {
    const data = z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        categoryId: z.string().min(1),
        learningObjectives: z.array(z.string()).default([]),
        skillLevel: z.string().default(""),
        status: z.enum(["draft", "published", "archived", "inactive"]).default("draft"),
    }).parse(req.body);
    const course = await CourseModel.create({
        title: data.title,
        slug: slugify(`${data.title}-${Date.now()}`),
        description: data.description,
        category: data.categoryId,
        learningObjectives: data.learningObjectives,
        skillLevel: data.skillLevel,
        status: data.status,
    });
    await writeAudit(req.user.id, "course_created", "Course", course._id.toString());
    res.status(201).json({ course });
}));
adminRouter.get("/courses", asyncHandler(async (_req, res) => {
    const courses = await CourseModel.find().populate("category").sort({ createdAt: -1 }).lean();
    res.json({ courses });
}));
adminRouter.post("/classes", asyncHandler(async (req, res) => {
    const data = z.object({
        title: z.string().min(3),
        courseId: z.string().min(1),
        teacherId: z.string().optional(),
        capacity: z.number().int().min(1).max(100).default(20),
        status: z.enum(["planned", "active", "completed", "archived"]).default("planned"),
        timeZone: z.string().default("Africa/Addis_Ababa"),
        description: z.string().default(""),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
    }).parse(req.body);
    if (data.teacherId) {
        const teacher = await UserModel.findOne({ _id: data.teacherId, role: "teacher", accountStatus: "active" });
        if (!teacher) {
            throw new ApiError(400, "Assigned teacher must be an active teacher.");
        }
    }
    const classroom = await ClassroomModel.create({
        title: data.title,
        course: data.courseId,
        teacher: data.teacherId ?? null,
        capacity: data.capacity,
        status: data.status,
        timeZone: data.timeZone,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
    });
    if (data.teacherId) {
        await NotificationModel.create({
            user: data.teacherId,
            title: "New class assignment",
            message: `You have been assigned to class "${data.title}".`,
            kind: "class_assignment",
            link: "/teacher/classes",
        });
    }
    await writeAudit(req.user.id, "class_created", "Classroom", classroom._id.toString());
    res.status(201).json({ classroom });
}));
adminRouter.get("/classes", asyncHandler(async (_req, res) => {
    const classes = await ClassroomModel.find()
        .populate("course")
        .populate("teacher", "fullName email")
        .populate("students", "fullName email")
        .sort({ createdAt: -1 })
        .lean();
    res.json({ classes });
}));
adminRouter.post("/classes/:classId/assign-student", asyncHandler(async (req, res) => {
    const data = z.object({
        studentId: z.string().min(1),
    }).parse(req.body);
    const classroom = await ClassroomModel.findById(req.params.classId);
    if (!classroom) {
        throw new ApiError(404, "Class not found.");
    }
    const student = await UserModel.findOne({ _id: data.studentId, role: "student", accountStatus: "active" });
    if (!student) {
        throw new ApiError(404, "Student not found.");
    }
    if (classroom.students.some((studentId) => studentId.toString() === data.studentId)) {
        throw new ApiError(409, "Student is already assigned to this class.");
    }
    if (classroom.students.length >= classroom.capacity) {
        throw new ApiError(400, "This class has reached capacity.");
    }
    classroom.students.push(student._id);
    await classroom.save();
    if (student.studentProfile) {
        student.studentProfile.placementStatus = "assigned";
        await student.save();
    }
    await NotificationModel.create({
        user: student._id,
        title: "New class placement",
        message: `You have been placed into class "${classroom.title}".`,
        kind: "student_placement",
        link: "/student/classes",
    });
    await writeAudit(req.user.id, "student_assigned", "Classroom", classroom._id.toString(), {
        studentId: student._id.toString(),
    });
    res.json({ message: "Student assigned successfully." });
}));
adminRouter.post("/classes/:classId/assign-teacher", asyncHandler(async (req, res) => {
    const data = z.object({
        teacherId: z.string().min(1),
    }).parse(req.body);
    const classroom = await ClassroomModel.findById(req.params.classId);
    if (!classroom) {
        throw new ApiError(404, "Class not found.");
    }
    const teacher = await UserModel.findOne({ _id: data.teacherId, role: "teacher", accountStatus: "active" });
    if (!teacher) {
        throw new ApiError(404, "Teacher not found.");
    }
    classroom.teacher = teacher._id;
    await classroom.save();
    await NotificationModel.create({
        user: teacher._id,
        title: "Class assignment updated",
        message: `You are now assigned to class "${classroom.title}".`,
        kind: "class_assignment",
        link: "/teacher/classes",
    });
    await writeAudit(req.user.id, "teacher_assigned", "Classroom", classroom._id.toString(), {
        teacherId: teacher._id.toString(),
    });
    res.json({ message: "Teacher assigned successfully." });
}));
adminRouter.post("/sessions", asyncHandler(async (req, res) => {
    const data = z.object({
        classId: z.string().min(1),
        title: z.string().min(3),
        description: z.string().default(""),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
        meetingUrl: z.string().url().optional(),
    }).parse(req.body);
    const classroom = await ClassroomModel.findById(req.body.classId);
    if (!classroom) {
        throw new ApiError(404, "Class not found.");
    }
    if (!classroom.teacher) {
        throw new ApiError(400, "Assign a teacher before creating sessions.");
    }
    const start = new Date(data.startsAt);
    const end = new Date(data.endsAt);
    if (start >= end) {
        throw new ApiError(400, "Session end time must be after start time.");
    }
    const existingConflict = await ClassSessionModel.findOne({
        teacher: classroom.teacher,
        status: "scheduled",
        $or: [
            { startsAt: { $lt: end, $gte: start } },
            { endsAt: { $gt: start, $lte: end } },
            { startsAt: { $lte: start }, endsAt: { $gte: end } },
        ],
    });
    if (existingConflict) {
        throw new ApiError(409, "The assigned teacher already has a conflicting session.");
    }
    const session = await ClassSessionModel.create({
        classroom: classroom._id,
        teacher: classroom.teacher,
        title: data.title,
        description: data.description,
        startsAt: start,
        endsAt: end,
        meetingUrl: data.meetingUrl ?? "",
    });
    const recipientIds = [classroom.teacher, ...classroom.students];
    await NotificationModel.insertMany(recipientIds.map((recipientId) => ({
        user: recipientId,
        title: "New class session scheduled",
        message: `${data.title} has been scheduled for ${start.toISOString()}.`,
        kind: "session",
        link: "/dashboard",
    })));
    await writeAudit(req.user.id, "session_created", "ClassSession", session._id.toString(), {
        classroomId: classroom._id.toString(),
    });
    res.status(201).json({ session });
}));
adminRouter.get("/faqs", asyncHandler(async (_req, res) => {
    const faqs = await FAQModel.find().sort({ sortOrder: 1 }).lean();
    res.json({ faqs });
}));
adminRouter.post("/faqs", asyncHandler(async (req, res) => {
    const data = z.object({
        question: z.string().min(5),
        answer: z.string().min(10),
        isPublished: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
    }).parse(req.body);
    const faq = await FAQModel.create(data);
    await writeAudit(req.user.id, "faq_created", "FAQ", faq._id.toString());
    res.status(201).json({ faq });
}));
adminRouter.get("/contact-inquiries", asyncHandler(async (_req, res) => {
    const inquiries = await ContactInquiryModel.find().sort({ createdAt: -1 }).lean();
    res.json({ inquiries });
}));
adminRouter.get("/audit-logs", asyncHandler(async (_req, res) => {
    const logs = await AuditLogModel.find()
        .populate("actor", "fullName email role")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
    res.json({ logs });
}));
adminRouter.patch("/teachers/:teacherId/status", asyncHandler(async (req, res) => {
    const data = z.object({
        status: z.enum(["active", "suspended"]),
    }).parse(req.body);
    const teacher = await UserModel.findOne({ _id: req.params.teacherId, role: "teacher" });
    if (!teacher) {
        throw new ApiError(404, "Teacher account not found.");
    }
    teacher.accountStatus = data.status;
    await teacher.save();
    await writeAudit(req.user.id, `teacher_status_${data.status}`, "User", teacher._id.toString());
    res.json({ message: `Teacher status changed to ${data.status}.`, teacher });
}));
adminRouter.get("/announcements", asyncHandler(async (_req, res) => {
    const announcements = await AnnouncementModel.find()
        .populate("author", "fullName")
        .populate("classroom", "title")
        .sort({ createdAt: -1 })
        .lean();
    res.json({ announcements });
}));
adminRouter.post("/announcements", asyncHandler(async (req, res) => {
    const data = z.object({
        title: z.string().min(3),
        content: z.string().min(5),
        target: z.enum(["all", "all_students", "all_teachers", "classroom"]),
        classroomId: z.string().optional(),
        priority: z.enum(["normal", "high", "urgent"]).default("normal"),
    }).parse(req.body);
    const announcement = await AnnouncementModel.create({
        title: data.title,
        content: data.content,
        target: data.target,
        classroom: data.classroomId ?? null,
        author: req.user.id,
        priority: data.priority,
    });
    await writeAudit(req.user.id, "announcement_created", "Announcement", announcement._id.toString());
    res.status(201).json({ announcement });
}));
adminRouter.get("/reports", asyncHandler(async (_req, res) => {
    const [studentsByPlacement, teachersWithClasses, attendanceSummary, classesWithOccupancy,] = await Promise.all([
        UserModel.aggregate([
            { $match: { role: "student" } },
            { $group: { _id: "$studentProfile.placementStatus", count: { $sum: 1 } } },
        ]),
        ClassroomModel.aggregate([
            { $match: { teacher: { $ne: null } } },
            { $group: { _id: "$teacher", classCount: { $sum: 1 } } },
        ]),
        AttendanceRecordModel.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        ClassroomModel.find()
            .populate("teacher", "fullName")
            .populate("course", "title")
            .select("title capacity students teacher course status")
            .lean(),
    ]);
    res.json({
        placementStats: studentsByPlacement,
        teacherWorkloads: teachersWithClasses,
        attendanceStats: attendanceSummary,
        classes: classesWithOccupancy.map((c) => ({
            _id: c._id,
            title: c.title,
            teacher: c.teacher?.fullName ?? "Unassigned",
            course: c.course?.title ?? "No course",
            capacity: c.capacity,
            enrolledCount: c.students.length,
            status: c.status,
        })),
    });
}));
adminRouter.get("/settings", asyncHandler(async (_req, res) => {
    const settings = await PlatformSettingModel.find().lean();
    res.json({ settings });
}));
adminRouter.post("/settings", asyncHandler(async (req, res) => {
    const data = z.object({
        key: z.string().min(1),
        value: z.any(),
        description: z.string().default(""),
    }).parse(req.body);
    const setting = await PlatformSettingModel.findOneAndUpdate({ key: data.key }, { value: data.value, description: data.description }, { upsert: true, new: true });
    await writeAudit(req.user.id, "setting_updated", "PlatformSetting", setting._id.toString(), { key: data.key });
    res.json({ setting });
}));
