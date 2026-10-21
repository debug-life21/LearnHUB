import React from "react";
import { Link } from "react-router-dom";
function LegalShell({ title, lastUpdated, children, }) {
    return (<div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
      {/* Notice Alert */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 leading-relaxed">
        <strong>Notice:</strong> This document represents the operational compliance and service agreement framework of the LearnHUB platform. All policies are actively enforced across all student, educator, and administrative interactions.
      </div>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="mt-1.5 text-xs text-slate-500 font-semibold">Effective Date & Last Updated: {lastUpdated}</p>
      </div>

      <div className="prose prose-slate max-w-none rounded-3xl bg-white p-8 sm:p-10 shadow-sm ring-1 ring-slate-200/90 text-sm leading-relaxed text-slate-700 space-y-6">
        {children}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-6 text-xs font-bold text-blue-600">
        <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
        <span>•</span>
        <Link to="/terms" className="hover:underline">Terms of Service</Link>
        <span>•</span>
        <Link to="/cookies" className="hover:underline">Cookie Policy</Link>
        <span>•</span>
        <Link to="/acceptable-use" className="hover:underline">Acceptable Use Policy</Link>
      </div>
    </div>);
}
export function PrivacyPolicyPage() {
    return (<LegalShell title="Privacy Policy" lastUpdated="October 20, 2026">
      <h3 className="text-lg font-bold text-slate-900">1. Information We Collect</h3>
      <p>
        LearnHUB collects personal profile details including full name, verified email address, schedule availability, current skill level, and educational background for students. For teachers, we collect academic credentials, degrees, and prior instructional experience. These details are used exclusively for administrative cohort placement, scheduling, and pedagogical verification.
      </p>

      <h3 className="text-lg font-bold text-slate-900">2. Security & Data Storage</h3>
      <p>
        All passwords are cryptographically hashed using state-of-the-art secure hashing mechanisms before persistence in MongoDB. Authentication tokens are strictly isolated in secure HttpOnly cookies to mitigate cross-site scripting (XSS) risks. Course materials, meeting links, and grades are protected by server-enforced Role-Based Access Control (RBAC).
      </p>

      <h3 className="text-lg font-bold text-slate-900">3. Non-Disclosure & Third Parties</h3>
      <p>
        LearnHUB never sells, monetizes, or shares user profile data with third-party advertisers. Google Meet links are utilized strictly for scheduled live classroom transmission between assigned cohort members and their verified educator.
      </p>
    </LegalShell>);
}
export function TermsOfServicePage() {
    return (<LegalShell title="Terms of Service" lastUpdated="October 20, 2026">
      <h3 className="text-lg font-bold text-slate-900">1. Platform Governance & Placement Rules</h3>
      <p>
        By accessing LearnHUB, users agree to adhere to core platform business rules. Student class assignments and schedule allocations are determined strictly by Hub Administrators to prevent teacher overbooking, ensure balanced cohort sizes, and uphold educational quality. Students submit preferences but cannot self-assign to unapproved cohorts.
      </p>

      <h3 className="text-lg font-bold text-slate-900">2. Educator Responsibilities</h3>
      <p>
        Approved educators are responsible for conducting scheduled Google Meet sessions, recording one-click attendance, grading student assignment submissions, and providing timely instructional feedback. Teachers are authorized only to access their assigned classrooms and students.
      </p>

      <h3 className="text-lg font-bold text-slate-900">3. Account Suspension & Administrative Action</h3>
      <p>
        Hub Administrators maintain sovereign authority to approve, reject, activate, or suspend student and teacher accounts in cases of academic misconduct, abusive behavior, or non-compliance with platform standards. All administrative actions are recorded in immutable audit logs.
      </p>
    </LegalShell>);
}
export function CookiePolicyPage() {
    return (<LegalShell title="Cookie Policy" lastUpdated="October 20, 2026">
      <h3 className="text-lg font-bold text-slate-900">1. Essential Platform Cookies</h3>
      <p>
        LearnHUB uses an essential HttpOnly session cookie (`learnhub_token`) to maintain your signed-in session. The site currently uses English and does not store a language preference. No advertising cookies are used by the application.
      </p>
    </LegalShell>);
}
export function AcceptableUsePage() {
    return (<LegalShell title="Acceptable Use Policy" lastUpdated="October 20, 2026">
      <h3 className="text-lg font-bold text-slate-900">1. Academic Integrity</h3>
      <p>
        Learners are expected to submit original project work and take quizzes independently. Plagiarism, automated submission abuse, or unauthorized sharing of cohort meeting links will lead to immediate course disqualification and potential account suspension.
      </p>

      <h3 className="text-lg font-bold text-slate-900">2. Classroom Respect & Conduct</h3>
      <p>
        Live Google Meet sessions must remain professional, respectful, and focused on learning. Harassment, disruptive conduct, or unauthorized recording of peers or instructors is strictly prohibited.
      </p>
    </LegalShell>);
}
