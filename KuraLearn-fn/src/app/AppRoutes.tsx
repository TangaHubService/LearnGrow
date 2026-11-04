import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_GROUPS } from "@/lib/roles";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SetupPasswordPage } from "@/pages/auth/SetupPasswordPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import AboutPage from "@/pages/marketing/AboutPage";
import ContactPage from "@/pages/marketing/ContactPage";
import PricingPage from "@/pages/marketing/PricingPage";
import { WelcomePage } from "@/pages/marketing/WelcomePage";
import {
  MessageThreadPage,
  MessagesPage,
  NotificationsPage,
  ProfilePage,
  SettingsPage,
} from "@/pages/student/StudentScreens";
import { NotForSuperAdmin, ProtectedLayout, RequireRole, RoleHome } from "./guards";
import { headteacherRoutes } from "./routes/headteacherRoutes";
import { parentRoutes } from "./routes/parentRoutes";
import { schoolOfficeRoutes } from "./routes/schoolOfficeRoutes";
import { superAdminRoutes } from "./routes/superAdminRoutes";
import { studentRoutes } from "./routes/studentRoutes";
import { teacherRoutes } from "./routes/teacherRoutes";

export function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f8fb] font-bold text-slate-600">
        Loading KuraLearn...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public pages */}
      <Route
        path="/welcome"
        element={isAuthenticated ? <Navigate to="/" replace /> : <WelcomePage />}
      />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/setup-password" element={<SetupPasswordPage />} />

      {/* One sign-in for everyone: the account's role decides where they land. */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/portal-select" element={<Navigate to="/login" replace />} />
      <Route path="/role-selection" element={<Navigate to="/login" replace />} />

      {/* Signed-in pages */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<RoleHome />} />
        <Route element={<NotForSuperAdmin />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:threadId" element={<MessageThreadPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route element={<RequireRole roles={ROLE_GROUPS.superAdmin} />}>{superAdminRoutes}</Route>
        <Route element={<RequireRole roles={ROLE_GROUPS.student} />}>{studentRoutes}</Route>
        <Route element={<RequireRole roles={ROLE_GROUPS.parent} />}>{parentRoutes}</Route>
        <Route element={<RequireRole roles={ROLE_GROUPS.staff} />}>{teacherRoutes}</Route>
        <Route element={<RequireRole roles={ROLE_GROUPS.schoolOffice} />}>
          {schoolOfficeRoutes}
        </Route>
        <Route element={<RequireRole roles={ROLE_GROUPS.schoolOffice} />}>
          {headteacherRoutes}
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
