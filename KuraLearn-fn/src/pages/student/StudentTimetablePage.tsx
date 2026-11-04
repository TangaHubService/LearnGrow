import { RefreshCw, MapPin } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { TimetableGrid, type TimetableEntry } from "@/components/timetable/TimetableGrid";
import { useStudentTimetable } from "@/hooks/useStudentPortal";

export function StudentTimetablePage() {
  const { data, isLoading, error, refetch } = useStudentTimetable();

  if (isLoading) {
    return (
      <div>
        <PageHeader
          brand="KuraLearn"
          title="My Timetable"
          subtitle="Your weekly class schedule at a glance."
        />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          brand="KuraLearn"
          title="My Timetable"
          subtitle="Your weekly class schedule at a glance."
        />
        <div className="flex flex-col items-center justify-center py-16">
          <RefreshCw size={48} className="mb-4 text-red-400" />
          <p className="text-lg font-bold text-slate-600">Failed to load timetable</p>
          <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const timetable = data?.timetable;
  if (!timetable) {
    return (
      <div>
        <PageHeader
          brand="KuraLearn"
          title="My Timetable"
          subtitle="Your weekly class schedule at a glance."
        />
        <Card className="py-12 text-center">
          <p className="text-lg font-bold text-slate-500">Timetable not available</p>
          <p className="mt-1 text-sm text-slate-500">You need to be assigned to a class first.</p>
        </Card>
      </div>
    );
  }

  const dayGrid = timetable.grid || [];
  const days = dayGrid.map((d: any) => d.day);
  const allPeriods = dayGrid.flatMap((d: any) => d.periods);

  const timeSlots = [
    ...new Set<string>(allPeriods.map((p: any) => `${p.startTime}-${p.endTime}`)),
  ].sort();

  const grid: Record<string, TimetableEntry[]> = {};
  for (const day of dayGrid) {
    grid[day.day] = day.periods.map((p: any) => ({
      id: p.id,
      startTime: p.startTime,
      endTime: p.endTime,
      subjectName: p.subjectName,
      teacherName: p.teacherName,
      roomName: p.roomName,
    }));
  }

  return (
    <div>
      <PageHeader
        brand="KuraLearn"
        title="My Timetable"
        subtitle="Your weekly class schedule at a glance."
      />

      <div className="mb-6 rounded-2xl bg-indigo-600 p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-indigo-100">{timetable.schoolName}</p>
            <p className="text-lg font-bold">
              {timetable.levelName} — {timetable.className}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
            <MapPin size={14} />
            {allPeriods.length} periods
          </div>
        </div>
      </div>

      <TimetableGrid
        days={days}
        timeSlots={timeSlots}
        grid={grid}
        emptyMessage="Your timetable hasn't been configured yet."
      />
    </div>
  );
}
