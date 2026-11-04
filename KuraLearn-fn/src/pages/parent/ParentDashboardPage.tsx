import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarCheck,
  FileText,
  Lightbulb,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { parentApi } from "@/lib/api";
import {
  DashboardPageLayout,
  DashboardPanel,
  DashboardStatGrid,
} from "@/components/dashboard/DashboardLayout";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { ProgressBar } from "@/components/common/ProgressBar";

type ParentChild = {
  id: string;
  name: string;
  studentCode?: string;
  level: string;
  className?: string;
  pathway?: string;
  combination?: { code: string; name: string } | null;
  attendance: {
    rate: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    total: number;
  };
  average?: number | null;
  latestReport?: {
    id: string;
    term: string;
    grade?: string | null;
    status: string;
    averagePercentage?: number | null;
    pdfUrl?: string | null;
    teacherComments?: string | null;
    headteacherComments?: string | null;
  } | null;
  recentMarks: Array<{
    id: string;
    subjectName: string;
    percentage?: number | null;
    grade?: string | null;
    status: string;
  }>;
  supportPlan?: {
    id: string;
    title: string;
    status: string;
    accommodations: string[];
    reviewDate?: string | null;
  } | null;
  riskLevel: string;
  nextAction: string;
  aiRecommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  fees?: { totalFee: number; paid: number; balance: number; status: string } | null;
  performanceTrends?: {
    overallTrend: Array<{ date: string; percentage: number; subject: string }>;
  };
};

function LoadingState() {
  return (
    <DashboardPageLayout title="Parent Portal" subtitle="Loading family learning summary">
      <div className="h-64 rounded-lg border border-slate-200 bg-white" />
    </DashboardPageLayout>
  );
}

function EmptyChildren() {
  return (
    <DashboardPanel title="Children">
      <div className="py-10 text-center">
        <p className="text-sm font-bold text-slate-800">No linked children yet</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Ask the school admin to link your parent account.
        </p>
      </div>
    </DashboardPanel>
  );
}

function ChildRow({ child }: { child: ParentChild }) {
  const tone =
    child.riskLevel === "HIGH"
      ? "text-rose-700 bg-rose-50"
      : child.riskLevel === "MEDIUM"
        ? "text-amber-700 bg-amber-50"
        : "text-emerald-700 bg-emerald-50";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-950">{child.name}</h2>
            <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
              {child.studentCode}
            </span>
            <span
              className={`rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${tone}`}
            >
              {child.riskLevel}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {child.level} {child.className ? `- ${child.className}` : ""}{" "}
            {child.combination ? `- ${child.combination.code}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/messages"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <MessageSquare size={16} /> Message
          </Link>
          {child.latestReport?.pdfUrl ? (
            <a
              href={child.latestReport.pdfUrl}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              <FileText size={16} /> Report
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Attendance</p>
          <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-700">
            <span>{child.attendance.rate}%</span>
            <span>{child.attendance.absent} absent</span>
          </div>
          <ProgressBar value={child.attendance.rate} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Latest average</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{child.average ?? "-"}%</p>
          <p className="text-xs font-semibold text-slate-500">
            {child.latestReport?.term ?? "No report yet"}{" "}
            {child.latestReport?.grade ? `- Grade ${child.latestReport.grade}` : ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Next action</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{child.nextAction}</p>
        </div>
      </div>

      {child.supportPlan ? (
        <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
            <ShieldCheck size={16} /> {child.supportPlan.title}
          </div>
          <p className="mt-1 text-xs font-semibold text-emerald-700">
            {child.supportPlan.accommodations.slice(0, 3).join(", ")}
          </p>
        </div>
      ) : null}

      {child.aiRecommendations && child.aiRecommendations.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Lightbulb size={14} /> AI Recommendations
          </div>
          {child.aiRecommendations.map((rec, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 ${
                rec.priority === "high"
                  ? "border-rose-100 bg-rose-50"
                  : rec.priority === "medium"
                    ? "border-amber-100 bg-amber-50"
                    : "border-slate-100 bg-slate-50"
              }`}
            >
              <p
                className={`text-sm font-bold ${
                  rec.priority === "high"
                    ? "text-rose-800"
                    : rec.priority === "medium"
                      ? "text-amber-800"
                      : "text-slate-800"
                }`}
              >
                {rec.title}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-600">{rec.description}</p>
            </div>
          ))}
        </div>
      )}

      {child.fees && child.fees.status !== "no_data" && (
        <div className="mt-4 rounded-lg border border-slate-100 bg-white p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">Fees</span>
            <span
              className={`font-bold ${child.fees.balance > 0 ? "text-rose-700" : "text-emerald-700"}`}
            >
              {child.fees.balance > 0
                ? `${child.fees.balance.toLocaleString()} RWF due`
                : "Paid in full"}
            </span>
          </div>
          <ProgressBar
            value={child.fees.totalFee > 0 ? (child.fees.paid / child.fees.totalFee) * 100 : 0}
          />
        </div>
      )}
    </section>
  );
}

export function ParentDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent-dashboard"],
    queryFn: async () => (await parentApi.dashboard()).dashboard,
  });

  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <DashboardPageLayout title="Parent Portal" subtitle="We could not load your family summary">
        <DashboardPanel title="Status">
          <p className="text-sm font-semibold text-rose-700">{(error as Error).message}</p>
        </DashboardPanel>
      </DashboardPageLayout>
    );
  }

  const children = (data?.children ?? []) as ParentChild[];

  return (
    <DashboardPageLayout
      title={`Muraho, ${data?.parent?.name?.split(" ")[0] ?? "Parent"}`}
      subtitle="Family learning summary"
      action={
        <Link
          to="/messages"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-700"
        >
          <MessageSquare size={16} /> Messages
        </Link>
      }
    >
      {children.length === 0 ? (
        <div role="status" className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm">
          <p className="font-bold text-slate-900">No children linked yet</p>
          <p className="mt-1 text-slate-700">
            Give your child's school your KuraLearn email, <strong>{user?.email}</strong>, so they
            can connect you to your child.
          </p>
        </div>
      ) : null}
      <DashboardStatGrid columns="four">
        <DashboardStatCard
          label="Children"
          value={data?.stats?.children ?? 0}
          icon={Users}
          tone="blue"
        />
        <DashboardStatCard
          label="Attendance"
          value={`${data?.stats?.averageAttendance ?? 0}%`}
          icon={CalendarCheck}
          tone="emerald"
        />
        <DashboardStatCard
          label="Alerts"
          value={data?.stats?.childrenWithAlerts ?? 0}
          icon={AlertTriangle}
          tone="amber"
        />
        <DashboardStatCard
          label="Unread"
          value={(data?.stats?.unreadMessages ?? 0) + (data?.stats?.unreadNotifications ?? 0)}
          icon={Bell}
          tone="purple"
        />
      </DashboardStatGrid>

      <DashboardPanel title="Guardian Brief">
        <div className="grid gap-3 lg:grid-cols-2">
          {(data?.guardianBrief ?? []).map((item: any) => (
            <div key={item.childId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-800">{item.message}</p>
            </div>
          ))}
        </div>
      </DashboardPanel>

      {children.length ? (
        <div className="space-y-4">
          {children.map((child) => (
            <ChildRow key={child.id} child={child} />
          ))}
        </div>
      ) : (
        <EmptyChildren />
      )}

      <DashboardPanel
        title="Recent Notices"
        action={
          <Link to="/notifications" className="text-sm font-bold text-emerald-700 hover:underline">
            View all
          </Link>
        }
      >
        <div className="space-y-3">
          {(data?.notifications ?? []).slice(0, 4).map((item: any) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
            >
              <BookOpen className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </DashboardPanel>
    </DashboardPageLayout>
  );
}
