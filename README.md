# LearnHUB — Complete Online Learning & Education Management Platform

LearnHUB is a modern, responsive, and secure full-stack education management platform built using the **MERN** stack (MongoDB, Express.js, React.js, Node.js) with TypeScript throughout.

---

## 🌟 Key Highlights & Architectural Features

### 1. Non-Negotiable Business Rules (Server-Enforced)
- **Hub Admin Controls Teacher Hiring**: Teachers cannot approve themselves or hire other teachers. All teacher applicants remain pending until reviewed and approved or rejected with stated reasons by the Hub Admin.
- **Hub Admin Controls Student Placement**: Students submit learning interests, skill levels, and schedule preferences upon registration. The Hub Admin reviews student profiles and assigns each student to an appropriate course, class, and teacher. Students cannot self-assign.
- **Teachers Teach Assigned Classes**: Strict server-side RBAC ensures teachers can only view and manage classes and students assigned directly to them.
- **Students Access Assigned Learning Only**: Students have verified access exclusively to their enrolled courses, authorized Google Meet links, class materials, assignments, and quizzes.
- **Server-Side Authorization on Every Protected Endpoint**: Authorization is enforced using cryptographic JWT sessions in HttpOnly SameSite cookies and verified in middleware, preventing unauthorized ID tampering.
- **Real Data & Functionality**: All users, courses, classes, sessions, attendance, assignments, submissions, quizzes, notifications, and audit logs are stored in MongoDB.

### 2. Dual Language Support (አማርኛ / English)
- **Primary Language**: Amharic (አማርኛ) as the default interface language.
- **Secondary Language**: English with persistent localStorage preference and instant one-click toggle.
- Clean font rendering with Ethiopic Unicode typography (`Noto Sans Ethiopic` & `Plus Jakarta Sans`).

### 3. Integrated Live Google Meet Lessons
- Scheduled class sessions include verified Google Meet links (`https://meet.google.com/...`).
- Time-until-session indicators and direct one-click **Join Meeting** button.
- Teacher schedule conflict prevention prevents double-booking teachers for overlapping sessions.

### 4. Continuous Evaluation & Progress Modeling
- Real progress formula considering weighted session attendance (40%), completed assignments (40%), and passed assessments (20%).
- Real-time scoring for multiple-choice quizzes with answers evaluated server-side.
- Teachers grade assignments with numeric scores and personalized feedback.
- Session attendance tracking (`Present`, `Absent`, `Late`, `Excused`).

### 5. Secure File & Resource Management
- Educational file upload with MIME type and extension validation.
- Role-based download authorization ensuring private educational materials are accessible only to enrolled participants.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+)
- **MongoDB Community Server** installed locally and listening on port 27017

### 1. Installation
Clone the repository and install all workspace dependencies:
```bash
npm install
```

### 2. Configure and Start Local MongoDB
Copy the example environment files:
```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Start MongoDB from the repository root (keep this terminal open):
```bash
mkdir -p .data/db
mongod --dbpath .data/db --bind_ip 127.0.0.1 --port 27017
```

The server connects to `mongodb://127.0.0.1:27017/learnhub` by default. The web app sends API requests to `http://localhost:4000`; these addresses can be changed in the respective `.env` files.

To enable Google sign-in and sign-up, create a **Web application** OAuth client ID in the Google Cloud Console. Add `http://localhost:5173` as an authorized JavaScript origin, then set the same client ID as `GOOGLE_CLIENT_ID` in `apps/server/.env` and `VITE_GOOGLE_CLIENT_ID` in `apps/web/.env`. Restart both development servers after changing environment variables. Students can register or sign in using a verified Google account. Teachers can submit an application using Google and must still be approved by an administrator before accessing the teacher portal. Admin accounts cannot use Google sign-in.

### 3. Database Seeding
Seed initial categories (Languages, Web Development, Programming, CS, Digital Marketing, etc.) and FAQs. Demo accounts are not created:
```bash
npm run seed --workspace server
```

Create the first administrator at [http://localhost:5173/setup/admin](http://localhost:5173/setup/admin), using the setup key configured in `apps/server/.env`. Students can register and teachers can submit an application from the sign-in page.

### 4. Development Mode
Run both backend API and frontend Vite dev servers concurrently:
```bash
npm run dev
```
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000](http://localhost:4000)

Check that the API is running at [http://localhost:4000/api/health](http://localhost:4000/api/health). If the browser reports a network error, start both servers with `npm run dev` and confirm MongoDB is running.

### 5. Production Build & Linting
```bash
npm run build
npm run lint
```

---

---

## 📁 Project Architecture

```
LearnHUB/
├── apps/
│   ├── server/                   # Express.js + Mongoose + TypeScript Backend
│   │   ├── src/
│   │   │   ├── models/           # Mongoose schemas (User, Classroom, Course, Assignment, etc.)
│   │   │   ├── routes/           # REST endpoints (auth, admin, teacher, student, resources, public)
│   │   │   ├── lib/              # Storage helpers, HTTP error wrappers
│   │   │   ├── auth.ts           # Argon2 hashing, JWT cookies, RBAC middlewares
│   │   │   ├── seed.ts           # Automated database seeding script
│   │   │   ├── app.ts            # Express setup with Helmet, CORS, Rate Limiting
│   │   │   └── index.ts          # Server entry point
│   │   └── package.json
│   └── web/                      # React 19 + Vite + Tailwind CSS + TypeScript Frontend
│       ├── src/
│       │   ├── components/       # Navbar, Footer, MetricCard, DashboardCard, Modal, Badge
│       │   ├── pages/            # Public, Auth, Admin, Teacher, and Student Dashboards
│       │   ├── context/          # AuthContext with session refresh
│       │   ├── i18n.ts           # Bilingual translations (Amharic & English)
│       │   ├── App.tsx           # Route definitions & portal dispatching
│       │   └── index.css         # Tailwind tokens & Ethiopic typography
│       └── package.json
├── PROJECT_ LearnH (2).pdf       # Project requirement specification
├── README.md
└── package.json
```
