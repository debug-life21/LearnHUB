import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    kind: { type: String, default: "general" },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String, default: "" },
  },
  { timestamps: true },
);

export const NotificationModel = mongoose.model("Notification", notificationSchema);
