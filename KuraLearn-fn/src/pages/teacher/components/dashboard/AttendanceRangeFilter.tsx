import { localDateKey } from "@/hooks/useTeacherDashboard";

export type AttendanceRangeKey = "today" | "7d" | "30d" | "90d" | "year" | "custom";
export type DateRange = { from: string; to: string };

const RANGE_OPTIONS: Array<{ key: AttendanceRangeKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom" },
];

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDateKey(date);
}

/** The dates a preset covers, counting today as the last day. */
export function presetRange(key: Exclude<AttendanceRangeKey, "custom">): DateRange {
  const to = localDateKey();
  switch (key) {
    case "today":
      return { from: to, to };
    case "7d":
      return { from: daysAgo(6), to };
    case "30d":
      return { from: daysAgo(29), to };
    case "90d":
      return { from: daysAgo(89), to };
    case "year":
      return { from: `${to.slice(0, 4)}-01-01`, to };
  }
}

const dateInputClass =
  "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-[#6d3eeb]";

export function AttendanceRangeFilter({
  selected,
  customRange,
  onSelect,
  onCustomRangeChange,
}: {
  selected: AttendanceRangeKey;
  customRange: DateRange;
  onSelect: (key: AttendanceRangeKey) => void;
  onCustomRangeChange: (range: DateRange) => void;
}) {
  const today = localDateKey();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Attendance period" className="flex flex-wrap gap-1">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected === option.key}
            onClick={() => onSelect(option.key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
              selected === option.key
                ? "bg-[#6d3eeb] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {selected === "custom" ? (
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <label className="flex items-center gap-1">
            From
            <input
              type="date"
              value={customRange.from}
              max={today}
              onChange={(event) =>
                onCustomRangeChange({ ...customRange, from: event.target.value })
              }
              className={dateInputClass}
            />
          </label>
          <label className="flex items-center gap-1">
            To
            <input
              type="date"
              value={customRange.to}
              max={today}
              onChange={(event) => onCustomRangeChange({ ...customRange, to: event.target.value })}
              className={dateInputClass}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
