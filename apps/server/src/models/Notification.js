import mongoose, { Schema } from "mongoose";

// Role-based caps: admin=20, teacher=10, student=10
export const NOTIFICATION_CAPS = { hub_admin: 20, admin: 20, teacher: 10, student: 10 };
export const DEFAULT_CAP = 10;

const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    kind: { type: String, default: "general" },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String, default: "" },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

/**
 * After inserting a notification for a user, prune any excess beyond the cap.
 * @param {string|ObjectId} userId
 * @param {number} cap  max number of notifications to keep (newest first)
 */
export async function pruneNotifications(userId, cap) {
    const maxKeep = cap || DEFAULT_CAP;
    // Find the oldest notifications beyond the cap
    const notifications = await NotificationModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(maxKeep)
        .select("_id")
        .lean();
    if (notifications.length > 0) {
        const idsToDelete = notifications.map((n) => n._id);
        await NotificationModel.deleteMany({ _id: { $in: idsToDelete } });
    }
}

export const NotificationModel = mongoose.model("Notification", notificationSchema);

