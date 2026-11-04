import React from "react";
import { AlertTriangle, CheckCircle, Clock, Users, XCircle, Percent } from "lucide-react";
import type { AttendanceSummary, AttendanceSummaryBreakdown } from "@/services/attendanceApi";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
type StatTone = "slate" | "emerald" | "rose" | "amber" | "violet";

const toneClasses: Record<StatTone, { icon: string; ring: string }> = {
  slate: {
    icon: "bg-slate-50 text-slate-700 border border-slate-200/60",
    ring: "border-slate-100/80 shadow-slate-100/50",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 border border-emerald-100/60",
    ring: "border-emerald-100/80",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700 border border-rose-100/60",
    ring: "border-rose-100/80",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 border border-amber-100/60",
    ring: "border-amber-100/80",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700 border border-violet-100/60",
    ring: "border-violet-100/80",
  },
};

const numberFormatter = new Intl.NumberFormat("en-RW");

const SkeletonCard = () => (
  <div className="h-full flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-3.5 w-24 animate-pulse rounded bg-slate-100" />
    </div>
    <div className="mt-4 h-7 w-16 animate-pulse rounded bg-slate-100" />
    <div className="mt-4 h-3 w-32 animate-pulse rounded bg-slate-100" />
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: AttendanceSummaryBreakdown;
  icon: React.ElementType;
  tone: StatTone;
  isPercentage?: boolean;
  isActive?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
}> = ({
  title,
  value,
  icon: Icon,
  tone,
  isPercentage = false,
  isActive = false,
  isClickable = false,
  onClick,
}) => {
  const theme = toneClasses[tone];

  const activeRingClass =
    tone === "slate"
      ? "ring-2 ring-slate-500 bg-slate-50/20 border-slate-300"
      : tone === "emerald"
        ? "ring-2 ring-emerald-500 bg-emerald-50/20 border-emerald-300"
        : tone === "rose"
          ? "ring-2 ring-rose-500 bg-rose-50/20 border-rose-300"
          : tone === "amber"
            ? "ring-2 ring-amber-500 bg-amber-50/20 border-amber-300"
            : "ring-2 ring-violet-500 bg-violet-50/20 border-violet-300";

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`rounded-xl border bg-white p-3 shadow-sm transition-all duration-200 ${
        isClickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${isActive ? activeRingClass : theme.ring}`}
    >
      {/* Row 1: Title */}
      <div className="text-[11px] font-semibold text-slate-500 truncate flex items-center justify-between">
        <span>{title}</span>
        {isClickable && (
          <span
            className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-violet-600 animate-pulse" : "bg-transparent"}`}
          />
        )}
      </div>

      {/* Row 2: Icon + Value */}
      <div className="mt-1.5 flex items-center gap-2">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${theme.icon}`}>
          <Icon size={14} strokeWidth={2} />
        </span>
        <div className="text-lg font-bold tracking-tight text-slate-800 leading-none">
          {isPercentage ? `${Math.round(value.total)}%` : numberFormatter.format(value.total)}
        </div>
      </div>

      {/* Row 3: Boys vs Girls */}
      <div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-slate-500 border-t border-slate-50 pt-1.5">
        <span>
          Boys: {isPercentage ? `${Math.round(value.boys)}%` : numberFormatter.format(value.boys)}
        </span>
        <span className="text-slate-200">|</span>
        <span>
          Girls:{" "}
          {isPercentage ? `${Math.round(value.girls)}%` : numberFormatter.format(value.girls)}
        </span>
      </div>
    </div>
  );
};

export const AttendanceStatsCards: React.FC<{
  summary: AttendanceSummary | null;
  loading: boolean;
  error?: string | null;
  selectedStatus: AttendanceStatus | undefined;
  onSelectStatus: (status: AttendanceStatus | undefined) => void;
}> = ({ summary, loading, error, selectedStatus, onSelectStatus }) => {
  if (loading && !summary) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 print:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-rose-800 print:hidden">
        <div className="flex items-center gap-2 text-sm font-bold">
          <AlertTriangle size={18} />
          Attendance summary could not be loaded
        </div>
        <p className="mt-1 text-xs font-semibold text-rose-700">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-xl border border-slate-200/60 bg-white p-8 text-center print:hidden shadow-sm">
        <Users size={28} className="mx-auto text-slate-500" />
        <h3 className="mt-3 text-sm font-bold text-slate-900">No attendance data found</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Choose a class and date to view attendance totals.
        </p>
      </div>
    );
  }

  const overallRate = summary.attendanceRate ?? 0;
  const boysRate = summary.attendanceRateBoys ?? 0;
  const girlsRate = summary.attendanceRateGirls ?? 0;

  const rateValue = {
    total: overallRate,
    boys: boysRate,
    girls: girlsRate,
  };

  const cards = [
    {
      title: "Total Students",
      value: summary.totalStudents,
      icon: Users,
      tone: "slate" as const,
      isPercentage: false,
      filterStatus: undefined,
    },
    {
      title: "Present",
      value: summary.present,
      icon: CheckCircle,
      tone: "emerald" as const,
      isPercentage: false,
      filterStatus: "PRESENT" as const,
    },
    {
      title: "Absent",
      value: summary.absent,
      icon: XCircle,
      tone: "rose" as const,
      isPercentage: false,
      filterStatus: "ABSENT" as const,
    },
    {
      title: "Late",
      value: summary.late,
      icon: Clock,
      tone: "amber" as const,
      isPercentage: false,
      filterStatus: "LATE" as const,
    },
    {
      title: "Rate",
      value: rateValue,
      icon: Percent,
      tone: "violet" as const,
      isPercentage: true,
      filterStatus: null,
    },
  ];

  const handleCardClick = (filterStatus: AttendanceStatus | null | undefined) => {
    if (filterStatus === null) return;
    onSelectStatus(filterStatus);
  };

  return (
    <div className="print:hidden">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const isClickable = card.filterStatus !== null;
          const isActive = isClickable && selectedStatus === card.filterStatus;

          return (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              tone={card.tone}
              isPercentage={card.isPercentage}
              isActive={isActive}
              isClickable={isClickable}
              onClick={() => handleCardClick(card.filterStatus)}
            />
          );
        })}
      </div>
    </div>
  );
};
