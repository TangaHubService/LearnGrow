import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AttendanceSegment, EnrollmentPoint } from "@/services/schoolAdminService";

type TooltipValue = string | number | Array<string | number>;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: TooltipValue }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-lg">
      <p className="text-[#0b1f4d]">{label}</p>
      <p className="mt-1 text-blue-600">Students: {payload[0]?.value}</p>
    </div>
  );
}

export function EnrollmentTrend({ data }: { data: EnrollmentPoint[] }) {
  return (
    <div className="h-[245px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="enrollmentFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3f6df6" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#3f6df6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e7edf6" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="month"
            tickLine={false}
            tick={{ fill: "#365075", fontSize: 12, fontWeight: 700 }}
          />
          <YAxis
            axisLine={false}
            allowDecimals={false}
            domain={[0, "auto"]}
            tickLine={false}
            tick={{ fill: "#365075", fontSize: 12, fontWeight: 700 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#9bb7ff", strokeWidth: 1 }} />
          <Area
            dataKey="students"
            fill="url(#enrollmentFill)"
            stroke="#3f6df6"
            strokeWidth={3}
            type="monotone"
            activeDot={{ r: 6, fill: "#3f6df6", stroke: "#fff", strokeWidth: 3 }}
            dot={{ r: 4, fill: "#3f6df6", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttendanceDonut({
  rate,
  segments,
}: {
  rate: number;
  segments: AttendanceSegment[];
}) {
  return (
    <div className="grid gap-5 md:grid-cols-[210px_1fr] md:items-center">
      <div className="relative h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="percent"
              innerRadius={64}
              outerRadius={92}
              paddingAngle={1}
              startAngle={94}
              endAngle={-266}
              stroke="none"
            >
              {segments.map((segment) => (
                <Cell key={segment.label} fill={segment.color} aria-label={segment.label} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-[#0b1f4d]">{rate}%</p>
            <p className="mt-1 text-sm font-bold text-slate-600">Present</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-start gap-3 text-sm">
            <span
              className="mt-1.5 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <div>
              <p className="font-bold text-slate-700">{segment.label}</p>
              <p className="font-bold text-slate-500">
                {segment.value.toLocaleString()} ({segment.percent}%)
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressDonut({ percent }: { percent: number }) {
  const data = [
    { name: "Collected", value: percent, color: "#496cf6" },
    { name: "Pending", value: 100 - percent, color: "#e9eefb" },
  ];

  return (
    <div className="relative h-40 w-40 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={52}
            outerRadius={72}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} aria-label={item.name} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-3xl font-bold text-[#0b1f4d]">{percent}%</p>
          <p className="text-xs font-bold text-slate-500">Collected</p>
        </div>
      </div>
    </div>
  );
}
