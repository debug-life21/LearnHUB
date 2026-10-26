import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { asyncHandler, ApiError } from "../lib/http.js";
import { ClassroomModel } from "../models/Classroom.js";
import { ContactInquiryModel } from "../models/ContactInquiry.js";
import { CourseModel } from "../models/Course.js";
import { FAQModel } from "../models/FAQ.js";
import { LearningCategoryModel } from "../models/LearningCategory.js";
import { TeacherApplicationModel } from "../models/TeacherApplication.js";
import { UserModel } from "../models/User.js";
import { CertificateModel } from "../models/Certificate.js";

export const publicRouter = Router();

publicRouter.get("/home", asyncHandler(async (_req, res) => {
    const [categories, publishedCourses, activeStudents, activeTeachers, activeClasses, pendingTeacherApplications] = await Promise.all([
        LearningCategoryModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
        CourseModel.find({ status: "published" }).limit(6).populate("category").lean(),
        UserModel.countDocuments({ role: "student", accountStatus: "active" }),
        UserModel.countDocuments({ role: "teacher", accountStatus: "active" }),
        ClassroomModel.countDocuments({ status: { $in: ["planned", "active"] } }),
        TeacherApplicationModel.countDocuments({ status: "pending" }),
    ]);
    res.json({
        brand: {
            name: "LearnHUB",
            tagline: "Structured online learning with real teacher guidance and clear student placement.",
        },
        categories,
        featuredCourses: publishedCourses,
        stats: {
            activeStudents,
            activeTeachers,
            activeClasses,
            pendingTeacherApplications,
        },
    });
}));

publicRouter.get("/categories", asyncHandler(async (_req, res) => {
    const categories = await LearningCategoryModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json({ categories });
}));

publicRouter.get("/courses", asyncHandler(async (req, res) => {
    const search = req.query.search ? String(req.query.search).trim() : "";
    const categoryId = req.query.category ? String(req.query.category).trim() : "";
    const skillLevel = req.query.skillLevel ? String(req.query.skillLevel).trim() : "";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const query = { status: "published" };

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { learningObjectives: { $regex: search, $options: "i" } },
        ];
    }

    if (categoryId && mongoose.isValidObjectId(categoryId)) {
        query.category = categoryId;
    }

    if (skillLevel && skillLevel !== "all") {
        query.skillLevel = { $regex: skillLevel, $options: "i" };
    }

    const [total, courses] = await Promise.all([
        CourseModel.countDocuments(query),
        CourseModel.find(query)
            .populate("category", "name description")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
    ]);

    res.json({
        courses,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    });
}));

publicRouter.get("/courses/:slugOrId", asyncHandler(async (req, res) => {
    const identifier = req.params.slugOrId;
    let course = null;
    if (mongoose.isValidObjectId(identifier)) {
        course = await CourseModel.findById(identifier).populate("category").lean();
    }
    if (!course) {
        course = await CourseModel.findOne({ slug: identifier, status: "published" }).populate("category").lean();
    }
    if (!course) {
        throw new ApiError(404, "Course not found.");
    }

    // Related active classrooms count
    const activeCohortsCount = await ClassroomModel.countDocuments({
        course: course._id,
        status: { $in: ["planned", "active"] },
    });

    res.json({
        course: {
            ...course,
            modules: Array.isArray(course.modules) ? course.modules : [],
        },
        activeCohortsCount,
    });
}));

publicRouter.get("/instructors", asyncHandler(async (_req, res) => {
    const teachers = await UserModel.find({
        role: "teacher",
        teacherStatus: "approved",
        accountStatus: "active",
        isDeleted: { $ne: true },
    })
        .select("name fullName email avatarUrl bio teacherProfile createdAt")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    res.json({
        instructors: teachers.map((t) => ({
            id: t._id.toString(),
            name: t.fullName || t.name,
            avatarUrl: t.avatarUrl || "",
            bio: t.bio || t.teacherProfile?.bio || "Certified LearnHUB Instructor passionate about guided student success.",
            expertise: t.teacherProfile?.expertise || ["Interactive Teaching", "Curriculum Mastery"],
            qualifications: t.teacherProfile?.qualifications || "Verified Educator",
        })),
    });
}));

publicRouter.get("/certificates/:certificateNumber", asyncHandler(async (req, res) => {
    const cert = await CertificateModel.findOne({
        certificateNumber: req.params.certificateNumber.trim(),
        status: "valid",
    })
        .populate("course", "title slug")
        .lean();

    if (!cert) {
        throw new ApiError(404, "Certificate not found or has been revoked.");
    }

    res.json({
        certificate: {
            certificateNumber: cert.certificateNumber,
            studentName: cert.studentName,
            courseTitle: cert.courseTitle,
            instructorName: cert.instructorName,
            issueDate: cert.issueDate,
            overallScore: cert.overallScore,
            status: cert.status,
            verificationUrl: `/verify-certificate/${cert.certificateNumber}`,
        },
    });
}));

publicRouter.get("/faqs", asyncHandler(async (_req, res) => {
    const faqs = await FAQModel.find({ isPublished: true }).sort({ sortOrder: 1 }).lean();
    res.json({ faqs });
}));

publicRouter.post("/contact", asyncHandler(async (req, res) => {
    const data = z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        subject: z.string().min(3),
        message: z.string().min(10),
    }).parse(req.body);
    const inquiry = await ContactInquiryModel.create(data);
    res.status(201).json({
        message: "Your inquiry has been submitted successfully.",
        inquiryId: inquiry._id,
    });
}));
