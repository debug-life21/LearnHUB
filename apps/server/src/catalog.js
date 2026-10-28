import { CourseModel } from "./models/Course.js";
import { LearningCategoryModel } from "./models/LearningCategory.js";
import { slugify } from "./utils.js";

const categoryData = [
    { name: "Languages", description: "English and Amharic language learning, literacy, conversation, and communication.", sortOrder: 1 },
    { name: "Primary School · Grades 1–4", description: "Foundational literacy, numeracy, science, and social studies practice for primary learners.", sortOrder: 2 },
    { name: "Middle School · Grades 5–8", description: "Grade-level language, mathematics, science, and social studies learning for middle school.", sortOrder: 3 },
    { name: "Secondary School · Grades 9–12", description: "High school language, mathematics, and subject-based science learning.", sortOrder: 4 },
    { name: "University & College", description: "Introductory university and college courses across computing, mathematics, and academic skills.", sortOrder: 5 },
    { name: "Web Development", description: "Build responsive websites and full-stack applications with modern tools.", sortOrder: 6 },
    { name: "Digital Marketing", description: "Master social media, SEO, content marketing, and online advertising to grow any business.", sortOrder: 7 },
    { name: "Programming", description: "Learn programming foundations, problem solving, and software development.", sortOrder: 8 },
    { name: "Data, AI & Analytics", description: "Explore data analysis, artificial intelligence, and machine learning foundations.", sortOrder: 9 },
    { name: "Cybersecurity & IT", description: "Build digital literacy, networking knowledge, and practical security awareness.", sortOrder: 10 },
    { name: "Design & Multimedia", description: "Practice user experience, visual design, and digital media production.", sortOrder: 11 },
    { name: "Business & Entrepreneurship", description: "Develop entrepreneurship, business planning, and communication skills.", sortOrder: 12 },
];

const courses = [];

function addCourse(category, title, description, skillLevel, learningObjectives) {
    courses.push({ category, title, description, skillLevel, learningObjectives });
}

const languageCourses = [
    ["Practical English · Beginner", "Build basic English vocabulary and confidence through everyday listening, speaking, reading, and writing practice.", ["Introduce yourself and ask simple questions", "Understand common everyday phrases", "Write short messages"]],
    ["Practical English · Elementary", "Strengthen everyday English for familiar situations with guided conversation and short texts.", ["Describe routines and familiar places", "Read short practical texts", "Write connected sentences"]],
    ["Practical English · Intermediate", "Improve fluency and comprehension for study, work, and everyday communication.", ["Explain opinions and experiences", "Understand the main ideas in clear speech", "Write organized paragraphs"]],
    ["Practical English · Upper Intermediate", "Develop accurate, flexible English for academic and professional communication.", ["Follow extended discussions", "Present a clear point of view", "Write structured reports and essays"]],
    ["English for Academic Study", "Practice the reading, writing, research, and presentation skills used in further education.", ["Identify claims and evidence in texts", "Plan and write an academic paragraph", "Deliver a short structured presentation"]],
    ["English for Work and Interviews", "Build practical communication skills for job applications, workplace conversations, and interviews.", ["Prepare a concise professional introduction", "Answer common interview questions", "Write clear workplace emails"]],
    ["Amharic Literacy · Foundations", "Build Amharic fidel reading and writing confidence through letter recognition, sounds, and short words.", ["Recognize and pronounce fidel", "Read and write familiar words", "Build a personal vocabulary list"]],
    ["Everyday Amharic Conversation", "Practice useful Amharic phrases for introductions, directions, daily activities, and conversation.", ["Use greetings and polite expressions", "Ask and answer everyday questions", "Describe familiar activities"]],
    ["Amharic Reading and Writing", "Develop Amharic reading comprehension, spelling, sentence construction, and paragraph writing.", ["Read short Amharic passages", "Identify key details and meaning", "Write connected Amharic sentences"]],
    ["Amharic Communication · Intermediate", "Extend Amharic fluency through longer conversations, listening practice, and clear written expression.", ["Summarize a short passage", "Take part in longer conversations", "Write a structured paragraph"]],
];
for (const [title, description, objectives] of languageCourses) {
    addCourse("Languages", title, description, title.includes("Beginner") || title.includes("Foundations") ? "Beginner" : "All levels", objectives);
}

const schoolSubjects = [
    { key: "English", label: "English Language", objective: "Read grade-level texts and communicate ideas in English." },
    { key: "Amharic", label: "Amharic Language", objective: "Read, write, and communicate in Amharic at a growing grade-level." },
    { key: "Mathematics", label: "Mathematics", objective: "Use grade-level mathematical reasoning to solve problems." },
    { key: "Science", label: "General Science", objective: "Explore grade-level scientific ideas through observation and explanation." },
    { key: "Social Studies", label: "Social Studies", objective: "Understand communities, history, geography, and civic life." },
];

for (let grade = 1; grade <= 8; grade += 1) {
    const category = grade <= 4 ? "Primary School · Grades 1–4" : "Middle School · Grades 5–8";
    for (const subject of schoolSubjects) {
        addCourse(
            category,
            `Grade ${grade} ${subject.label}`,
            `A guided Grade ${grade} ${subject.label.toLowerCase()} course with clear explanations, practice activities, and review of foundational concepts.`,
            "Grade-level",
            [subject.objective, "Practice skills through guided examples", "Review learning with short activities"],
        );
    }
}

for (let grade = 9; grade <= 12; grade += 1) {
    for (const subject of schoolSubjects) {
        addCourse(
            "Secondary School · Grades 9–12",
            `Grade ${grade} ${subject.label}`,
            `A guided Grade ${grade} ${subject.label.toLowerCase()} course with concept review, worked examples, and structured practice.`,
            "Grade-level",
            [subject.objective, "Connect key ideas to practical examples", "Strengthen understanding with review and practice"],
        );
    }
    for (const subject of ["Biology", "Chemistry", "Physics"]) {
        addCourse(
            "Secondary School · Grades 9–12",
            `Grade ${grade} ${subject}`,
            `An introductory Grade ${grade} ${subject.toLowerCase()} course focused on core concepts, scientific reasoning, and guided practice.`,
            "Grade-level",
            [`Explain key Grade ${grade} ${subject.toLowerCase()} concepts`, "Interpret examples, observations, or simple data", "Apply ideas to structured practice questions"],
        );
    }
}

const universityCourses = [
    ["University Mathematics Foundations", "Review algebra, functions, and mathematical reasoning used in introductory university study.", ["Manipulate algebraic expressions", "Interpret functions and graphs", "Show clear mathematical reasoning"]],
    ["Calculus I · Limits and Derivatives", "An introductory course in limits, continuity, and differentiation with worked examples.", ["Evaluate basic limits", "Differentiate common functions", "Apply derivatives to simple problems"]],
    ["Linear Algebra Foundations", "Study vectors, matrices, systems of linear equations, and their applications.", ["Solve systems using matrix methods", "Work with vectors and matrix operations", "Interpret linear transformations"]],
    ["Discrete Mathematics", "Explore logic, sets, counting, relations, graphs, and proof techniques for computing.", ["Use propositional logic", "Apply counting principles", "Reason about graphs and relations"]],
    ["University Academic Writing", "Practice research, academic structure, source evaluation, and clear university-level writing.", ["Develop a focused thesis", "Organize evidence into an argument", "Cite and evaluate sources responsibly"]],
    ["Introduction to Computer Science", "Explore foundational computing concepts, algorithms, data representation, and programming.", ["Describe core computing concepts", "Trace simple algorithms", "Represent information in common formats"]],
    ["Data Structures and Algorithms", "Study common data structures and algorithmic approaches through implementation and analysis.", ["Choose suitable data structures", "Implement core search and sort methods", "Compare algorithm efficiency"]],
    ["Database Systems", "Learn relational data modeling, SQL, normalization, and database application fundamentals.", ["Design a relational schema", "Query and update data with SQL", "Explain normalization and integrity"]],
    ["Operating Systems Foundations", "Explore processes, memory, file systems, and the role of an operating system.", ["Describe process and thread concepts", "Explain memory management basics", "Compare file system responsibilities"]],
    ["Software Engineering Practices", "Learn requirements, design, testing, collaboration, and maintenance in software projects.", ["Write clear functional requirements", "Plan and review a software change", "Design tests for expected behavior"]],
    ["Computer Networks Foundations", "Understand network layers, addressing, routing, and common internet protocols.", ["Explain basic network layers", "Interpret IP addressing concepts", "Describe common application protocols"]],
    ["Introduction to Economics", "Explore supply, demand, markets, incentives, and core microeconomic reasoning.", ["Interpret supply and demand", "Explain incentives and trade-offs", "Use simple economic models"]],
];
for (const [title, description, objectives] of universityCourses) {
    addCourse("University & College", title, description, "Introductory university", objectives);
}

const technologyCourses = [
    ["Digital Literacy Essentials", "Build confidence with computer basics, files, online communication, and safe digital habits.", ["Manage files and folders", "Use common online collaboration tools", "Recognize basic online safety risks"], "Cybersecurity & IT"],
    ["HTML and CSS Foundations", "Create accessible web pages and style responsive layouts with HTML and CSS.", ["Structure pages with semantic HTML", "Style layouts with CSS", "Build a responsive page"], "Web Development"],
    ["JavaScript Programming Foundations", "Learn JavaScript syntax, data, functions, and browser-based programming through practice.", ["Use variables and core data types", "Write functions and control flow", "Build interactive browser behavior"], "Programming"],
    ["Responsive Web Design", "Design and build web layouts that adapt across mobile, tablet, and desktop screens.", ["Apply responsive layout patterns", "Use accessible interface structure", "Test pages at multiple screen sizes"], "Web Development"],
    ["React User Interfaces", "Build component-based interfaces with React, state, props, and reusable patterns.", ["Create reusable React components", "Manage state and events", "Build a small interactive interface"], "Web Development"],
    ["Node.js and REST APIs", "Create server-side applications and REST endpoints with Node.js and Express.", ["Build Express routes", "Validate request data", "Connect an API to persistent storage"], "Web Development"],
    ["Full-Stack Application Foundations", "Connect a modern web interface to a server API and database in a guided project.", ["Plan frontend and API responsibilities", "Exchange data through HTTP", "Build a small end-to-end application"], "Web Development"],
    ["Python Programming Foundations", "Learn Python basics, control flow, functions, and structured problem solving.", ["Write Python expressions and functions", "Use loops and collections", "Solve small programming problems"], "Programming"],
    ["Java Programming Foundations", "Explore object-oriented programming and core Java syntax through guided exercises.", ["Use Java types and control flow", "Create classes and objects", "Build a small console application"], "Programming"],
    ["Git and Collaborative Development", "Use version control to track changes, collaborate, and review software work.", ["Track work with Git commits", "Work with branches", "Review and resolve simple merge conflicts"], "Programming"],
    ["SQL for Data and Applications", "Query relational databases and use SQL to retrieve, filter, and summarize data.", ["Select and filter records", "Join related tables", "Aggregate and summarize results"], "Data, AI & Analytics"],
    ["MongoDB Fundamentals", "Model document data and perform common database operations with MongoDB concepts.", ["Design document structures", "Query and update documents", "Choose basic indexes"], "Data, AI & Analytics"],
    ["Data Analysis with Spreadsheets", "Organize, clean, analyze, and communicate findings from data using spreadsheets.", ["Clean tabular data", "Use formulas and summaries", "Present findings with charts"], "Data, AI & Analytics"],
    ["Data Analysis with Python", "Use Python tools and structured workflows to explore and visualize datasets.", ["Load and inspect a dataset", "Summarize and transform data", "Create clear visualizations"], "Data, AI & Analytics"],
    ["Artificial Intelligence Literacy", "Understand common AI concepts, practical uses, limitations, and responsible use.", ["Distinguish AI terms and capabilities", "Evaluate AI-generated output", "Identify privacy and fairness considerations"], "Data, AI & Analytics"],
    ["Machine Learning Foundations", "Explore data, features, model training, evaluation, and introductory machine learning workflows.", ["Prepare a simple dataset", "Describe a basic model workflow", "Interpret evaluation results"], "Data, AI & Analytics"],
    ["Networking Essentials", "Learn how devices communicate through networks, addressing, and common network services.", ["Describe network devices and links", "Explain basic addressing", "Troubleshoot simple connectivity scenarios"], "Cybersecurity & IT"],
    ["Cybersecurity Awareness", "Build practical knowledge of accounts, data protection, common threats, and safer online behavior.", ["Use strong authentication practices", "Recognize common social engineering", "Protect personal and organizational data"], "Cybersecurity & IT"],
    ["Cybersecurity Foundations", "Study security principles, threat modeling, access control, and defensive practices.", ["Explain confidentiality, integrity, and availability", "Identify common threat patterns", "Describe defensive security controls"], "Cybersecurity & IT"],
    ["Cloud Computing Fundamentals", "Understand cloud service models, deployment concepts, and basic cloud architecture.", ["Compare common cloud service models", "Describe scalable cloud resources", "Recognize shared responsibility basics"], "Cybersecurity & IT"],
    ["UI and UX Design Foundations", "Practice user research, information architecture, wireframing, and usability feedback.", ["Identify user needs", "Create a low-fidelity wireframe", "Improve a design using feedback"], "Design & Multimedia"],
    ["Graphic Design Fundamentals", "Explore visual hierarchy, typography, color, composition, and practical design workflows.", ["Apply visual hierarchy", "Choose effective type and color", "Create a simple visual asset"], "Design & Multimedia"],
    ["Video Editing Essentials", "Learn the foundations of planning, editing, and exporting clear short-form video.", ["Organize clips and media", "Build a clear edit sequence", "Export for a selected platform"], "Design & Multimedia"],
    ["Entrepreneurship and Business Planning", "Develop an early business idea through customer needs, value propositions, and basic planning.", ["Identify a customer problem", "Describe a value proposition", "Draft a simple business model"], "Business & Entrepreneurship"],
];
for (const [title, description, objectives, category] of technologyCourses) {
    addCourse(category, title, description, "Beginner", objectives);
}

// Dedicated Digital Marketing courses
const digitalMarketingCourses = [
    ["Digital Marketing Foundations", "Learn the core concepts of digital marketing — audiences, funnels, channels, and measurement — to launch effective online campaigns.", ["Explain key digital marketing channels", "Define a target audience and campaign goal", "Measure success with basic digital metrics"]],
    ["Social Media Marketing & Strategy", "Build and manage social media presences on Instagram, TikTok, Facebook, and LinkedIn to grow an engaged audience.", ["Create a social media content calendar", "Write captions that drive engagement", "Analyze platform insights and metrics"]],
    ["SEO & Search Engine Optimization", "Improve website visibility on Google and other search engines through on-page, off-page, and technical SEO techniques.", ["Conduct keyword research", "Optimize pages for search rankings", "Understand backlinks and domain authority"]],
    ["Content Marketing & Copywriting", "Create compelling written, visual, and video content that attracts, educates, and converts your audience.", ["Write persuasive headlines and copy", "Plan a content strategy for a brand", "Repurpose content across channels"]],
    ["Email Marketing & Automation", "Build email lists, design high-converting newsletters, and set up automated drip sequences that nurture leads.", ["Grow an email list with lead magnets", "Design effective email campaigns", "Set up basic email automation sequences"]],
    ["Paid Advertising · Google & Meta Ads", "Run targeted pay-per-click campaigns on Google Search and Meta (Facebook/Instagram) to generate leads and sales.", ["Set up a Google Ads campaign", "Create a Meta Ads audience and creative", "Optimize ad spend based on ROAS"]],
    ["E-Commerce & Online Sales", "Launch and grow an online store using platforms like Shopify, with strategies for driving traffic and increasing conversions.", ["Set up an online store", "Write product descriptions that sell", "Use paid and organic channels to drive sales"]],
];
for (const [title, description, objectives] of digitalMarketingCourses) {
    addCourse("Digital Marketing", title, description, "Beginner", objectives);
}

export async function seedLearningCatalog() {
    const categoriesByName = new Map();
    for (const category of categoryData) {
        const saved = await LearningCategoryModel.findOneAndUpdate(
            { slug: slugify(category.name) },
            { $set: { ...category, slug: slugify(category.name), isActive: true } },
            { upsert: true, new: true },
        );
        categoriesByName.set(category.name, saved);
    }

    await CourseModel.bulkWrite(courses.map((course) => {
        const category = categoriesByName.get(course.category);
        if (!category) {
            throw new Error(`Unknown course category: ${course.category}`);
        }
        return {
            updateOne: {
                filter: { slug: slugify(course.title) },
                update: {
                    $set: {
                        title: course.title,
                        slug: slugify(course.title),
                        description: course.description,
                        learningObjectives: course.learningObjectives,
                        category: category._id,
                        skillLevel: course.skillLevel,
                        status: "published",
                    },
                },
                upsert: true,
            },
        };
    }));
    console.log(`Seeded ${categoryData.length} learning categories and ${courses.length} catalog courses.`);
    return Object.fromEntries(categoriesByName);
}
