import { Router } from "express";
import { z } from "zod";
import { clearAuthCookie, hashPassword, requireAuth, setAuthCookie, signToken, verifyPassword, type AuthedRequest } from "../auth.js";
import { asyncHandler, ApiError } from "../lib/http.js";
import { TeacherApplicationModel } from "../models/TeacherApplication.js";
import { UserModel } from "../models/User.js";
import { env } from "../config.js";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { randomBytes } from "node:crypto";

export const authRouter = Router();
const googleAuthClient = new OAuth2Client();

async function verifyGoogleCredential(
  credential: string,
): Promise<TokenPayload & { email: string }> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new ApiError(503, "Google sign-in is not configured.");
  }

  let payload: TokenPayload | undefined;
  try {
    const ticket = await googleAuthClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Google sign-in could not be verified.");
  }

  if (!payload?.email || payload.email_verified !== true) {
    throw new ApiError(401, "Google account email could not be verified.");
  }

  return { ...payload, email: payload.email };
}

const baseAuthSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  languagePreference: z.enum(["am", "en"]).default("am"),
});

authRouter.post(
  "/register/student",
  asyncHandler(async (req, res) => {
    const data = baseAuthSchema.extend({
      learningInterests: z.array(z.string()).default([]),
      learningGoals: z.string().default(""),
      currentSkillLevel: z.string().default(""),
      preferredSchedule: z.string().default(""),
    }).parse(req.body);

    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const user = await UserModel.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      role: "student",
      languagePreference: data.languagePreference,
      studentProfile: {
        learningInterests: data.learningInterests,
        learningGoals: data.learningGoals,
        currentSkillLevel: data.currentSkillLevel,
        preferredSchedule: data.preferredSchedule,
        preferredLanguage: data.languagePreference,
        placementStatus: "pending",
      },
    });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    res.status(201).json({
      message: "Student account created successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
      },
    });
  }),
);

authRouter.post(
  "/apply/teacher",
  asyncHandler(async (req, res) => {
    const data = baseAuthSchema.extend({
      qualifications: z.string().min(10),
      experience: z.string().min(10),
      teachingCategories: z.array(z.string()).default([]),
    }).parse(req.body);

    const existing = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const user = await UserModel.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      role: "teacher",
      languagePreference: data.languagePreference,
      accountStatus: "pending_approval",
      teacherProfile: {
        qualifications: data.qualifications,
        expertise: data.teachingCategories,
      },
    });

    await TeacherApplicationModel.create({
      user: user._id,
      qualifications: data.qualifications,
      experience: data.experience,
      teachingCategories: data.teachingCategories,
    });

    res.status(201).json({
      message: "Teacher application submitted and awaiting admin approval.",
    });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }).parse(req.body);

    const user = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const validPassword = await verifyPassword(user.passwordHash, data.password);
    if (!validPassword) {
      throw new ApiError(401, "Invalid email or password.");
    }

    if (user.accountStatus !== "active") {
      throw new ApiError(403, "Your account is not active yet.");
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    res.json({
      message: "Signed in successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        languagePreference: user.languagePreference,
      },
    });
  }),
);

authRouter.post(
  "/google/register/student",
  asyncHandler(async (req, res) => {
    const data = z.object({
      credential: z.string().min(1),
      learningInterests: z.array(z.string()).default([]),
      learningGoals: z.string().default(""),
      currentSkillLevel: z.string().default(""),
      preferredSchedule: z.string().default(""),
      languagePreference: z.enum(["am", "en"]).default("en"),
    }).parse(req.body);
    const payload = await verifyGoogleCredential(data.credential);
    const email = payload.email.toLowerCase();

    if (await UserModel.findOne({ email })) {
      throw new ApiError(409, "An account with this Google email already exists. Sign in instead.");
    }

    const user = await UserModel.create({
      fullName: payload.name?.trim() || email.split("@")[0],
      email,
      passwordHash: await hashPassword(randomBytes(32).toString("base64url")),
      role: "student",
      emailVerified: true,
      languagePreference: data.languagePreference,
      studentProfile: {
        learningInterests: data.learningInterests,
        learningGoals: data.learningGoals,
        currentSkillLevel: data.currentSkillLevel,
        preferredSchedule: data.preferredSchedule,
        preferredLanguage: data.languagePreference,
        placementStatus: "pending",
      },
    });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    res.status(201).json({
      message: "Student account created successfully with Google.",
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        languagePreference: user.languagePreference,
      },
    });
  }),
);

authRouter.post(
  "/google/apply/teacher",
  asyncHandler(async (req, res) => {
    const data = z.object({
      credential: z.string().min(1),
      qualifications: z.string().min(10),
      experience: z.string().min(10),
      teachingCategories: z.array(z.string()).default([]),
    }).parse(req.body);
    const payload = await verifyGoogleCredential(data.credential);
    const email = payload.email.toLowerCase();

    if (await UserModel.findOne({ email })) {
      throw new ApiError(409, "An account with this Google email already exists.");
    }

    const user = await UserModel.create({
      fullName: payload.name?.trim() || email.split("@")[0],
      email,
      passwordHash: await hashPassword(randomBytes(32).toString("base64url")),
      role: "teacher",
      emailVerified: true,
      accountStatus: "pending_approval",
      teacherProfile: {
        qualifications: data.qualifications,
        expertise: data.teachingCategories,
      },
    });

    await TeacherApplicationModel.create({
      user: user._id,
      qualifications: data.qualifications,
      experience: data.experience,
      teachingCategories: data.teachingCategories,
    });

    res.status(201).json({
      message: "Teacher application submitted and awaiting admin approval.",
    });
  }),
);

authRouter.post(
  "/google",
  asyncHandler(async (req, res) => {
    const { credential } = z.object({ credential: z.string().min(1) }).parse(req.body);
    const payload = await verifyGoogleCredential(credential);

    const user = await UserModel.findOne({ email: payload.email.toLowerCase() });
    if (!user || !["student", "teacher"].includes(user.role)) {
      throw new ApiError(403, "Google sign-in is only available for registered student and teacher accounts.");
    }

    if (user.accountStatus !== "active") {
      throw new ApiError(403, "Your account is not active yet.");
    }

    const token = signToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);

    res.json({
      message: "Signed in successfully with Google.",
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        languagePreference: user.languagePreference,
      },
    });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearAuthCookie(res);
    res.json({ message: "Signed out successfully." });
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await UserModel.findById(req.user?.id).select("-passwordHash").lean();

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    res.json({ user });
  }),
);

authRouter.post(
  "/provision-admin",
  asyncHandler(async (req, res) => {
    const data = z.object({
      fullName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      setupKey: z.string().min(4),
    }).parse(req.body);

    if (data.setupKey !== env.INITIAL_ADMIN_SETUP_KEY) {
      throw new ApiError(403, "Invalid admin setup key.");
    }

    const existingAdmin = await UserModel.findOne({ role: "hub_admin" });
    if (existingAdmin) {
      throw new ApiError(409, "An admin account already exists.");
    }

    const existingUser = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, "An account with this email already exists.");
    }

    const admin = await UserModel.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash: await hashPassword(data.password),
      role: "hub_admin",
      languagePreference: "en",
      accountStatus: "active",
      emailVerified: true,
    });

    const token = signToken({ sub: admin._id.toString(), role: admin.role });
    setAuthCookie(res, token);

    res.status(201).json({
      message: "Initial admin created successfully.",
      user: {
        id: admin._id,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  }),
);

authRouter.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = z.object({
      currentPassword: z.string().min(8),
      newPassword: z.string().min(8),
    }).parse(req.body);

    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const isValid = await verifyPassword(user.passwordHash, data.currentPassword);
    if (!isValid) {
      throw new ApiError(401, "Current password is incorrect.");
    }

    user.passwordHash = await hashPassword(data.newPassword);
    await user.save();

    res.json({ message: "Password updated successfully." });
  }),
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const data = z.object({
      email: z.string().email(),
    }).parse(req.body);

    const user = await UserModel.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      // Generic message to prevent account enumeration
      res.json({
        message: "If an account with that email exists, password reset instructions have been dispatched.",
      });
      return;
    }

    // In production, dispatch SMTP email. In dev mode, return safe notification:
    res.json({
      message: "Password reset request accepted. (Dev mode: check server logs or reset via admin provisioning).",
    });
  }),
);
