import { Route } from "react-router-dom";
import AdminAttendanceDashboard from "@/pages/admin/AdminAttendanceDashboard";
import { SchoolAdminDashboardPage } from "@/pages/admin/SchoolAdminDashboard";
import { StudentListPage } from "@/pages/admin/students/StudentListPage";
import { StudentRegistrationPage } from "@/pages/admin/students/StudentRegistrationPage";

export const schoolOfficeRoutes = (
  <>
    <Route path="/school-admin" element={<SchoolAdminDashboardPage />} />
    <Route path="/admin" element={<SchoolAdminDashboardPage />} />
    <Route path="/admin/students" element={<StudentListPage />} />
    <Route path="/admin/students/register" element={<StudentRegistrationPage />} />
    <Route path="/admin/attendance" element={<AdminAttendanceDashboard />} />
  </>
);
