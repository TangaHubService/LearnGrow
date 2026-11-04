import { apiRequest } from "@/lib/api";

export const studentPortalService = {
  getDashboard: () => apiRequest<any>("/students/me/dashboard"),
  getProfile: () => apiRequest<any>("/students/me"),
  updateProfile: (data: any) =>
    apiRequest<any>("/students/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  createProfile: (data: any) =>
    apiRequest<any>("/students/profile-setup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getLevels: () => apiRequest<{ levels: Array<{ id: string; name: string }> }>("/levels"),
  getSubjects: () => apiRequest<any>("/student/subjects"),
  getMyCourses: (filters?: any) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest<any>(`/student/my-courses${query ? `?${query}` : ""}`);
  },
  getCourseDetails: (courseId: string) => apiRequest<any>(`/student/courses/${courseId}`),
  startCourse: (courseId: string) =>
    apiRequest<any>(`/student/courses/${courseId}/start`, {
      method: "POST",
    }),
  completeLesson: (lessonId: string) =>
    apiRequest<any>(`/student/lessons/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({ deviceType: "web" }),
    }),
  getContinueLearning: () => apiRequest<any>("/student/continue-learning"),
  getStudentDashboard: () => apiRequest<any>("/student/dashboard"),
  getSubjectCourses: (subjectId: string) => apiRequest<any>(`/subjects/${subjectId}/courses`),
  getLessonDetails: (lessonId: string) => apiRequest<any>(`/lessons/${lessonId}`),
  updateLessonProgress: (lessonId: string, data: { status?: string; timeSpent?: number }) =>
    apiRequest<any>(`/lessons/${lessonId}/progress`, {
      method: "POST",
      body: JSON.stringify({ ...data, deviceType: "web" }),
    }),
  getAssignments: () => apiRequest<any>("/students/me/submissions"), // Assignments are often viewed through submissions or a dedicated list
  getAssessments: () => apiRequest<any>("/students/me/assessments"),
  getAssessmentDetails: (assessmentId: string) => apiRequest<any>(`/assessments/${assessmentId}`),
  getAttendance: (filters?: { startDate?: string; endDate?: string }) => {
    const cleanParams = Object.fromEntries(
      Object.entries(filters || {}).filter(([_, v]) => v != null && v !== "undefined"),
    );
    const params = new URLSearchParams(cleanParams as any).toString();
    return apiRequest<any>(`/attendance/history/me${params ? `?${params}` : ""}`);
  },
  getAnnouncements: () => apiRequest<any>("/students/me/announcements"),
  getNotifications: () => apiRequest<any>("/notifications"),
  getMessages: () => apiRequest<any>("/messages"),
  getMessageThread: (threadId: string) => apiRequest<any>(`/messages/${threadId}`),
  getAnalytics: () => apiRequest<any>("/students/me/analytics"),
  getRewards: () => apiRequest<any>("/students/me/rewards"),
  getGoals: () => apiRequest<any>("/students/me/goals"),
  createGoal: (data: any) =>
    apiRequest<any>("/students/me/goals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getLibrary: (params?: any) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params || {}).filter(([_, v]) => v != null && v !== "undefined"),
    );
    const query = new URLSearchParams(cleanParams as any).toString();
    return apiRequest<any>(`/library${query ? `?${query}` : ""}`);
  },
  getLibraryResource: (id: string) => apiRequest<any>(`/library/${id}`),
  getQuiz: (id: string) => apiRequest<any>(`/quizzes/${id}`),
  submitQuiz: (id: string, answers: any) =>
    apiRequest<any>(`/quizzes/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  getQuizResults: (attemptId: string) => apiRequest<any>(`/quiz-attempts/${attemptId}/results`),

  // AI Features
  getAIInsights: () => apiRequest<any>("/students/me/analytics"),
  getAIConversations: () => apiRequest<any>("/ai/conversations"),
  getAIConversation: (id: string) => apiRequest<any>(`/ai/conversations/${id}`),
  aiChat: (payload: any) =>
    apiRequest<any>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Student Marks & Report Cards
  getMarks: () => apiRequest<any>("/students/me/marks"),
  getReportCards: () => apiRequest<any>("/students/me/report-cards"),

  // Student Timetable
  getTimetable: () => apiRequest<any>("/students/me/timetable"),

  // Student National Exams
  getNationalExams: () => apiRequest<any>("/students/me/national-exams"),

  // Student Attendance Summary
  getAttendanceSummary: () => apiRequest<any>("/students/me/attendance"),

  // Student Academic Pathway
  getPathway: () => apiRequest<any>("/students/me/pathway"),
};
