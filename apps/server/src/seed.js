import mongoose from "mongoose";
import { connectDatabase } from "./db.js";
import { hashPassword } from "./auth.js";
import { UserModel } from "./models/User.js";
import { CourseModel } from "./models/Course.js";
import { ClassroomModel } from "./models/Classroom.js";
import { ClassSessionModel } from "./models/ClassSession.js";
import { FAQModel } from "./models/FAQ.js";
import { AssignmentModel } from "./models/Assignment.js";
import { AssessmentModel } from "./models/Assessment.js";
import { LearningResourceModel } from "./models/LearningResource.js";
import { AnnouncementModel } from "./models/Announcement.js";
import { seedLearningCatalog } from "./catalog.js";
import { syncFaqs } from "./faqData.js";
import { env } from "./config.js";
async function seed() {
    console.log("Connecting to database for seeding...");
    await connectDatabase();
    console.log("Seeding learning categories and courses...");
    const categoryDocs = await seedLearningCatalog();
    console.log("Seeding default FAQs...");
    await syncFaqs(FAQModel);
    if (env.SEED_DEMO_DATA !== "true") {
        console.log("Skipping demo accounts and sample classroom data.");
        await mongoose.disconnect();
        return;
    }
    console.log("Seeding default accounts...");
    const defaultPasswordHash = await hashPassword("LearnHub2026!");
    // 1. Sample Teacher
    let teacher = await UserModel.findOne({ email: "teacher@learnhub.et" });
    if (!teacher) {
        teacher = await UserModel.create({
            fullName: "Almaz Kebede",
            email: "teacher@learnhub.et",
            passwordHash: defaultPasswordHash,
            role: "teacher",
            languagePreference: "en",
            accountStatus: "active",
            emailVerified: true,
            teacherProfile: {
                bio: "Senior software engineer and educator with 8+ years of experience in JavaScript and Python.",
                expertise: ["Web Development", "Programming"],
                qualifications: "M.Sc. in Computer Science",
                availabilityNotes: "Available Mon-Fri 6:00 PM - 9:00 PM EAT",
            },
        });
        console.log("Created Teacher: teacher@learnhub.et / LearnHub2026!");
    }

    // 4. Sample Course
    let course = await CourseModel.findOne({ slug: "modern-full-stack-web-development" });
    if (!course) {
        course = await CourseModel.create({
            title: "Modern Full-Stack Web Development",
            slug: "modern-full-stack-web-development",
            description: "Comprehensive hands-on training covering HTML, CSS, JavaScript, React, Node.js, and MongoDB.",
            category: categoryDocs["Web Development"]._id,
            learningObjectives: [
                "Master frontend UI component design with modern CSS and React",
                "Build secure RESTful APIs with Node.js and Express",
                "Design scalable MongoDB database schemas",
                "Deploy and monitor production web applications",
            ],
            skillLevel: "Beginner to Intermediate",
            status: "published",
        });
    }
    // 5. Sample Classroom
    let classroom = await ClassroomModel.findOne({ title: "Web Dev Cohort 1 - Addis Ababa" });
    if (!classroom) {
        classroom = await ClassroomModel.create({
            title: "Web Dev Cohort 1 - Addis Ababa",
            course: course._id,
            teacher: teacher._id,
            students: [],
            capacity: 25,
            status: "active",
            timeZone: "Africa/Addis_Ababa",
            description: "Evening intensive cohort meeting 3 times a week on Google Meet.",
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        });
    }
    // 6. Sample Upcoming Session
    const sessionStartTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    const sessionEndTime = new Date(sessionStartTime.getTime() + 90 * 60 * 1000);
    let session = await ClassSessionModel.findOne({ classroom: classroom._id });
    if (!session) {
        session = await ClassSessionModel.create({
            classroom: classroom._id,
            teacher: teacher._id,
            title: "Live Class: React Component Architecture & Hooks",
            description: "Interactive session covering state management, effects, and custom hooks.",
            startsAt: sessionStartTime,
            endsAt: sessionEndTime,
            meetingUrl: "https://meet.google.com/abc-defg-hij",
            status: "scheduled",
        });
    }
    // 7. Sample Assignment
    let assignment = await AssignmentModel.findOne({ classroom: classroom._id });
    if (!assignment) {
        assignment = await AssignmentModel.create({
            title: "React Component Library Implementation",
            description: "Build three reusable UI components: Button, Modal Dialog, and Card.",
            instructions: "Implement proper accessibility, keyboard navigation, and submit your code repository or text answer.",
            classroom: classroom._id,
            course: course._id,
            teacher: teacher._id,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            allowedSubmissionTypes: ["text", "file"],
            maxScore: 100,
        });
    }
    // 8. Sample Assessment
    let assessment = await AssessmentModel.findOne({ classroom: classroom._id });
    if (!assessment) {
        assessment = await AssessmentModel.create({
            title: "Web Development Fundamentals Quiz 1",
            description: "10-minute quick quiz on HTTP, REST, and React essentials.",
            classroom: classroom._id,
            teacher: teacher._id,
            timeLimitMinutes: 15,
            passingScorePercentage: 70,
            isPublished: true,
            questions: [
                {
                    prompt: "Which HTTP method is typically used to create a new resource on an Express server?",
                    options: ["GET", "POST", "DELETE", "PATCH"],
                    correctOptionIndex: 1,
                    explanation: "POST requests submit an entity to the specified resource, usually causing a change in state or side effects.",
                    points: 1,
                },
                {
                    prompt: "What is the primary role of MongoDB in the TedbabeLearnHUB architecture?",
                    options: [
                        "Frontend state management",
                        "Document database for storing users, courses, and resources",
                        "Network packet routing",
                        "CSS stylesheet preprocessor",
                    ],
                    correctOptionIndex: 1,
                    explanation: "MongoDB serves as the document database storing JSON-like documents with dynamic schemas.",
                    points: 1,
                },
                {
                    prompt: "In TedbabeLearnHUB, who has permission to approve teacher applications and place students?",
                    options: [
                        "Students themselves",
                        "Any teacher",
                        "Hub Admin only",
                        "Public anonymous visitors",
                    ],
                    correctOptionIndex: 2,
                    explanation: "According to business rules 1 and 2, only an authorized Hub Admin can approve teachers and assign students.",
                    points: 1,
                },
            ],
        });
    }
    // 9. Sample Resource
    let resource = await LearningResourceModel.findOne({ title: "TedbabeLearnHUB Course Syllabus & Guidelines" });
    if (!resource) {
        resource = await LearningResourceModel.create({
            title: "TedbabeLearnHUB Course Syllabus & Guidelines",
            description: "Official guide to course progression, schedule rules, and live Google Meet sessions.",
            originalFilename: "tedbabelearnhub-syllabus.pdf",
            storedKey: "sample-syllabus.pdf",
            mimeType: "application/pdf",
            fileSize: 1024 * 250,
            uploader: admin._id,
            course: course._id,
            classroom: classroom._id,
            category: "pdf",
            visibility: "class_only",
            downloadUrl: "#",
        });
    }
    // 10. Sample Announcement
    let announcement = await AnnouncementModel.findOne({ title: "Welcome to TedbabeLearnHUB Cohort 1" });
    if (!announcement) {
        announcement = await AnnouncementModel.create({
            title: "Welcome to TedbabeLearnHUB Cohort 1",
            content: "All students are reminded to check their upcoming class schedules and test their Google Meet connection prior to start time.",
            target: "all_students",
            classroom: classroom._id,
            author: admin._id,
            priority: "high",
        });
    }
    console.log("Seeding completed successfully!");
    process.exit(0);
}
seed().catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
});
