import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/common/PageHeader";
import { ProgressBar } from "@/components/common/ProgressBar";
import { StudentCard, PrimaryLink } from "@/components/student/StudentShared";
import { DashboardPanel } from "@/components/dashboard/DashboardLayout";
import { useStudentAnalytics } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw, TrendingUp, AlertTriangle, Sparkles, Brain, Clock, Award } from "lucide-react";
import { Link } from "react-router-dom";

const CHART_COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];
const SEVERITY_ICONS: Record<string, any> = {
  info: Sparkles,
  warning: AlertTriangle,
  success: TrendingUp,
};
const SEVERITY_BG: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const SEVERITY_ICON_CLS: Record<string, string> = {
  info: "text-blue-600",
  warning: "text-amber-700",
  success: "text-emerald-700",
};

export function AnalyticsPage() {
  const { data, isLoading, error, refetch } = useStudentAnalytics();

  if (isLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Progress analytics" subtitle="Loading..." />
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Progress analytics" subtitle="Error" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">Failed to load analytics</h3>
          <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const analytics = data?.analytics || data;
  const summary = analytics.summary || {};
  const weeklyActivity = analytics.weeklyActivity || [];
  const monthlyTrend = analytics.monthlyTrend || { labels: [], minutes: [] };
  const subjectProgress = analytics.subjectProgress || [];
  const topicPerformance = analytics.topicPerformance || [];
  const quizTrend = analytics.quizTrend || [];
  const avgScoresBySubject = analytics.avgScoresBySubject || [];
  const weakTopics = analytics.weakTopics || [];
  const recommendedNextStudy = analytics.recommendedNextStudy;
  const attendance = analytics.attendance || {};
  const insights = analytics.insights || [];
  const attendanceTrend = attendance.trend || [];

  const radarData = topicPerformance.map((t: any) => ({
    subject: t.subjectName,
    progress: t.progress,
    quizScore: t.avgQuizScore,
  }));

  const maxMinutes = Math.max(...monthlyTrend.minutes, 1);

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="Progress analytics"
        subtitle="Detailed learning analytics, performance trends, attendance, and AI-powered insights."
      />

      {/* Summary stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total time",
            value: `${summary.totalTimeMinutes || 0}m`,
            icon: Clock,
            color: "#f97316",
          },
          {
            label: "Lessons done",
            value: summary.completedLessons || 0,
            icon: Award,
            color: "#059669",
          },
          {
            label: "Overall progress",
            value: `${summary.overallProgress || 0}%`,
            icon: TrendingUp,
            color: "#2563eb",
          },
          {
            label: "Avg quiz score",
            value: summary.avgQuizScore != null ? `${summary.avgQuizScore}%` : "—",
            icon: Brain,
            color: "#8b5cf6",
          },
          {
            label: "Attendance",
            value: summary.termAttendanceRate != null ? `${summary.termAttendanceRate}%` : "—",
            icon: Award,
            color: "#0ea5e9",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
              style={{ backgroundColor: `${stat.color}18`, color: stat.color }}
            >
              <stat.icon size={20} />
            </span>
            <div>
              <p className="text-xl font-bold text-slate-950">{stat.value}</p>
              <p className="text-xs font-bold uppercase text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.9fr]">
        <StudentCard>
          <h2 className="text-lg font-bold">Weekly activity (minutes)</h2>
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#e7edf6" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                />
                <YAxis
                  domain={[0, "auto"]}
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
                  {weeklyActivity.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </StudentCard>
        <StudentCard>
          <h2 className="text-lg font-bold">Monthly trend</h2>
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyTrend.labels.map((label: string, i: number) => ({
                  month: label,
                  minutes: monthlyTrend.minutes[i],
                }))}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid stroke="#e7edf6" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                />
                <YAxis
                  domain={[0, Math.ceil(maxMinutes / 20) * 20 + 20]}
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
                  formatter={(value: number) => [`${value} min`, "Time spent"]}
                />
                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ fill: "#059669", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total: {summary.totalTimeMinutes || 0}m</span>
            <span>
              Avg:{" "}
              {monthlyTrend.minutes.length > 0
                ? Math.round(
                    monthlyTrend.minutes.reduce((a: number, b: number) => a + b, 0) /
                      monthlyTrend.minutes.length,
                  )
                : 0}
              m/mo
            </span>
          </div>
        </StudentCard>
      </div>

      {/* Subject progress + competency radar */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <StudentCard>
          <h2 className="font-bold">Subject progress & quiz scores</h2>
          <div className="mt-4 space-y-4">
            {topicPerformance.length > 0 ? (
              topicPerformance.map((topic: any) => (
                <div key={topic.subjectName}>
                  <div className="mb-1 flex items-center justify-between text-sm font-bold">
                    <span>{topic.subjectName}</span>
                    <span className="text-xs text-slate-500">
                      Quiz:{" "}
                      <span
                        className={
                          topic.avgQuizScore >= 70
                            ? "text-emerald-700"
                            : topic.avgQuizScore >= 40
                              ? "text-amber-700"
                              : "text-rose-700"
                        }
                      >
                        {topic.avgQuizScore > 0 ? `${topic.avgQuizScore}%` : "—"}
                      </span>
                      {" | "}Progress: {topic.progress}%
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <ProgressBar value={topic.progress} color="#059669" />
                    </div>
                    <div className="flex-1">
                      <ProgressBar
                        value={topic.avgQuizScore}
                        color={
                          topic.avgQuizScore >= 70
                            ? "#8b5cf6"
                            : topic.avgQuizScore >= 40
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                      />
                    </div>
                  </div>
                  {topic.competencyGap != null && topic.competencyGap > 30 && (
                    <p className="mt-1 text-[10px] font-bold text-amber-700">
                      Gap: {topic.competencyGap}% between progress and quiz score — review material
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-slate-500">No subject progress data.</p>
            )}
          </div>
        </StudentCard>

        {/* Competency radar */}
        <StudentCard>
          <h2 className="font-bold">Competency overview</h2>
          {radarData.length >= 3 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#475569", fontSize: 10, fontWeight: 700 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    tickCount={5}
                  />
                  <Radar
                    name="Progress"
                    dataKey="progress"
                    stroke="#059669"
                    fill="#059669"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Quiz Score"
                    dataKey="quizScore"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500">
              Complete lessons in 3+ subjects to see competency overview
            </div>
          )}
        </StudentCard>
      </div>

      {/* Attendance trend */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <StudentCard>
          <h2 className="font-bold">Attendance trend</h2>
          {attendanceTrend.length > 0 ? (
            <div className="mt-4">
              <div className="mb-3 flex flex-wrap gap-4 text-xs font-bold">
                <span className="text-emerald-700">Present: {attendance.termPresent || 0}</span>
                <span className="text-amber-700">Late: {attendance.termLate || 0}</span>
                <span className="text-rose-700">Absent: {attendance.termAbsent || 0}</span>
                <span className="text-slate-500">Total: {attendance.termTotal || 0}</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendanceTrend}
                    margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                  >
                    <CartesianGrid stroke="#e7edf6" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                      formatter={(value: number) => [`${value}%`, "Attendance rate"]}
                    />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={40} fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-slate-500">No attendance data for this term.</p>
          )}
        </StudentCard>

        <StudentCard>
          <h2 className="font-bold">Recommended next study</h2>
          {recommendedNextStudy ? (
            <div className="mt-4">
              <p className="text-lg font-bold text-emerald-700">{recommendedNextStudy.subject}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {recommendedNextStudy.reason}
              </p>
              <div className="mt-4 flex gap-3">
                <PrimaryLink to={recommendedNextStudy.action}>
                  {recommendedNextStudy.actionLabel}
                </PrimaryLink>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-slate-500">
              Start learning to get personalized recommendations.
            </p>
          )}
        </StudentCard>
      </div>

      {/* Quiz trend */}
      {quizTrend.length > 0 && (
        <div className="mt-5">
          <StudentCard>
            <h2 className="font-bold">Quiz score trend</h2>
            <div className="mt-2 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quizTrend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="#e7edf6" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                    formatter={(value: number, _name: string, props: any) => [
                      `${value}%`,
                      props.payload.title || "Score",
                    ]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {quizTrend.map((_: any, i: number) => {
                      const score = quizTrend[i]?.score || 0;
                      return (
                        <Cell
                          key={i}
                          fill={score >= 70 ? "#059669" : score >= 40 ? "#f59e0b" : "#ef4444"}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </StudentCard>
        </div>
      )}

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <div className="mt-5">
          <StudentCard>
            <h2 className="font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-700" />
              Areas needing improvement
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {weakTopics.map((w: any) => (
                <div key={w.subject} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="font-bold text-amber-800">{w.subject}</p>
                  <p className="text-xs font-bold text-amber-700">
                    {w.lowScoreCount} low quiz score{w.lowScoreCount !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </StudentCard>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mt-5 space-y-3">
          <h2 className="text-lg font-bold text-[#0b1f4d] flex items-center gap-2">
            <Sparkles size={20} className="text-emerald-700" />
            AI Insights & Recommendations
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {insights.map((insight: any, i: number) => {
              const Icon = SEVERITY_ICONS[insight.severity] || Sparkles;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${SEVERITY_BG[insight.severity] || SEVERITY_BG.info}`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      size={20}
                      className={`mt-0.5 shrink-0 ${SEVERITY_ICON_CLS[insight.severity]}`}
                    />
                    <p className="text-sm font-bold">{insight.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <PrimaryLink to="/student/marks">View marks</PrimaryLink>
        <PrimaryLink to="/student/attendance">Attendance details</PrimaryLink>
        <Link
          to="/ai"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Ask AI Tutor
        </Link>
      </div>
    </div>
  );
}
