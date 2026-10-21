# LearnHUB — Complete Online Learning & Education Management Platform

LearnHUB is a modern, responsive, and secure full-stack education management platform built using the **MERN** stack (MongoDB, Express.js, React.js, Node.js) with JavaScript throughout.

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

To enable Google sign-in and sign-up:
1. Open **Google Cloud Console → APIs & Services → Credentials** and create an **OAuth client ID** of type **Web application**.
2. Under **Authorized JavaScript origins**, add `http://localhost:5173`.
3. Copy the client ID into `GOOGLE_CLIENT_ID` in `apps/server/.env` and `VITE_GOOGLE_CLIENT_ID` in `apps/web/.env`.
4. Restart both development servers after changing environment variables.

Google sign-in verifies the credential on the API. New Google users choose a student or teacher role on the sign-up form; teacher accounts still require administrator approval.

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in `apps/server/.env` to send email verification codes. Create an administrator account using `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run:
```bash
npm run seed:admin
```
Use a unique administrator password of at least 12 characters.
Admin accounts cannot be created from the public signup flow. Student and teacher email/password accounts must verify their 6-digit code before a session is created. Teacher accounts remain pending approval after verification.

### 3. Database Seeding
Seed initial categories (Languages, Web Development, Programming, CS, Digital Marketing, etc.) and FAQs. Demo accounts are not created:
```bash
npm run seed --workspace server
```

Run the admin seed command above to provision an administrator. Students and teachers can register from the sign-in page; teachers are approved through the admin portal.

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
│   ├── server/                   # Express.js + Mongoose + JavaScript Backend
│   │   ├── src/
│   │   │   ├── models/           # Mongoose schemas (User, Classroom, Course, Assignment, etc.)
│   │   │   ├── routes/           # REST endpoints (auth, admin, teacher, student, resources, public)
│   │   │   ├── lib/              # Storage helpers, HTTP error wrappers
│   │   │   ├── controllers/      # Authentication request handlers
│   │   │   ├── middleware/       # Authentication and role authorization
│   │   │   ├── utils/            # SMTP verification email delivery
│   │   │   ├── auth.js           # Password hashing, JWT cookies, RBAC helpers
│   │   │   ├── seed.js           # Platform data seeding
│   │   │   ├── seedAdmin.js      # Environment-driven administrator seeding
│   │   │   ├── app.js            # Express setup with Helmet, CORS, Rate Limiting
│   │   │   └── index.js          # Server entry point
│   │   └── package.json
│   └── web/                      # React 19 + Vite + Tailwind CSS + JavaScript Frontend
│       ├── src/
│       │   ├── components/       # Navbar, Footer, MetricCard, DashboardCard, Modal, Badge
│       │   ├── pages/            # Public, Auth, Admin, Teacher, and Student Dashboards
│       │   ├── context/          # AuthContext with session refresh
│       │   ├── i18n.js           # Bilingual translations (Amharic & English)
│       │   ├── App.jsx           # Route definitions & portal dispatching
│       │   └── index.css         # Tailwind tokens & Ethiopic typography
│       └── package.json
├── PROJECT_ LearnH (2).pdf       # Project requirement specification
├── README.md
└── package.json
```
