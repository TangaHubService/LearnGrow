import React from "react";
import { Calendar, ChevronLeft, ChevronRight, Download, RotateCcw } from "lucide-react";
import { CustomDropdown } from "@/components/ModernUi";

type ViewMode = "daily" | "weekly" | "monthly" | "yearly";
type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface AttendanceFiltersProps {
  selectedClassId: string | undefined;
  classes: any[];
  selectedStatus?: AttendanceStatus;
  viewBy: ViewMode;
  getDisplayDate: () => string;
  onClassChange: (val: string | undefined) => void;
  onStatusChange: (val: AttendanceStatus | undefined) => void;
  onViewChange: (v: ViewMode) => void;
  onChangeDate: (direction: number) => void;
  onResetFilters: () => void;
  onExport: (format: "csv" | "excel" | "pdf") => void;
}

const statusOptions = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "EXCUSED", label: "Excused" },
];

export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  selectedClassId,
  classes,
  selectedStatus,
  viewBy,
  getDisplayDate,
  onClassChange,
  onStatusChange,
  onViewChange,
  onChangeDate,
  onResetFilters,
  onExport,
}) => {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm print:hidden">
      <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.1fr_0.9fr_1.2fr_1.2fr_auto] xl:items-end">
        {/* Class Filter */}
        <div>
          <label className="mb-1.5 block px-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Select Class
          </label>
          <CustomDropdown
            value={selectedClassId}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            onChange={onClassChange}
            placeholder="Select Class"
            clearable={false}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="mb-1.5 block px-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Attendance Status
          </label>
          <CustomDropdown
            value={selectedStatus}
            options={statusOptions}
            onChange={(value) => onStatusChange(value as AttendanceStatus | undefined)}
            placeholder="All statuses"
            clearable
          />
        </div>

        {/* Date / Period Scroller */}
        <div>
          <label className="mb-1.5 block px-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {viewBy === "daily"
              ? "Date Period"
              : viewBy === "weekly"
                ? "Week Period"
                : viewBy === "monthly"
                  ? "Month Period"
                  : "Year Period"}
          </label>
          <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200/80 bg-white px-2 shadow-sm transition-all focus-within:border-violet-400">
            <button
              onClick={() => onChangeDate(-1)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              title="Previous"
              type="button"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <div className="flex min-w-0 items-center gap-2 px-2">
              <Calendar size={15} className="shrink-0 text-slate-500" />
              <span className="truncate text-xs font-bold text-slate-700">{getDisplayDate()}</span>
            </div>
            <button
              onClick={() => onChangeDate(1)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              title="Next"
              type="button"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div>
          <label className="mb-1.5 block px-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Analytics View
          </label>
          <div className="grid h-11 grid-cols-4 rounded-xl border border-slate-200/70 bg-slate-50 p-1 shadow-sm">
            {["daily", "weekly", "monthly", "yearly"].map((v) => (
              <button
                key={v}
                onClick={() => onViewChange(v as ViewMode)}
                type="button"
                className={`rounded-lg px-1 text-[10px] sm:text-xs font-extrabold transition-all duration-200 ${
                  viewBy === v
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/80"
                }`}
              >
                {v === "daily"
                  ? "Daily"
                  : v === "weekly"
                    ? "Weekly"
                    : v === "monthly"
                      ? "Monthly"
                      : "Yearly"}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons Panel */}
        <div className="flex gap-2 md:col-span-2 lg:col-span-3 xl:col-span-1">
          <button
            onClick={onResetFilters}
            type="button"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 xl:flex-none"
          >
            <RotateCcw size={14} strokeWidth={2.5} /> Reset
          </button>
          <button
            onClick={() => onExport("excel")}
            type="button"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-extrabold text-white shadow-sm transition-all duration-150 hover:bg-emerald-800 hover:-translate-y-0.5 xl:flex-none"
          >
            <Download size={14} strokeWidth={2.5} /> Export
          </button>
        </div>
      </div>
    </div>
  );
};
