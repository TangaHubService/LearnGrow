import { Users, BookOpen, BarChart3, FileText, Clock, Loader2 } from "lucide-react";
import { Card } from "@/components/common/Card";

export function CourseAnalytics({ loading, analytics }: { loading: boolean; analytics: any }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
        <Loader2 size={18} className="animate-spin" /> Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="py-12 text-center">
        <p className="text-slate-500">No analytics data available yet.</p>
      </Card>
    );
  }

  const stats = [
    {
      label: "Total Enrollments",
      value: analytics.totalEnrollments,
      icon: Users,
      color: "text-[#6d3eeb]",
    },
    {
      label: "Completed",
      value: analytics.completedCount,
      icon: BookOpen,
      color: "text-emerald-700",
    },
    {
      label: "Avg Progress",
      value: `${analytics.avgProgress}%`,
      icon: BarChart3,
      color: "text-sky-600",
    },
    {
      label: "Total Lessons",
      value: analytics.totalLessons,
      icon: FileText,
      color: "text-amber-700",
    },
    {
      label: "Avg Quiz Score",
      value: `${analytics.avgQuizScore}%`,
      icon: BookOpen,
      color: "text-pink-600",
    },
    {
      label: "Quiz Attempts",
      value: analytics.totalQuizAttempts,
      icon: Clock,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center">
          <stat.icon size={24} className={`mx-auto ${stat.color}`} />
          <p className={`mt-2 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}
