import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { hasAnyRole, homePathFor, ROLE_GROUPS } from "@/lib/roles";
import { DashboardPage } from "@/pages/student/StudentScreens";

/** Signed-in pages, shown inside the sidebar layout. */
export function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  if (!isAuthenticated) return <Navigate to={pathname === "/" ? "/welcome" : "/login"} replace />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/** Sends people who open a page for another role back to their own home page. */
export function RequireRole({ roles }: { roles: readonly string[] }) {
  const { user } = useAuth();
  return hasAnyRole(user, roles) ? <Outlet /> : <Navigate to="/" replace />;
}

/** The root path: students see their dashboard here, everyone else goes to their own home page. */
export function RoleHome() {
  const { user } = useAuth();
  const home = homePathFor(user);
  return home === "/" ? <DashboardPage /> : <Navigate to={home} replace />;
}

/** The profile and settings pages behind this are written for learners, so super admins get their own. */
export function NotForSuperAdmin() {
  const { user } = useAuth();
  return hasAnyRole(user, ROLE_GROUPS.superAdmin) ? (
    <Navigate to="/super-admin/profile" replace />
  ) : (
    <Outlet />
  );
}
