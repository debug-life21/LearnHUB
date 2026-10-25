import fs from "node:fs/promises";
import mongoose from "mongoose";
import { Router } from "express";
import { z } from "zod";
import { hashPassword, requireAuth, requireRole } from "../auth.js";
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
import { AssessmentAttemptModel } from "../models/AssessmentAttempt.js";
import { AssignmentModel } from "../models/Assignment.js";
import { AssignmentSubmissionModel } from "../models/AssignmentSubmission.js";
import { AssessmentModel } from "../models/Assessment.js";
import { CertificateModel } from "../models/Certificate.js";
import { DiscussionModel } from "../models/Discussion.js";
import { LearningResourceModel } from "../models/LearningResource.js";
import { slugify } from "../utils.js";
import { getLocalFilePath } from "../lib/storage.js";
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("hub_admin"));
adminRouter.get("/teachers/pending", asyncHandler(async (_req, res) => {
    const teachers = await UserModel.find({ role: "teacher", isDeleted: { $ne: true }, teacherStatus: "pending", isVerified: { $ne: false } })
        .select("-password -passwordHash -verificationCode")
        .sort({ createdAt: 1 })
        .lean();
    res.json({ teachers });
}));
async function updateTeacherReview(req, res, status) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        throw new ApiError(400, "Invalid teacher ID.");
    }
    const teacher = await UserModel.findOne({ _id: req.params.id, role: "teacher", isDeleted: { $ne: true } });
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
        UserModel.countDocuments({ role: "student", isDeleted: { $ne: true } }),
        UserModel.countDocuments({ role: "student", isDeleted: { $ne: true }, accountStatus: "active" }),
        UserModel.countDocuments({ role: "student", isDeleted: { $ne: true }, "studentProfile.placementStatus": "pending" }),
        UserModel.countDocuments({ role: "teacher", isDeleted: { $ne: true } }),
        UserModel.countDocuments({ role: "teacher", isDeleted: { $ne: true }, accountStatus: "active" }),
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
        .populate("user", "fullName email accountStatus languagePreference isVerified isDeleted")
        .sort({ createdAt: -1 })
        .lean();
    res.json({ applications: applications.filter((application) => application.user && !application.user.isDeleted && application.user.isVerified !== false) });
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
    const teachers = await UserModel.find({ role: "teacher", isDeleted: { $ne: true } })
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .lean();
    res.json({ teachers });
}));
adminRouter.get("/administrators", asyncHandler(async (_req, res) => {
    const administrators = await UserModel.find({
        role: { $in: ["admin", "hub_admin"] },
        isDeleted: { $ne: true },
    })
        .select("-password -passwordHash -verificationCode")
        .sort({ createdAt: 1 })
        .lean();
    res.json({ administrators });
}));
adminRouter.post("/administrators", asyncHandler(async (req, res) => {
    const data = z.object({
        fullName: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(254),
        password: z.string().min(12).max(128),
    }).parse(req.body);
    const email = data.email.toLowerCase();
    if (await UserModel.exists({ email })) {
        throw new ApiError(409, "An account with this email already exists.");
    }
    const administrator = await UserModel.create({
        name: data.fullName,
        fullName: data.fullName,
        email,
        password: await hashPassword(data.password),
        authProvider: "local",
        role: "admin",
        isVerified: true,
        emailVerified: true,
        teacherStatus: "approved",
        accountStatus: "active",
    });
    await writeAudit(req.user.id, "administrator_created", "User", administrator._id.toString());
    res.status(201).json({
        administrator: {
            _id: administrator._id,
            fullName: administrator.fullName,
            email: administrator.email,
            role: administrator.role,
            accountStatus: administrator.accountStatus,
            createdAt: administrator.createdAt,
        },
    });
}));
adminRouter.post("/users", asyncHandler(async (req, res) => {
    const data = z.object({
        fullName: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(254),
        password: z.string().min(12).max(128),
        role: z.enum(["student", "teacher"]),
    }).parse(req.body);
    const email = data.email.toLowerCase();
    if (await UserModel.exists({ email })) throw new ApiError(409, "An account with this email already exists.");
    const account = await UserModel.create({
        name: data.fullName,
        fullName: data.fullName,
        email,
        password: await hashPassword(data.password),
        authProvider: "local",
        role: data.role,
        isVerified: true,
        emailVerified: true,
        teacherStatus: data.role === "teacher" ? "approved" : undefined,
        accountStatus: "active",
        ...(data.role === "student" ? { studentProfile: { placementStatus: "pending" } } : {}),
    });
    await writeAudit(req.user.id, `${data.role}_created_by_admin`, "User", account._id.toString());
    res.status(201).json({
        user: {
            _id: account._id,
            fullName: account.fullName,
            email: account.email,
            role: account.role,
            accountStatus: account.accountStatus,
            studentProfile: account.studentProfile,
            teacherStatus: account.teacherStatus,
            createdAt: account.createdAt,
        },
    });
}));
adminRouter.patch("/administrators/:administratorId/status", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.administratorId)) {
        throw new ApiError(400, "Invalid administrator ID.");
    }
    const { status } = z.object({ status: z.enum(["active", "suspended"]) }).parse(req.body);
    const administrator = await UserModel.findOne({
        _id: req.params.administratorId,
        role: { $in: ["admin", "hub_admin"] },
        isDeleted: { $ne: true },
    });
    if (!administrator) throw new ApiError(404, "Administrator account not found.");
    if (administrator._id.toString() === req.user.id && status !== "active") {
        throw new ApiError(400, "You cannot suspend your own administrator account.");
    }
    if (status === "suspended" && administrator.accountStatus === "active") {
        const activeAdministrators = await UserModel.countDocuments({
            role: { $in: ["admin", "hub_admin"] },
            accountStatus: "active",
            isDeleted: { $ne: true },
        });
        if (activeAdministrators <= 1) {
            throw new ApiError(409, "The last active administrator cannot be suspended.");
        }
    }
    administrator.accountStatus = status;
    await administrator.save();
    await writeAudit(req.user.id, `administrator_status_${status}`, "User", administrator._id.toString());
    res.json({ message: `Administrator status changed to ${status}.` });
}));
adminRouter.patch("/users/:userId/status", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.userId)) throw new ApiError(400, "Invalid user ID.");
    const { status } = z.object({ status: z.enum(["active", "suspended"]) }).parse(req.body);
    const account = await UserModel.findOne({
        _id: req.params.userId,
        role: { $in: ["student", "teacher"] },
        isDeleted: { $ne: true },
    });
    if (!account) throw new ApiError(404, "Student or teacher account not found.");
    account.accountStatus = status;
    await account.save();
    await writeAudit(req.user.id, `user_status_${status}`, "User", account._id.toString(), { role: account.role });
    res.json({ message: `${account.role === "student" ? "Student" : "Teacher"} account status changed to ${status}.` });
}));
adminRouter.get("/students", asyncHandler(async (_req, res) => {
    const students = await UserModel.find({ role: "student", isDeleted: { $ne: true } })
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .lean();
    res.json({ students });
}));
adminRouter.delete("/users/:userId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.userId)) {
        throw new ApiError(400, "Invalid user ID.");
    }
    const user = await UserModel.findOne({
        _id: req.params.userId,
        role: { $in: ["teacher", "student", "admin", "hub_admin"] },
        isDeleted: { $ne: true },
    });
    if (!user) {
        throw new ApiError(404, "Account not found.");
    }
    if (user._id.toString() === req.user.id) {
        throw new ApiError(400, "You cannot delete your own administrator account.");
    }
    if (user.role === "admin" || user.role === "hub_admin") {
        const activeAdministrators = await UserModel.countDocuments({
            role: { $in: ["admin", "hub_admin"] },
            accountStatus: "active",
            isDeleted: { $ne: true },
        });
        if (user.accountStatus === "active" && activeAdministrators <= 1) {
            throw new ApiError(409, "The last active administrator cannot be deleted.");
        }
    }

    const userId = user._id;
    const deletedAt = new Date();
    await UserModel.updateOne(
        { _id: userId },
        {
            $set: {
                name: "Removed account",
                fullName: "Removed account",
                email: `removed-${userId.toString()}@deleted.invalid`,
                accountStatus: "suspended",
                isVerified: false,
                emailVerified: false,
                isDeleted: true,
                deletedAt,
            },
            $unset: {
                password: "",
                passwordHash: "",
                googleId: "",
                verificationCode: "",
                codeExpiresAt: "",
                codePurpose: "",
                codeAttempts: "",
                codeSentAt: "",
                studentProfile: "",
                teacherProfile: "",
            },
        },
    );
    await Promise.all([
        ClassroomModel.updateMany({ students: userId }, { $pull: { students: userId } }),
        ClassroomModel.updateMany({ teacher: userId }, { $set: { teacher: null } }),
        TeacherApplicationModel.deleteOne({ user: userId }),
        NotificationModel.deleteMany({ user: userId }),
    ]);
    await writeAudit(req.user.id, "user_account_deleted", "User", userId.toString(), {
        role: user.role,
        deletedAt: deletedAt.toISOString(),
    });
    const accountType = user.role === "teacher" ? "Teacher" : user.role === "student" ? "Student" : "Administrator";
    res.json({ message: `${accountType} account deleted. Historical learning records were retained.` });
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
adminRouter.patch("/categories/:categoryId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.categoryId)) throw new ApiError(400, "Invalid category ID.");
    const data = z.object({
        name: z.string().trim().min(2).optional(),
        description: z.string().default("").optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
    }).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.").parse(req.body);
    const category = await LearningCategoryModel.findById(req.params.categoryId);
    if (!category) throw new ApiError(404, "Category not found.");
    if (data.name) {
        category.name = data.name;
        category.slug = slugify(data.name);
    }
    if (data.description !== undefined) category.description = data.description;
    if (data.sortOrder !== undefined) category.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) category.isActive = data.isActive;
    await category.save();
    await writeAudit(req.user.id, "category_updated", "LearningCategory", category._id.toString());
    res.json({ category });
}));
adminRouter.delete("/categories/:categoryId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.categoryId)) throw new ApiError(400, "Invalid category ID.");
    const category = await LearningCategoryModel.findById(req.params.categoryId);
    if (!category) throw new ApiError(404, "Category not found.");
    if (await CourseModel.exists({ category: category._id })) {
        throw new ApiError(409, "Move or delete this category's courses before deleting the category.");
    }
    await LearningCategoryModel.deleteOne({ _id: category._id });
    await writeAudit(req.user.id, "category_deleted", "LearningCategory", category._id.toString());
    res.json({ message: "Category deleted." });
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
    if (!mongoose.isValidObjectId(data.categoryId) || !(await LearningCategoryModel.exists({ _id: data.categoryId }))) {
        throw new ApiError(400, "Select a valid category.");
    }
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
adminRouter.patch("/courses/:courseId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.courseId)) throw new ApiError(400, "Invalid course ID.");
    const data = z.object({
        title: z.string().trim().min(3).optional(),
        description: z.string().trim().min(10).optional(),
        categoryId: z.string().optional(),
        learningObjectives: z.array(z.string()).optional(),
        skillLevel: z.string().optional(),
        status: z.enum(["draft", "published", "archived", "inactive"]).optional(),
    }).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.").parse(req.body);
    const course = await CourseModel.findById(req.params.courseId);
    if (!course) throw new ApiError(404, "Course not found.");
    if (data.categoryId) {
        if (!mongoose.isValidObjectId(data.categoryId) || !(await LearningCategoryModel.exists({ _id: data.categoryId }))) {
            throw new ApiError(400, "Select a valid category.");
        }
        course.category = data.categoryId;
    }
    if (data.title) {
        course.title = data.title;
        course.slug = slugify(`${data.title}-${course._id.toString().slice(-6)}`);
    }
    if (data.description !== undefined) course.description = data.description;
    if (data.learningObjectives !== undefined) course.learningObjectives = data.learningObjectives;
    if (data.skillLevel !== undefined) course.skillLevel = data.skillLevel;
    if (data.status !== undefined) course.status = data.status;
    await course.save();
    await writeAudit(req.user.id, "course_updated", "Course", course._id.toString());
    res.json({ course });
}));
adminRouter.delete("/courses/:courseId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.courseId)) throw new ApiError(400, "Invalid course ID.");
    const course = await CourseModel.findById(req.params.courseId);
    if (!course) throw new ApiError(404, "Course not found.");
    if (await ClassroomModel.exists({ course: course._id })) {
        throw new ApiError(409, "Archive this course or move its cohorts before deleting it.");
    }
    if (await LearningResourceModel.exists({ course: course._id })) {
        throw new ApiError(409, "Remove this course's learning resources before deleting it.");
    }
    await CourseModel.deleteOne({ _id: course._id });
    await writeAudit(req.user.id, "course_deleted", "Course", course._id.toString());
    res.json({ message: "Course deleted." });
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
    if (!mongoose.isValidObjectId(data.courseId) || !(await CourseModel.exists({ _id: data.courseId }))) {
        throw new ApiError(400, "Select a valid course.");
    }
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
    const sessions = await ClassSessionModel.find({ classroom: { $in: classes.map((classroom) => classroom._id) } })
        .sort({ startsAt: 1 })
        .lean();
    res.json({ classes, sessions });
}));
adminRouter.patch("/classes/:classId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.classId)) throw new ApiError(400, "Invalid cohort ID.");
    const data = z.object({
        title: z.string().trim().min(3).optional(),
        courseId: z.string().optional(),
        teacherId: z.string().nullable().optional(),
        capacity: z.number().int().min(1).max(100).optional(),
        status: z.enum(["planned", "active", "completed", "archived"]).optional(),
        timeZone: z.string().optional(),
        description: z.string().optional(),
    }).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.").parse(req.body);
    const classroom = await ClassroomModel.findById(req.params.classId);
    if (!classroom) throw new ApiError(404, "Cohort not found.");
    if (data.courseId) {
        if (!mongoose.isValidObjectId(data.courseId) || !(await CourseModel.exists({ _id: data.courseId }))) {
            throw new ApiError(400, "Select a valid course.");
        }
        classroom.course = data.courseId;
    }
    if (data.teacherId !== undefined && data.teacherId !== null) {
        if (!mongoose.isValidObjectId(data.teacherId)) throw new ApiError(400, "Invalid teacher ID.");
        const teacher = await UserModel.findOne({ _id: data.teacherId, role: "teacher", accountStatus: "active", isDeleted: { $ne: true } });
        if (!teacher) throw new ApiError(400, "Assigned teacher must be an active teacher.");
        classroom.teacher = teacher._id;
    } else if (data.teacherId === null) {
        classroom.teacher = null;
    }
    if (data.capacity !== undefined) {
        if (data.capacity < classroom.students.length) throw new ApiError(400, "Capacity cannot be lower than current enrollment.");
        classroom.capacity = data.capacity;
    }
    if (data.title !== undefined) classroom.title = data.title;
    if (data.status !== undefined) classroom.status = data.status;
    if (data.timeZone !== undefined) classroom.timeZone = data.timeZone;
    if (data.description !== undefined) classroom.description = data.description;
    await classroom.save();
    await writeAudit(req.user.id, "classroom_updated", "Classroom", classroom._id.toString());
    res.json({ classroom });
}));
adminRouter.delete("/classes/:classId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.classId)) throw new ApiError(400, "Invalid cohort ID.");
    const classroom = await ClassroomModel.findById(req.params.classId).lean();
    if (!classroom) throw new ApiError(404, "Cohort not found.");
    const [sessions, assessments, assignments, resources] = await Promise.all([
        ClassSessionModel.find({ classroom: classroom._id }).select("_id").lean(),
        AssessmentModel.find({ classroom: classroom._id }).select("_id").lean(),
        AssignmentModel.find({ classroom: classroom._id }).select("_id").lean(),
        LearningResourceModel.find({ classroom: classroom._id }).select("storedKey storageProvider").lean(),
    ]);
    const sessionIds = sessions.map(({ _id }) => _id);
    const assessmentIds = assessments.map(({ _id }) => _id);
    const assignmentIds = assignments.map(({ _id }) => _id);
    await Promise.all([
        AnnouncementModel.deleteMany({ classroom: classroom._id }),
        AssessmentAttemptModel.deleteMany({ $or: [
            { classroom: classroom._id },
            ...(assessmentIds.length ? [{ assessment: { $in: assessmentIds } }] : []),
        ] }),
        AssignmentSubmissionModel.deleteMany({ $or: [
            { classroom: classroom._id },
            ...(assignmentIds.length ? [{ assignment: { $in: assignmentIds } }] : []),
        ] }),
        AttendanceRecordModel.deleteMany({ $or: [
            { classroom: classroom._id },
            ...(sessionIds.length ? [{ session: { $in: sessionIds } }] : []),
        ] }),
        CertificateModel.deleteMany({ classroom: classroom._id }),
        DiscussionModel.deleteMany({ classroom: classroom._id }),
        LearningResourceModel.deleteMany({ classroom: classroom._id }),
        AssessmentModel.deleteMany({ classroom: classroom._id }),
        AssignmentModel.deleteMany({ classroom: classroom._id }),
        ClassSessionModel.deleteMany({ classroom: classroom._id }),
        ClassroomModel.deleteOne({ _id: classroom._id }),
    ]);
    for (const studentId of classroom.students) {
        const stillEnrolled = await ClassroomModel.exists({ students: studentId });
        if (!stillEnrolled) {
            await UserModel.updateOne({ _id: studentId }, { $set: { "studentProfile.placementStatus": "pending" } });
        }
    }
    for (const resource of resources) {
        if (resource.storageProvider !== "local_disk" || !resource.storedKey) continue;
        const filePath = getLocalFilePath(resource.storedKey);
        if (filePath) await fs.unlink(filePath);
    }
    await writeAudit(req.user.id, "classroom_deleted", "Classroom", classroom._id.toString());
    res.json({ message: "Cohort and its learning records deleted." });
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
adminRouter.patch("/sessions/:sessionId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.sessionId)) throw new ApiError(400, "Invalid session ID.");
    const data = z.object({
        title: z.string().trim().min(3).optional(),
        description: z.string().optional(),
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional(),
        meetingUrl: z.union([z.string().url(), z.literal("")]).optional(),
        status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
    }).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.").parse(req.body);
    const session = await ClassSessionModel.findById(req.params.sessionId);
    if (!session) throw new ApiError(404, "Session not found.");
    const startsAt = data.startsAt ? new Date(data.startsAt) : session.startsAt;
    const endsAt = data.endsAt ? new Date(data.endsAt) : session.endsAt;
    if (startsAt >= endsAt) throw new ApiError(400, "Session end time must be after start time.");
    if (session.status === "scheduled" && (data.startsAt || data.endsAt)) {
        const conflict = await ClassSessionModel.findOne({
            _id: { $ne: session._id },
            teacher: session.teacher,
            status: "scheduled",
            startsAt: { $lt: endsAt },
            endsAt: { $gt: startsAt },
        });
        if (conflict) throw new ApiError(409, "The assigned teacher already has a conflicting session.");
    }
    if (data.title !== undefined) session.title = data.title;
    if (data.description !== undefined) session.description = data.description;
    session.startsAt = startsAt;
    session.endsAt = endsAt;
    if (data.meetingUrl !== undefined) session.meetingUrl = data.meetingUrl;
    if (data.status !== undefined) session.status = data.status;
    await session.save();
    await writeAudit(req.user.id, "session_updated", "ClassSession", session._id.toString());
    res.json({ session });
}));
adminRouter.delete("/sessions/:sessionId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.sessionId)) throw new ApiError(400, "Invalid session ID.");
    const session = await ClassSessionModel.findById(req.params.sessionId);
    if (!session) throw new ApiError(404, "Session not found.");
    await Promise.all([
        AttendanceRecordModel.deleteMany({ session: session._id }),
        ClassSessionModel.deleteOne({ _id: session._id }),
    ]);
    await writeAudit(req.user.id, "session_deleted", "ClassSession", session._id.toString());
    res.json({ message: "Session and its attendance records deleted." });
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
adminRouter.patch("/faqs/:faqId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.faqId)) throw new ApiError(400, "Invalid FAQ ID.");
    const data = z.object({
        question: z.string().trim().min(5).optional(),
        answer: z.string().trim().min(10).optional(),
        isPublished: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
    }).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.").parse(req.body);
    const faq = await FAQModel.findByIdAndUpdate(req.params.faqId, { $set: data }, { new: true, runValidators: true });
    if (!faq) throw new ApiError(404, "FAQ not found.");
    await writeAudit(req.user.id, "faq_updated", "FAQ", faq._id.toString());
    res.json({ faq });
}));
adminRouter.delete("/faqs/:faqId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.faqId)) throw new ApiError(400, "Invalid FAQ ID.");
    const faq = await FAQModel.findByIdAndDelete(req.params.faqId);
    if (!faq) throw new ApiError(404, "FAQ not found.");
    await writeAudit(req.user.id, "faq_deleted", "FAQ", faq._id.toString());
    res.json({ message: "FAQ deleted." });
}));
adminRouter.get("/contact-inquiries", asyncHandler(async (_req, res) => {
    const inquiries = await ContactInquiryModel.find().sort({ createdAt: -1 }).lean();
    res.json({ inquiries });
}));
adminRouter.patch("/contact-inquiries/:inquiryId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.inquiryId)) throw new ApiError(400, "Invalid inquiry ID.");
    const data = z.object({ status: z.enum(["new", "in_progress", "closed"]) }).parse(req.body);
    const inquiry = await ContactInquiryModel.findByIdAndUpdate(req.params.inquiryId, { $set: data }, { new: true, runValidators: true });
    if (!inquiry) throw new ApiError(404, "Contact inquiry not found.");
    await writeAudit(req.user.id, `contact_inquiry_${data.status}`, "ContactInquiry", inquiry._id.toString());
    res.json({ inquiry });
}));
adminRouter.delete("/contact-inquiries/:inquiryId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.inquiryId)) throw new ApiError(400, "Invalid inquiry ID.");
    const inquiry = await ContactInquiryModel.findByIdAndDelete(req.params.inquiryId);
    if (!inquiry) throw new ApiError(404, "Contact inquiry not found.");
    await writeAudit(req.user.id, "contact_inquiry_deleted", "ContactInquiry", inquiry._id.toString());
    res.json({ message: "Contact inquiry deleted." });
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
    const teacher = await UserModel.findOne({ _id: req.params.teacherId, role: "teacher", isDeleted: { $ne: true } });
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
    if (data.target === "classroom" && !data.classroomId) {
        throw new ApiError(400, "Select a cohort for a cohort-specific announcement.");
    }
    if (data.classroomId && !mongoose.isValidObjectId(data.classroomId)) {
        throw new ApiError(400, "Select a valid cohort.");
    }
    if (data.classroomId && !(await ClassroomModel.exists({ _id: data.classroomId }))) {
        throw new ApiError(404, "Cohort not found.");
    }
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
adminRouter.patch("/announcements/:announcementId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.announcementId)) throw new ApiError(400, "Invalid announcement ID.");
    const data = z.object({
        title: z.string().trim().min(3).optional(),
        content: z.string().trim().min(5).optional(),
        target: z.enum(["all", "all_students", "all_teachers", "classroom"]).optional(),
        classroomId: z.string().nullable().optional(),
        priority: z.enum(["normal", "high", "urgent"]).optional(),
    }).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.").parse(req.body);
    const announcement = await AnnouncementModel.findById(req.params.announcementId);
    if (!announcement) throw new ApiError(404, "Announcement not found.");
    if (data.title !== undefined) announcement.title = data.title;
    if (data.content !== undefined) announcement.content = data.content;
    if (data.target !== undefined) announcement.target = data.target;
    if (data.priority !== undefined) announcement.priority = data.priority;
    if (data.classroomId !== undefined) {
        if (data.classroomId === null) announcement.classroom = null;
        else {
            if (!mongoose.isValidObjectId(data.classroomId) || !(await ClassroomModel.exists({ _id: data.classroomId }))) {
                throw new ApiError(400, "Select a valid cohort.");
            }
            announcement.classroom = data.classroomId;
        }
    }
    if (announcement.target === "classroom" && !announcement.classroom) {
        throw new ApiError(400, "Select a cohort for a cohort-specific announcement.");
    }
    await announcement.save();
    await writeAudit(req.user.id, "announcement_updated", "Announcement", announcement._id.toString());
    res.json({ announcement });
}));
adminRouter.delete("/announcements/:announcementId", asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.announcementId)) throw new ApiError(400, "Invalid announcement ID.");
    const announcement = await AnnouncementModel.findByIdAndDelete(req.params.announcementId);
    if (!announcement) throw new ApiError(404, "Announcement not found.");
    await writeAudit(req.user.id, "announcement_deleted", "Announcement", announcement._id.toString());
    res.json({ message: "Announcement deleted." });
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
