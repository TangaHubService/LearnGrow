import { Link, Navigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  CheckCircle2,
  ChevronRight,
  Flame,
  ShieldCheck,
  Star,
  RefreshCw,
  TrendingUp,
  Brain,
  AlertTriangle,
  Sparkles,
  Clock,
  BookOpen,
} from "lucide-react";
import { DashboardPageLayout, DashboardPanel } from "@/components/dashboard/DashboardLayout";
import { PrimaryLink, SecondaryLink, StudentProgressBar } from "@/components/student/StudentShared";

import { useAuth } from "@/contexts/AuthContext";
import { useStudentDashboard } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";

const CHART_COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

function ActivityBarChart({ data }: { data: { day: string; minutes: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.minutes), 1);
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#e7edf6" vertical={false} />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
          />
          <YAxis
            domain={[0, Math.ceil(maxVal / 10) * 10 + 10]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
            unit="m"
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 12,
              fontWeight: 700,
            }}
            formatter={(value: number) => [`${value} min`, "Activity"]}
          />
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AttendancePie({ data }: { data: { day: string; present: number; absent: number }[] }) {
  const totalPresent = data.reduce((s, d) => s + d.present, 0);
  const totalAbsent = data.reduce((s, d) => s + d.absent, 0);
  const totalRecords = totalPresent + totalAbsent;
  if (totalRecords === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
        No attendance records this week
      </div>
    );
  }
  const rate = Math.round((totalPresent / totalRecords) * 100);
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { name: "Present", value: totalPresent },
                { name: "Absent", value: totalAbsent },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={48}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill="#059669" />
              <Cell fill="#f43f5e" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-800">{rate}%</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="h-3 w-3 rounded-full bg-emerald-700" />
          <span className="text-slate-700">Present</span>
          <span className="ml-auto text-slate-900">{totalPresent}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="text-slate-700">Absent</span>
          <span className="ml-auto text-slate-900">{totalAbsent}</span>
        </div>
        <div className="pt-1 text-[11px] font-bold text-slate-500">
          {totalRecords} total records
        </div>
      </div>
    </div>
  );
}

const INSIGHT_STYLES = {
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    icon: "text-blue-600",
    Icon: Sparkles,
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    icon: "text-amber-700",
    Icon: AlertTriangle,
  },
  success: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    icon: "text-emerald-700",
    Icon: TrendingUp,
  },
};

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useStudentDashboard();

  if (isLoading) {
    return (
      <DashboardPageLayout title="Loading..." subtitle="Getting your learning progress ready">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
      </DashboardPageLayout>
    );
  }

  // A learner who has just signed up picks their level before seeing a dashboard.
  if ((error as Error | null)?.message?.includes("profile is not set up")) {
    return <Navigate to="/profile-setup" replace />;
  }

  if (error) {
    return (
      <DashboardPageLayout
        title="Oops!"
        subtitle="Something went wrong while loading your dashboard"
      >
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-full bg-red-50 p-4 text-red-600">
            <RefreshCw size={48} className="animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Failed to load dashboard</h3>
          <p className="mt-2 max-w-xs text-slate-500">
            {(error as any)?.message || "Please check your connection and try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white transition-all hover:bg-indigo-700 active:scale-95"
          >
            <RefreshCw size={18} />
            Try again
          </button>
        </div>
      </DashboardPageLayout>
    );
  }

  const dashboard = data.dashboard || data;
  const isLinkedToSchool = Boolean(dashboard.student?.schoolName);
  const student = dashboard.student;
  const stats = dashboard.stats;
  const continueLearning = dashboard.continueLearning;
  const goals = dashboard.goals || [];
  const weeklyActivity = dashboard.weeklyActivity || [];
  const attendanceByDay = dashboard.attendanceByDay || [];
  const insights = dashboard.insights || [];
  const quizPerformance = dashboard.quizPerformance || [];

  return (
    <DashboardPageLayout
      title={
        <span className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-lg font-bold text-white shadow-sm">
            {student.name?.charAt(0) || "S"}
          </span>
          <span>Hi, {student.name.split(" ")[0]}</span>
        </span>
      }
      subtitle={
        <span className="flex items-center gap-2 text-slate-500">
          <BookOpen size={14} />
          {student.level} learner {student.schoolName ? `at ${student.schoolName}` : ""}
        </span>
      }
      action={
        continueLearning ? (
          <Link
            to={`/lessons/${continueLearning.lessonId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md active:scale-[0.97]"
          >
            Continue <ChevronRight size={16} />
          </Link>
        ) : undefined
      }
    >
      {isLinkedToSchool ? null : (
        <div role="status" className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm">
          <p className="font-bold text-slate-900">You haven't joined a school yet</p>
          <p className="mt-1 text-slate-700">
            Give your teacher or school office your KuraLearn email, <strong>{user?.email}</strong>,
            so they can add you to your class.
          </p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Star size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.stars || 0}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Stars</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.badges || 0}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">Badges</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.completedLessons || 0}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Lessons done
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <Flame size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.streakDays || 0}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Streak days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Brain size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.avgQuizScore != null ? `${stats.avgQuizScore}%` : "—"}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-600">Quiz avg</p>
              <p className="text-[10px] font-bold text-slate-500">
                {stats.totalQuizzes || 0} quizzes taken
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.attendanceRate != null ? `${stats.attendanceRate}%` : "—"}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-sky-600">Attendance</p>
              <p className="text-[10px] font-bold text-slate-500">This week</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.totalTimeSpentMinutes != null ? `${stats.totalTimeSpentMinutes}m` : "—"}
              </p>
              <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                Time spent
              </p>
              <p className="text-[10px] font-bold text-slate-500">Total learning</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <DashboardPanel title="Continue Learning">
          {continueLearning ? (
            <div>
              <h2 className="text-xl font-bold text-slate-900">{continueLearning.title}</h2>
              <p className="mt-1 text-sm font-bold text-emerald-700">
                {continueLearning.subjectName}
              </p>
              <div className="mt-2">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      continueLearning.progressStatus === "IN_PROGRESS"
                        ? "bg-amber-100 text-amber-700"
                        : continueLearning.progressStatus === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {continueLearning.progressStatus === "IN_PROGRESS"
                      ? "In progress"
                      : continueLearning.progressStatus === "COMPLETED"
                        ? "Completed"
                        : "Not started"}
                  </span>
                  <span>{continueLearning.courseTitle}</span>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to={`/lessons/${continueLearning.lessonId}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition-all hover:bg-emerald-800 active:scale-[0.97]"
                >
                  Open lesson <ChevronRight size={16} />
                </Link>
                <Link
                  to={`/courses/${continueLearning.courseId}/path`}
                  className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.97]"
                >
                  Learning path
                </Link>
                <Link
                  to="/ai"
                  className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.97]"
                >
                  Ask AI Tutor
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex h-36 flex-col items-center justify-center text-center">
              <BookOpen size={36} className="mb-3 text-slate-500" />
              <p className="text-sm font-bold text-slate-500">No active lessons</p>
              <p className="text-xs text-slate-500">Start a new subject below!</p>
              <Link
                to="/subjects"
                className="mt-3 text-sm font-bold text-indigo-600 hover:underline"
              >
                Browse subjects
              </Link>
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel title="Today's Goals">
          <div className="space-y-4">
            {goals.length > 0 ? (
              goals.map((goal: any) => (
                <Link key={goal.id} to="/goals" className="group block">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                      {goal.title}
                    </p>
                    <p className="text-[11px] font-bold text-slate-500">
                      {goal.progress}/{goal.target}
                    </p>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all group-hover:bg-emerald-600"
                      style={{ width: `${Math.min(100, (goal.progress / goal.target) * 100)}%` }}
                    />
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex h-36 flex-col items-center justify-center text-center">
                <p className="text-sm text-slate-500">No goals set yet.</p>
                <Link to="/goals" className="mt-2 text-xs font-bold text-indigo-600">
                  Set a learning goal
                </Link>
              </div>
            )}
          </div>
        </DashboardPanel>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title={
            <span className="flex items-center gap-2">
              <TrendingUp size={16} />
              Weekly Activity
            </span>
          }
          bodyClassName="p-4"
        >
          {weeklyActivity.some((d: any) => d.minutes > 0) ? (
            <ActivityBarChart data={weeklyActivity} />
          ) : (
            <div className="flex h-44 items-center justify-center text-sm text-slate-500">
              No activity recorded this week. Start a lesson!
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-500">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title={
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              Attendance
            </span>
          }
          bodyClassName="p-4"
        >
          <AttendancePie data={attendanceByDay} />
        </DashboardPanel>
      </div>

      {insights.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#0b1f4d]">
            <Sparkles size={20} className="text-emerald-700" />
            AI-Powered Insights
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {insights.slice(0, 3).map((insight: any, i: number) => {
              const style =
                INSIGHT_STYLES[insight.severity as keyof typeof INSIGHT_STYLES] ||
                INSIGHT_STYLES.info;
              const Icon = style.Icon;
              return (
                <div key={i} className={`rounded-xl border p-4 ${style.bg}`}>
                  <div className="flex items-start gap-3">
                    <Icon size={20} className={`mt-0.5 shrink-0 ${style.icon}`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${style.text}`}>{insight.message}</p>
                      {insight.action && (
                        <Link
                          to={insight.action}
                          className={`mt-2 inline-block text-xs font-bold underline underline-offset-2 ${style.text} opacity-70 hover:opacity-100`}
                        >
                          {insight.actionLabel || "Take action"} &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {quizPerformance.length > 0 && (
        <div className="mt-8">
          <DashboardPanel title="Recent Quiz Scores" bodyClassName="p-4">
            <div className="divide-y divide-slate-100">
              {quizPerformance.slice(0, 5).map((q: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-700">{q.quizTitle}</p>
                    <p className="text-[11px] font-bold text-slate-500">{q.subjectName}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                      q.score >= 70
                        ? "bg-emerald-100 text-emerald-700"
                        : q.score >= 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {q.score}%
                  </span>
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          to="/student/analytics"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.97]"
        >
          <TrendingUp size={16} />
          Full analytics
        </Link>
        <Link
          to="/ai"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.97]"
        >
          <Sparkles size={16} />
          AI Tutor
        </Link>
      </div>
    </DashboardPageLayout>
  );
}
