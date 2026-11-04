import { Route } from "react-router-dom";
import { SuperAdminActivityPage } from "@/pages/super-admin/SuperAdminActivityPage";
import { SuperAdminDashboardPage } from "@/pages/super-admin/SuperAdminDashboardPage";
import { SuperAdminProfilePage } from "@/pages/super-admin/SuperAdminProfilePage";
import { SuperAdminSchoolsPage } from "@/pages/super-admin/SuperAdminSchoolsPage";
import { SuperAdminUsersPage } from "@/pages/super-admin/SuperAdminUsersPage";

export const superAdminRoutes = (
  <>
    <Route path="/super-admin" element={<SuperAdminDashboardPage />} />
    <Route path="/super-admin/schools" element={<SuperAdminSchoolsPage />} />
    <Route path="/super-admin/users" element={<SuperAdminUsersPage />} />
    <Route path="/super-admin/activity" element={<SuperAdminActivityPage />} />
    <Route path="/super-admin/profile" element={<SuperAdminProfilePage />} />
  </>
);
