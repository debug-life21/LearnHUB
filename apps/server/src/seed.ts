import mongoose from "mongoose";
import { connectDatabase } from "./db.js";
import { hashPassword } from "./auth.js";
import { UserModel } from "./models/User.js";
import { LearningCategoryModel } from "./models/LearningCategory.js";
import { CourseModel } from "./models/Course.js";
import { ClassroomModel } from "./models/Classroom.js";
import { ClassSessionModel } from "./models/ClassSession.js";
import { FAQModel } from "./models/FAQ.js";
import { AssignmentModel } from "./models/Assignment.js";
import { AssessmentModel } from "./models/Assessment.js";
import { LearningResourceModel } from "./models/LearningResource.js";
import { AnnouncementModel } from "./models/Announcement.js";
import { slugify } from "./utils.js";
import { env } from "./config.js";

async function seed() {
  console.log("Connecting to database for seeding...");
  await connectDatabase();

  console.log("Seeding initial categories...");
  const categoriesData = [
    { name: "Languages", description: "Learn Amharic, English, and other world languages with native educators.", sortOrder: 1 },
    { name: "Web Development", description: "Modern full-stack web applications, React, Node, and web standards.", sortOrder: 2 },
    { name: "Programming", description: "Core programming principles, algorithms, and practical software design.", sortOrder: 3 },
    { name: "Computer Science", description: "Theoretical computer science, data structures, and computing systems.", sortOrder: 4 },
    { name: "Digital Marketing", description: "SEO, social media growth, search advertising, and brand strategy.", sortOrder: 5 },
    { name: "Academic Subjects", description: "Mathematics, science, and scholastic subjects for all grade levels.", sortOrder: 6 },
    { name: "Business Skills", description: "Entrepreneurship, leadership, financial planning, and management.", sortOrder: 7 },
    { name: "Professional Development", description: "Workplace communication, resume building, and career growth.", sortOrder: 8 },
    { name: "Creative Skills", description: "Graphic design, UI/UX, video editing, and creative writing.", sortOrder: 9 },
    { name: "Other Learning", description: "Diverse educational opportunities and specialized courses.", sortOrder: 10 },
  ];

  const categoryDocs: Record<string, any> = {};
  for (const cat of categoriesData) {
    const doc = await LearningCategoryModel.findOneAndUpdate(
      { name: cat.name },
      { ...cat, slug: slugify(cat.name), isActive: true },
      { upsert: true, new: true },
    );
    categoryDocs[cat.name] = doc;
  }

  console.log("Seeding default FAQs...");
  const faqs = [
    {
      question: "How do students register and get placed in a cohort?",
      answer: "Students complete their profile with their goals, background, and schedule preferences. The Hub Admin evaluates the application and assigns the learner to the optimal course, cohort size, and certified teacher. (ተማሪዎች ፍላጎታቸውንና ደረጃቸውን በመሙላት ይመዘገባሉ። የአስተዳዳሪው ቡድን መረጃውን መርምሮ ተገቢውን ኮርስ፣ ክፍል እና አስተማሪ ይመድብላቸዋል።)",
      sortOrder: 1,
      isPublished: true,
    },
    {
      question: "How do educators apply and get approved to teach?",
      answer: "Educators apply through the teacher portal with their academic qualifications and experience. Administrative privileges and classroom assignments are activated only after rigorous Hub Admin verification and credential review. (አስተማሪዎች የትምህርት ዝግጅታቸውን እና የልምድ መረጃቸውን ሞልተው ያመለክታሉ። ማመልከቻው በHub Admin ታይቶ ተቀባይነት ሲያገኝ ብቻ ማስተማር ይፈቀድላቸዋል።)",
      sortOrder: 2,
      isPublished: true,
    },
    {
      question: "How do live Google Meet lessons work?",
      answer: "Every scheduled session is generated with a secure, verified Google Meet URL. Teachers and enrolled students can join with one click directly from their respective dashboards. (ሁሉም የክፍለ ጊዜ መርሃ ግብሮች የተረጋገጡ የGoogle Meet አገናኞችን ይይዛሉ። ክፍለ ጊዜው ሲደርስ ተማሪዎች እና አስተማሪዎች በአንድ ቁልፍ በቀጥታ መግባት ይችላሉ።)",
      sortOrder: 3,
      isPublished: true,
    },
    {
      question: "How is student progress and grade calculated?",
      answer: "Progress is computed transparently using a weighted formula: 40% Session Attendance + 40% Practical Assignments + 20% Scored Quizzes, permanently recorded in MongoDB. (የተማሪ እድገት በእውነተኛ መረጃ: 40% መገኘት + 40% ስራዎች + 20% ፈተናዎች ተሰልቶ በዳሽቦርዱ ላይ ይታያል።)",
      sortOrder: 4,
      isPublished: true,
    },
  ];

  for (const faq of faqs) {
    await FAQModel.findOneAndUpdate({ question: faq.question }, faq, { upsert: true });
  }

  if (env.SEED_DEMO_DATA !== "true") {
    console.log("Skipping demo accounts and sample classroom data.");
    await mongoose.disconnect();
    return;
  }

  console.log("Seeding default accounts...");
  const defaultPasswordHash = await hashPassword("LearnHub2026!");

  // 1. Hub Admin
  let admin = await UserModel.findOne({ role: "hub_admin" });
  if (!admin) {
    admin = await UserModel.create({
      fullName: "Hub Admin",
      email: "admin@learnhub.et",
      passwordHash: defaultPasswordHash,
      role: "hub_admin",
      languagePreference: "am",
      accountStatus: "active",
      emailVerified: true,
    });
    console.log("Created Hub Admin: admin@learnhub.et / LearnHub2026!");
  }

  // 2. Sample Teacher
  let teacher = await UserModel.findOne({ email: "teacher@learnhub.et" });
  if (!teacher) {
    teacher = await UserModel.create({
      fullName: "Almaz Kebede",
      email: "teacher@learnhub.et",
      passwordHash: defaultPasswordHash,
      role: "teacher",
      languagePreference: "am",
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

  // 3. Sample Student
  let student = await UserModel.findOne({ email: "student@learnhub.et" });
  if (!student) {
    student = await UserModel.create({
      fullName: "Yonas Haile",
      email: "student@learnhub.et",
      passwordHash: defaultPasswordHash,
      role: "student",
      languagePreference: "am",
      accountStatus: "active",
      emailVerified: true,
      studentProfile: {
        learningInterests: ["Web Development", "Programming"],
        learningGoals: "Build production-ready web apps with React and Node.js.",
        currentSkillLevel: "Beginner-Intermediate",
        preferredSchedule: "Evenings after 6:00 PM",
        preferredLanguage: "am",
        placementStatus: "assigned",
      },
    });
    console.log("Created Student: student@learnhub.et / LearnHub2026!");
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
      students: [student._id],
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
          prompt: "What is the primary role of MongoDB in the LearnHUB architecture?",
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
          prompt: "In LearnHUB, who has permission to approve teacher applications and place students?",
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
  let resource = await LearningResourceModel.findOne({ title: "LearnHUB Course Syllabus & Guidelines" });
  if (!resource) {
    resource = await LearningResourceModel.create({
      title: "LearnHUB Course Syllabus & Guidelines",
      description: "Official guide to course progression, schedule rules, and live Google Meet sessions.",
      originalFilename: "learnhub-syllabus.pdf",
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
  let announcement = await AnnouncementModel.findOne({ title: "Welcome to LearnHUB Cohort 1" });
  if (!announcement) {
    announcement = await AnnouncementModel.create({
      title: "Welcome to LearnHUB Cohort 1",
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
