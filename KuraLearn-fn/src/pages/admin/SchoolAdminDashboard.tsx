import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { schoolAdminApi } from "@/services/schoolAdminService";
import { useAuth } from "@/contexts/AuthContext";
import {
  TeacherResourcesPage,
  TeacherClassesPage,
  TeacherLessonsPage,
  TeacherMessagesPage,
  TeacherReportsPage,
  TeacherAiPage,
} from "@/pages/teacher/TeacherJourney";
import AdminAttendanceDashboard from "@/pages/admin/AdminAttendanceDashboard";
import { DashboardPageLayout, DashboardStatGrid } from "@/components/dashboard/DashboardLayout";
import { AttendanceDonut, EnrollmentTrend } from "./dashboard/dashboardCharts";
import { DatePill, ErrorCard, LoadingCard, MetricCard, Panel } from "./dashboard/dashboardUi";
import {
  AssessmentOverview,
  CurriculumOverview,
  RecentActivities,
  RightRail,
  TopClasses,
} from "./dashboard/dashboardWidgets";

const adminRoles = new Set(["ADMIN"]);

function hasAdminRole(user: { role?: string; roles?: string[] } | null) {
  return (
    adminRoles.has(user?.role ?? "") || (user?.roles?.some((role) => adminRoles.has(role)) ?? false)
  );
}

export function SchoolAdminDashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const isLibrary = location.hash === "#library";
  const isLessons = location.hash === "#lessons";
  const isClasses = location.hash === "#classes";
  const isAttendance = location.hash === "#attendance";
  const isAi = location.hash === "#ai";
  const isCommunications = location.hash === "#communications";
  const isReports = location.hash === "#reports";

  const query = useQuery({
    queryKey: ["school-admin-dashboard"],
    queryFn: schoolAdminApi.dashboard,
  });

  if (!hasAdminRole(user)) return <Navigate to="/" replace />;

  if (isLibrary) {
    return (
      <div>
        <TeacherResourcesPage />
      </div>
    );
  }

  if (isLessons) {
    return (
      <div>
        <TeacherLessonsPage />
      </div>
    );
  }

  if (isClasses) {
    return (
      <div>
        <TeacherClassesPage />
      </div>
    );
  }

  if (isAttendance) {
    return (
      <div>
        <AdminAttendanceDashboard />
      </div>
    );
  }

  if (isAi) {
    return (
      <div>
        <TeacherAiPage />
      </div>
    );
  }

  if (isCommunications) {
    return (
      <div>
        <TeacherMessagesPage />
      </div>
    );
  }

  if (isReports) {
    return (
      <div>
        <TeacherReportsPage />
      </div>
    );
  }

  return (
    <>
      {query.isLoading ? <LoadingCard /> : null}
      {query.isError ? (
        <ErrorCard message="The school dashboard could not be loaded. Please try again." />
      ) : null}
      {query.data ? <DashboardContent data={query.data} /> : null}
    </>
  );
}

function DashboardContent({
  data,
}: {
  data: Awaited<ReturnType<typeof schoolAdminApi.dashboard>>;
}) {
  return (
    <DashboardPageLayout
      title="Dashboard Overview"
      subtitle={`${data.school.name} · ${data.school.division} · ${data.school.currentTerm}`}
      action={<DatePill todayLabel={data.school.todayLabel} />}
    >
      <DashboardStatGrid columns="six">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </DashboardStatGrid>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <Panel title="Student Enrollment, Last 10 Months">
              <EnrollmentTrend data={data.enrollmentTrend} />
            </Panel>
            <Panel title="Attendance Today">
              <AttendanceDonut rate={data.attendance.rate} segments={data.attendance.segments} />
            </Panel>
          </div>

          <div className="grid gap-5 2xl:grid-cols-2">
            <CurriculumOverview curriculum={data.curriculum} />
            <TopClasses classes={data.topClasses} />
          </div>

          <div className="grid gap-5 2xl:grid-cols-2">
            <RecentActivities items={data.activities} />
            <AssessmentOverview assessments={data.assessments} />
          </div>
        </div>

        <RightRail data={data} />
      </section>
    </DashboardPageLayout>
  );
}
