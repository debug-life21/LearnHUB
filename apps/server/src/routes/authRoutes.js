import { Router } from "express";
import { z } from "zod";
import { clearAuthCookie, hashPassword, verifyPassword } from "../auth.js";
import {
    adminLogin,
    forgotPassword,
    google,
    login,
    resendCode,
    resetPassword,
    signup,
    updateProfile,
    verifyCode,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { asyncHandler, ApiError } from "../lib/http.js";
import { UserModel } from "../models/User.js";
import { sendSecurityAlertEmail } from "../utils/email.js";

export const authRouter = Router();

authRouter.post("/signup", asyncHandler(signup));
authRouter.post("/verify-code", asyncHandler(verifyCode));
authRouter.post("/login", asyncHandler(login));
authRouter.post("/admin-login", asyncHandler(adminLogin));
authRouter.post("/resend-code", asyncHandler(resendCode));
authRouter.post("/google", asyncHandler(google));
authRouter.post("/forgot-password", asyncHandler(forgotPassword));
authRouter.post("/reset-password", asyncHandler(resetPassword));
authRouter.patch("/profile", protect, asyncHandler(updateProfile));

async function legacySignup(req, res, next, role) {
    req.body = { ...req.body, name: req.body.name || req.body.fullName, role };
    return signup(req, res, next);
}
async function legacyGoogleSignup(req, res, next, role) {
    req.body = { ...req.body, role };
    return google(req, res, next);
}
authRouter.post("/register/student", asyncHandler((req, res, next) => legacySignup(req, res, next, "student")));
authRouter.post("/apply/teacher", asyncHandler((req, res, next) => legacySignup(req, res, next, "teacher")));
authRouter.post("/google/register/student", asyncHandler((req, res, next) => legacyGoogleSignup(req, res, next, "student")));
authRouter.post("/google/apply/teacher", asyncHandler((req, res, next) => legacyGoogleSignup(req, res, next, "teacher")));

authRouter.post("/logout", (_req, res) => {
    clearAuthCookie(res);
    res.json({ message: "Signed out successfully." });
});

authRouter.get("/me", protect, asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user.id)
        .select("-password -passwordHash -verificationCode -codeExpiresAt -codePurpose -codeAttempts -codeSentAt -resetPasswordToken -resetPasswordExpires")
        .lean();
    if (!user || user.isDeleted) {
        throw new ApiError(404, "User not found.");
    }
    res.json({
        user: {
            id: user._id.toString(),
            name: user.name || user.fullName,
            fullName: user.fullName || user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            phone: user.phone || "",
            bio: user.bio || "",
            avatarUrl: user.avatarUrl || "",
            teacherStatus: user.teacherStatus,
            accountStatus: user.accountStatus,
            languagePreference: user.languagePreference,
            studentProfile: user.studentProfile,
            teacherProfile: user.teacherProfile,
        },
    });
}));

authRouter.post("/change-password", protect, asyncHandler(async (req, res) => {
    const data = z.object({
        currentPassword: z.string().min(8),
        newPassword: z.string().min(8).max(128),
    }).parse(req.body);
    const user = await UserModel.findById(req.user.id).select("+password +passwordHash");
    if (!user || user.isDeleted) {
        throw new ApiError(404, "User not found.");
    }
    const valid = user.password
        ? await verifyPassword(user.password, data.currentPassword)
        : user.passwordHash
            ? await verifyPassword(user.passwordHash, data.currentPassword)
            : false;
    if (!valid) {
        throw new ApiError(401, "Current password is incorrect.");
    }
    user.password = await hashPassword(data.newPassword);
    user.passwordHash = undefined;
    await user.save();

    await sendSecurityAlertEmail({
        email: user.email,
        name: user.name || user.fullName,
        action: "Your password was changed via account settings.",
    });

    res.json({ message: "Password updated successfully." });
}));
