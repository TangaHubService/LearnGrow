import { useMemo } from "react";
import { RefreshCw, Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { DashboardStatGrid } from "@/components/dashboard/DashboardLayout";
import { Skeleton } from "@/components/common/Skeleton";
import { useStudentAttendanceSummary } from "@/hooks/useStudentPortal";

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  PRESENT: CheckCircle2,
  ABSENT: XCircle,
  LATE: Clock,
  EXCUSED: AlertCircle,
};

const STATUS_COLOR: Record<string, string> = {
  PRESENT: "text-emerald-700 bg-emerald-50",
  ABSENT: "text-red-600 bg-red-50",
  LATE: "text-amber-700 bg-amber-50",
  EXCUSED: "text-blue-600 bg-blue-50",
};

function AttendanceContent() {
  const { data, isLoading, error, refetch } = useStudentAttendanceSummary();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <DashboardStatGrid columns="four">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </DashboardStatGrid>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <RefreshCw size={48} className="mb-4 text-red-400" />
        <p className="text-lg font-bold text-slate-600">Failed to load attendance</p>
        <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
          Retry
        </button>
      </div>
    );
  }

  const attendance = data?.attendance;
  if (!attendance) {
    return (
      <Card className="py-12 text-center">
        <Calendar size={48} className="mx-auto text-slate-500 mb-3" />
        <p className="text-lg font-bold text-slate-500">No attendance records</p>
        <p className="mt-1 text-sm text-slate-500">Your attendance hasn't been recorded yet.</p>
      </Card>
    );
  }

  const summary = attendance.summary || {};
  const monthlyTrend = attendance.monthlyTrend || [];
  const recentRecords = attendance.recentRecords || [];

  return (
    <div className="space-y-6">
      <DashboardStatGrid columns="four">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Present</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.present ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Late</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.late ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Absent</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.absent ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
            Attendance Rate
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary.rate ?? 0}%</p>
        </div>
      </DashboardStatGrid>

      {monthlyTrend.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wide">
            Monthly Trend
          </h2>
          <div className="space-y-3">
            {monthlyTrend.map((m: any) => (
              <div key={m.month}>
                <div className="mb-1 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">{m.month}</span>
                  <span
                    className={
                      m.rate >= 85
                        ? "text-emerald-700"
                        : m.rate >= 70
                          ? "text-amber-700"
                          : "text-red-600"
                    }
                  >
                    {m.rate}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${m.rate >= 85 ? "bg-emerald-500" : m.rate >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${m.rate}%` }}
                  />
                </div>
                <div className="mt-1 flex gap-3 text-[10px] font-semibold text-slate-500">
                  <span>{m.present} present</span>
                  <span>{m.absent} absent</span>
                  <span>{m.late} late</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {recentRecords.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wide">
            Recent Records
          </h2>
          <div className="divide-y divide-slate-50">
            {recentRecords.map((r: any) => {
              const Icon = STATUS_ICON[r.status] || CheckCircle2;
              const colorClass = STATUS_COLOR[r.status] || "text-slate-500 bg-slate-50";
              return (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      {new Date(r.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">{r.status}</p>
                  </div>
                  {r.reason && (
                    <span className="text-[10px] italic text-slate-500 max-w-[200px] text-right truncate">
                      {r.reason}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export function StudentAttendancePage() {
  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="My Attendance"
        subtitle="Track your attendance record, monthly trends, and recent history."
      />
      <AttendanceContent />
    </div>
  );
}
