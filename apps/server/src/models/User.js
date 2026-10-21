import mongoose, { Schema } from "mongoose";
export const roles = ["admin", "hub_admin", "teacher", "student", "support_staff"];
const studentProfileSchema = new Schema({
    learningInterests: { type: [String], default: [] },
    learningGoals: { type: String, default: "" },
    currentSkillLevel: { type: String, default: "" },
    preferredSchedule: { type: String, default: "" },
    preferredLanguage: { type: String, default: "am" },
    placementStatus: {
        type: String,
        enum: ["pending", "assigned"],
        default: "pending",
    },
}, { _id: false });
const teacherProfileSchema = new Schema({
    bio: { type: String, default: "" },
    expertise: { type: [String], default: [] },
    qualifications: { type: String, default: "" },
    availabilityNotes: { type: String, default: "" },
}, { _id: false });
const userSchema = new Schema({
    name: { type: String, trim: true, default: "" },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, select: false },
    passwordHash: { type: String, select: false },
    googleId: { type: String, sparse: true, unique: true },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    role: { type: String, enum: roles, required: true, index: true },
    emailVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    teacherStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: function () { return this.accountStatus === "pending_approval" ? "pending" : "approved"; },
        index: true,
    },
    verificationCode: { type: String, select: false, default: undefined },
    codeExpiresAt: { type: Date, select: false, default: undefined },
    codePurpose: { type: String, enum: ["signup", "login"], select: false, default: undefined },
    codeAttempts: { type: Number, select: false, default: 0 },
    codeSentAt: { type: Date, select: false, default: undefined },
    languagePreference: { type: String, enum: ["am", "en"], default: "am" },
    accountStatus: {
        type: String,
        enum: ["pending_approval", "active", "suspended"],
        default: "active",
        index: true,
    },
    studentProfile: { type: studentProfileSchema, default: undefined },
    teacherProfile: { type: teacherProfileSchema, default: undefined },
}, { timestamps: true });
export const UserModel = mongoose.model("User", userSchema);
