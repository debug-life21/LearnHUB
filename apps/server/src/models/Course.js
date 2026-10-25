import mongoose, { Schema } from "mongoose";
const lessonSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    durationMinutes: { type: Number, default: 30 },
    videoUrl: { type: String, default: "" },
    resourceUrls: { type: [String], default: [] },
    isFreePreview: { type: Boolean, default: false },
}, { _id: true });

const moduleSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    lessons: { type: [lessonSchema], default: [] },
}, { _id: true });

const courseSchema = new Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, required: true },
    learningObjectives: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "LearningCategory", required: true },
    skillLevel: { type: String, default: "All levels" },
    estimatedDuration: { type: String, default: "8 weeks" },
    thumbnailUrl: { type: String, default: "" },
    modules: { type: [moduleSchema], default: [] },
    prerequisites: { type: [String], default: [] },
    status: {
        type: String,
        enum: ["draft", "published", "archived", "inactive"],
        default: "draft",
        index: true,
    },
}, { timestamps: true });
export const CourseModel = mongoose.model("Course", courseSchema);
