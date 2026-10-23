import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/http.js";
import { ClassroomModel } from "../models/Classroom.js";
import { ContactInquiryModel } from "../models/ContactInquiry.js";
import { CourseModel } from "../models/Course.js";
import { FAQModel } from "../models/FAQ.js";
import { LearningCategoryModel } from "../models/LearningCategory.js";
import { TeacherApplicationModel } from "../models/TeacherApplication.js";
import { UserModel } from "../models/User.js";
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
