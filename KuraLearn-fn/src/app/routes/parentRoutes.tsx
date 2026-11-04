import { Route } from "react-router-dom";
import { ParentDashboardPage } from "@/pages/parent/ParentDashboardPage";
import { MessagesPage, NotificationsPage } from "@/pages/student/StudentScreens";

export const parentRoutes = (
  <>
    <Route path="/parent" element={<ParentDashboardPage />} />
    <Route path="/parent/children" element={<ParentDashboardPage />} />
    <Route path="/parent/reports" element={<ParentDashboardPage />} />
    <Route path="/parent/messages" element={<MessagesPage />} />
    <Route path="/parent/notifications" element={<NotificationsPage />} />
  </>
);
