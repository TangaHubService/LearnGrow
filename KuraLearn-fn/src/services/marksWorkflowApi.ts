import { apiRequest } from "@/lib/api";

export type MarkSubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CORRECTION_REQUESTED"
  | "REJECTED"
  | "APPROVED";

export type MarksContext = {
  schoolId: string;
  academicYears: any[];
  terms: any[];
  classes: any[];
  subjects: any[];
  students: any[];
  assessmentTypes: string[];
  recentSubmissions: any[];
};

export type MarkSubmission = {
  id: string;
  classId: string;
  subjectId: string;
  termId: string;
  academicYearId: string;
  assessmentType: string;
  assessmentKey: string;
  maxScore: number;
  status: MarkSubmissionStatus;
  isLocked: boolean;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  class?: any;
  subject?: any;
  term?: any;
  academicYear?: any;
  teacher?: any;
  reviewedBy?: any;
  completion?: {
    totalStudents: number;
    recordedMarks: number;
    missingMarks: number;
    percentage: number;
  };
};

export type MarkSubmissionDetail = {
  submission: MarkSubmission & { events?: any[]; school?: any };
  records: any[];
  completion: {
    totalStudents: number;
    recordedMarks: number;
    missingMarks: number;
    percentage: number;
  };
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function query(params: Record<string, any> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const marksWorkflowApi = {
  context: (params?: {
    schoolId?: string;
    classId?: string;
    subjectId?: string;
    termId?: string;
  }) => apiRequest<MarksContext>(`/marks/context${query(params)}`),

  submissions: (params?: Record<string, any>) =>
    apiRequest<PaginatedResponse<MarkSubmission>>(`/marks/submissions${query(params)}`),

  submission: (id: string) => apiRequest<MarkSubmissionDetail>(`/marks/submissions/${id}`),

  saveDraft: (payload: {
    classId: string;
    subjectId: string;
    academicYearId: string;
    termId: string;
    assessmentType: string;
    assessmentKey?: string;
    maxScore: number;
    records: Array<{
      studentId: string;
      score?: number | null;
      missingReason?: string | null;
      teacherComments?: string | null;
    }>;
  }) =>
    apiRequest<MarkSubmissionDetail>("/marks/submissions/draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  submit: (id: string) =>
    apiRequest<MarkSubmissionDetail>(`/marks/submissions/${id}/submit`, { method: "POST" }),

  approve: (id: string, comment?: string) =>
    apiRequest<MarkSubmissionDetail>(`/marks/submissions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  reject: (id: string, comment?: string) =>
    apiRequest<MarkSubmissionDetail>(`/marks/submissions/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  requestCorrection: (id: string, comment?: string) =>
    apiRequest<MarkSubmissionDetail>(`/marks/submissions/${id}/request-correction`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  unlock: (id: string, comment?: string) =>
    apiRequest<MarkSubmissionDetail>(`/marks/submissions/${id}/unlock`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  analytics: (params?: {
    schoolId?: string;
    classId?: string;
    termId?: string;
    subjectId?: string;
  }) => apiRequest<any>(`/marks/analytics${query(params)}`),

  reportCards: (params?: Record<string, any>) =>
    apiRequest<PaginatedResponse<any>>(`/reports/cards${query(params)}`),

  generateReportCards: (payload: { classId: string; termId: string }) =>
    apiRequest<{ success: boolean; count: number; items: any[] }>("/reports/cards/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  reportCard: (id: string) => apiRequest<any>(`/reports/cards/${id}`),

  approveReportCard: (
    id: string,
    payload?: { headteacherComments?: string; promotionRecommendation?: string },
  ) =>
    apiRequest<any>(`/reports/cards/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),

  exportReportCardPdf: (id: string) =>
    apiRequest<{ success: boolean; pdfUrl: string; report: any }>(
      `/reports/cards/${id}/export-pdf`,
      { method: "POST" },
    ),

  classMarksheet: (params: { classId: string; termId: string }) =>
    apiRequest<any>(`/reports/class${query(params)}`),

  exportClassPdf: (payload: { classId: string; termId: string }) =>
    apiRequest<{ success: boolean; pdfUrl: string; count?: number }>("/reports/class/export-pdf", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  exportMarksheetPdf: (payload: { classId: string; termId: string }) =>
    apiRequest<{ success: boolean; pdfUrl: string }>("/reports/marksheet/export-pdf", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  exportTranscriptPdf: (payload: { studentId: string }) =>
    apiRequest<{ success: boolean; pdfUrl: string }>("/reports/transcript/export-pdf", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  aiInsights: (payload: { studentId: string; termId: string }) =>
    apiRequest<any>("/ai/marks-insights", { method: "POST", body: JSON.stringify(payload) }),
};
