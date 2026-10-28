import bcrypt from "bcryptjs";
import { randomInt, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { env } from "../config.js";
import { setAuthCookie, signToken, verifyPassword, hashPassword } from "../auth.js";
import { ApiError } from "../lib/http.js";
import { TeacherApplicationModel } from "../models/TeacherApplication.js";
import { UserModel } from "../models/User.js";
import { CourseModel } from "../models/Course.js";
import { deleteStoredFile, saveFile, validateFileType } from "../lib/storage.js";
import { sendVerificationCode, sendPasswordResetEmail, sendSecurityAlertEmail } from "../utils/email.js";

const googleAuthClient = new OAuth2Client();
const codeLifetimeMs = 10 * 60 * 1000;
const resendCooldownMs = 60 * 1000;

const COUNTRY_PHONE_PATTERNS = {
    ET: { code: "+251", pattern: /^\+?251[1-9]\d{7,8}$/, example: "+251912345678", name: "Ethiopia" },
    US: { code: "+1", pattern: /^\+?1[2-9]\d{9}$/, example: "+12025551234", name: "United States" },
    GB: { code: "+44", pattern: /^\+?44[1-9]\d{9,10}$/, example: "+447911123456", name: "United Kingdom" },
    KE: { code: "+254", pattern: /^\+?254[17]\d{8}$/, example: "+254712345678", name: "Kenya" },
    NG: { code: "+234", pattern: /^\+?234[789]\d{9}$/, example: "+2348012345678", name: "Nigeria" },
    ZA: { code: "+27", pattern: /^\+?27[1-9]\d{8}$/, example: "+27821234567", name: "South Africa" },
    IN: { code: "+91", pattern: /^\+?91[6-9]\d{9}$/, example: "+919876543210", name: "India" },
    AE: { code: "+971", pattern: /^\+?971[2-9]\d{7,8}$/, example: "+971501234567", name: "UAE" },
    DE: { code: "+49", pattern: /^\+?49[1-9]\d{9,11}$/, example: "+4915112345678", name: "Germany" },
    FR: { code: "+33", pattern: /^\+?33[1-9]\d{8}$/, example: "+33612345678", name: "France" },
    CA: { code: "+1", pattern: /^\+?1[2-9]\d{9}$/, example: "+16135551234", name: "Canada" },
    AU: { code: "+61", pattern: /^\+?61[2-9]\d{8}$/, example: "+61412345678", name: "Australia" },
    SA: { code: "+966", pattern: /^\+?966[5]\d{8}$/, example: "+966512345678", name: "Saudi Arabia" },
    EG: { code: "+20", pattern: /^\+?20[1]\d{9}$/, example: "+201012345678", name: "Egypt" },
    GH: { code: "+233", pattern: /^\+?233[2-9]\d{8}$/, example: "+233241234567", name: "Ghana" },
    TZ: { code: "+255", pattern: /^\+?255[6-7]\d{8}$/, example: "+255712345678", name: "Tanzania" },
    UG: { code: "+256", pattern: /^\+?256[3-7]\d{8}$/, example: "+256712345678", name: "Uganda" },
    RW: { code: "+250", pattern: /^\+?250[7]\d{8}$/, example: "+250781234567", name: "Rwanda" },
    CN: { code: "+86", pattern: /^\+?86[1]\d{10}$/, example: "+8613812345678", name: "China" },
    JP: { code: "+81", pattern: /^\+?81[0-9]\d{8,9}$/, example: "+819012345678", name: "Japan" },
    BR: { code: "+55", pattern: /^\+?55[1-9]\d{9,10}$/, example: "+5511912345678", name: "Brazil" },
    IT: { code: "+39", pattern: /^\+?39[0-9]\d{8,10}$/, example: "+393123456789", name: "Italy" },
    ES: { code: "+34", pattern: /^\+?34[6-9]\d{8}$/, example: "+34612345678", name: "Spain" },
    TR: { code: "+90", pattern: /^\+?90[5]\d{9}$/, example: "+905301234567", name: "Turkey" },
    PK: { code: "+92", pattern: /^\+?92[3]\d{9}$/, example: "+923001234567", name: "Pakistan" },
    BD: { code: "+880", pattern: /^\+?880[1]\d{9}$/, example: "+8801712345678", name: "Bangladesh" },
    MX: { code: "+52", pattern: /^\+?52[1-9]\d{9}$/, example: "+525512345678", name: "Mexico" },
    OTHER: { code: "", pattern: /^\+?\d{7,15}$/, example: "+1234567890", name: "Other" },
};

const validCountryCodes = Object.keys(COUNTRY_PHONE_PATTERNS);

function validatePhoneForCountry(phone, country) {
    const entry = COUNTRY_PHONE_PATTERNS[country] || COUNTRY_PHONE_PATTERNS.OTHER;
    const cleanPhone = phone.replace(/[\s\-().]/g, "");
    if (!entry.pattern.test(cleanPhone)) {
        return { valid: false, message: `Enter a valid ${entry.name} phone number (e.g. ${entry.example}).` };
    }
    return { valid: true };
}

const studentProfileSchema = z.object({
    learningInterests: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
    learningGoals: z.string().trim().max(1000).default(""),
    currentSkillLevel: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Beginner"),
    preferredSchedule: z.string().trim().min(2).max(200),
    preferredCourseIds: z.array(z.string()).min(1).max(10),
    weeklyStudyHours: z.number().int().min(1).max(80).default(5),
    timeZone: z.string().trim().max(80).default("Africa/Addis_Ababa"),
});

const signupSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(8).max(128),
    role: z.enum(["student", "teacher"]),
    phone: z.string().trim().min(7, "Phone number must be at least 7 characters.").max(30),
    country: z.string().trim().min(1, "Please select your country."),
    studentProfile: studentProfileSchema.optional(),
    teacherApplication: z.object({
        qualifications: z.string().trim().min(2).max(1000),
        experience: z.string().trim().min(10).max(3000),
        teachingStatement: z.string().trim().min(20).max(1000),
        experienceYears: z.number().int().min(0).max(60),
        teachingCategories: z.array(z.string().trim().min(1).max(80)).min(1).max(10),
        availability: z.string().trim().min(2).max(500),
        cv: z.object({
            originalFilename: z.string().min(1).max(200),
            mimeType: z.string().min(1).max(120),
            base64Data: z.string().min(1),
        }),
        certificates: z.array(z.object({
            originalFilename: z.string().min(1).max(200),
            mimeType: z.string().min(1).max(120),
            base64Data: z.string().min(1),
        })).max(5).default([]),
    }).optional(),
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
    const token = signToken({ sub: user._id.toString(), role: user.role });
    setAuthCookie(res, token);
    return token;
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
    if (data.role === "teacher" && !data.teacherApplication) {
        throw new ApiError(400, "Complete the teacher application and upload a CV.");
    }
    if (data.role === "student" && !data.studentProfile) {
        throw new ApiError(400, "Complete your learning preferences before registering.");
    }
    const phoneCheck = validatePhoneForCountry(data.phone, data.country);
    if (!phoneCheck.valid) {
        throw new ApiError(400, phoneCheck.message);
    }
    const applicationFiles = [];
    if (data.teacherApplication) {
        const files = [data.teacherApplication.cv, ...data.teacherApplication.certificates];
        for (const file of files) {
            if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.base64Data)) {
                throw new ApiError(400, "An application document could not be read. Please select it again.");
            }
            const buffer = Buffer.from(file.base64Data, "base64");
            if (!validateFileType(file.originalFilename, file.mimeType)) {
                throw new ApiError(400, "CV and certificates must be PDF, Word documents, or images.");
            }
            if (!buffer.length || buffer.length > 5 * 1024 * 1024) {
                throw new ApiError(400, "Each application document must be smaller than 5MB.");
            }
            applicationFiles.push({ ...file, buffer });
        }
        if (applicationFiles.reduce((total, file) => total + file.buffer.length, 0) > 10 * 1024 * 1024) {
            throw new ApiError(400, "Application documents must total less than 10MB.");
        }
    }
    const email = normalizedEmail(data.email);
    if (await UserModel.exists({ email })) {
        throw new ApiError(409, "An account with this email already exists.");
    }
    let preferredCourseIds = [];
    if (data.role === "student") {
        preferredCourseIds = data.studentProfile.preferredCourseIds;
        if (preferredCourseIds.some((courseId) => !/^[a-f\d]{24}$/i.test(courseId))) {
            throw new ApiError(400, "Select valid courses from the course catalog.");
        }
        const matchingCourses = await CourseModel.countDocuments({
            _id: { $in: preferredCourseIds },
            status: "published",
        });
        if (matchingCourses !== new Set(preferredCourseIds).size) {
            throw new ApiError(400, "One or more selected courses are no longer available.");
        }
    }
    const savedTeacherFiles = [];
    if (data.role === "teacher") {
        try {
            for (const file of applicationFiles) {
                savedTeacherFiles.push(await saveFile(file.buffer, file.originalFilename, file.mimeType));
            }
        } catch (error) {
            await Promise.all(savedTeacherFiles.map((file) => deleteStoredFile(file.key, file.storageProvider)));
            throw error;
        }
    }
    let user;
    try {
        user = await UserModel.create({
            name: data.name,
            fullName: data.name,
            email,
            phone: data.phone,
            country: data.country,
            timeZone: data.studentProfile?.timeZone || "Africa/Addis_Ababa",
            password: await bcrypt.hash(data.password, 12),
            authProvider: "local",
            role: data.role,
            isVerified: false,
            emailVerified: false,
            teacherStatus: data.role === "teacher" ? "pending" : "approved",
            accountStatus: "pending_approval",
            studentProfile: data.role === "student" ? {
                ...data.studentProfile,
                preferredCourseIds,
                placementStatus: "pending",
            } : undefined,
            teacherProfile: data.role === "teacher" ? {
                qualifications: data.teacherApplication.qualifications,
                expertise: data.teacherApplication.teachingCategories,
                availabilityNotes: data.teacherApplication.availability,
                experienceYears: data.teacherApplication.experienceYears,
            } : undefined,
        });
        if (data.role === "teacher") {
            await TeacherApplicationModel.create({
                user: user._id,
                qualifications: data.teacherApplication.qualifications,
                experience: data.teacherApplication.experience,
                teachingStatement: data.teacherApplication.teachingStatement,
                experienceYears: data.teacherApplication.experienceYears,
                teachingCategories: data.teacherApplication.teachingCategories,
                availability: data.teacherApplication.availability,
                documents: {
                    cv: {
                        key: savedTeacherFiles[0].key,
                        storageProvider: savedTeacherFiles[0].storageProvider,
                        filename: applicationFiles[0].originalFilename,
                        mimeType: applicationFiles[0].mimeType,
                        size: savedTeacherFiles[0].size,
                    },
                    certificates: applicationFiles.slice(1).map((file, index) => ({
                        key: savedTeacherFiles[index + 1].key,
                        storageProvider: savedTeacherFiles[index + 1].storageProvider,
                        filename: file.originalFilename,
                        mimeType: file.mimeType,
                        size: savedTeacherFiles[index + 1].size,
                    })),
                },
            });
        }
    } catch (error) {
        if (user?._id) await UserModel.deleteOne({ _id: user._id });
        await Promise.all(savedTeacherFiles.map((file) => deleteStoredFile(file.key, file.storageProvider)));
        throw error;
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
        const token = setSessionCookie(res, user);
        res.json({
            message: "Signed in successfully.",
            token,
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
    const token = setSessionCookie(res, user);
    res.json({
        message: "Signed in successfully.",
        token,
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
    const token = setSessionCookie(res, user);
    res.json({
        message: "Email verified successfully.",
        token,
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
        phone: z.string().trim().max(30).default(""),
        country: z.string().trim().default(""),
        studentProfile: studentProfileSchema.optional(),
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
        if (data.role === "teacher") {
            throw new ApiError(400, "Teacher applications must be submitted with the required CV and qualifications.");
        }
        if (!data.studentProfile) {
            throw new ApiError(400, "Complete your learning plan before creating a student account.");
        }
        const preferredCourseIds = data.studentProfile.preferredCourseIds;
        if (preferredCourseIds.some((courseId) => !/^[a-f\d]{24}$/i.test(courseId))) {
            throw new ApiError(400, "Select valid courses from the course catalog.");
        }
        const matchingCourses = await CourseModel.countDocuments({
            _id: { $in: preferredCourseIds },
            status: "published",
        });
        if (matchingCourses !== new Set(preferredCourseIds).size) {
            throw new ApiError(400, "One or more selected courses are no longer available.");
        }
        user = await UserModel.create({
            name: payload.name?.trim() || email.split("@")[0],
            fullName: payload.name?.trim() || email.split("@")[0],
            email,
            phone: data.phone,
            country: data.country,
            timeZone: data.studentProfile?.timeZone || "Africa/Addis_Ababa",
            googleId: payload.sub,
            authProvider: "google",
            role: data.role,
            isVerified: true,
            emailVerified: true,
            teacherStatus: "approved",
            accountStatus: "active",
            studentProfile: {
                ...data.studentProfile,
                placementStatus: "pending",
            },
        });
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
    const token = setSessionCookie(res, user);
    res.json({ message: "Signed in successfully with Google.", token, user: userResponse(user) });
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
        teacherProfile: z.object({
            expertise: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
            qualifications: z.string().trim().max(1000).optional(),
            availabilityNotes: z.string().trim().max(500).optional(),
            experienceYears: z.number().int().min(0).max(60).optional(),
        }).optional(),
        languagePreference: z.enum(["am", "en"]).optional(),
        avatarUrl: z.string().trim().max(1_400_000).refine((value) => (
            value === "" ||
            /^https:\/\/[^\s]+$/i.test(value) ||
            /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
        ), "Profile photos must be a secure URL or an uploaded JPG, PNG, or WebP image."),
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
    if (data.teacherProfile && user.role === "teacher") {
        user.teacherProfile ??= {};
        if (data.teacherProfile.expertise !== undefined) user.teacherProfile.expertise = data.teacherProfile.expertise;
        if (data.teacherProfile.qualifications !== undefined) user.teacherProfile.qualifications = data.teacherProfile.qualifications;
        if (data.teacherProfile.availabilityNotes !== undefined) user.teacherProfile.availabilityNotes = data.teacherProfile.availabilityNotes;
        if (data.teacherProfile.experienceYears !== undefined) user.teacherProfile.experienceYears = data.teacherProfile.experienceYears;
    }
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
            teacherProfile: user.teacherProfile,
        },
    });
}
