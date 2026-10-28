import bcrypt from "bcryptjs";
import { app } from "./app.js";
import { env } from "./config.js";
import { connectDatabase } from "./db.js";
import { UserModel } from "./models/User.js";
import { CourseModel } from "./models/Course.js";
import { FAQModel } from "./models/FAQ.js";
import { seedLearningCatalog } from "./catalog.js";

async function autoInitDatabase() {
    try {
        // 1. Auto-seed catalog (categories & courses) if empty
        const publishedCourses = await CourseModel.countDocuments({ status: "published" });
        if (publishedCourses === 0) {
            console.log("[Auto-Init] No published courses in database. Seeding catalog...");
            await seedLearningCatalog();
            console.log("[Auto-Init] Catalog seeded successfully.");
        }

        // 2. Auto-seed or elevate super admin from ADMIN_EMAIL / ADMIN_PASSWORD
        if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
            const adminEmail = env.ADMIN_EMAIL.trim().toLowerCase();
            const existingUser = await UserModel.findOne({ email: adminEmail }).select("+password +passwordHash");
            const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
            if (!existingUser) {
                const name = adminEmail.split("@")[0];
                await UserModel.create({
                    name,
                    fullName: name,
                    email: adminEmail,
                    password: hashedPassword,
                    authProvider: "local",
                    role: "admin",
                    isVerified: true,
                    emailVerified: true,
                    accountStatus: "active",
                    teacherStatus: "approved",
                });
                console.log(`[Auto-Init] Admin account provisioned for ${adminEmail}`);
            } else {
                existingUser.role = "admin";
                existingUser.accountStatus = "active";
                existingUser.isVerified = true;
                existingUser.emailVerified = true;
                existingUser.teacherStatus = "approved";
                existingUser.password = hashedPassword;
                existingUser.passwordHash = undefined;
                await existingUser.save();
                console.log(`[Auto-Init] Account ${adminEmail} verified as admin with active password`);
            }
        }

        // 3. Auto-seed default FAQs if empty
        const faqCount = await FAQModel.countDocuments();
        if (faqCount === 0) {
            const faqs = [
                {
                    question: "How do students register and get placed in a cohort?",
                    answer: "Create an account, share what you want to learn, and tell us when you are available. Our team reviews your goals and helps connect you with a suitable cohort and instructor.",
                    sortOrder: 1,
                    isPublished: true,
                },
                {
                    question: "How do educators apply and get approved to teach?",
                    answer: "Create an instructor account and verify your email. Your application remains under review until an administrator approves it. Once approved, you can access instructor tools and assigned cohorts.",
                    sortOrder: 2,
                    isPublished: true,
                },
                {
                    question: "How do live Google Meet lessons work?",
                    answer: "When a session is scheduled, its meeting link and time appear in your dashboard. Open the session and select Join live session to meet with your instructor and cohort.",
                    sortOrder: 3,
                    isPublished: true,
                },
                {
                    question: "How is student progress and grade calculated?",
                    answer: "Your dashboard brings together attendance, completed assignments, and assessment results so you can follow your progress and see what to focus on next.",
                    sortOrder: 4,
                    isPublished: true,
                },
            ];
            await FAQModel.insertMany(faqs);
            console.log("[Auto-Init] Default FAQs seeded.");
        }
    } catch (err) {
        console.error("[Auto-Init] Error during database initialization:", err);
    }
}

async function bootstrap() {
    await connectDatabase();
    await autoInitDatabase();
    app.listen(env.PORT, () => {
        console.log(`TedbabeLearnHUB (TLH) API listening on http://localhost:${env.PORT}`);
    });
}
bootstrap().catch((error) => {
    console.error("Failed to start TedbabeLearnHUB (TLH) API", error);
    process.exit(1);
});

