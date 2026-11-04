import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Navigate } from "react-router-dom";
import {
  headteacherApi,
  type HeadteacherDashboard,
  type PerformanceAnalytics,
} from "@/services/headteacherApi";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardStatGrid, DashboardPanel } from "@/components/dashboard/DashboardLayout";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  GraduationCap,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Brain,
  Sparkles,
  ShieldAlert,
  Award,
  Calendar,
  Phone,
  Mail,
  User,
  Check,
  X,
  Lock,
  Unlock,
  Eye,
  HelpCircle,
  FileSpreadsheet,
  Printer,
  Gauge,
  HeartHandshake,
} from "lucide-react";
import { MarksApprovalPage } from "./marks/MarksApprovalPage";
import { MarksReportsPage } from "./marks/MarksReportsPage";
import { useTeacherReferenceData } from "@/pages/teacher/teacherReference";
import { StaffManagementPage } from "./StaffManagementPage";
import { CustomDropdown } from "@/components/ModernUi";
import { hasAnyRole, ROLE_GROUPS } from "@/lib/roles";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color || "blue"]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
      <div className="mt-2">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-2 text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center text-red-600">
        <AlertTriangle className="mx-auto h-8 w-8" />
        <p className="mt-2 font-semibold">{message}</p>
      </div>
    </div>
  );
}

function EmptyData({ message }: { message: string }) {
  return <div className="py-10 text-center text-slate-500">{message}</div>;
}

function MiniChart({ data }: { data: { date: string; rate: number }[] }) {
  if (!data || data.length === 0) return <EmptyData message="No data available" />;

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3f6df6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3f6df6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7edf6" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value: number) => [`${value}%`, "Attendance"]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#3f6df6"
            fill="url(#colorRate)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PerformanceChart({ data }: { data: { class: string; average: number }[] }) {
  if (!data || data.length === 0) return <EmptyData message="No data available" />;

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7edf6" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} />
          <YAxis
            dataKey="class"
            type="category"
            tick={{ fontSize: 10 }}
            axisLine={false}
            width={80}
          />
          <Tooltip formatter={(value: number) => [`${value}%`, "Average"]} />
          <Bar dataKey="average" fill="#3f6df6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AttendanceDonut({ data }: { data: { present: number; absent: number; late: number } }) {
  const chartData = [
    { name: "Present", value: data.present, color: "#28b764" },
    { name: "Absent", value: data.absent, color: "#f05a72" },
    { name: "Late", value: data.late, color: "#f5b731" },
  ];

  const total = data.present + data.absent + data.late;
  if (total === 0) return <EmptyData message="No attendance data" />;

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} aria-label={entry.name} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HeadteacherPortalPage() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const canView = hasAnyRole(user, ROLE_GROUPS.schoolOffice);

  const dashboardQuery = useQuery<HeadteacherDashboard>({
    queryKey: ["headteacher-dashboard"],
    queryFn: headteacherApi.dashboard,
    enabled: canView,
  });

  if (!canView) return <Navigate to="/" replace />;

  if (dashboardQuery.isLoading) return <LoadingSpinner />;
  if (dashboardQuery.isError) return <ErrorDisplay message="Failed to load dashboard data" />;

  const data = dashboardQuery.data;
  if (!data) return <ErrorDisplay message="No data" />;

  const stats = data.stats;

  const renderContent = () => {
    if (path === "/headteacher" || path === "/headteacher/") {
      return <DashboardView data={data} />;
    }
    if (path === "/headteacher/staff") {
      return <StaffManagementPage />;
    }
    // Legacy /teachers route → now redirect conceptually to staff management
    if (path === "/headteacher/teachers") {
      return <StaffManagementPage />;
    }
    if (path === "/headteacher/students") {
      return <StudentsView />;
    }
    if (path === "/headteacher/attendance") {
      return <AttendanceView />;
    }
    if (path === "/headteacher/marks") {
      return <MarksApprovalPage />;
    }
    if (path === "/headteacher/reports") {
      return <MarksReportsPage />;
    }
    if (path === "/headteacher/parents") {
      return <ParentsView />;
    }
    if (path === "/headteacher/analytics") {
      return <AnalyticsView />;
    }
    if (path === "/headteacher/ai") {
      return <AIView />;
    }
    return <DashboardView data={data} />;
  };

  return <div className="min-h-screen bg-[#f8fbff] p-4 lg:p-6">{renderContent()}</div>;
}

function DashboardView({ data }: { data: HeadteacherDashboard }) {
  const trendsQuery = useQuery({
    queryKey: ["headteacher-trends"],
    queryFn: () => headteacherApi.attendanceTrends("week"),
  });
  const analyticsQuery = useQuery<PerformanceAnalytics>({
    queryKey: ["headteacher-analytics"],
    queryFn: () => headteacherApi.performanceAnalytics(),
  });

  const stats = data.stats;

  return (
    <div className="space-y-6">
      <DashboardStatGrid columns="six">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={GraduationCap}
          color="blue"
        />
        <StatCard label="Total Teachers" value={stats.totalTeachers} icon={Users} color="orange" />
        <StatCard
          label="Total Classes"
          value={stats.totalClasses}
          icon={Building2}
          color="purple"
        />
        <StatCard
          label="Attendance Today"
          value={`${stats.attendanceRate}%`}
          icon={TrendingUp}
          color={stats.attendanceRate >= 85 ? "green" : "red"}
        />
        <StatCard
          label="Pending Marks"
          value={stats.pendingMarksApproval}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          label="Students at Risk"
          value={stats.studentsAtRisk}
          icon={AlertTriangle}
          color={stats.studentsAtRisk > 0 ? "red" : "green"}
        />
      </DashboardStatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel title="Attendance Trend (Week)">
          <MiniChart data={trendsQuery.data || []} />
        </DashboardPanel>
        <DashboardPanel title="Class Performance">
          <PerformanceChart data={analyticsQuery.data?.byClass || []} />
        </DashboardPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardPanel title="Today's Attendance">
          <AttendanceDonut
            data={{
              present: stats.totalStudents - stats.absentToday,
              absent: stats.absentToday,
              late: 0,
            }}
          />
        </DashboardPanel>
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Pending Approvals</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">{stats.pendingMarksApproval}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold">Parent Engagement</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">{stats.parentEngagement}%</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Reports Generated</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">{stats.reportGenerated}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Brain className="h-5 w-5" />
                <span className="font-semibold">Active Interventions</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">{stats.activeInterventions}</p>
            </div>
          </div>
        </div>
      </div>

      <AIInsightsSection />
    </div>
  );
}

function AIInsightsSection() {
  const aiQuery = useQuery({
    queryKey: ["headteacher-ai-summary"],
    queryFn: async () => {
      const result = await headteacherApi.aiSchoolSummary();
      return result;
    },
  });
  if (aiQuery.isLoading || !aiQuery.data?.summary) return null;

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-purple-100 p-2">
          <Brain className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-bold text-purple-900">AI School Summary</h3>
          <p className="mt-1 text-sm text-purple-800">{aiQuery.data.summary}</p>
        </div>
      </div>
    </div>
  );
}

function TeachersView() {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["headteacher-teachers"],
    queryFn: async () => (await headteacherApi.teachers()).items,
  });

  const detailQuery = useQuery({
    queryKey: ["teacher-detail", selectedTeacherId],
    queryFn: () => headteacherApi.teacherDetail(selectedTeacherId!),
    enabled: !!selectedTeacherId,
  });

  const workloadQuery = useQuery({
    queryKey: ["teacher-workload", selectedTeacherId],
    queryFn: () => headteacherApi.teacherWorkload(selectedTeacherId!),
    enabled: !!selectedTeacherId,
  });

  if (query.isLoading) return <LoadingSpinner />;
  const teachers = query.data || [];

  return (
    <div className="space-y-6">
      <DashboardPanel title="Teacher Overview">
        <p className="text-xs font-semibold text-slate-500 mb-4">
          Click on any teacher to view detailed workloads, assigned courses, and recent marks
          submissions.
        </p>
        {teachers.length === 0 ? (
          <EmptyData message="No teachers found" />
        ) : (
          <div tabIndex={0} className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Name</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Email</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-600">
                    Assigned Classes
                  </th>
                  <th className="py-3 px-4 text-center font-bold text-slate-600">
                    Lessons Prepared
                  </th>
                  <th className="py-3 px-4 text-center font-bold text-slate-600">Resources</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-600">Pending Marks</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-all duration-150"
                    onClick={() => setSelectedTeacherId(t.id)}
                  >
                    <td className="py-3 px-4 font-bold text-blue-600 hover:text-blue-800">
                      {t.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{t.email}</td>
                    <td className="py-3 px-4 text-center text-slate-600 font-semibold">
                      {t.assignedClasses}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-semibold">
                      {t.lessonsPrepared}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-semibold">
                      {t.resourcesUploaded}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          t.pendingMarks > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {t.pendingMarks} pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      {/* Teacher Detail Slide-over / Modal */}
      {selectedTeacherId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="h-full w-full max-w-2xl bg-white p-6 shadow-lg overflow-y-auto animate-in slide-in-from-right duration-350">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Teacher Profile</h3>
                <p className="text-sm font-semibold text-slate-500">
                  School Admin & Performance Monitoring
                </p>
              </div>
              <button
                onClick={() => setSelectedTeacherId(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
              >
                Close Panel
              </button>
            </div>

            {detailQuery.isLoading || workloadQuery.isLoading ? (
              <LoadingSpinner />
            ) : detailQuery.isError || workloadQuery.isError ? (
              <ErrorDisplay message="Failed to load teacher detail data." />
            ) : (
              (() => {
                const detail = detailQuery.data!;
                const workload = workloadQuery.data!;
                return (
                  <div className="space-y-6">
                    {/* Basic Info Header Card */}
                    <div className="rounded-xl bg-blue-600 p-6 text-white shadow-md">
                      <h4 className="text-2xl font-bold">{detail.name}</h4>
                      <p className="text-sm font-semibold opacity-90 mt-1">{detail.email}</p>
                      <div className="flex gap-4 mt-4 pt-4 border-t border-white/20 text-xs font-bold">
                        <div>
                          Attendance (30D):{" "}
                          <span className="text-green-300 font-extrabold">
                            {detail.attendanceThisMonth || 0} sessions
                          </span>
                        </div>
                        <div>
                          Lessons:{" "}
                          <span className="text-blue-200 font-extrabold">
                            {detail.totalLessons} total
                          </span>
                        </div>
                        <div>
                          Resources:{" "}
                          <span className="text-purple-200 font-extrabold">
                            {detail.totalResources} uploads
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Workload Stats Grid */}
                    <div>
                      <h5 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
                        Workload Analysis
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 shadow-sm">
                          <p className="text-xs font-semibold text-slate-500">Courses Assigned</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">
                            {workload.classesAssigned}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 shadow-sm">
                          <p className="text-xs font-semibold text-slate-500">Lesson Plans</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">
                            {workload.lessonPlansCreated}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 shadow-sm">
                          <p className="text-xs font-semibold text-slate-500">Marks Entered</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">
                            {workload.marksEntered}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 shadow-sm">
                          <p className="text-xs font-semibold text-slate-500">Resources Shared</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">
                            {workload.resourcesUploaded}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Classes */}
                    <div>
                      <h5 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
                        Assigned Classes & Subjects
                      </h5>
                      {detail.assignedClasses.length === 0 ? (
                        <EmptyData message="No courses explicitly assigned yet." />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {detail.assignedClasses.map((ac, idx) => (
                            <span
                              key={idx}
                              className="inline-flex flex-col rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs"
                            >
                              <span className="font-bold text-blue-900">{ac.name}</span>
                              <span className="font-semibold text-blue-700 mt-0.5">
                                {ac.subject}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Marks Submissions */}
                    <div>
                      <h5 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
                        Recent Marks Entry Logs
                      </h5>
                      {detail.recentMarks.length === 0 ? (
                        <EmptyData message="No recent marks entries recorded." />
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3 font-bold text-slate-600">Subject</th>
                                <th className="py-2.5 px-3 font-bold text-slate-600">Class</th>
                                <th className="py-2.5 px-3 font-bold text-slate-600">Term</th>
                                <th className="py-2.5 px-3 font-bold text-slate-600">Status</th>
                                <th className="py-2.5 px-3 font-bold text-slate-600">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {detail.recentMarks.map((rm, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-3 font-bold text-slate-800">
                                    {rm.subject}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 font-semibold">
                                    {rm.class}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                                    {rm.term}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${
                                        rm.status === "APPROVED"
                                          ? "bg-green-50 text-green-700"
                                          : "bg-amber-50 text-amber-700"
                                      }`}
                                    >
                                      {rm.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-500 font-medium">
                                    {new Date(rm.date).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentsView() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    classId: "",
    gender: "",
    hasDisability: "" as "" | "true" | "false",
    status: "",
  });

  const { data: refData } = useTeacherReferenceData();
  const dashboardQuery = useQuery({
    queryKey: ["headteacher-dashboard"],
    queryFn: headteacherApi.dashboard,
  });

  const classFilterOptions = useMemo(
    () => [
      { value: "", label: "All Classes" },
      ...(refData?.classes ?? []).map((c: any) => ({ value: c.id, label: c.name })),
    ],
    [refData?.classes],
  );

  const query = useQuery({
    queryKey: ["headteacher-students", filters],
    queryFn: async () => {
      const params: {
        status?: string;
        gender?: string;
        hasDisability?: boolean;
        classId?: string;
        search?: string;
      } = {};
      if (filters.status) params.status = filters.status;
      if (filters.gender) params.gender = filters.gender;
      if (filters.classId) params.classId = filters.classId;
      if (filters.search) params.search = filters.search;
      if (filters.hasDisability === "true") params.hasDisability = true;
      if (filters.hasDisability === "false") params.hasDisability = false;
      return (await headteacherApi.students(params)).items;
    },
  });

  const detailQuery = useQuery({
    queryKey: ["student-detail", selectedStudentId],
    queryFn: () => headteacherApi.studentDetail(selectedStudentId!),
    enabled: !!selectedStudentId,
  });

  const riskQuery = useQuery({
    queryKey: ["student-risk", selectedStudentId],
    queryFn: () => headteacherApi.studentRisk(selectedStudentId!),
    enabled: !!selectedStudentId,
  });

  const [activeTab, setActiveTab] = useState<"academic" | "attendance" | "parents" | "risk">(
    "academic",
  );

  if (query.isLoading) return <LoadingSpinner />;
  const students = query.data || [];

  const totalStudents = dashboardQuery.data?.stats.totalStudents || 0;
  const atRiskCount = students.filter(
    (s) => s.riskLevel === "HIGH" || s.riskLevel === "MEDIUM",
  ).length;
  const maleCount = students.filter((s) => s.gender === "MALE").length;
  const femaleCount = students.filter((s) => s.gender === "FEMALE").length;
  const withDisabilityCount = students.filter((s) => s.hasDisability).length;
  const avgAttendance =
    students.length > 0
      ? Math.round(
          students
            .filter((s) => s.attendanceRate !== null)
            .reduce((acc, s) => acc + (s.attendanceRate || 0), 0) /
            students.filter((s) => s.attendanceRate !== null).length,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wide">Total</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-800">{totalStudents}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-5 w-5 text-blue-700" />
            <span className="text-xs font-bold uppercase tracking-wide text-blue-700">Male</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-800">{maleCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-5 w-5 text-pink-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-pink-700">Female</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-pink-800">{femaleCount}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wide">At Risk</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">{atRiskCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-xs font-bold uppercase tracking-wide">Avg Attendance</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-700">{avgAttendance}%</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-5 w-5 text-purple-700" />
            <span className="text-xs font-bold uppercase tracking-wide text-purple-700">
              Disability
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-800">{withDisabilityCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by name or code..."
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:outline-none placeholder-slate-400 w-full sm:w-64"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <div className="w-full sm:w-44">
          <CustomDropdown
            options={classFilterOptions}
            value={filters.classId}
            onChange={(val) => setFilters({ ...filters, classId: val || "" })}
            placeholder="All Classes"
            clearable={false}
            className="!min-h-10 text-xs"
          />
        </div>
        <div className="w-full sm:w-44">
          <CustomDropdown
            options={[
              { value: "", label: "All Genders" },
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
            value={filters.gender}
            onChange={(val) => setFilters({ ...filters, gender: val || "" })}
            placeholder="All Genders"
            clearable={false}
            className="!min-h-10 text-xs"
          />
        </div>
        <div className="w-full sm:w-48">
          <CustomDropdown
            options={[
              { value: "", label: "All Support Status" },
              { value: "true", label: "With Disability" },
              { value: "false", label: "Without Disability" },
            ]}
            value={filters.hasDisability}
            onChange={(val) =>
              setFilters({ ...filters, hasDisability: val as "" | "true" | "false" })
            }
            placeholder="All Support Status"
            clearable={false}
            className="!min-h-10 text-xs"
          />
        </div>
        <div className="w-full sm:w-44">
          <CustomDropdown
            options={[
              { value: "", label: "All Statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "TRANSFERRED", label: "Transferred" },
              { value: "DROPPED_OUT", label: "Dropped Out" },
            ]}
            value={filters.status}
            onChange={(val) => setFilters({ ...filters, status: val || "" })}
            placeholder="All Statuses"
            clearable={false}
            className="!min-h-10 text-xs"
          />
        </div>
      </div>

      <DashboardPanel title={`Students Overview (${students.length})`}>
        <p className="text-xs font-semibold text-slate-500 mb-4">
          Click on any student to open the comprehensive profile panel detailing analytics, risk
          score factors, and academic reports.
        </p>
        {students.length === 0 ? (
          <EmptyData message="No students found" />
        ) : (
          <div tabIndex={0} className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Name</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Code</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Class</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Gender</th>
                  <th className="py-3 px-4 text-left font-bold text-slate-600">Disability</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-600">At Risk</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-600">Attendance</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-all duration-150"
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setActiveTab("academic");
                    }}
                  >
                    <td className="py-3 px-4 font-bold text-blue-600 hover:text-blue-800">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {s.studentCode || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{s.class}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{s.gender}</td>
                    <td className="py-3 px-4">
                      {s.hasDisability ? (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                          {s.disabilityType || "Support Needed"}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium text-xs">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          s.riskLevel === "HIGH"
                            ? "bg-red-100 text-red-800"
                            : s.riskLevel === "MEDIUM"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {s.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold ${
                          s.attendanceRate === null
                            ? "text-slate-500"
                            : s.attendanceRate >= 85
                              ? "text-green-600"
                              : s.attendanceRate >= 70
                                ? "text-amber-700"
                                : "text-red-600"
                        }`}
                      >
                        {s.attendanceRate ? `${s.attendanceRate}%` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          s.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : s.status === "TRANSFERRED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="h-full w-full max-w-3xl bg-white p-6 shadow-lg overflow-y-auto animate-in slide-in-from-right duration-350">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Student Profile Dashboard</h3>
                <p className="text-sm font-semibold text-slate-500">
                  Comprehensive Academic, Risk & Attendance Log
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
              >
                Close Profile
              </button>
            </div>

            {detailQuery.isLoading || riskQuery.isLoading ? (
              <LoadingSpinner />
            ) : detailQuery.isError || riskQuery.isError ? (
              <ErrorDisplay message="Failed to load student detail data." />
            ) : (
              (() => {
                const detail = detailQuery.data!;
                const risk = riskQuery.data!;
                return (
                  <div className="space-y-6">
                    <div className="rounded-xl bg-indigo-700 p-6 text-white shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-block rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold tracking-wide uppercase mb-2">
                            {detail.studentCode}
                          </span>
                          <h4 className="text-2xl font-bold">{detail.name}</h4>
                          <p className="text-sm font-semibold opacity-90 mt-0.5">
                            {detail.class} · {detail.level}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-wide">AI Risk Level</p>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold mt-1 ${
                              risk.riskLevel === "HIGH"
                                ? "bg-red-500 text-white"
                                : risk.riskLevel === "MEDIUM"
                                  ? "bg-amber-500 text-slate-900"
                                  : "bg-green-500 text-white"
                            }`}
                          >
                            {risk.riskLevel}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white/10 text-xs font-bold">
                        <div>
                          GENDER:{" "}
                          <span className="text-blue-200 font-extrabold">{detail.gender}</span>
                        </div>
                        {detail.dateOfBirth && (
                          <div>
                            DOB:{" "}
                            <span className="text-blue-200 font-extrabold">
                              {new Date(detail.dateOfBirth).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div>
                          SUPPORT:{" "}
                          <span className="text-purple-200 font-extrabold">
                            {detail.hasDisability
                              ? detail.disabilityType || "Special Care"
                              : "None Required"}
                          </span>
                        </div>
                        <div>
                          STATUS:{" "}
                          <span className="text-green-300 font-extrabold">{detail.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex border-b border-slate-200 gap-2">
                      <button
                        onClick={() => setActiveTab("academic")}
                        className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-all ${
                          activeTab === "academic"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Academic Marks
                      </button>
                      <button
                        onClick={() => setActiveTab("attendance")}
                        className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-all ${
                          activeTab === "attendance"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Attendance Logs
                      </button>
                      <button
                        onClick={() => setActiveTab("parents")}
                        className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-all ${
                          activeTab === "parents"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Linked Parents
                      </button>
                      <button
                        onClick={() => setActiveTab("risk")}
                        className={`py-2.5 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                          activeTab === "risk"
                            ? "border-purple-600 text-purple-600"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Sparkles size={14} className="text-purple-700" /> AI Risk Factors
                      </button>
                    </div>

                    {activeTab === "academic" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-slate-500">
                                Academic Term Average
                              </p>
                              <p className="text-2xl font-bold text-slate-800 mt-1">
                                {detail.averageMarks !== null
                                  ? `${detail.averageMarks}%`
                                  : "No approved marks"}
                              </p>
                            </div>
                            {detail.averageMarks !== null && (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                                {detail.averageMarks >= 80
                                  ? "A"
                                  : detail.averageMarks >= 70
                                    ? "B"
                                    : detail.averageMarks >= 60
                                      ? "C"
                                      : "D"}
                              </div>
                            )}
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-slate-500">
                                Report Cards Compiled
                              </p>
                              <p className="text-2xl font-bold text-slate-800 mt-1">
                                {detail.reports.length}
                              </p>
                            </div>
                            <FileText className="h-6 w-6 text-indigo-700" />
                          </div>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                            Academic Marks Logs
                          </h5>
                          {detail.marks.length === 0 ? (
                            <EmptyData message="No approved marks entry recorded." />
                          ) : (
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                    <th className="py-2.5 px-3 font-bold text-slate-600">
                                      Subject
                                    </th>
                                    <th className="py-2.5 px-3 font-bold text-slate-600">Term</th>
                                    <th className="py-2.5 px-3 text-center font-bold text-slate-600">
                                      Score
                                    </th>
                                    <th className="py-2.5 px-3 text-center font-bold text-slate-600">
                                      Percentage
                                    </th>
                                    <th className="py-2.5 px-3 text-center font-bold text-slate-600">
                                      Grade
                                    </th>
                                    <th className="py-2.5 px-3 text-center font-bold text-slate-600">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {detail.marks.map((m, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="py-2.5 px-3 font-bold text-slate-800">
                                        {m.subject}
                                      </td>
                                      <td className="py-2.5 px-3 text-slate-600 font-semibold">
                                        {m.term}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                                        {m.score}/{m.maxScore}
                                      </td>
                                      <td className="py-2.5 px-3 text-center font-bold text-blue-600">
                                        {m.percentage}%
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                          {m.grade || "-"}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span
                                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${
                                            m.status === "APPROVED"
                                              ? "bg-green-50 text-green-700"
                                              : "bg-amber-50 text-amber-700"
                                          }`}
                                        >
                                          {m.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "attendance" && (
                      <div className="space-y-4">
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Average 30D Attendance Rate
                            </p>
                            <p className="text-2xl font-bold text-green-700 mt-1">
                              {risk.avgAttendance !== null
                                ? `${risk.avgAttendance}%`
                                : "No logs available"}
                            </p>
                          </div>
                          <Gauge className="h-6 w-6 text-green-500" />
                        </div>

                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                          Attendance History Timeline
                        </h5>
                        {detail.attendance.length === 0 ? (
                          <EmptyData message="No daily attendance logs found." />
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {detail.attendance.map((att, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 shadow-sm"
                              >
                                <span className="text-xs font-semibold text-slate-600">
                                  {new Date(att.date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                                    att.status === "PRESENT"
                                      ? "bg-green-100 text-green-800"
                                      : att.status === "ABSENT"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {att.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "parents" && (
                      <div className="space-y-4">
                        {detail.parents.length === 0 ? (
                          <EmptyData message="No parents/guardians linked to this student record." />
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {detail.parents.map((p, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                                    <User size={20} />
                                  </div>
                                  <div>
                                    <h6 className="font-bold text-slate-800">{p.name}</h6>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
                                      {p.relationship}
                                    </p>
                                  </div>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                                  <span className="flex items-center gap-1">
                                    <Phone size={14} className="text-slate-500" />{" "}
                                    {p.phone || "No phone"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "risk" && (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-6 space-y-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                              <Sparkles className="h-6 w-6" />
                            </div>
                            <div>
                              <h5 className="font-bold text-purple-900 text-base">
                                KuraLearn AI Risk Advisory
                              </h5>
                              <p className="mt-1 text-sm text-purple-800 font-semibold">
                                {risk.recommendation}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2">
                            <div className="flex justify-between text-xs font-bold text-purple-900 mb-1">
                              <span>Composite Risk Score</span>
                              <span>{risk.score}/100</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-purple-200">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${
                                  risk.riskLevel === "HIGH"
                                    ? "bg-red-500"
                                    : risk.riskLevel === "MEDIUM"
                                      ? "bg-amber-500"
                                      : "bg-green-500"
                                }`}
                                style={{ width: `${risk.score}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                            Identified Academic & Behavioral Factors
                          </h5>
                          {Object.keys(risk.factors || {}).length === 0 ? (
                            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center text-xs font-bold text-green-800">
                              No immediate negative factors detected. Student is performing within
                              normal bounds.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {Object.entries(risk.factors || {}).map(([key, val], idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 shadow-sm text-xs"
                                >
                                  <span className="font-bold text-slate-700 capitalize">
                                    {key.replace(/([A-Z])/g, " $1")}
                                  </span>
                                  <span
                                    className={`font-bold ${val ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {val ? "Concerning" : "Normal"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceView() {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [period, setPeriod] = useState<"week" | "month">("week");

  const { data: refData } = useTeacherReferenceData();
  const overviewQuery = useQuery({
    queryKey: ["headteacher-attendance"],
    queryFn: headteacherApi.attendance,
  });

  const activeClassOptions = useMemo(
    () => [
      { value: "", label: "-- Choose Class --" },
      ...(refData?.classes ?? []).map((c: any) => ({ value: c.id, label: c.name })),
    ],
    [refData?.classes],
  );
  const trendsQuery = useQuery({
    queryKey: ["headteacher-attendance-trends", period],
    queryFn: () => headteacherApi.attendanceTrends(period),
  });
  const teacherQuery = useQuery({
    queryKey: ["headteacher-teacher-attendance"],
    queryFn: headteacherApi.teacherAttendanceStatus,
  });

  const classAttendanceQuery = useQuery({
    queryKey: ["class-attendance-list", selectedClassId],
    queryFn: () => headteacherApi.classAttendance(selectedClassId),
    enabled: !!selectedClassId,
  });

  return (
    <div className="space-y-6">
      <DashboardPanel title="Today's Attendance Grid">
        {overviewQuery.isLoading ? (
          <LoadingSpinner />
        ) : overviewQuery.data ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {overviewQuery.data.today.present}
              </p>
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mt-1">
                Present
              </p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{overviewQuery.data.today.absent}</p>
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide mt-1">Absent</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
              <p className="text-3xl font-bold text-amber-700">{overviewQuery.data.today.late}</p>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mt-1">
                Late/Excused
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{overviewQuery.data.today.rate}%</p>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mt-1">
                Daily Rate
              </p>
            </div>
          </div>
        ) : (
          <EmptyData message="No daily attendance data" />
        )}
      </DashboardPanel>

      <DashboardPanel title="Attendance Trends & Period Analytics">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-semibold text-slate-500">
            Daily attendance metrics tracking historical absenteeism.
          </p>
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setPeriod("week")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                period === "week" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                period === "month" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
        {trendsQuery.isLoading ? <LoadingSpinner /> : <MiniChart data={trendsQuery.data || []} />}
      </DashboardPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel title="Class Attendance Comparison">
          <p className="text-xs font-semibold text-slate-500 mb-4">
            Daily class attendance ratios. Click a row to view student level attendance listings.
          </p>
          {overviewQuery.data?.byClass && overviewQuery.data.byClass.length > 0 ? (
            <div tabIndex={0} className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="py-2.5 px-3 font-bold text-slate-600">Class</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-600">Present</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-600">Absent</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-600">Daily Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewQuery.data.byClass.map((c) => (
                    <tr
                      key={c.class}
                      className={`border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-all ${
                        selectedClassId &&
                        refData?.classes?.find((cl: any) => cl.name === c.class)?.id ===
                          selectedClassId
                          ? "bg-blue-50/50"
                          : ""
                      }`}
                      onClick={() => {
                        const classId = refData?.classes?.find(
                          (cl: any) => cl.name === c.class,
                        )?.id;
                        if (classId) setSelectedClassId(classId);
                      }}
                    >
                      <td className="py-2.5 px-3 font-bold text-blue-600">{c.class}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                        {c.present}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-semibold">
                        {c.absent}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-bold ${c.rate >= 85 ? "text-green-600" : c.rate >= 70 ? "text-amber-700" : "text-red-600"}`}
                        >
                          {c.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyData message="No class attendance records available" />
          )}
        </DashboardPanel>

        <DashboardPanel title="Student-level Class Attendance (30D)">
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Selected Active Class
            </label>
            <CustomDropdown
              options={activeClassOptions}
              value={selectedClassId}
              onChange={(val) => setSelectedClassId(val || "")}
              placeholder="-- Choose Class --"
              clearable={false}
              className="!min-h-10 text-xs"
            />
          </div>

          {!selectedClassId ? (
            <div className="py-10 text-center text-slate-500 font-semibold text-xs border border-dashed border-slate-200 rounded-lg">
              Choose an active class from the dropdown or click a class row on the left to review
              individual attendance logs.
            </div>
          ) : classAttendanceQuery.isLoading ? (
            <LoadingSpinner />
          ) : classAttendanceQuery.data && classAttendanceQuery.data.length > 0 ? (
            <div tabIndex={0} className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-bold text-slate-600">Student Name</th>
                    <th className="py-2 px-3 text-center font-bold text-slate-600">Present</th>
                    <th className="py-2 px-3 text-center font-bold text-slate-600">Absent</th>
                    <th className="py-2 px-3 text-center font-bold text-slate-600">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {classAttendanceQuery.data.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-bold text-slate-800">{student.name}</td>
                      <td className="py-2 px-3 text-center text-green-600 font-semibold">
                        {student.present}
                      </td>
                      <td className="py-2 px-3 text-center text-red-600 font-semibold">
                        {student.absent}
                      </td>
                      <td className="py-2 px-3 text-center font-bold">
                        <span
                          className={
                            (student.rate || 0) >= 85
                              ? "text-green-600"
                              : (student.rate || 0) >= 70
                                ? "text-amber-700"
                                : "text-red-600"
                          }
                        >
                          {student.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyData message="No attendance records compiled for this class." />
          )}
        </DashboardPanel>
      </div>

      <DashboardPanel title="Teacher Roll-Call Submission Status">
        <p className="text-xs font-semibold text-slate-500 mb-4">
          Realtime logs showing whether assigned subject teachers have registered today's student
          attendance.
        </p>
        {teacherQuery.isLoading ? (
          <LoadingSpinner />
        ) : teacherQuery.data && teacherQuery.data.length > 0 ? (
          <div tabIndex={0} className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-2.5 px-4 font-bold text-slate-600">Teacher</th>
                  <th className="py-2.5 px-4 text-center font-bold text-slate-600">
                    Has Scheduled Lessons Today
                  </th>
                  <th className="py-2.5 px-4 text-center font-bold text-slate-600">
                    Attendance Logged Today
                  </th>
                </tr>
              </thead>
              <tbody>
                {teacherQuery.data.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{t.name}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          t.hasLessonsToday
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t.hasLessonsToday ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          t.submittedToday
                            ? "bg-green-100 text-green-800"
                            : "bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                        }`}
                      >
                        {t.submittedToday ? "Completed" : "Pending Log"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyData message="No teachers registered in system" />
        )}
      </DashboardPanel>
    </div>
  );
}

function ParentsView() {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [parentTab, setParentTab] = useState<"children" | "messages">("children");

  const engagementQuery = useQuery({
    queryKey: ["headteacher-parent-engagement"],
    queryFn: headteacherApi.parentEngagement,
  });
  const parentsQuery = useQuery({
    queryKey: ["headteacher-parents"],
    queryFn: async () => (await headteacherApi.parents()).items,
  });

  const childrenQuery = useQuery({
    queryKey: ["parent-children", selectedParentId],
    queryFn: () => headteacherApi.parentChildren(selectedParentId!),
    enabled: !!selectedParentId,
  });

  const messagesQuery = useQuery({
    queryKey: ["parent-messages", selectedParentId],
    queryFn: () => headteacherApi.parentMessages(selectedParentId!),
    enabled: !!selectedParentId,
  });

  return (
    <div className="space-y-6">
      <DashboardPanel title="Parent Community Engagement Analytics">
        {engagementQuery.isLoading ? (
          <LoadingSpinner />
        ) : engagementQuery.data ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {engagementQuery.data.totalParents}
              </p>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mt-1">
                Total Parents
              </p>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {engagementQuery.data.linkedParents}
              </p>
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mt-1">
                Linked Profiles
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">
                {engagementQuery.data.activeEngaged}
              </p>
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mt-1">
                Active This Month
              </p>
            </div>
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 text-center">
              <p className="text-3xl font-bold text-orange-700">
                {engagementQuery.data.engagementRate}%
              </p>
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mt-1">
                Engagement Rate
              </p>
            </div>
          </div>
        ) : (
          <EmptyData message="No parent engagement summary recorded." />
        )}
      </DashboardPanel>

      <DashboardPanel title="Parent Directory">
        <p className="text-xs font-semibold text-slate-500 mb-4">
          Comprehensive contacts database. Click any parent to review their children's records and
          school communication logs.
        </p>
        {parentsQuery.isLoading ? (
          <LoadingSpinner />
        ) : parentsQuery.data && parentsQuery.data.length > 0 ? (
          <div tabIndex={0} className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3 px-4 font-bold text-slate-600">Name</th>
                  <th className="py-3 px-4 font-bold text-slate-600">Email Address</th>
                  <th className="py-3 px-4 font-bold text-slate-600">Phone Number</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-600">Linked Pupils</th>
                </tr>
              </thead>
              <tbody>
                {parentsQuery.data.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-all duration-150"
                    onClick={() => {
                      setSelectedParentId(p.id);
                      setParentTab("children");
                    }}
                  >
                    <td className="py-3 px-4 font-bold text-blue-600 hover:text-blue-800">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{p.email || "-"}</td>
                    <td className="py-3 px-4 text-slate-600 font-bold">{p.phone || "-"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                        {p.childrenCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyData message="No parents found" />
        )}
      </DashboardPanel>

      {selectedParentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="h-full w-full max-w-2xl bg-white p-6 shadow-lg overflow-y-auto animate-in slide-in-from-right duration-350">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Parent Profile</h3>
                <p className="text-sm font-semibold text-slate-500">Linked Pupils & Chat logs</p>
              </div>
              <button
                onClick={() => setSelectedParentId(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
              >
                Close Profile
              </button>
            </div>

            {(() => {
              const activeParent = parentsQuery.data?.find((p) => p.id === selectedParentId);
              if (!activeParent) return <ErrorDisplay message="Parent profile not found" />;
              return (
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                    <h4 className="text-lg font-bold text-slate-800">{activeParent.name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-slate-500" />{" "}
                        {activeParent.email || "No email"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-500" />{" "}
                        {activeParent.phone || "No phone"}
                      </div>
                    </div>
                  </div>

                  <div className="flex border-b border-slate-200 gap-2">
                    <button
                      onClick={() => setParentTab("children")}
                      className={`py-2 px-4 text-sm font-bold border-b-2 transition-all ${
                        parentTab === "children"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Linked Children
                    </button>
                    <button
                      onClick={() => setParentTab("messages")}
                      className={`py-2 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-1 ${
                        parentTab === "messages"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <MessageSquare size={14} /> SMS / In-App Message Logs
                    </button>
                  </div>

                  {parentTab === "children" && (
                    <div className="space-y-4">
                      {childrenQuery.isLoading ? (
                        <LoadingSpinner />
                      ) : childrenQuery.data?.items && childrenQuery.data.items.length > 0 ? (
                        <div className="space-y-3">
                          {(childrenQuery.data.items as any[]).map((child, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 tracking-wide uppercase mb-1">
                                    {child.studentCode}
                                  </span>
                                  <h6 className="font-extrabold text-slate-800 text-sm">
                                    {child.name}
                                  </h6>
                                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                    CLASS: {child.class}
                                  </p>
                                </div>
                                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                                  {child.relationship}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs font-bold">
                                <div>
                                  Average Marks:{" "}
                                  <span className="text-blue-600 font-extrabold">
                                    {child.averageMarks ? `${child.averageMarks}%` : "No scores"}
                                  </span>
                                </div>
                                <div>
                                  Attendance Rate:{" "}
                                  <span className="text-green-600 font-extrabold">
                                    {child.attendanceRate ? `${child.attendanceRate}%` : "No logs"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyData message="No pupil linkages recorded for this parent profile." />
                      )}
                    </div>
                  )}

                  {parentTab === "messages" && (
                    <div className="space-y-4">
                      {messagesQuery.isLoading ? (
                        <LoadingSpinner />
                      ) : messagesQuery.data?.items && messagesQuery.data.items.length > 0 ? (
                        <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-[350px] overflow-y-auto">
                          {(messagesQuery.data.items as any[]).map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex flex-col space-y-1 ${msg.fromRole === "PARENT" ? "items-end" : "items-start"}`}
                            >
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                {msg.from} ({msg.fromRole})
                              </span>
                              <div
                                className={`rounded-xl px-3 py-2 text-xs font-semibold max-w-[85%] ${
                                  msg.fromRole === "PARENT"
                                    ? "bg-blue-600 text-white rounded-tr-none"
                                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                                }`}
                              >
                                <p>{msg.body}</p>
                              </div>
                              <span className="text-[10px] font-medium text-slate-500">
                                {new Date(msg.createdAt).toLocaleString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyData message="No recent messaging logs found." />
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsView() {
  const analyticsQuery = useQuery<PerformanceAnalytics>({
    queryKey: ["headteacher-analytics"],
    queryFn: () => headteacherApi.performanceAnalytics(),
  });
  const aiQuery = useQuery({
    queryKey: ["headteacher-ai-insights"],
    queryFn: async () =>
      (await headteacherApi.aiInsights()) as {
        insights: { type: string; title: string; summary: string; priority: string }[];
        atRiskStudents: { name: string; class: string; riskLevel: string }[];
      },
  });

  return (
    <div className="space-y-6">
      <DashboardPanel title="Performance by Subject">
        {analyticsQuery.data?.bySubject && analyticsQuery.data.bySubject.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsQuery.data.bySubject}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`${value}%`, "Average"]} />
                <Bar dataKey="average" fill="#3f6df6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyData message="No subject data available" />
        )}
      </DashboardPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel title="Performance by Gender">
          {analyticsQuery.data?.byGender && analyticsQuery.data.byGender.length > 0 ? (
            <div className="space-y-4">
              {analyticsQuery.data.byGender.map((item) => (
                <div key={item.gender} className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{item.gender}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-[#3f6df6]"
                        style={{ width: `${item.average}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      {item.average.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyData message="No gender data" />
          )}
        </DashboardPanel>

        <DashboardPanel title="Students at Risk">
          {aiQuery.data?.atRiskStudents && aiQuery.data.atRiskStudents.length > 0 ? (
            <div className="space-y-3">
              {aiQuery.data.atRiskStudents.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                  <div>
                    <p className="font-semibold text-red-900">{s.name}</p>
                    <p className="text-xs text-red-700">{s.class}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${s.riskLevel === "HIGH" ? "bg-red-200 text-red-800" : "bg-yellow-200 text-yellow-800"}`}
                  >
                    {s.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyData message="No students at risk" />
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}

function AIView() {
  const insightsQuery = useQuery({
    queryKey: ["headteacher-ai-insights"],
    queryFn: async () =>
      (await headteacherApi.aiInsights()) as {
        insights: { type: string; title: string; summary: string; priority: string }[];
        atRiskStudents: { name: string; class: string; riskLevel: string }[];
        weakSubjects: { subject: string; average: number }[];
      },
  });
  const actionQuery = useQuery({
    queryKey: ["headteacher-ai-action-plan"],
    queryFn: async () =>
      (await headteacherApi.aiActionPlan()) as {
        actions: { priority: string; action: string; target: string; timeline: string }[];
      },
  });

  return (
    <div className="space-y-6">
      <DashboardPanel title="AI Insights Dashboard">
        {insightsQuery.data?.insights && insightsQuery.data.insights.length > 0 ? (
          <div className="space-y-4">
            {insightsQuery.data.insights.map((insight, i) => (
              <div
                key={i}
                className={`rounded-xl p-4 border ${
                  insight.priority === "HIGH"
                    ? "bg-rose-50/50 border-rose-200 text-rose-950"
                    : insight.priority === "MEDIUM"
                      ? "bg-amber-50/50 border-amber-200 text-amber-950"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100/60">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1 rounded-md ${
                        insight.priority === "HIGH"
                          ? "bg-rose-100 text-rose-700"
                          : insight.priority === "MEDIUM"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <Brain size={18} />
                    </div>
                    <h4 className="font-extrabold text-sm tracking-tight">{insight.title}</h4>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      insight.priority === "HIGH"
                        ? "bg-rose-100 text-rose-800"
                        : insight.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {insight.priority} Priority
                  </span>
                </div>
                <p className="text-xs font-semibold leading-relaxed opacity-90">
                  {insight.summary}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyData message="No AI insights available" />
        )}
      </DashboardPanel>

      <DashboardPanel title="KuraLearn Dynamic Recommended Actions Checklist">
        <p className="text-xs font-semibold text-slate-500 mb-4">
          Prescriptive intervention plan built on realtime database logs. Check items as you
          complete them in school operations.
        </p>
        {actionQuery.data?.actions && actionQuery.data.actions.length > 0 ? (
          <div className="space-y-3">
            {actionQuery.data.actions.map((action, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-all"
              >
                <input
                  type="checkbox"
                  id={`action-${i}`}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`action-${i}`}
                    className="block font-bold text-slate-800 text-sm cursor-pointer select-none"
                  >
                    {action.action}
                  </label>
                  <div className="flex gap-4 mt-1 text-[11px] font-bold text-slate-500">
                    <span>
                      Target: <span className="text-slate-600">{action.target}</span>
                    </span>
                    <span>
                      Timeline: <span className="text-blue-600">{action.timeline}</span>
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    action.priority === "HIGH"
                      ? "bg-rose-100 text-rose-700"
                      : action.priority === "MEDIUM"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {action.priority}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyData message="No action plan generated yet." />
        )}
      </DashboardPanel>
    </div>
  );
}
