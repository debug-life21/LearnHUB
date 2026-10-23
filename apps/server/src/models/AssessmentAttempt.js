import mongoose, { Schema } from "mongoose";
const assessmentAttemptSchema = new Schema({
    assessment: { type: Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    answers: [
        {
            questionId: { type: Schema.Types.ObjectId, required: true },
            selectedOption: { type: Number, required: true },
            isCorrect: { type: Boolean, required: true },
        },
    ],
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    completedAt: { type: Date, default: Date.now },
}, { timestamps: true });
export const AssessmentAttemptModel = mongoose.model("AssessmentAttempt", assessmentAttemptSchema);
