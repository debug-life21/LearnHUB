import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
// Public Pages
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { FAQPage } from "./pages/FAQPage";
import { PrivacyPolicyPage, TermsOfServicePage, CookiePolicyPage, AcceptableUsePage, } from "./pages/LegalPages";
// Auth Pages
import { SignInPage, SignupPage, VerifyCodePage } from "./pages/AuthPages";
// Dashboards
import { AdminDashboard } from "./pages/AdminDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (<div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm font-bold text-slate-700">Loading your learning space…</span>
        </div>
      </div>);
    }
    if (!user) {
        return <Navigate to="/sign-in" replace/>;
    }
    if (roles && !roles.includes(user.role) && !(roles.includes("admin") && user.role === "hub_admin")) {
        return <Navigate to="/dashboard" replace/>;
    }
    return <>{children}</>;
}
function TeacherApprovalPending() {
    return (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
            <div className="rounded-3xl border border-amber-200 bg-white p-8 shadow-sm sm:p-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-700">…</div>
                <h1 className="mt-5 text-2xl font-black text-slate-900">Your application is under review</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">Your email is verified. An administrator must approve your teacher account before you can access the teaching dashboard.</p>
            </div>
        </div>
    );
}
function DashboardDispatcher() {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/sign-in" replace/>;
    }
    if (user.role === "admin" || user.role === "hub_admin") {
        return <AdminDashboard user={user}/>;
    }
    if (user.role === "teacher") {
        if (user.teacherStatus === "pending" || user.accountStatus === "pending_approval") {
            return <TeacherApprovalPending />;
        }
        return <TeacherDashboard user={user}/>;
    }
    return <StudentDashboard user={user}/>;
}
export default function App() {
    return (<div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans selection:bg-cyan-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />}/>
          <Route path="/categories" element={<ExplorePage />}/>
          <Route path="/about" element={<AboutPage />}/>
          <Route path="/contact" element={<ContactPage />}/>
          <Route path="/faq" element={<FAQPage />}/>

          {/* Legal pages */}
          <Route path="/privacy" element={<PrivacyPolicyPage />}/>
          <Route path="/terms" element={<TermsOfServicePage />}/>
          <Route path="/cookies" element={<CookiePolicyPage />}/>
          <Route path="/acceptable-use" element={<AcceptableUsePage />}/>

          {/* Authentication & onboarding routes */}
          <Route path="/sign-in" element={<SignInPage />}/>
          <Route path="/signup" element={<SignupPage />}/>
          <Route path="/register/student" element={<SignupPage initialRole="student" />}/>
          <Route path="/apply/teacher" element={<SignupPage initialRole="teacher" />}/>
          <Route path="/verify-code" element={<VerifyCodePage />}/>

          {/* Protected portal dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardDispatcher /></ProtectedRoute>}/>
          <Route path="/dashboard/student" element={<ProtectedRoute roles={["student"]}><DashboardDispatcher /></ProtectedRoute>}/>
          <Route path="/dashboard/teacher" element={<ProtectedRoute roles={["teacher"]}><DashboardDispatcher /></ProtectedRoute>}/>
          <Route path="/dashboard/admin" element={<ProtectedRoute roles={["admin"]}><DashboardDispatcher /></ProtectedRoute>}/>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </main>
      <Footer />
    </div>);
}
