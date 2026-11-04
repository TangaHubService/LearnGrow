import { apiRequest } from "@/lib/api";

export const marksApi = {
  list: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {}).toString();
    const url = query ? `/marks?${query}` : "/marks";
    return apiRequest<{ success: boolean; data: any[] }>(url);
  },

  approve: (data: { classId: string; subjectId: string; termId: string; assessmentType: string }) =>
    apiRequest<{ success: boolean; data: { count: number } }>("/marks/approve", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getStudentReport: (studentId: string) =>
    apiRequest<{ success: boolean; data: any }>(`/reports/student/${studentId}`),

  getClassMarksheet: (params: { classId: string; termId: string; assessmentType?: string }) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest<{ success: boolean; data: any }>(`/reports/class?${query}`);
  },

  getGradingSettings: (schoolId: string) =>
    apiRequest<{ success: boolean; data: any[] }>(`/grading-settings?schoolId=${schoolId}`),

  saveGradingSettings: (schoolId: string, scales: any[]) =>
    apiRequest<{ success: boolean }>("/grading-settings", {
      method: "POST",
      body: JSON.stringify({ schoolId, scales }),
    }),

  importMarks: (formData: FormData) =>
    apiRequest<{ success: boolean; data: any }>("/marks/import", {
      method: "POST",
      body: formData,
    }),
};
