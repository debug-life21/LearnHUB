import bcrypt from "bcryptjs";
import { randomInt, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { env } from "../config.js";
import { setAuthCookie, signToken, verifyPassword, hashPassword } from "../auth.js";
import { ApiError } from "../lib/http.js";
import { TeacherApplicationModel } from "../models/TeacherApplication.js";
import { UserModel } from "../models/User.js";
import { sendVerificationCode, sendPasswordResetEmail, sendSecurityAlertEmail } from "../utils/email.js";

const googleAuthClient = new OAuth2Client();
const codeLifetimeMs = 10 * 60 * 1000;
const resendCooldownMs = 60 * 1000;

const signupSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
    role: z.enum(["student", "teacher"]),
});

function userResponse(user) {
    return {
        id: user._id.toString(),
        name: user.name || user.fullName,
        fullName: user.fullName || user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        teacherStatus: user.teacherStatus,
        accountStatus: user.accountStatus,
        languagePreference: user.languagePreference,
    };
}

function setSessionCookie(res, user) {
    setAuthCookie(res, signToken({ sub: user._id.toString(), role: user.role }));
}

async function issueCode(user, purpose) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    user.verificationCode = await bcrypt.hash(code, 10);
    user.codeExpiresAt = new Date(Date.now() + codeLifetimeMs);
    user.codePurpose = purpose;
    user.codeAttempts = 0;
    user.codeSentAt = new Date();
    await user.save();
    await sendVerificationCode({ email: user.email, name: user.name || user.fullName, code });
}

function normalizedEmail(email) {
    return email.toLowerCase();
}

export async function signup(req, res) {
    const data = signupSchema.parse(req.body);
    const email = normalizedEmail(data.email);
    if (await UserModel.exists({ email })) {
        throw new ApiError(409, "An account with this email already exists.");
    }
    const user = await UserModel.create({
        name: data.name,
        fullName: data.name,
        email,
        password: await bcrypt.hash(data.password, 12),
        authProvider: "local",
        role: data.role,
        isVerified: false,
        emailVerified: false,
        teacherStatus: data.role === "teacher" ? "pending" : "approved",
        accountStatus: "pending_approval",
    });
    if (data.role === "teacher") {
        await TeacherApplicationModel.create({
            user: user._id,
            qualifications: "To be provided",
            experience: "To be provided",
            teachingCategories: [],
        });
    }
    await issueCode(user, "signup");
    res.status(201).json({ message: "Verification code sent.", email, purpose: "signup" });
}

export async function login(req, res) {
    const data = z.object({
        email: z.string().trim().email(),
        password: z.string().min(1).max(128),
    }).parse(req.body);
    const user = await UserModel.findOne({ email: normalizedEmail(data.email) })
        .select("+password +passwordHash");
    const passwordHash = user?.password || user?.passwordHash;
    const validPassword = passwordHash ? await verifyPassword(passwordHash, data.password) : false;
    if (!user || !validPassword) {
        throw new ApiError(401, "Invalid email or password.");
    }
    if (user.isDeleted) {
        throw new ApiError(403, "This account is no longer available.");
    }
    if (user.teacherStatus === "rejected" || user.accountStatus === "suspended") {
        throw new ApiError(403, "This account is not available.");
    }
    if (user.role === "admin" || user.role === "hub_admin") {
        if (user.accountStatus !== "active") {
            throw new ApiError(403, "This account is not available.");
        }
        setSessionCookie(res, user);
        res.json({
            message: "Signed in successfully.",
            user: userResponse(user),
        });
        return;
    }
    const purpose = user.isVerified ? "login" : "signup";
    await issueCode(user, purpose);
    res.json({
        message: "Verification code sent.",
        email: user.email,
        purpose,
    });
}

export async function adminLogin(req, res) {
    const data = z.object({
        email: z.string().trim().email(),
        password: z.string().min(1).max(128),
    }).parse(req.body);
    const user = await UserModel.findOne({ email: normalizedEmail(data.email) })
        .select("+password +passwordHash");
    const passwordHash = user?.password || user?.passwordHash;
    const validPassword = passwordHash ? await verifyPassword(passwordHash, data.password) : false;
    if (!user || !validPassword || user.isDeleted) {
        throw new ApiError(401, "Invalid administrator email or password.");
    }
    if (!["admin", "hub_admin"].includes(user.role)) {
        throw new ApiError(403, "This sign-in is for administrators only.");
    }
    if (user.accountStatus !== "active") {
        throw new ApiError(403, "This administrator account is not active.");
    }
    setSessionCookie(res, user);
    res.json({
        message: "Signed in successfully.",
        user: userResponse(user),
    });
}

export async function verifyCode(req, res) {
    const data = z.object({
        email: z.string().trim().email(),
        code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
    }).parse(req.body);
    const user = await UserModel.findOne({ email: normalizedEmail(data.email) })
        .select("+verificationCode +codeExpiresAt +codePurpose +codeAttempts +codeSentAt");
    if (!user || !user.verificationCode || !user.codeExpiresAt) {
        throw new ApiError(400, "The code is invalid or expired. Request a new code.");
    }
    if (user.codeExpiresAt.getTime() <= Date.now()) {
        user.verificationCode = undefined;
        user.codePurpose = undefined;
        await user.save();
        throw new ApiError(400, "The code is invalid or expired. Request a new code.");
    }
    const matches = await bcrypt.compare(data.code, user.verificationCode);
    if (!matches) {
        user.codeAttempts += 1;
        if (user.codeAttempts >= 5) {
            user.verificationCode = undefined;
            user.codeExpiresAt = undefined;
            user.codePurpose = undefined;
            user.codeSentAt = undefined;
            user.codeAttempts = 0;
            await user.save();
            throw new ApiError(429, "Too many incorrect attempts. Request a new code.");
        }
        await user.save();
        throw new ApiError(400, "The code is invalid or expired.");
    }
    const purpose = user.codePurpose;
    user.verificationCode = undefined;
    user.codeExpiresAt = undefined;
    user.codePurpose = undefined;
    user.codeSentAt = undefined;
    user.codeAttempts = 0;
    user.isVerified = true;
    user.emailVerified = true;
    if (user.role === "teacher" && user.teacherStatus === "pending") {
        user.accountStatus = "pending_approval";
    } else if (user.role === "student") {
        user.accountStatus = "active";
    }
    await user.save();
    setSessionCookie(res, user);
    res.json({
        message: "Email verified successfully.",
        user: userResponse(user),
        purpose,
    });
}

export async function resendCode(req, res) {
    const data = z.object({
        email: z.string().trim().email(),
        purpose: z.enum(["signup", "login"]),
    }).parse(req.body);
    const user = await UserModel.findOne({ email: normalizedEmail(data.email) }).select("+codeSentAt");
    if (!user || (data.purpose === "signup" && user.isVerified) || (data.purpose === "login" && !user.isVerified)) {
        res.json({ message: "If the account is eligible, a new code has been sent." });
        return;
    }
    const cooldownRemaining = user.codeSentAt
        ? resendCooldownMs - (Date.now() - user.codeSentAt.getTime())
        : 0;
    if (cooldownRemaining > 0) {
        throw new ApiError(429, `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting another code.`);
    }
    await issueCode(user, data.purpose);
    res.json({ message: "A new verification code has been sent." });
}

export async function google(req, res) {
    const data = z.object({
        credential: z.string().min(1),
        role: z.enum(["student", "teacher"]).optional(),
    }).parse(req.body);
    if (!env.GOOGLE_CLIENT_ID) {
        throw new ApiError(503, "Google sign-in is not configured.");
    }
    let payload;
    try {
        const ticket = await googleAuthClient.verifyIdToken({
            idToken: data.credential,
            audience: env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    }
    catch {
        throw new ApiError(401, "Google sign-in could not be verified.");
    }
    if (!payload?.email || payload.email_verified !== true || !payload.sub) {
        throw new ApiError(401, "Google account email could not be verified.");
    }
    const email = normalizedEmail(payload.email);
    let user = await UserModel.findOne({ $or: [{ email }, { googleId: payload.sub }] });
    if (user?.isDeleted) {
        throw new ApiError(403, "This account is no longer available.");
    }
    if (!user) {
        if (!data.role) {
            throw new ApiError(400, "Choose a role on the sign-up page before continuing with Google.");
        }
        user = await UserModel.create({
            name: payload.name?.trim() || email.split("@")[0],
            fullName: payload.name?.trim() || email.split("@")[0],
            email,
            googleId: payload.sub,
            authProvider: "google",
            role: data.role,
            isVerified: true,
            emailVerified: true,
            teacherStatus: data.role === "teacher" ? "pending" : "approved",
            accountStatus: data.role === "teacher" ? "pending_approval" : "active",
        });
        if (data.role === "teacher") {
            await TeacherApplicationModel.create({
                user: user._id,
                qualifications: "To be provided",
                experience: "To be provided",
                teachingCategories: [],
            });
        }
    } else {
        if (user.role === "admin" || user.role === "hub_admin" || user.role === "support_staff") {
            throw new ApiError(403, "Google sign-in is not available for this account.");
        }
        if (user.teacherStatus === "rejected" || user.accountStatus === "suspended") {
            throw new ApiError(403, "This account is not available.");
        }
        user.googleId = payload.sub;
        user.authProvider = "google";
        user.isVerified = true;
        user.emailVerified = true;
        await user.save();
    }
    setSessionCookie(res, user);
    res.json({ message: "Signed in successfully with Google.", user: userResponse(user) });
}

export async function forgotPassword(req, res) {
    const data = z.object({
        email: z.string().trim().email(),
    }).parse(req.body);
    const email = normalizedEmail(data.email);
    const user = await UserModel.findOne({ email }).select("+resetPasswordToken +resetPasswordExpires +codeSentAt");

    // To prevent user enumeration attacks, always respond with standard success message
    if (!user || user.isDeleted || user.accountStatus === "suspended") {
        res.json({ message: "If an account matches that email, a password reset link and code have been sent." });
        return;
    }

    // Cooldown check (60 seconds)
    const cooldownRemaining = user.codeSentAt
        ? resendCooldownMs - (Date.now() - user.codeSentAt.getTime())
        : 0;
    if (cooldownRemaining > 0) {
        throw new ApiError(429, `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting another reset code.`);
    }

    const resetToken = randomBytes(24).toString("hex");
    const numericCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetPasswordToken = await bcrypt.hash(resetToken, 10);
    user.verificationCode = await bcrypt.hash(numericCode, 10);
    user.codeExpiresAt = expiresAt;
    user.resetPasswordExpires = expiresAt;
    user.codePurpose = "reset_password";
    user.codeAttempts = 0;
    user.codeSentAt = new Date();
    await user.save();

    const clientBaseUrl = env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientBaseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await sendPasswordResetEmail({
        email: user.email,
        name: user.name || user.fullName,
        resetUrl,
        code: numericCode,
    });

    res.json({
        message: "If an account matches that email, a password reset link and code have been sent.",
        email,
    });
}

export async function resetPassword(req, res) {
    const data = z.object({
        email: z.string().trim().email(),
        tokenOrCode: z.string().trim().min(6),
        newPassword: z.string().min(8).max(128),
    }).parse(req.body);

    const email = normalizedEmail(data.email);
    const user = await UserModel.findOne({ email })
        .select("+password +passwordHash +resetPasswordToken +resetPasswordExpires +verificationCode +codeExpiresAt +codeAttempts");

    if (!user || user.isDeleted) {
        throw new ApiError(400, "Invalid or expired password reset request.");
    }

    const isCodeExpired = (user.resetPasswordExpires && user.resetPasswordExpires.getTime() <= Date.now())
        || (user.codeExpiresAt && user.codeExpiresAt.getTime() <= Date.now());

    if (isCodeExpired) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.verificationCode = undefined;
        user.codeExpiresAt = undefined;
        await user.save();
        throw new ApiError(400, "Your reset link or code has expired. Please request a new one.");
    }

    let isMatch = false;
    // Check against 6-digit verification code
    if (user.verificationCode) {
        isMatch = await bcrypt.compare(data.tokenOrCode, user.verificationCode);
    }
    // If not matched, check against URL token
    if (!isMatch && user.resetPasswordToken) {
        isMatch = await bcrypt.compare(data.tokenOrCode, user.resetPasswordToken);
    }

    if (!isMatch) {
        user.codeAttempts = (user.codeAttempts || 0) + 1;
        if (user.codeAttempts >= 5) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.verificationCode = undefined;
            user.codeExpiresAt = undefined;
            user.codeAttempts = 0;
            await user.save();
            throw new ApiError(429, "Too many failed attempts. Request a new password reset link.");
        }
        await user.save();
        throw new ApiError(400, "Invalid verification code or reset token.");
    }

    user.password = await hashPassword(data.newPassword);
    user.passwordHash = undefined;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.verificationCode = undefined;
    user.codeExpiresAt = undefined;
    user.codeAttempts = 0;
    await user.save();

    await sendSecurityAlertEmail({
        email: user.email,
        name: user.name || user.fullName,
        action: "Your password was successfully reset.",
    });

    res.json({ message: "Your password has been reset successfully. You can now sign in." });
}

export async function updateProfile(req, res) {
    const data = z.object({
        fullName: z.string().trim().min(2).max(100).optional(),
        phone: z.string().trim().max(30).optional(),
        bio: z.string().trim().max(500).optional(),
        languagePreference: z.enum(["am", "en"]).optional(),
        avatarUrl: z.string().trim().optional(),
    }).parse(req.body);

    const user = await UserModel.findById(req.user.id);
    if (!user || user.isDeleted) {
        throw new ApiError(404, "User not found.");
    }

    if (data.fullName !== undefined) {
        user.fullName = data.fullName;
        user.name = data.fullName;
    }
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;
    if (data.languagePreference !== undefined) {
        user.languagePreference = data.languagePreference;
        if (user.studentProfile) user.studentProfile.preferredLanguage = data.languagePreference;
    }

    await user.save();

    res.json({
        message: "Profile updated successfully.",
        user: {
            id: user._id.toString(),
            name: user.name || user.fullName,
            fullName: user.fullName || user.name,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            phone: user.phone,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            teacherStatus: user.teacherStatus,
            accountStatus: user.accountStatus,
            languagePreference: user.languagePreference,
        },
    });
}
