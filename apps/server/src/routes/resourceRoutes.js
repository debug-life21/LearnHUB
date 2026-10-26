import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { asyncHandler, ApiError } from "../lib/http.js";
import { LearningResourceModel } from "../models/LearningResource.js";
import { ClassroomModel } from "../models/Classroom.js";
import { deleteStoredFile, getStoredFileStream, saveFile, validateFileType } from "../lib/storage.js";
import { pipeline } from "node:stream/promises";
import { normalizeExternalResource } from "../utils/externalResource.js";
export const resourceRouter = Router();
resourceRouter.use(requireAuth);
resourceRouter.post("/upload", asyncHandler(async (req, res) => {
    if (req.user.role !== "teacher" && req.user.role !== "hub_admin" && req.user.role !== "admin") {
        throw new ApiError(403, "Only teachers and administrators can upload learning resources.");
    }
    const data = z.object({
        title: z.string().min(2),
        description: z.string().default(""),
        category: z.enum(["document", "pdf", "spreadsheet", "video", "slide", "audio", "worksheet", "other"]).default("document"),
        sourceType: z.enum(["upload", "youtube", "google_drive"]).default("upload"),
        sourceUrl: z.string().url().optional(),
        classroomId: z.string().optional(),
        courseId: z.string().optional(),
        visibility: z.enum(["public", "class_only", "course_only", "admin_only"]).default("class_only"),
        originalFilename: z.string().optional(),
        mimeType: z.string().optional(),
        base64Data: z.string().optional(),
    }).parse(req.body);
    if (data.visibility === "class_only" && !data.classroomId) {
        throw new ApiError(400, "Choose a cohort for a class-only resource.");
    }
    let external = null;
    if (data.sourceType !== "upload") {
        if (!data.sourceUrl) throw new ApiError(400, "Enter a link for the selected resource.");
        try {
            external = normalizeExternalResource(data.sourceType, data.sourceUrl);
        } catch (error) {
            throw new ApiError(400, error.message);
        }
    } else if (!data.base64Data || !data.originalFilename || !data.mimeType) {
        throw new ApiError(400, "Select a file to upload.");
    } else if (!validateFileType(data.originalFilename, data.mimeType)) {
        throw new ApiError(400, "File type or extension is not allowed for educational resources.");
    }
    // Check teacher ownership if uploading to classroom
    if (req.user.role === "teacher" && data.classroomId) {
        const classroom = await ClassroomModel.findOne({ _id: data.classroomId, teacher: req.user.id });
        if (!classroom) {
            throw new ApiError(403, "You can only upload resources to classes you are assigned to teach.");
        }
    }
    if (data.classroomId && !await ClassroomModel.exists({ _id: data.classroomId })) {
        throw new ApiError(404, "Classroom not found.");
    }
    let saved = null;
    let fileBuffer = null;
    if (!external) {
        fileBuffer = Buffer.from(data.base64Data, "base64");
        if (fileBuffer.length > 25 * 1024 * 1024) {
            throw new ApiError(400, "File size exceeds the 25MB limit.");
        }
        saved = await saveFile(fileBuffer, data.originalFilename, data.mimeType);
    }
    let resource;
    try {
        resource = await LearningResourceModel.create({
            title: data.title,
            description: data.description,
            originalFilename: data.originalFilename || "",
            storedKey: saved?.key || "",
            mimeType: external?.mimeType || data.mimeType,
            fileSize: saved?.size || 0,
            sourceType: data.sourceType,
            externalUrl: external?.externalUrl || "",
            sourceUrl: external?.sourceUrl || "",
            uploader: req.user.id,
            classroom: data.classroomId ?? null,
            course: data.courseId ?? null,
            category: data.sourceType === "youtube" ? "video" : data.category,
            visibility: data.visibility,
            storageProvider: saved?.storageProvider || "external",
            downloadUrl: external?.sourceUrl || `/api/resources/${saved?.key}/file`,
        });
    } catch (error) {
        if (saved) await deleteStoredFile(saved.key, saved.storageProvider);
        throw error;
    }
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
    await authorizeResourceAccess(req, resource);
    if (["youtube", "google_drive"].includes(resource.sourceType)) {
        return res.redirect(303, resource.sourceUrl);
    }
    await sendResourceFile(req, res, resource, true);
}));
resourceRouter.get("/:key/file", asyncHandler(async (req, res) => {
    const resource = await LearningResourceModel.findOne({ storedKey: req.params.key });
    if (!resource) {
        throw new ApiError(404, "Resource not found.");
    }
    await authorizeResourceAccess(req, resource);
    if (["youtube", "google_drive"].includes(resource.sourceType)) {
        return res.redirect(302, resource.externalUrl);
    }
    await sendResourceFile(req, res, resource, false);
}));
resourceRouter.delete("/:id", asyncHandler(async (req, res) => {
    const resource = await LearningResourceModel.findById(req.params.id);
    if (!resource) {
        throw new ApiError(404, "Resource not found.");
    }
    if (req.user.role !== "hub_admin" && req.user.role !== "admin" && resource.uploader.toString() !== req.user.id) {
        throw new ApiError(403, "You cannot delete resources uploaded by someone else.");
    }
    if (!["youtube", "google_drive"].includes(resource.sourceType)) {
        await deleteStoredFile(resource.storedKey, resource.storageProvider || "local_disk");
    }
    await LearningResourceModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Resource deleted successfully." });
}));

async function authorizeResourceAccess(req, resource) {
    if (req.user.role === "hub_admin" || req.user.role === "admin") return;
    if (resource.visibility === "admin_only") {
        throw new ApiError(403, "You do not have permission to access this resource.");
    }
    if (req.user.role === "teacher") {
        const isUploader = resource.uploader.toString() === req.user.id;
        const teachesClass = resource.classroom
            ? await ClassroomModel.exists({ _id: resource.classroom, teacher: req.user.id })
            : false;
        const teachesCourse = resource.course
            ? await ClassroomModel.exists({ course: resource.course, teacher: req.user.id })
            : false;
        if (!isUploader && !teachesClass && !teachesCourse && resource.visibility !== "public") {
            throw new ApiError(403, "You do not have permission to access this resource.");
        }
        return;
    }
    if (resource.visibility === "public") return;
    const enrolled = resource.classroom
        ? await ClassroomModel.exists({ _id: resource.classroom, students: req.user.id })
        : resource.course
            ? await ClassroomModel.exists({ course: resource.course, students: req.user.id })
            : false;
    if (!enrolled) {
        throw new ApiError(403, "You do not have permission to access this resource.");
    }
}

async function sendResourceFile(req, res, resource, asAttachment) {
    const storedFile = await getStoredFileStream(
        resource.storedKey,
        resource.storageProvider || "local_disk",
        req.headers.range || "",
    );
    if (!storedFile) throw new ApiError(404, "File not found in storage.");
    if (storedFile.invalidRange) {
        res.setHeader("Content-Range", `bytes */${storedFile.size}`);
        res.status(416).end();
        return;
    }
    res.setHeader("Content-Type", resource.mimeType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, no-store");
    if (storedFile.contentLength !== undefined) res.setHeader("Content-Length", storedFile.contentLength);
    if (storedFile.contentRange) res.setHeader("Content-Range", storedFile.contentRange);
    res.setHeader(
        "Content-Disposition",
        asAttachment
            ? `attachment; filename*=UTF-8''${encodeURIComponent(resource.originalFilename)}`
            : `inline; filename*=UTF-8''${encodeURIComponent(resource.originalFilename)}`,
    );
    if (storedFile.partial) res.status(206);
    await pipeline(storedFile.body, res);
}
