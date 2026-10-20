import mongoose, { Schema } from "mongoose";
const learningResourceSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    originalFilename: { type: String, required: true },
    storedKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploader: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", default: null, index: true },
    category: {
        type: String,
        enum: ["document", "pdf", "video", "slide", "audio", "worksheet", "other"],
        default: "document",
    },
    visibility: {
        type: String,
        enum: ["public", "class_only", "course_only", "admin_only"],
        default: "class_only",
        index: true,
    },
    storageProvider: { type: String, default: "local_disk" },
    downloadUrl: { type: String, default: "" },
}, { timestamps: true });
export const LearningResourceModel = mongoose.model("LearningResource", learningResourceSchema);
