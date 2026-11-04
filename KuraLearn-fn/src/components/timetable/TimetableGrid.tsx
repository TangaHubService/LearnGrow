import { Clock, MapPin, User } from "lucide-react";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export type TimetableEntry = {
  id: string;
  startTime?: string;
  endTime?: string;
  subjectName?: string | null;
  teacherName?: string | null;
  roomName?: string | null;
  className?: string | null;
};

export type TimetableGridProps = {
  days?: string[];
  timeSlots?: string[];
  grid?: Record<string, TimetableEntry[]>;
  header?: { title?: string; subtitle?: string };
  stats?: { label: string; value: number }[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-slate-50" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Clock size={48} className="mb-3 text-slate-500" />
      <p className="text-lg font-bold text-slate-600">No timetable periods</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function TimetableGrid({
  days: propDays,
  timeSlots = [],
  grid = {},
  header,
  stats,
  isLoading,
  emptyMessage = "Your timetable hasn't been configured yet.",
  className = "",
}: TimetableGridProps) {
  const days =
    (propDays ?? Object.keys(grid).length > 0)
      ? Object.keys(grid)
      : ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

  if (isLoading) return <LoadingSkeleton />;

  const hasData = days.some((d) => (grid[d]?.length ?? 0) > 0);

  if (!hasData) return <EmptyState message={emptyMessage} />;

  const allEntries = days.flatMap((d) => grid[d] ?? []);
  const totalEntries = allEntries.length;

  return (
    <div className={className}>
      {header && (
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {header.title && <h2 className="text-lg font-bold text-slate-900">{header.title}</h2>}
            {header.subtitle && (
              <p className="text-sm font-bold text-slate-500">{header.subtitle}</p>
            )}
          </div>
          <div className="text-xs font-bold text-slate-500">{totalEntries} scheduled periods</div>
        </div>
      )}

      {timeSlots.length > 0 ? (
        <div
          tabIndex={0}
          className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  Time
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500"
                  >
                    {DAY_LABELS[day] ?? day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot) => {
                const [start, end] = timeSlot.split("-");
                return (
                  <tr key={timeSlot} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 text-sm font-bold text-slate-700">
                      {start} - {end}
                    </td>
                    {days.map((day) => {
                      const cellEntries =
                        grid[day]?.filter((e) => e.startTime === start && e.endTime === end) ?? [];
                      return (
                        <td key={`${day}-${timeSlot}`} className="px-2 py-2 text-center">
                          {cellEntries.length > 0 ? (
                            <div className="space-y-1">
                              {cellEntries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="rounded-lg bg-emerald-50 p-2 text-xs"
                                >
                                  {entry.className && (
                                    <div className="font-bold text-emerald-900">
                                      {entry.className}
                                    </div>
                                  )}
                                  <div className="font-bold text-emerald-700">
                                    {entry.subjectName ?? "—"}
                                  </div>
                                  {entry.teacherName && (
                                    <div className="mt-0.5 flex items-center justify-center gap-1 text-emerald-700">
                                      <User size={10} />
                                      <span className="truncate">{entry.teacherName}</span>
                                    </div>
                                  )}
                                  {entry.roomName && (
                                    <div className="flex items-center justify-center gap-1 text-emerald-700">
                                      <MapPin size={10} />
                                      <span>{entry.roomName}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {days.map((day) => {
            const entries = grid[day] ?? [];
            return (
              <div key={day} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <h3 className="text-sm font-bold text-slate-700">{DAY_LABELS[day] ?? day}</h3>
                  <p className="text-[10px] font-bold text-slate-500">
                    {entries.length} period{entries.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="divide-y divide-slate-50 px-4 py-2">
                  {entries.length > 0 ? (
                    entries.map((entry) => (
                      <div key={entry.id} className="py-3">
                        <p className="text-sm font-bold text-slate-900">
                          {entry.subjectName ?? "—"}
                        </p>
                        {entry.teacherName && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
                            <User size={12} />
                            {entry.teacherName}
                          </p>
                        )}
                        {entry.roomName && (
                          <p className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={12} />
                            {entry.roomName}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-xs text-slate-500">No periods</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {stats && stats.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="text-2xl font-bold text-emerald-700">{stat.value}</div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
