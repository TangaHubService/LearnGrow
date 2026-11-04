import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { User } from "lucide-react";
import { timetableApi } from "@/services/timetableApi";
import { teacherApi } from "@/services/teacherApi";
import { useCurrentTeacher } from "@/hooks/useTeacherDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { CustomDropdown } from "@/components/ModernUi";
import { TimetableGrid, type TimetableEntry } from "@/components/timetable/TimetableGrid";

const ADMIN_ROLES = new Set(["HEAD_TEACHER", "ADMIN", "SUPER_ADMIN", "DIRECTOR_OF_STUDIES"]);

export function TeacherTimetablePage() {
  const { user: authUser } = useAuth();
  const teacher = useCurrentTeacher();
  const isAdmin = ADMIN_ROLES.has(authUser?.role ?? "");

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const { data: refData } = useQuery({
    queryKey: ["teacher-reference"],
    queryFn: teacherApi.referenceData,
  });

  const activeTerm = refData?.terms?.[0];

  const effectiveTeacherId = isAdmin ? selectedTeacherId : (teacher.data?.id ?? "");

  const { data: gridData, isLoading } = useQuery({
    queryKey: ["timetable-grid", selectedClassId, effectiveTeacherId, activeTerm?.id, isAdmin],
    queryFn: () =>
      timetableApi.getGrid({
        termId: activeTerm.id,
        classId: selectedClassId || undefined,
        teacherId: effectiveTeacherId || undefined,
      }),
    enabled: !!activeTerm?.id,
  });

  const { data: entries } = useQuery({
    queryKey: ["timetable-entries", selectedClassId, effectiveTeacherId, activeTerm?.id, isAdmin],
    queryFn: () =>
      timetableApi.listEntries({
        termId: activeTerm.id,
        classId: selectedClassId || undefined,
        teacherId: effectiveTeacherId || undefined,
        pageSize: 200,
      }),
    enabled: !!activeTerm?.id,
  });

  const rawGrid = gridData?.grid ?? {};
  const timeSlots = gridData?.timeSlots ?? [];
  const days = gridData?.days ?? ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

  const grid: Record<string, TimetableEntry[]> = {};
  for (const day of days) {
    grid[day] = (rawGrid[day] ?? []).map((e: any) => ({
      id: e.id,
      startTime: e.startTime,
      endTime: e.endTime,
      className: e.class?.name ?? null,
      subjectName: e.subject?.name ?? e.subjectId ?? null,
      teacherName: e.teacher?.user?.name ?? null,
      roomName: e.room ?? null,
    }));
  }

  const classOptions = (refData?.classes ?? []).map((c: any) => ({
    value: c.id,
    label: `${c.name} (${c.levelName ?? ""})`,
  }));

  const teacherOptions = (refData?.teachers ?? []).map((t: any) => ({
    value: t.id,
    label: t.name,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <User size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isAdmin ? "All Timetables" : `${teacher.data?.name ?? "My"} Timetable`}
              </h1>
              <p className="text-sm font-bold text-slate-500">
                {entries?.items?.length ?? 0} scheduled periods
                {activeTerm && ` · ${activeTerm.name ?? ""}`}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-56">
              <CustomDropdown
                value={selectedClassId || undefined}
                options={classOptions}
                onChange={(val: string) => {
                  setSelectedClassId(val ?? "");
                  if (!isAdmin) setSelectedTeacherId("");
                }}
                placeholder="All Classes"
                clearable
              />
            </div>
            {isAdmin && (
              <div className="w-56">
                <CustomDropdown
                  value={selectedTeacherId || undefined}
                  options={teacherOptions}
                  onChange={(val: string) => {
                    setSelectedTeacherId(val ?? "");
                    setSelectedClassId("");
                  }}
                  placeholder="All Teachers"
                  clearable
                />
              </div>
            )}
          </div>
        </div>

        <TimetableGrid
          days={days}
          timeSlots={timeSlots}
          grid={grid}
          isLoading={isLoading}
          emptyMessage="No timetable entries found for the selected filters."
          stats={[
            { label: "Total Periods", value: entries?.items?.length ?? 0 },
            { label: "Active Days", value: days.length },
            { label: "Time Slots", value: timeSlots.length },
          ]}
        />
      </div>
    </div>
  );
}
