import { Route } from "react-router-dom";
import { StudentListPage } from "@/pages/admin/students/StudentListPage";
import { HeadteacherPortalPage } from "@/pages/headteacher/HeadteacherPortal";

// The portal page picks its section from the URL.
const portalPaths = [
  "",
  "/staff",
  "/teachers",
  "/attendance",
  "/marks",
  "/reports",
  "/parents",
  "/analytics",
  "/ai",
];

export const headteacherRoutes = (
  <>
    {portalPaths.map((path) => (
      <Route key={path} path={`/headteacher${path}`} element={<HeadteacherPortalPage />} />
    ))}
    <Route path="/headteacher/students" element={<StudentListPage />} />
  </>
);
