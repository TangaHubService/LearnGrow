import React from "react";
import { CheckCircle, Clock, FileText, Search, XCircle } from "lucide-react";
import { DetailCard } from "@/components/ModernUi";
import { Pagination } from "@/components/common/Pagination";

type ViewMode = "daily" | "weekly" | "monthly" | "yearly";
type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface AttendanceGridProps {
  viewBy: ViewMode;
  loading: boolean;
  saving: boolean;
  markingAll: boolean;
  students: any[];
  records: any[];
  weekDays: Date[];
  currentWeekStart: Date;
  currentPage: number;
  itemsPerPage: number;
  totalRecords: number;
  totalPages: number;
  dateRange: { start: Date; end: Date };
  onToggleAttendance: (studentId: string, date: Date) => void;
  onMarkDirect: (studentId: string, date: Date, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
  onSelectStudent: (student: any) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (limit: number) => void;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; activeBg: string; activeText: string }
> = {
  PRESENT: {
    label: "Present",
    activeBg: "bg-emerald-50 border border-emerald-200/50",
    activeText: "text-emerald-700",
  },
  ABSENT: {
    label: "Absent",
    activeBg: "bg-rose-50 border border-rose-200/50",
    activeText: "text-rose-700",
  },
  LATE: {
    label: "Late",
    activeBg: "bg-amber-50 border border-amber-200/50",
    activeText: "text-amber-700",
  },
  EXCUSED: {
    label: "Excused",
    activeBg: "bg-violet-50 border border-violet-200/50",
    activeText: "text-violet-700",
  },
};

export const AttendanceGrid: React.FC<AttendanceGridProps> = ({
  viewBy,
  loading,
  saving,
  markingAll,
  students,
  records,
  weekDays,
  currentWeekStart,
  currentPage,
  itemsPerPage,
  totalRecords,
  totalPages,
  dateRange,
  onToggleAttendance,
  onMarkDirect,
  onMarkAllPresent,
  onSelectStudent,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const toLocalYYYYMMDD = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getStatus = (studentId: string, date: Date): AttendanceStatus | undefined => {
    const targetStr = toLocalYYYYMMDD(date);
    return records.find((r) => {
      if (r.studentId !== studentId) return false;
      const rDate = new Date(r.date);
      return toLocalYYYYMMDD(rDate) === targetStr;
    })?.status as AttendanceStatus | undefined;
  };

  const columnCount = (viewBy === "daily" ? 2 : viewBy === "weekly" ? weekDays.length + 3 : 6) + 2;

  return (
    <DetailCard className="overflow-hidden rounded-xl border border-slate-200 bg-white !p-0 shadow-sm">
      <div tabIndex={0} className="overflow-x-auto">
        {viewBy === "daily" && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 print:hidden">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Daily Attendance Log
            </div>
            <button
              onClick={onMarkAllPresent}
              disabled={markingAll || loading || students.length === 0}
              className="h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 px-4 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            >
              {markingAll ? "Marking..." : "Mark All Present"}
            </button>
          </div>
        )}
        <table className="w-full text-left text-sm border-collapse min-w-[850px]">
          <thead className="border-b border-slate-200 bg-slate-50/80">
            <tr>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 w-12 text-center">
                #
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 w-28">
                Code
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Student Name
              </th>
              {viewBy === "weekly" &&
                weekDays.map((date, i) => (
                  <th key={i} className="px-4 py-3 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">
                      {date.toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-none">
                      {date.getDate()}
                    </div>
                  </th>
                ))}
              {viewBy === "daily" && (
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 w-44">
                  Status
                </th>
              )}
              {(viewBy === "monthly" || viewBy === "yearly") && (
                <>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 w-20">
                    Present
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 w-20">
                    Absent
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 w-20">
                    Late
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 w-20">
                    Excused
                  </th>
                </>
              )}
              {viewBy === "weekly" && (
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 w-24">
                  Present
                </th>
              )}
              {viewBy !== "daily" && (
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 w-20">
                  Rate
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4" colSpan={columnCount}>
                    <div className="h-6 bg-slate-100 rounded-lg w-full mx-auto" />
                  </td>
                </tr>
              ))
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-16 text-center">
                  <div className="max-w-xs mx-auto">
                    <div className="p-4 rounded-full bg-slate-50 inline-block mb-3 border border-slate-100">
                      <Search size={24} className="text-slate-500" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      No students found
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Try adjusting your filters or search query.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student, i) => {
                const rowRecords = records.filter((r) => r.studentId === student.id);
                const presentCount = rowRecords.filter((r) => r.status === "PRESENT").length;
                const absentCount = rowRecords.filter((r) => r.status === "ABSENT").length;
                const lateCount = rowRecords.filter((r) => r.status === "LATE").length;
                const excusedCount = rowRecords.filter((r) => r.status === "EXCUSED").length;

                const totalDaysCount =
                  viewBy === "yearly"
                    ? 365
                    : viewBy === "monthly"
                      ? dateRange.end.getDate()
                      : viewBy === "weekly"
                        ? weekDays.length
                        : 1;
                const percent =
                  totalDaysCount > 0
                    ? Math.round(((presentCount + lateCount) / totalDaysCount) * 100)
                    : 0;
                const globalIndex = (currentPage - 1) * itemsPerPage + i + 1;
                const isFemale = student.gender === "FEMALE";

                const dailyStatus = getStatus(student.id, currentWeekStart);
                const rowBg =
                  viewBy === "daily"
                    ? dailyStatus === "PRESENT"
                      ? "bg-emerald-50/15 hover:bg-emerald-50/30"
                      : dailyStatus === "ABSENT"
                        ? "bg-rose-50/25 hover:bg-rose-50/45"
                        : dailyStatus === "LATE"
                          ? "bg-amber-50/15 hover:bg-amber-50/30"
                          : dailyStatus === "EXCUSED"
                            ? "bg-blue-50/15 hover:bg-blue-50/30"
                            : "hover:bg-slate-50/40"
                    : "hover:bg-slate-50/40";

                return (
                  <tr key={student.id} className={`transition-colors group ${rowBg}`}>
                    <td className="px-4 py-3.5 text-center text-xs font-bold text-slate-500">
                      {globalIndex}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-xs text-slate-500">
                      {student.studentCode}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {student.user?.avatar || student.avatar ? (
                          <img
                            src={student.user?.avatar || student.avatar}
                            alt={student.user?.name}
                            className="h-8 w-8 rounded-xl object-cover border border-slate-100"
                          />
                        ) : (
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-xl text-[10px] font-bold shrink-0 ${
                              isFemale
                                ? "bg-rose-50 text-rose-700 border border-rose-100/50"
                                : "bg-sky-50 text-sky-700 border border-sky-100/50"
                            }`}
                          >
                            {student.user.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        )}
                        <button
                          onClick={() => onSelectStudent(student)}
                          className="text-sm font-semibold text-slate-700 hover:text-[#6d3eeb] hover:underline text-left block leading-tight"
                        >
                          {student.user.name}
                        </button>
                      </div>
                    </td>

                    {viewBy === "weekly" &&
                      weekDays.map((date, j) => {
                        const status = getStatus(student.id, date);
                        return (
                          <td key={j} className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => onToggleAttendance(student.id, date)}
                              disabled={saving}
                              className={`h-8 w-8 mx-auto rounded-lg flex items-center justify-center border transition-all ${
                                status === "PRESENT"
                                  ? "bg-emerald-700 text-white border border-emerald-500 shadow-sm scale-105"
                                  : status === "ABSENT"
                                    ? "bg-rose-500 text-white border border-rose-500 shadow-sm scale-105"
                                    : status === "LATE"
                                      ? "bg-amber-500 text-white border border-amber-500 shadow-sm scale-105"
                                      : status === "EXCUSED"
                                        ? "bg-blue-500 text-white border border-blue-500 shadow-sm scale-105"
                                        : "bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-600 hover:border-slate-200"
                              }`}
                            >
                              {status === "PRESENT" && <CheckCircle size={14} />}
                              {status === "ABSENT" && <XCircle size={14} />}
                              {status === "LATE" && <Clock size={14} />}
                              {status === "EXCUSED" && <FileText size={14} />}
                              {!status && <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
                            </button>
                          </td>
                        );
                      })}

                    {viewBy === "daily" &&
                      (() => {
                        const status = getStatus(student.id, currentWeekStart);
                        return (
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map(
                                (s) => {
                                  const config = STATUS_CONFIG[s];
                                  const active = status === s;
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => onMarkDirect(student.id, currentWeekStart, s)}
                                      disabled={saving}
                                      title={config.label}
                                      className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all ${
                                        active
                                          ? s === "PRESENT"
                                            ? "bg-emerald-700 text-white border-emerald-500 shadow-sm scale-105"
                                            : s === "ABSENT"
                                              ? "bg-rose-500 text-white border-rose-500 shadow-sm scale-105"
                                              : s === "LATE"
                                                ? "bg-amber-500 text-white border-amber-500 shadow-sm scale-105"
                                                : "bg-blue-500 text-white border-blue-500 shadow-sm scale-105"
                                          : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-600 hover:border-slate-200"
                                      }`}
                                    >
                                      {s === "PRESENT" && <CheckCircle size={14} />}
                                      {s === "ABSENT" && <XCircle size={14} />}
                                      {s === "LATE" && <Clock size={14} />}
                                      {s === "EXCUSED" && <FileText size={14} />}
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          </td>
                        );
                      })()}

                    {(viewBy === "monthly" || viewBy === "yearly") && (
                      <>
                        <td className="px-4 py-3.5 text-center font-bold text-sm text-emerald-700">
                          {presentCount}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-sm text-rose-700">
                          {absentCount}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-sm text-amber-700">
                          {lateCount}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-sm text-blue-600">
                          {excusedCount}
                        </td>
                      </>
                    )}

                    {viewBy === "weekly" && (
                      <td className="px-4 py-3.5 text-center font-bold text-sm text-slate-600">
                        {presentCount}/{weekDays.length}
                      </td>
                    )}

                    {viewBy !== "daily" && (
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-xs inline-block w-12 border ${
                            percent >= 90
                              ? "bg-emerald-50/50 text-emerald-700 border-emerald-100"
                              : percent >= 75
                                ? "bg-amber-50/50 text-amber-700 border-amber-100"
                                : "bg-rose-50/50 text-rose-700 border-rose-100"
                          }`}
                        >
                          {percent}%
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Unified pagination wrapper */}
      <div className="px-4 border-t border-slate-100 mt-4 w-full">
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={totalRecords}
          limit={itemsPerPage}
          onChange={onPageChange}
          onLimitChange={onItemsPerPageChange}
          itemLabel="students"
          isLoading={loading}
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      </div>
    </DetailCard>
  );
};
