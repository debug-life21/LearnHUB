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
        // 1. Always sync catalog (categories & courses) to keep production up to date
        console.log("[Auto-Init] Syncing learning catalog (categories and courses)...");
        await seedLearningCatalog();
        console.log("[Auto-Init] Catalog sync complete.");

        // 2. Security: Purge any pre-existing / Google-linked account under ADMIN_EMAIL and provision fresh dedicated Admin
        if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
            const adminEmail = env.ADMIN_EMAIL.trim().toLowerCase();
            const existingUser = await UserModel.findOne({ email: adminEmail }).select("+password +passwordHash");
            const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

            // If the account was previously registered via Google or as a student, delete it completely for security
            if (existingUser && (existingUser.role !== "admin" || existingUser.googleId || existingUser.authProvider !== "local")) {
                console.log(`[Security Reset] Purging stale/compromised account for ${adminEmail} (role was: ${existingUser.role}, auth: ${existingUser.authProvider})...`);
                await UserModel.deleteMany({ email: adminEmail });
            }

            const currentAdmin = await UserModel.findOne({ email: adminEmail });
            if (!currentAdmin) {
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
                    languagePreference: "en",
                });
                console.log(`[Security Reset] Fresh dedicated Administrator provisioned for ${adminEmail}`);
            } else {
                currentAdmin.role = "admin";
                currentAdmin.authProvider = "local";
                currentAdmin.googleId = undefined; // Disallow any Google OAuth takeover
                currentAdmin.accountStatus = "active";
                currentAdmin.isVerified = true;
                currentAdmin.emailVerified = true;
                currentAdmin.teacherStatus = "approved";
                currentAdmin.languagePreference = "en";
                currentAdmin.password = hashedPassword;
                currentAdmin.passwordHash = undefined;
                await currentAdmin.save();
                console.log(`[Security Reset] Clean dedicated admin credentials verified for ${adminEmail}`);
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

