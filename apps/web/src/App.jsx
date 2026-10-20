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
import { SignInPage, StudentRegistrationPage, TeacherApplicationPage, AdminSetupPage, } from "./pages/AuthPages";
// Dashboards
import { AdminDashboard } from "./pages/AdminDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (<div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm font-bold text-slate-700">በመጫን ላይ... / Loading...</span>
        </div>
      </div>);
    }
    if (!user) {
        return <Navigate to="/sign-in" replace/>;
    }
    return <>{children}</>;
}
function DashboardDispatcher() {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/sign-in" replace/>;
    }
    if (user.role === "hub_admin") {
        return <AdminDashboard user={user}/>;
    }
    if (user.role === "teacher") {
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
          <Route path="/register/student" element={<StudentRegistrationPage />}/>
          <Route path="/apply/teacher" element={<TeacherApplicationPage />}/>
          <Route path="/setup/admin" element={<AdminSetupPage />}/>

          {/* Protected portal dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute>
                <DashboardDispatcher />
              </ProtectedRoute>}/>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
      </main>
      <Footer />
    </div>);
}
