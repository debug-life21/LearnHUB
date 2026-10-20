import mongoose, { Schema } from "mongoose";

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    target: {
      type: String,
      enum: ["all", "all_students", "all_teachers", "classroom"],
      required: true,
      index: true,
    },
    classroom: { type: Schema.Types.ObjectId, ref: "Classroom", default: null, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    priority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      default: "normal",
    },
  },
  { timestamps: true },
);

export const AnnouncementModel = mongoose.model("Announcement", announcementSchema);
