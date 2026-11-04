import { apiRequest } from "@/lib/api";

function query(params: Record<string, string | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const timetableApi = {
  getGrid: (params: {
    termId: string;
    classId?: string;
    teacherId?: string;
    roomId?: string;
    shift?: string;
  }) =>
    apiRequest<{ grid: Record<string, any[]>; timeSlots: string[]; days: string[] }>(
      `/timetable/grid${query(params)}`,
    ),

  listEntries: (params?: {
    classId?: string;
    teacherId?: string;
    roomId?: string;
    dayOfWeek?: string;
    termId?: string;
    page?: number;
    pageSize?: number;
  }) => apiRequest<{ items: any[]; meta: any }>(`/timetable/entries${query(params as any)}`),

  getEntry: (id: string) => apiRequest<{ entry: any }>(`/timetable/entries/${id}`),

  createEntry: (payload: any) =>
    apiRequest<{ entry: any }>("/timetable/entries", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateEntry: (id: string, payload: any) =>
    apiRequest<{ entry: any }>(`/timetable/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteEntry: (id: string) =>
    apiRequest<{ deleted: boolean }>(`/timetable/entries/${id}`, { method: "DELETE" }),

  generate: (payload: {
    academicYearId: string;
    termId: string;
    classIds?: string[];
    respectWorkload?: boolean;
  }) =>
    apiRequest<{ created: number; entries: any[] }>("/timetable/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  checkConflicts: (payload: {
    classId: string;
    teacherId?: string;
    room?: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    termId?: string;
  }) =>
    apiRequest<{
      hasConflict: boolean;
      teacherConflict: boolean;
      classConflict: boolean;
      roomConflict: boolean;
      details: string[];
    }>("/timetable/check-conflicts", { method: "POST", body: JSON.stringify(payload) }),

  listRooms: (type?: string) => apiRequest<{ items: any[] }>(`/timetable/rooms${query({ type })}`),

  createRoom: (payload: any) =>
    apiRequest<{ room: any }>("/timetable/rooms", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listPeriods: (shift?: string) =>
    apiRequest<{ items: any[] }>(`/timetable/periods${query({ shift })}`),

  getWorkloadCheck: (params: { teacherId: string; termId?: string; dayOfWeek?: string }) =>
    apiRequest<{
      withinLimits: boolean;
      currentDayCount: number;
      currentWeekCount: number;
      maxDay: number;
      maxWeek: number;
    }>(`/timetable/workload/check${query(params)}`),

  setWorkload: (payload: {
    teacherId: string;
    maxPeriodsPerDay?: number;
    maxPeriodsPerWeek?: number;
    maxConsecutivePeriods?: number;
  }) =>
    apiRequest<{ workload: any }>("/timetable/workload", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
