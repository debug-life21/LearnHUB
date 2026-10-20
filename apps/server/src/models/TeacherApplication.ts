import mongoose, { Schema } from "mongoose";

const teacherApplicationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    qualifications: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    teachingCategories: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const TeacherApplicationModel = mongoose.model(
  "TeacherApplication",
  teacherApplicationSchema,
);
