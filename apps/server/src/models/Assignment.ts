import mongoose, { Schema } from "mongoose";

const assignmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    instructions: { type: String, required: true },
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    allowedSubmissionTypes: {
      type: [String],
      enum: ["text", "file", "both"],
      default: ["text"],
    },
    maxScore: { type: Number, default: 100 },
    attachedResourceUrls: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const AssignmentModel = mongoose.model("Assignment", assignmentSchema);
