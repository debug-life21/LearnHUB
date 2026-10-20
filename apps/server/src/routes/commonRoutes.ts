import { Router } from "express";
import { type AuthedRequest, requireAuth } from "../auth.js";
import { asyncHandler, ApiError } from "../lib/http.js";
import { NotificationModel } from "../models/Notification.js";

export const commonRouter = Router();

commonRouter.use(requireAuth);

commonRouter.get(
  "/notifications",
  asyncHandler(async (req: AuthedRequest, res) => {
    const notifications = await NotificationModel.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      notifications,
      unreadCount: notifications.filter((item) => !item.isRead).length,
    });
  }),
);

commonRouter.post(
  "/notifications/:notificationId/read",
  asyncHandler(async (req: AuthedRequest, res) => {
    const notification = await NotificationModel.findOne({
      _id: req.params.notificationId,
      user: req.user!.id,
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found.");
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Notification marked as read." });
  }),
);
