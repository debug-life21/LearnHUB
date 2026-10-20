import mongoose, { Schema } from "mongoose";

const classroomSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    students: [{ type: Schema.Types.ObjectId, ref: "User", index: true }],
    capacity: { type: Number, default: 20 },
    status: {
      type: String,
      enum: ["planned", "active", "completed", "archived"],
      default: "planned",
      index: true,
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    timeZone: { type: String, default: "Africa/Addis_Ababa" },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

export const ClassroomModel = mongoose.model("Classroom", classroomSchema);
