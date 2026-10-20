import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, required: true },
    learningObjectives: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "LearningCategory", required: true },
    skillLevel: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived", "inactive"],
      default: "draft",
      index: true,
    },
  },
  { timestamps: true },
);

export const CourseModel = mongoose.model("Course", courseSchema);
