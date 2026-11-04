import { apiRequest } from "@/lib/api";

export type ListParams = {
  search?: string;
  status?: string;
  classId?: string;
  subjectName?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export type ClassAttendance = {
  classId: string;
  className: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
  /** Percentage present or late; null when nothing was marked in the period. */
  rate: number | null;
};

function query(params: ListParams = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

function looseQuery(params: Record<string, string | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const teacherApi = {
  dashboard: (params?: Partial<ListParams>) =>
    apiRequest<{ dashboard: any }>(`/teacher/dashboard${query(params)}`),
  dashboardProfile: () => apiRequest<{ teacher: any }>("/teacher/dashboard/profile"),
  dashboardStats: (date?: string) =>
    apiRequest<{ stats: any }>(`/teacher/dashboard/stats${looseQuery({ date })}`),
  dashboardSchedule: (date?: string) =>
    apiRequest<{ date: string; items: any[] }>(
      `/teacher/dashboard/schedule${looseQuery({ date })}`,
    ),
  dashboardClasses: () => apiRequest<{ items: any[] }>("/teacher/dashboard/classes"),
  dashboardClassAttendance: ({ from, to }: { from: string; to: string }) =>
    apiRequest<{ from: string; to: string; items: ClassAttendance[] }>(
      `/teacher/dashboard/class-attendance?from=${from}&to=${to}`,
    ),
  dashboardNotifications: () => apiRequest<{ items: any[] }>("/teacher/dashboard/notifications"),
  dashboardAssessments: () => apiRequest<{ items: any[] }>("/teacher/dashboard/assessments"),
  dashboardLearnersNeedingSupport: () =>
    apiRequest<{ items: any[] }>("/teacher/dashboard/learners-needing-support"),
  dashboardRecentAiOutputs: () =>
    apiRequest<{ items: any[] }>("/teacher/dashboard/recent-ai-outputs"),
  referenceData: () => apiRequest<any>("/teacher/reference-data"),
  classes: (params?: ListParams) =>
    apiRequest<{ items: any[]; meta: any }>(`/teacher/classes${query(params)}`),
  classDetails: (id: string) => apiRequest<any>(`/teacher/classes/${id}`),
  createClass: (payload: any) =>
    apiRequest<any>("/teacher/classes", { method: "POST", body: JSON.stringify(payload) }),
  updateClass: (id: string, payload: any) =>
    apiRequest<any>(`/teacher/classes/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  archiveClass: (id: string) =>
    apiRequest<any>(`/teacher/classes/${id}/archive`, { method: "POST" }),
  students: (params?: ListParams) =>
    apiRequest<{ items: any[]; meta: any }>(`/teacher/students${query(params)}`),
  createStudent: (payload: any) =>
    apiRequest<any>("/teacher/students", { method: "POST", body: JSON.stringify(payload) }),
  updateStudent: (id: string, payload: any) =>
    apiRequest<any>(`/teacher/students/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  lessons: (params?: ListParams) =>
    apiRequest<{ items: any[]; meta: any }>(`/teacher/lessons${query(params)}`),
  createLesson: (payload: any) =>
    apiRequest<any>("/teacher/lessons", { method: "POST", body: JSON.stringify(payload) }),
  updateLesson: (id: string, payload: any) =>
    apiRequest<any>(`/teacher/lessons/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  lessonPlans: (params?: ListParams) =>
    apiRequest<{ items: any[]; meta: any }>(`/teacher/lesson-plans${query(params)}`),
  createLessonPlan: (payload: any) =>
    apiRequest<any>("/teacher/lesson-plans", { method: "POST", body: JSON.stringify(payload) }),
  updateLessonPlan: (id: string, payload: any) =>
    apiRequest<any>(`/teacher/lesson-plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  publishLessonPlan: (id: string) =>
    apiRequest<any>(`/teacher/lesson-plans/${id}/publish`, { method: "POST" }),
  duplicateLessonPlan: (id: string) =>
    apiRequest<any>(`/teacher/lesson-plans/${id}/duplicate`, { method: "POST" }),
  archiveLessonPlan: (id: string) =>
    apiRequest<any>(`/teacher/lesson-plans/${id}/archive`, { method: "POST" }),
  publishLesson: (id: string) =>
    apiRequest<any>(`/teacher/lessons/${id}/publish`, { method: "POST" }),
  duplicateLesson: (id: string) =>
    apiRequest<any>(`/teacher/lessons/${id}/duplicate`, { method: "POST" }),
  archiveLesson: (id: string) =>
    apiRequest<any>(`/teacher/lessons/${id}/archive`, { method: "POST" }),
  startDelivery: (payload: any) =>
    apiRequest<any>("/teacher/delivery-sessions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDelivery: (id: string, payload: any) =>
    apiRequest<any>(`/teacher/delivery-sessions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  endDelivery: (id: string, summary?: string) =>
    apiRequest<any>(`/teacher/delivery-sessions/${id}/end`, {
      method: "POST",
      body: JSON.stringify({ summary }),
    }),
  reports: (params?: Partial<ListParams>) =>
    apiRequest<{ reports: any }>(`/teacher/reports${query(params)}`),
  messages: () => apiRequest<{ messages: any[] }>("/teacher/messages"),
  sendMessage: (payload: any) =>
    apiRequest<any>("/teacher/messages", { method: "POST", body: JSON.stringify(payload) }),
  resources: (params?: ListParams) =>
    apiRequest<{ items: any[]; meta: any }>(`/teacher/resources${query(params)}`),
  createResource: (payload: any) =>
    apiRequest<any>("/teacher/resources", { method: "POST", body: JSON.stringify(payload) }),
  updateResource: (id: string, payload: any) =>
    apiRequest<any>(`/teacher/resources/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  archiveResource: (id: string) =>
    apiRequest<any>(`/teacher/resources/${id}/archive`, { method: "POST" }),
  notifications: () => apiRequest<{ notifications: any[] }>("/teacher/notifications"),
  auditLogs: () => apiRequest<{ auditLogs: any[] }>("/teacher/audit-logs"),
  ai: (path: string, payload: any) =>
    apiRequest<any>(`/ai/${path}`, { method: "POST", body: JSON.stringify(payload) }),
  aiComprehensive: (payload: any) =>
    apiRequest<any>("/ai/comprehensive", { method: "POST", body: JSON.stringify(payload) }),
  convertPlanToContent: (lessonPlanId: string) =>
    apiRequest<any>("/ai/convert-plan-to-content", {
      method: "POST",
      body: JSON.stringify({ lessonPlanId }),
    }),
  aiTasks: () => apiRequest<any>("/ai/task-types"),
  aiConversations: () => apiRequest<{ conversations: any[] }>("/ai/conversations"),
  aiConversation: (id: string) =>
    apiRequest<{ conversation: any; messages: any[] }>(`/ai/conversations/${id}`),
  saveAiOutput: (payload: any) =>
    apiRequest<any>("/teacher/ai-outputs", { method: "POST", body: JSON.stringify(payload) }),
  getAiOutputs: (params?: { taskType?: string; subjectId?: string; classId?: string }) =>
    apiRequest<{ items: any[] }>(`/teacher/ai-outputs${looseQuery(params)}`),
  submitAttendance: (payload: { classId: string; date: string; records: any[] }) =>
    apiRequest<any>("/teacher/attendance", { method: "POST", body: JSON.stringify(payload) }),
  saveMarks: (payload: {
    classId: string;
    subjectId: string;
    academicYearId: string;
    termId: string;
    assessmentType: string;
    maxScore: number;
    records: Array<{ studentId: string; score: number; teacherComments?: string }>;
  }) => apiRequest<any>("/marks", { method: "POST", body: JSON.stringify(payload) }),
  getMarks: (params?: {
    classId?: string;
    subjectId?: string;
    termId?: string;
    studentId?: string;
    assessmentType?: string;
    status?: string;
  }) => apiRequest<{ items: any[] }>(`/marks${looseQuery(params)}`),
  updateMark: (
    id: string,
    payload: {
      score?: number;
      teacherComments?: string;
      headteacherComments?: string;
      status?: string;
      isLocked?: boolean;
      reason?: string;
    },
  ) => apiRequest<any>(`/marks/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  approveMarks: (payload: {
    classId: string;
    subjectId: string;
    termId: string;
    assessmentType: string;
  }) => apiRequest<any>("/marks/approve", { method: "POST", body: JSON.stringify(payload) }),
  getStudentReport: (studentId: string, params: { termId: string }) =>
    apiRequest<any>(`/reports/student/${studentId}${looseQuery(params)}`),
  getClassMarksheet: (params: { classId: string; termId: string }) =>
    apiRequest<any>(`/reports/class${looseQuery(params)}`),
  getAiMarksInsights: (payload: { studentId: string; termId: string }) =>
    apiRequest<any>("/ai/marks-insights", { method: "POST", body: JSON.stringify(payload) }),
  getAiReportCardComment: (payload: { studentId: string; termId: string }) =>
    apiRequest<any>("/ai/student-report-comment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getGradingSettings: () => apiRequest<{ scales: any[] }>("/grading-settings"),
  saveGradingSettings: (payload: { scales: any[] }) =>
    apiRequest<any>("/grading-settings", { method: "POST", body: JSON.stringify(payload) }),
  importMarks: (payload: {
    classId: string;
    subjectId: string;
    academicYearId: string;
    termId: string;
    assessmentType: string;
    maxScore: number;
    records: Array<{ studentCode: string; score: number }>;
  }) => apiRequest<any>("/marks/import", { method: "POST", body: JSON.stringify(payload) }),
  createQuiz: (payload: any) =>
    apiRequest<any>(`/course/courses/${payload.courseId || payload.classId}/quizzes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateQuiz: (id: string, payload: any) =>
    apiRequest<any>(`/course/quizzes/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
};
