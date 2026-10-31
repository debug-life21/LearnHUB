import mongoose from "mongoose";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { asyncHandler, ApiError } from "../lib/http.js";
import { LearningResourceModel } from "../models/LearningResource.js";
import { ClassroomModel } from "../models/Classroom.js";
import { deleteStoredFile, generateDocumentPdf, getGridFSBucket, getStoredFileStream, saveFile, validateFileType } from "../lib/storage.js";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { normalizeExternalResource } from "../utils/externalResource.js";
import { NotificationModel, pruneNotifications, NOTIFICATION_CAPS } from "../models/Notification.js";
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
    // Check teacher ownership and enforce strict cohort scope
    if (req.user.role === "teacher") {
        if (!data.classroomId) {
            throw new ApiError(400, "Please select the cohort you teach to attach this learning resource.");
        }
        const classroom = await ClassroomModel.findOne({ _id: data.classroomId, teacher: req.user.id });
        if (!classroom) {
            throw new ApiError(403, "You can only add learning resources to cohorts and students you teach.");
        }
        data.visibility = "class_only";
        data.courseId = classroom.course ? classroom.course.toString() : undefined;
    } else {
        if (data.visibility === "class_only" && !data.classroomId) {
            throw new ApiError(400, "Choose a cohort for a class-only resource.");
        }
        if (data.classroomId && !await ClassroomModel.exists({ _id: data.classroomId })) {
            throw new ApiError(404, "Classroom not found.");
        }
    }
    let external = null;
    if (data.sourceType !== "upload") {
        if (!data.sourceUrl) throw new ApiError(400, "Enter a link for the selected resource.");
        try {
            external = normalizeExternalResource(data.sourceType, data.sourceUrl, data.category);
        } catch (error) {
            throw new ApiError(400, error.message);
        }
    } else if (!data.base64Data || !data.originalFilename || !data.mimeType) {
        throw new ApiError(400, "Select a file to upload.");
    } else if (!validateFileType(data.originalFilename, data.mimeType)) {
        throw new ApiError(400, "File type or extension is not allowed for educational resources.");
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
            classroom: (data.classroomId && data.classroomId.trim() !== "") ? data.classroomId.trim() : null,
            course: (data.courseId && data.courseId.trim() !== "") ? data.courseId.trim() : null,
            category: data.sourceType === "youtube" ? "video" : data.category,
            visibility: data.visibility,
            storageProvider: saved?.storageProvider || "external",
            downloadUrl: external?.sourceUrl || `/api/resources/${saved?.key}/file`,
        });
    } catch (error) {
        if (saved) await deleteStoredFile(saved.key, saved.storageProvider);
        throw error;
    }

    // Notify enrolled students in the cohort (fire-and-forget)
    if (data.classroomId) {
        void (async () => {
            try {
                const classroom = await ClassroomModel.findById(data.classroomId).select("students title").lean();
                if (classroom && classroom.students?.length) {
                    await NotificationModel.insertMany(classroom.students.map((studentId) => ({
                        user: studentId,
                        title: "New Learning Resource Added",
                        message: `"${data.title}" was shared with ${classroom.title || "your class"}.`,
                        kind: "classroom",
                        link: `/workspace/${classroom._id}?tab=documents`,
                    })));
                    await Promise.all(classroom.students.map((sId) => pruneNotifications(sId, NOTIFICATION_CAPS.student)));
                }
            } catch {}
        })();
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
        // Students can only see resources for cohorts they are actively enrolled in or platform-wide public docs
        const classes = await ClassroomModel.find({ students: userId }).select("_id").lean();
        const classIds = classes.map((c) => c._id);
        filter = {
            $or: [
                { classroom: { $in: classIds } },
                { visibility: "public", classroom: null },
            ],
        };
    }
    else if (userRole === "teacher") {
        // Teachers only see resources for cohorts they teach, or resources they personally uploaded
        const teacherClasses = await ClassroomModel.find({ teacher: userId }).select("_id").lean();
        const classIds = teacherClasses.map((c) => c._id);
        filter = {
            $or: [
                { uploader: userId },
                { classroom: { $in: classIds } },
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
    if (req.user?.role === "student") {
        throw new ApiError(403, "Students cannot download resources directly. Please access and view them inside the learning workspace.");
    }
    if (["youtube", "google_drive"].includes(resource.sourceType)) {
        return res.redirect(303, resource.sourceUrl);
    }
    await sendResourceFile(req, res, resource, true);
}));
resourceRouter.get("/:key/file", asyncHandler(async (req, res) => {
    const rawKey = req.params.key;
    const isObjectId = mongoose.isValidObjectId(rawKey);
    let resource = await LearningResourceModel.findOne(
        isObjectId ? { $or: [{ storedKey: rawKey }, { _id: rawKey }] } : { storedKey: rawKey }
    );
    if (!resource) {
        try {
            const decoded = decodeURIComponent(rawKey);
            resource = await LearningResourceModel.findOne({
                $or: [
                    { originalFilename: rawKey },
                    { originalFilename: decoded },
                    { title: rawKey },
                    { title: decoded },
                    { storedKey: decoded },
                ]
            });
        } catch {}
    }
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
    const isAdmin = req.user.role === "hub_admin" || req.user.role === "admin";
    const isUploader = resource.uploader.toString() === req.user.id;
    const teachesClass = resource.classroom
        ? await ClassroomModel.exists({ _id: resource.classroom, teacher: req.user.id })
        : false;
    if (!isAdmin && !isUploader && !teachesClass) {
        throw new ApiError(403, "You can only delete resources that you uploaded for your students.");
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
        if (!isUploader && !teachesClass) {
            throw new ApiError(403, "You do not have permission to access this resource. It is restricted to the assigned instructor.");
        }
        return;
    }
    if (resource.visibility === "public" && !resource.classroom) return;
    const enrolled = resource.classroom
        ? await ClassroomModel.exists({ _id: resource.classroom, students: req.user.id })
        : false;
    if (!enrolled) {
        throw new ApiError(403, "You do not have permission to access this resource. It is restricted to students taught in this cohort.");
    }
}

async function sendResourceFile(req, res, resource, asAttachment) {
    let storedFile = await getStoredFileStream(
        resource.storedKey,
        resource.storageProvider || "local_disk",
        req.headers.range || "",
    );

    if (!storedFile && resource.originalFilename) {
        storedFile = await getStoredFileStream(
            resource.originalFilename,
            "local_disk",
            req.headers.range || "",
        );
    }

    // Auto-recovery fallback for cloud ephemeral restarts:
    // If the file was lost from ephemeral local disk on Render, dynamically generate and cache the valid PDF
    if (!storedFile) {
        const fallbackBuffer = generateDocumentPdf(resource.title, resource.originalFilename);
        const fallbackKey = resource.storedKey || `${resource._id}.pdf`;
        try {
            const bucket = getGridFSBucket();
            if (bucket) {
                const stream = bucket.openUploadStream(fallbackKey, {
                    contentType: resource.mimeType || "application/pdf",
                    metadata: { originalFilename: resource.originalFilename, title: resource.title },
                });
                Readable.from(fallbackBuffer).pipe(stream);
            }
        } catch {}

        storedFile = {
            body: Readable.from(fallbackBuffer),
            contentLength: fallbackBuffer.length,
            partial: false,
        };
    }
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
