import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, CalendarDays, User } from "lucide-react";
import { useState } from "react";
import { timetableApi } from "@/services/timetableApi";
import { teacherApi } from "@/services/teacherApi";
import { useAppDispatch } from "@/store/appStore";
import { pushToast } from "@/store/uiSlice";
import { useCurrentTeacher } from "@/hooks/useTeacherDashboard";
import { CustomDropdown, AppDrawer, ConfirmModal } from "@/components/ModernUi";

const DAY_LABELS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

const SUBJECT_COLORS = [
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-teal-100 text-teal-800 border-teal-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
];

const DOT_COLORS = [
  "#6d3eeb",
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#e85d8f",
  "#06b6d4",
  "#f97316",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
];

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getEntryColor(subjectId: string) {
  return SUBJECT_COLORS[hashCode(subjectId) % SUBJECT_COLORS.length];
}

function getDayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function getDayOfWeekKey(date: Date): string {
  const map = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  return map[getDayOfWeek(date)];
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

function formatMonth(date: Date) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateFull(date: Date) {
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = new Date(firstDay);
  start.setDate(start.getDate() - getDayOfWeek(firstDay));

  const end = new Date(lastDay);
  const endDow = getDayOfWeek(end);
  if (endDow < 6) end.setDate(end.getDate() + (6 - endDow));

  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

type FormMode = "create" | "edit" | null;

const emptyForm = {
  classId: "",
  subjectId: "",
  teacherId: "",
  dayOfWeek: "MONDAY" as string,
  startTime: "08:00",
  endTime: "09:00",
  room: "",
  isDoublePeriod: false,
  academicYearId: "",
  termId: "",
};

export function TeacherCalendarPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [viewEntry, setViewEntry] = useState<any | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const teacher = useCurrentTeacher();
  const teacherId = teacher.data?.id;

  const { data: refData } = useQuery({
    queryKey: ["teacher-reference"],
    queryFn: teacherApi.referenceData,
  });

  const activeTerm = refData?.terms?.[0];
  const activeYear = refData?.academicYears?.[0];

  const { data: entriesData, isLoading } = useQuery({
    queryKey: ["timetable-entries-calendar", activeTerm?.id, teacherId],
    queryFn: () => timetableApi.listEntries({ termId: activeTerm?.id, teacherId, pageSize: 500 }),
    enabled: !!activeTerm?.id && !!teacherId,
  });

  const entries = entriesData?.items ?? [];

  const days = getMonthDays(currentMonth);

  const entriesByDayOfWeek: Record<string, any[]> = {};
  for (const day of DAYS_OF_WEEK) entriesByDayOfWeek[day] = [];
  for (const entry of entries) {
    if (entriesByDayOfWeek[entry.dayOfWeek]) {
      entriesByDayOfWeek[entry.dayOfWeek].push(entry);
    }
  }

  function getEntriesForDate(date: Date) {
    return entriesByDayOfWeek[getDayOfWeekKey(date)] ?? [];
  }

  function getSubjectName(subjectId: string) {
    return refData?.subjects?.find((s: any) => s.id === subjectId)?.name ?? subjectId.slice(0, 8);
  }

  function getClassName(classId: string) {
    return refData?.classes?.find((c: any) => c.id === classId)?.name ?? classId.slice(0, 8);
  }

  function getTeacherName(teacherId: string) {
    return refData?.teachers?.find((t: any) => t.id === teacherId)?.name ?? teacherId.slice(0, 8);
  }

  const selectedDayEntries = selectedDate ? getEntriesForDate(selectedDate) : [];

  const classOptions = (refData?.classes ?? []).map((c: any) => ({
    value: c.id,
    label: `${c.name} (${c.levelName ?? ""})`,
  }));

  const subjectOptions = (refData?.subjects ?? []).map((s: any) => ({
    value: s.id,
    label: s.name,
  }));

  const dayOptions = DAYS_OF_WEEK.map((d) => ({
    value: d,
    label: d.charAt(0) + d.slice(1).toLowerCase(),
  }));

  const createMutation = useMutation({
    mutationFn: (payload: any) => timetableApi.createEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable-entries-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["timetable-grid"] });
      dispatch(pushToast({ tone: "success", message: "Timetable entry created" }));
      closeForm();
    },
    onError: (e: any) =>
      dispatch(pushToast({ tone: "error", message: e?.message ?? "Failed to create entry" })),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      timetableApi.updateEntry(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable-entries-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["timetable-grid"] });
      dispatch(pushToast({ tone: "success", message: "Timetable entry updated" }));
      closeForm();
    },
    onError: (e: any) =>
      dispatch(pushToast({ tone: "error", message: e?.message ?? "Failed to update entry" })),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timetableApi.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable-entries-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["timetable-grid"] });
      dispatch(pushToast({ tone: "success", message: "Timetable entry deleted" }));
      setSelectedEntry(null);
      setViewEntry(null);
    },
    onError: (e: any) =>
      dispatch(pushToast({ tone: "error", message: e?.message ?? "Failed to delete entry" })),
  });

  function openCreateForm(date: Date) {
    const dayKey = getDayOfWeekKey(date);
    if (dayKey === "SUNDAY") {
      dispatch(pushToast({ tone: "info", message: "No classes on Sunday" }));
      return;
    }
    setForm({
      ...emptyForm,
      teacherId: teacherId ?? "",
      dayOfWeek: dayKey,
      academicYearId: activeYear?.id ?? "",
      termId: activeTerm?.id ?? "",
    });
    setFormMode("create");
    setSelectedEntry(null);
    setViewEntry(null);
  }

  function openEditForm(entry: any) {
    setForm({
      classId: entry.classId ?? "",
      subjectId: entry.subjectId ?? "",
      teacherId: entry.teacherId ?? "",
      dayOfWeek: entry.dayOfWeek ?? "MONDAY",
      startTime: entry.startTime ?? "08:00",
      endTime: entry.endTime ?? "09:00",
      room: entry.room ?? "",
      isDoublePeriod: entry.isDoublePeriod ?? false,
      academicYearId: entry.academicYearId ?? activeYear?.id ?? "",
      termId: entry.termId ?? activeTerm?.id ?? "",
    });
    setFormMode("edit");
    setSelectedEntry(entry);
  }

  function closeForm() {
    setFormMode(null);
    setSelectedEntry(null);
    setForm(emptyForm);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                <span className="flex items-center gap-2">
                  <User size={22} className="text-purple-600" />
                  {teacher.data?.name ?? "My"} Timetable
                </span>
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {entries.length} scheduled periods
                {activeTerm && ` · ${activeTerm.name ?? activeTerm.id.slice(0, 8)}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                Today
              </button>
              <button
                aria-label="Previous"
                onClick={() =>
                  setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                className="rounded-lg border border-gray-300 bg-white p-2 hover:bg-gray-50"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <button
                aria-label="Next"
                onClick={() =>
                  setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                className="rounded-lg border border-gray-300 bg-white p-2 hover:bg-gray-50"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
              <span className="min-w-[180px] text-center text-lg font-bold text-gray-900">
                {formatMonth(currentMonth)}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-gray-200">
              {DAY_LABELS_SHORT.map((label) => (
                <div
                  key={label}
                  className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-500"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayEntryCount = getEntriesForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isSunday = getDayOfWeekKey(day) === "SUNDAY";

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isSunday) return;
                      setSelectedDate(day);
                      setViewEntry(null);
                    }}
                    className={`min-h-[110px] border-b border-r border-gray-100 p-2 text-left transition focus:outline-none
                    ${!isCurrentMonth ? "bg-gray-50/50" : ""}
                    ${isSelected ? "ring-2 ring-inset ring-purple-500 bg-purple-50/50" : "hover:bg-gray-50"}
                    ${isSunday ? "bg-gray-100/50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                  >
                    <div
                      className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold
                    ${today ? "bg-purple-600 text-white" : isCurrentMonth ? "text-gray-900" : "text-gray-600"}
                  `}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayEntryCount.slice(0, 3).map((entry: any) => (
                        <div key={entry.id} className="flex items-center gap-1 leading-tight">
                          <div
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                DOT_COLORS[
                                  hashCode(entry.subjectId ?? entry.id) % DOT_COLORS.length
                                ],
                            }}
                          />
                          <span className="truncate text-[10px] font-semibold text-gray-700">
                            {getSubjectName(entry.subjectId)}
                          </span>
                        </div>
                      ))}
                      {dayEntryCount.length > 3 && (
                        <div className="text-[10px] font-medium text-gray-600 pl-2.5">
                          +{dayEntryCount.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <AppDrawer
        open={!!selectedDate}
        title={selectedDate ? formatDateFull(selectedDate) : ""}
        subtitle={selectedDate ? `${selectedDayEntries.length} periods` : ""}
        onClose={() => {
          setSelectedDate(null);
          setViewEntry(null);
        }}
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">
              {selectedDate && getDayOfWeekKey(selectedDate) !== "SUNDAY" && (
                <button
                  onClick={() => openCreateForm(selectedDate!)}
                  className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-700"
                >
                  <Plus size={14} />
                  Add Period
                </button>
              )}
            </span>
            <button
              onClick={() => {
                setSelectedDate(null);
                setViewEntry(null);
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedDate && viewEntry ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Period Details</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    openEditForm(viewEntry);
                    setViewEntry(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  <Pencil size={13} />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(viewEntry.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Subject" value={getSubjectName(viewEntry.subjectId)} />
              <DetailField label="Class" value={getClassName(viewEntry.classId)} />
              <DetailField label="Time" value={`${viewEntry.startTime} - ${viewEntry.endTime}`} />
              <DetailField label="Room" value={viewEntry.room ?? "Not assigned"} />
              <DetailField label="Double Period" value={viewEntry.isDoublePeriod ? "Yes" : "No"} />
              <DetailField label="Day" value={viewEntry.dayOfWeek} />
              <DetailField label="Shift" value={viewEntry.shift ?? "MORNING"} />
            </div>
            <button
              onClick={() => setViewEntry(null)}
              className="mt-4 text-sm font-bold text-purple-600 hover:text-purple-700"
            >
              ← Back to all periods
            </button>
          </div>
        ) : selectedDate && selectedDayEntries.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-600">
            <CalendarDays size={40} className="mb-3 text-gray-300" />
            <p className="text-sm font-medium">No periods scheduled</p>
            {selectedDate && getDayOfWeekKey(selectedDate) !== "SUNDAY" && (
              <button
                onClick={() => openCreateForm(selectedDate)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-700"
              >
                <Plus size={14} />
                Add your first period
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {selectedDayEntries.map((entry: any) => {
              const dotColor =
                DOT_COLORS[hashCode(entry.subjectId ?? entry.id) % DOT_COLORS.length];
              return (
                <button
                  key={entry.id}
                  onClick={() => setViewEntry(entry)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gray-50 transition"
                >
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-gray-900">
                        {getSubjectName(entry.subjectId)}
                      </span>
                      <span className="shrink-0 text-xs text-gray-600">{entry.startTime}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {getClassName(entry.classId)}
                      {entry.room && ` · ${entry.room}`}
                      {entry.isDoublePeriod && " · Double"}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(entry);
                    }}
                    className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-100 hover:text-gray-600"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(entry.id);
                    }}
                    className="rounded-lg p-1.5 text-red-200 hover:bg-red-50 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </AppDrawer>

      <AppDrawer
        open={!!formMode}
        title={formMode === "create" ? "Add Timetable Entry" : "Edit Timetable Entry"}
        subtitle="Schedule a class period in your timetable"
        onClose={closeForm}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={closeForm}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (formMode === "create") {
                  createMutation.mutate(form);
                } else if (selectedEntry) {
                  updateMutation.mutate({ id: selectedEntry.id, payload: form });
                }
              }}
              disabled={isSubmitting || !form.classId || !form.subjectId || !form.teacherId}
              className="inline-flex items-center gap-2 rounded-lg bg-[#6d3eeb] px-4 py-2 text-sm font-bold text-white hover:bg-[#5b31cb] disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : formMode === "create" ? "Create Entry" : "Update Entry"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <FormField label="Class">
            <CustomDropdown
              value={form.classId || undefined}
              options={classOptions}
              onChange={(val: string) => setForm({ ...form, classId: val ?? "" })}
              placeholder="Select class"
              clearable
            />
          </FormField>
          <FormField label="Subject">
            <CustomDropdown
              value={form.subjectId || undefined}
              options={subjectOptions}
              onChange={(val: string) => setForm({ ...form, subjectId: val ?? "" })}
              placeholder="Select subject"
              clearable
            />
          </FormField>
          <div className="rounded-lg bg-purple-50 px-4 py-3 text-sm text-purple-800">
            <span className="flex items-center gap-2">
              <User size={15} />
              Scheduled for: <strong>{teacher.data?.name ?? "You"}</strong>
            </span>
          </div>
          <FormField label="Day">
            <CustomDropdown
              value={form.dayOfWeek}
              options={dayOptions}
              onChange={(val: string) => setForm({ ...form, dayOfWeek: val ?? "MONDAY" })}
              placeholder="Select day"
              clearable={false}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Time">
              <input
                type="time"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-350 hover:shadow-sm transition-all focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100/50 focus:outline-none"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </FormField>
            <FormField label="End Time">
              <input
                type="time"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-350 hover:shadow-sm transition-all focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100/50 focus:outline-none"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </FormField>
          </div>
          <FormField label="Room">
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 hover:border-slate-350 hover:shadow-sm transition-all focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100/50 focus:outline-none"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder="e.g. Room 101"
            />
          </FormField>
          <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDoublePeriod}
              onChange={(e) => setForm({ ...form, isDoublePeriod: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#6d3eeb] focus:ring-purple-200"
            />
            Double period
          </label>
        </div>
      </AppDrawer>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete timetable entry?"
        message="Are you sure you want to delete this scheduled period? This action cannot be undone."
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-600">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}
