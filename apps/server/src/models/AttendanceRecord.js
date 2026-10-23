import mongoose, { Schema } from "mongoose";
const attendanceRecordSchema = new Schema({
    session: { type: Schema.Types.ObjectId, ref: "ClassSession", required: true, index: true },
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
        type: String,
        enum: ["present", "absent", "late", "excused"],
        required: true,
        default: "present",
    },
    notes: { type: String, default: "" },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });
export const AttendanceRecordModel = mongoose.model("AttendanceRecord", attendanceRecordSchema);
