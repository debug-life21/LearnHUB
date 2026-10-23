import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "./db.js";
import { env } from "./config.js";
import { UserModel } from "./models/User.js";

async function seedAdmin() {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
        throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in apps/server/.env before seeding an admin.");
    }
    if (env.ADMIN_PASSWORD.length < 12) {
        throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
    }
    await connectDatabase();
    const email = env.ADMIN_EMAIL.trim().toLowerCase();
    const existing = await UserModel.findOne({ email }).select("+password");
    if (existing && existing.role !== "admin" && existing.role !== "hub_admin") {
        throw new Error("ADMIN_EMAIL already belongs to a non-admin account.");
    }
    const password = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    if (existing) {
        existing.name = existing.name || existing.fullName;
        existing.fullName = existing.fullName || existing.name;
        existing.password = password;
        existing.passwordHash = undefined;
        existing.role = "admin";
        existing.authProvider = "local";
        existing.isVerified = true;
        existing.emailVerified = true;
        existing.accountStatus = "active";
        existing.teacherStatus = "approved";
        await existing.save();
    } else {
        const name = email.split("@")[0];
        await UserModel.create({
            name,
            fullName: name,
            email,
            password,
            authProvider: "local",
            role: "admin",
            isVerified: true,
            emailVerified: true,
            accountStatus: "active",
            teacherStatus: "approved",
        });
    }
    console.log(`Admin account ready for ${email}.`);
}

seedAdmin()
    .catch((error) => {
        console.error("Admin seeding failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
