import { apiRequest } from "@/lib/api";

function query(params: Record<string, string | number | boolean | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export type HeadteacherDashboard = {
  school: {
    id: string;
    name: string;
    type: string;
    district: string;
    academicYear: string;
    currentTerm: string;
    todayLabel: string;
  };
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalSubjects: number;
    attendanceRate: number;
    absentToday: number;
    pendingMarksApproval: number;
    incompleteSubmissions: number;
    reportGenerated: number;
    resourcesUploaded: number;
    parentEngagement: number;
    studentsAtRisk: number;
    activeInterventions: number;
    unresolvedAlerts: number;
  };
};

export type SchoolInfo = {
  id: string;
  name: string;
  type: string;
  district: string;
  sector: string;
  village: string;
  academicYear: string;
  currentTerm: string;
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
};

export type TeacherListItem = {
  id: string;
  name: string;
  email: string;
  assignedClasses: number;
  assignedSubjects: number;
  lessonsPrepared: number;
  resourcesUploaded: number;
  pendingMarks: number;
};

export type TeacherDetail = {
  id: string;
  name: string;
  email: string;
  assignedClasses: { id: string; name: string; subject: string }[];
  totalLessons: number;
  totalResources: number;
  recentMarks: {
    id: string;
    subject: string;
    class: string;
    term: string;
    status: string;
    date: Date;
  }[];
  attendanceThisMonth: number;
};

export type TeacherWorkload = {
  classesAssigned: number;
  lessonPlansCreated: number;
  marksEntered: number;
  attendanceMarked: number;
  resourcesUploaded: number;
};

export type StudentListItem = {
  id: string;
  name: string;
  studentCode: string;
  class: string;
  level: string;
  gender: string;
  hasDisability: boolean;
  disabilityType: string;
  status: string;
  riskLevel: string;
  attendanceRate: number | null;
};

export type StudentDetail = {
  id: string;
  name: string;
  email: string;
  studentCode: string;
  class: string;
  level: string;
  gender: string;
  dateOfBirth: Date;
  hasDisability: boolean;
  disabilityType: string;
  status: string;
  parents: { name: string; relationship: string; phone: string }[];
  marks: {
    id: string;
    subject: string;
    term: string;
    score: number;
    maxScore: number;
    percentage: number;
    grade: string;
    status: string;
  }[];
  attendance: { date: Date; status: string }[];
  reports: { id: string; term: string; totalMarks: number; average: number; grade: string }[];
  riskLevel: string;
  averageMarks: number | null;
};

export type AttendanceOverview = {
  today: { present: number; absent: number; late: number; total: number; rate: number };
  byClass: { class: string; present: number; absent: number; rate: number }[];
};

export type AttendanceTrend = { date: string; rate: number; present: number; absent: number };

export type PendingMark = {
  id: string;
  student: string;
  studentCode: string;
  subject: string;
  class: string;
  term: string;
  score: number;
  maxScore: number;
  percentage: number;
  teacher: string;
  submittedAt: Date;
};

export type ReportCard = {
  id: string;
  student: string;
  studentCode: string;
  class: string;
  term: string;
  academicYear: string;
  totalMarks: number;
  average: number;
  grade: string;
  status: string;
  createdAt: Date;
};

export type PerformanceAnalytics = {
  bySubject: { subject: string; average: number; students: number }[];
  byClass: { class: string; average: number; students: number }[];
  byGender: { gender: string; average: number; students: number }[];
  byDisability: { category: string; average: number; students: number }[];
};

export type AIInsight = {
  type: string;
  title: string;
  summary: string;
  priority: string;
};

export type ParentListItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  children: { name: string; class: string; relationship: string }[];
  childrenCount: number;
};

export type ParentEngagement = {
  totalParents: number;
  linkedParents: number;
  activeEngaged: number;
  engagementRate: number;
};

export const headteacherApi = {
  dashboard: () => apiRequest<HeadteacherDashboard>("/headteacher/dashboard"),
  schoolInfo: () => apiRequest<SchoolInfo>("/headteacher/school-info"),

  teachers: (params?: { search?: string; classId?: string; subjectId?: string }) =>
    apiRequest<{ items: TeacherListItem[] }>(`/headteacher/teachers${query(params || {})}`),
  teacherDetail: (id: string) => apiRequest<TeacherDetail>(`/headteacher/teachers/${id}`),
  teacherWorkload: (id: string) =>
    apiRequest<TeacherWorkload>(`/headteacher/teachers/${id}/workload`),

  students: (params?: {
    search?: string;
    classId?: string;
    gender?: string;
    hasDisability?: boolean;
    status?: string;
  }) => apiRequest<{ items: StudentListItem[] }>(`/headteacher/students${query(params || {})}`),
  studentDetail: (id: string) => apiRequest<StudentDetail>(`/headteacher/students/${id}`),
  studentRisk: (id: string) =>
    apiRequest<{
      riskLevel: string;
      score: number;
      factors: object;
      avgAttendance: number | null;
      avgMarks: number | null;
      recommendation: string;
    }>(`/headteacher/students/${id}/risk`),

  attendance: () => apiRequest<AttendanceOverview>("/headteacher/attendance"),
  attendanceTrends: (period?: "week" | "month") =>
    apiRequest<AttendanceTrend[]>(`/headteacher/attendance/trends${query({ period })}`),
  classAttendance: (classId: string) =>
    apiRequest<{ name: string; present: number; absent: number; rate: number }[]>(
      `/headteacher/attendance/class/${classId}`,
    ),
  teacherAttendanceStatus: () =>
    apiRequest<{ id: string; name: string; submittedToday: boolean; hasLessonsToday: boolean }[]>(
      "/headteacher/attendance/submission-status",
    ),

  pendingMarks: (params?: { classId?: string; subjectId?: string; termId?: string }) =>
    apiRequest<{ items: PendingMark[] }>(`/headteacher/marks/pending${query(params || {})}`),
  approvedMarks: (params?: { classId?: string; subjectId?: string; termId?: string }) =>
    apiRequest<{ items: PendingMark[] }>(`/headteacher/marks/approved${query(params || {})}`),
  approveMark: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/headteacher/marks/${id}/approve`, {
      method: "POST",
    }),
  rejectMark: (id: string, reason: string) =>
    apiRequest<{ success: boolean; message: string }>(`/headteacher/marks/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  lockMark: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/headteacher/marks/${id}/lock`, {
      method: "POST",
    }),
  unlockMark: (id: string, reason: string) =>
    apiRequest<{ success: boolean; message: string }>(`/headteacher/marks/${id}/unlock`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  markAuditLog: (markId: string) =>
    apiRequest<{
      items: {
        id: string;
        changedBy: string;
        oldScore: number;
        newScore: number;
        reason: string;
        createdAt: Date;
      }[];
    }>(`/headteacher/marks/audit/${markId}`),

  reports: (params?: { classId?: string; termId?: string; status?: string }) =>
    apiRequest<{ items: ReportCard[] }>(`/headteacher/reports${query(params || {})}`),
  generateReport: (classId: string, termId: string) =>
    apiRequest<{ success: boolean; generated: number }>("/headteacher/reports/generate", {
      method: "POST",
      body: JSON.stringify({ classId, termId }),
    }),
  reportDetail: (id: string) => apiRequest<object>(`/headteacher/reports/${id}`),
  updateReportComment: (id: string, comment: string) =>
    apiRequest<{ success: boolean }>(`/headteacher/reports/${id}/comments`, {
      method: "PUT",
      body: JSON.stringify({ comment }),
    }),
  approveReport: (id: string) =>
    apiRequest<{ success: boolean; message: string }>(`/headteacher/reports/${id}/approve`, {
      method: "POST",
    }),

  performanceAnalytics: (params?: { classId?: string; subjectId?: string; termId?: string }) =>
    apiRequest<PerformanceAnalytics>(`/headteacher/analytics/performance${query(params || {})}`),
  attendanceAnalytics: () => apiRequest<object>("/headteacher/analytics/attendance"),
  comparisonAnalytics: () => apiRequest<object>("/headteacher/analytics/comparison"),

  parents: (params?: { search?: string }) =>
    apiRequest<{ items: ParentListItem[] }>(`/headteacher/parents${query(params || {})}`),
  parentChildren: (id: string) =>
    apiRequest<{ items: object[] }>(`/headteacher/parents/${id}/children`),
  parentMessages: (id: string) =>
    apiRequest<{ items: object[] }>(`/headteacher/parents/${id}/messages`),
  parentEngagement: () => apiRequest<ParentEngagement>("/headteacher/parent-engagement"),

  aiInsights: () => apiRequest<object>("/headteacher/ai/insights", { method: "POST" }),
  aiActionPlan: () => apiRequest<object>("/headteacher/ai/action-plan", { method: "POST" }),
  aiSchoolSummary: () =>
    apiRequest<{ summary: string }>("/headteacher/ai/summary", { method: "POST" }),
};
