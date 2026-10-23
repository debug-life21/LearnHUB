import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { asyncHandler, ApiError } from "../lib/http.js";
import { LearningResourceModel } from "../models/LearningResource.js";
import { ClassroomModel } from "../models/Classroom.js";
import { saveLocalFile, getLocalFilePath, validateFileType } from "../lib/storage.js";
export const resourceRouter = Router();
resourceRouter.use(requireAuth);
resourceRouter.post("/upload", asyncHandler(async (req, res) => {
    if (req.user.role !== "teacher" && req.user.role !== "hub_admin" && req.user.role !== "admin") {
        throw new ApiError(403, "Only teachers and administrators can upload learning resources.");
    }
    const data = z.object({
        title: z.string().min(2),
        description: z.string().default(""),
        category: z.enum(["document", "pdf", "video", "slide", "audio", "worksheet", "other"]).default("document"),
        classroomId: z.string().optional(),
        courseId: z.string().optional(),
        visibility: z.enum(["public", "class_only", "course_only", "admin_only"]).default("class_only"),
        originalFilename: z.string().min(1),
        mimeType: z.string().min(1),
        base64Data: z.string().min(1),
    }).parse(req.body);
    if (!validateFileType(data.originalFilename, data.mimeType)) {
        throw new ApiError(400, "File type or extension is not allowed for educational resources.");
    }
    // Check teacher ownership if uploading to classroom
    if (req.user.role === "teacher" && data.classroomId) {
        const classroom = await ClassroomModel.findOne({ _id: data.classroomId, teacher: req.user.id });
        if (!classroom) {
            throw new ApiError(403, "You can only upload resources to classes you are assigned to teach.");
        }
    }
    const fileBuffer = Buffer.from(data.base64Data, "base64");
    if (fileBuffer.length > 25 * 1024 * 1024) {
        throw new ApiError(400, "File size exceeds the 25MB limit.");
    }
    const saved = saveLocalFile(fileBuffer, data.originalFilename);
    const resource = await LearningResourceModel.create({
        title: data.title,
        description: data.description,
        originalFilename: data.originalFilename,
        storedKey: saved.key,
        mimeType: data.mimeType,
        fileSize: saved.size,
        uploader: req.user.id,
        classroom: data.classroomId ?? null,
        course: data.courseId ?? null,
        category: data.category,
        visibility: data.visibility,
        storageProvider: "local_disk",
        downloadUrl: `/api/resources/${saved.key}/file`,
    });
    res.status(201).json({
        message: "Resource uploaded successfully.",
        resource,
    });
}));
resourceRouter.get("/", asyncHandler(async (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;
    let filter = {};
    if (userRole === "student") {
        // Students can only see resources for classes they are enrolled in or public
        const classes = await ClassroomModel.find({ students: userId }).select("_id course").lean();
        const classIds = classes.map((c) => c._id);
        const courseIds = classes.map((c) => c.course).filter(Boolean);
        filter = {
            $or: [
                { visibility: "public" },
                { classroom: { $in: classIds } },
                { course: { $in: courseIds } },
            ],
        };
    }
    else if (userRole === "teacher") {
        const teacherClasses = await ClassroomModel.find({ teacher: userId }).select("_id course").lean();
        const classIds = teacherClasses.map((c) => c._id);
        const courseIds = teacherClasses.map((c) => c.course).filter(Boolean);
        filter = {
            $or: [
                { uploader: userId },
                { classroom: { $in: classIds } },
                { course: { $in: courseIds } },
                { visibility: "public" },
            ],
        };
    }
    const resources = await LearningResourceModel.find(filter)
        .populate("uploader", "fullName email")
        .populate("classroom", "title")
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .lean();
    res.json({ resources });
}));
resourceRouter.get("/:id/download", asyncHandler(async (req, res) => {
    const resource = await LearningResourceModel.findById(req.params.id);
    if (!resource) {
        throw new ApiError(404, "Resource not found.");
    }
    // Permission check
    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === "student" && resource.visibility !== "public") {
        if (resource.classroom) {
            const enrolled = await ClassroomModel.exists({ _id: resource.classroom, students: userId });
            if (!enrolled) {
                throw new ApiError(403, "You do not have permission to access this resource.");
            }
        }
    }
    const filePath = getLocalFilePath(resource.storedKey);
    if (!filePath) {
        throw new ApiError(404, "File not found on storage server.");
    }
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(resource.originalFilename)}"`);
    res.setHeader("Content-Type", resource.mimeType);
    res.sendFile(filePath);
}));
resourceRouter.get("/:key/file", asyncHandler(async (req, res) => {
    const resource = await LearningResourceModel.findOne({ storedKey: req.params.key });
    if (!resource) {
        throw new ApiError(404, "Resource not found.");
    }
    const filePath = getLocalFilePath(resource.storedKey);
    if (!filePath) {
        throw new ApiError(404, "File not found on storage server.");
    }
    res.setHeader("Content-Type", resource.mimeType);
    res.sendFile(filePath);
}));
resourceRouter.delete("/:id", asyncHandler(async (req, res) => {
    const resource = await LearningResourceModel.findById(req.params.id);
    if (!resource) {
        throw new ApiError(404, "Resource not found.");
    }
    if (req.user.role !== "hub_admin" && req.user.role !== "admin" && resource.uploader.toString() !== req.user.id) {
        throw new ApiError(403, "You cannot delete resources uploaded by someone else.");
    }
    await LearningResourceModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Resource deleted successfully." });
}));
