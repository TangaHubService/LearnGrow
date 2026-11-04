import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ClassAttendance } from "@/services/teacherApi";

const BAR_COLOR = "#6d3eeb";
const PERCENT_TICKS = [0, 25, 50, 75, 100];
// Past this many classes the names no longer fit side by side, so they are slanted.
const MAX_LEVEL_LABELS = 8;

function shortName(name: string) {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}

function AttendanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ClassAttendance }>;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs text-slate-600 shadow-lg ring-1 ring-slate-100">
      <p className="font-bold text-slate-900">{row.className}</p>
      {row.rate === null ? (
        <p className="mt-1">No attendance marked in this period</p>
      ) : (
        <>
          <p className="mt-1 font-bold text-slate-900">{row.rate}% attended</p>
          <p className="mt-1">
            {row.present} present, {row.late} late
          </p>
          <p>
            {row.absent} absent, {row.excused} excused
          </p>
        </>
      )}
    </div>
  );
}

export function ClassAttendanceChart({ items }: { items: ClassAttendance[] }) {
  const slantLabels = items.length > MAX_LEVEL_LABELS;
  const summary = items
    .map((row) => `${row.className}: ${row.rate === null ? "no record" : `${row.rate}%`}`)
    .join(", ");

  return (
    <div role="img" aria-label={`Attendance by class. ${summary}`} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="className"
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            interval={0}
            tickFormatter={shortName}
            tick={{ fill: "#64748b", fontSize: 12 }}
            angle={slantLabels ? -35 : 0}
            textAnchor={slantLabels ? "end" : "middle"}
            height={slantLabels ? 56 : 30}
          />
          <YAxis
            domain={[0, 100]}
            ticks={PERCENT_TICKS}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `${value}%`}
            tick={{ fill: "#64748b", fontSize: 12 }}
          />
          <Tooltip cursor={{ fill: "#f8fafc" }} content={<AttendanceTooltip />} />
          <Bar
            dataKey="rate"
            fill={BAR_COLOR}
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
