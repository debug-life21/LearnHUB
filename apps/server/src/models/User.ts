import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const roles = ["hub_admin", "teacher", "student", "support_staff"] as const;
export type UserRole = (typeof roles)[number];

const studentProfileSchema = new Schema(
  {
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
  },
  { _id: false },
);

const teacherProfileSchema = new Schema(
  {
    bio: { type: String, default: "" },
    expertise: { type: [String], default: [] },
    qualifications: { type: String, default: "" },
    availabilityNotes: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, required: true, index: true },
    emailVerified: { type: Boolean, default: false },
    languagePreference: { type: String, enum: ["am", "en"], default: "am" },
    accountStatus: {
      type: String,
      enum: ["pending_approval", "active", "suspended"],
      default: "active",
      index: true,
    },
    studentProfile: { type: studentProfileSchema, default: undefined },
    teacherProfile: { type: teacherProfileSchema, default: undefined },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel = mongoose.model("User", userSchema);
