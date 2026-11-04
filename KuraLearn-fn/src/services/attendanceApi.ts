/// <reference types="vite/client" />
import { apiRequest } from "@/lib/api";

export type AttendanceSummaryBreakdown = {
  total: number;
  boys: number;
  girls: number;
};

export type AttendanceSummary = {
  totalStudents: AttendanceSummaryBreakdown;
  present: AttendanceSummaryBreakdown;
  absent: AttendanceSummaryBreakdown;
  late: AttendanceSummaryBreakdown;
  excused: AttendanceSummaryBreakdown;
  totalRecords?: number;
  attendanceRate?: number;
  attendanceRateBoys?: number;
  attendanceRateGirls?: number;
  hasAttendanceData?: boolean;
};

type AttendanceQueryParams = Record<string, string | number | undefined>;

function query(params: AttendanceQueryParams) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const attendanceApi = {
  markAttendance: (payload: {
    schoolId?: string;
    classId?: string;
    date: string;
    records: any[];
    subjectId?: string;
    academicYearId?: string;
    termId?: string;
  }) => apiRequest<any>("/attendance/mark", { method: "POST", body: JSON.stringify(payload) }),

  getAnalytics: (schoolId: string) =>
    apiRequest<{ data: any[] }>(`/attendance/analytics?schoolId=${schoolId}`),

  getAlerts: (schoolId: string) =>
    apiRequest<{ data: any[] }>(`/attendance/alerts?schoolId=${schoolId}`),

  getSmartSuggestions: (classId: string, schoolId?: string) =>
    apiRequest<{ data: any[] }>(
      `/attendance/suggestions?classId=${classId}${schoolId ? `&schoolId=${schoolId}` : ""}`,
    ),

  getStudentRisk: (studentId: string) => apiRequest<any>(`/attendance/student/${studentId}/risk`),

  calculateRiskAI: (studentId: string) =>
    apiRequest<any>(`/attendance/student/${studentId}/risk/calculate`, { method: "POST" }),

  updateSchoolAnalytics: (schoolId: string) =>
    apiRequest<any>("/attendance/analytics/update", {
      method: "POST",
      body: JSON.stringify({ schoolId }),
    }),
  getGrid: (params: {
    schoolId: string;
    classId: string;
    subjectId?: string;
    startDate: string;
    endDate: string;
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
  }) =>
    apiRequest<{ data: { students: any[]; records: any[]; totalCount?: number } }>(
      `/attendance/grid${query(params)}`,
    ),
  getSummary: (params: {
    schoolId: string;
    classId?: string;
    subjectId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    period?: string;
  }) => apiRequest<{ data: AttendanceSummary }>(`/attendance/summary${query(params)}`),
  exportData: (params: {
    schoolId: string;
    classId: string;
    subjectId?: string;
    startDate: string;
    endDate: string;
    format: string;
  }) => {
    const url = `/attendance/export/${params.format}${query({
      schoolId: params.schoolId,
      classId: params.classId,
      subjectId: params.subjectId,
      startDate: params.startDate,
      endDate: params.endDate,
    })}`;
    window.open(`${import.meta.env.VITE_API_URL || ""}${url}`, "_blank");
  },

  getStudentHistory: (studentId: string, params?: { startDate?: string; endDate?: string }) => {
    let url = `/attendance/student/${studentId}/history`;
    if (params) {
      const query = new URLSearchParams(params as any).toString();
      if (query) url += `?${query}`;
    }
    return apiRequest<{ data: { records: any[]; summary: any } }>(url);
  },

  getAcademicPeriods: (schoolId: string) =>
    apiRequest<{ data: any[] }>(`/attendance/periods?schoolId=${schoolId}`),
};
