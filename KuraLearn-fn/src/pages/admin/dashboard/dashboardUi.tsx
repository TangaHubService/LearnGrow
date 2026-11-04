import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
  Search,
  UserPlus,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminMetric, QuickAction, Tone } from "@/services/schoolAdminService";
import { DashboardPanel as SharedDashboardPanel } from "@/components/dashboard/DashboardLayout";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";

const toneStyles: Record<Tone, { badge: string; icon: string; text: string; bar: string }> = {
  blue: { badge: "bg-blue-50", icon: "text-blue-600", text: "text-blue-700", bar: "bg-blue-500" },
  orange: {
    badge: "bg-orange-50",
    icon: "text-orange-700",
    text: "text-orange-700",
    bar: "bg-orange-400",
  },
  indigo: {
    badge: "bg-indigo-50",
    icon: "text-indigo-600",
    text: "text-indigo-700",
    bar: "bg-indigo-500",
  },
  rose: { badge: "bg-rose-50", icon: "text-rose-700", text: "text-rose-700", bar: "bg-rose-400" },
  green: {
    badge: "bg-emerald-50",
    icon: "text-emerald-700",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
  },
  red: { badge: "bg-red-50", icon: "text-red-600", text: "text-red-600", bar: "bg-red-400" },
  purple: {
    badge: "bg-purple-50",
    icon: "text-purple-600",
    text: "text-purple-700",
    bar: "bg-purple-500",
  },
  violet: {
    badge: "bg-violet-50",
    icon: "text-violet-600",
    text: "text-violet-700",
    bar: "bg-violet-500",
  },
  sky: { badge: "bg-sky-50", icon: "text-sky-600", text: "text-sky-700", bar: "bg-sky-500" },
  amber: {
    badge: "bg-amber-50",
    icon: "text-amber-700",
    text: "text-amber-700",
    bar: "bg-amber-400",
  },
};

const toneHex: Record<Tone, string> = {
  blue: "#2563eb",
  orange: "#f97316",
  indigo: "#4f46e5",
  rose: "#f43f5e",
  green: "#059669",
  red: "#dc2626",
  purple: "#7c3aed",
  violet: "#6d28d9",
  sky: "#0284c7",
  amber: "#d97706",
};

const metricIcons: Record<string, LucideIcon> = {
  students: Users,
  teachers: GraduationCap,
  classes: BookOpen,
  attendance: ClipboardCheck,
  income: Wallet,
  expenses: WalletCards,
  learning: BookOpen,
  ai: Bot,
};

const actionIcons: Record<string, LucideIcon> = {
  student: UserPlus,
  teacher: GraduationCap,
  class: BookOpen,
  notice: Megaphone,
  admission: ClipboardCheck,
  report: FileText,
  curriculum: BookOpen,
  ai: Bot,
  message: MessageSquare,
};

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SharedDashboardPanel title={title} action={action} className={className}>
      {children}
    </SharedDashboardPanel>
  );
}

export function MetricCard({ metric }: { metric: AdminMetric }) {
  const Icon = metricIcons[metric.icon] ?? Users;

  return (
    <DashboardStatCard
      label={metric.label}
      value={metric.value}
      icon={Icon}
      tone={toneHex[metric.tone]}
      trendDirection={metric.trend.direction}
      trendLabel={metric.trend.label}
      trendTone={metric.trend.tone}
    />
  );
}

const QUICK_ACTION_LINKS: Record<string, string> = {
  "add-student": "/admin/students/register",
  "add-teacher": "/headteacher/staff",
  "create-class": "/teacher/classes",
  curriculum: "/teacher/courses",
  "ai-report": "/teacher/reports",
  message: "/teacher/messages",
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => {
        const Icon = actionIcons[action.icon] ?? Plus;
        const style = toneStyles[action.tone];
        return (
          <Link
            key={action.id}
            to={QUICK_ACTION_LINKS[action.id] ?? "/school-admin"}
            className="flex min-h-[56px] items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 text-left transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm"
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${style.badge} ${style.icon}`}
            >
              <Icon size={16} />
            </span>
            <span className="text-xs font-bold leading-tight text-slate-900">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function ToneDot({ tone }: { tone: Tone }) {
  return <span className={`h-2 w-2 rounded-full ${toneStyles[tone].bar}`} />;
}

export function DatePill({ todayLabel }: { todayLabel: string }) {
  return (
    <div className="hidden h-14 items-center gap-3 rounded-md border border-slate-200 bg-white px-5 text-sm font-bold text-blue-600 shadow-sm xl:flex">
      <CalendarDays size={18} className="text-slate-600" />
      {todayLabel}
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="grid min-h-[60vh] place-items-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-500">
      Loading dashboard data...
    </div>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-700">
      {message}
    </div>
  );
}
