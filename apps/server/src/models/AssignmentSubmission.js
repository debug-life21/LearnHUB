import mongoose, { Schema } from "mongoose";
const assignmentSubmissionSchema = new Schema({
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true, index: true },
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    textResponse: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    originalFilename: { type: String, default: "" },
    status: {
        type: String,
        enum: ["submitted", "graded", "resubmitted"],
        default: "submitted",
        index: true,
    },
    score: { type: Number, default: null },
    feedback: { type: String, default: "" },
    gradedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    gradedAt: { type: Date, default: null },
}, { timestamps: true });
// A student can have one submission per assignment
assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
export const AssignmentSubmissionModel = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);
