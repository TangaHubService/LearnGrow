import axios from "axios";
import * as SecureStore from "expo-secure-store";
import type { ApiUser, AuthResponse } from "@kuralearn/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const ACCESS_TOKEN_KEY = "kuralearn_access_token";
const REFRESH_TOKEN_KEY = "kuralearn_refresh_token";
const USER_KEY = "kuralearn_user";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`, {
          refreshToken,
        });
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),
  register: (data: { email: string; password: string; name: string; role: string }) =>
    api.post<AuthResponse>("/auth/register", data),
  me: () => api.get<{ user: ApiUser }>("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const studentApi = {
  dashboard: () => api.get("/students/me/dashboard"),
  subjects: () => api.get("/students/me/subjects"),
  courses: (subjectId: string) => api.get(`/subjects/${subjectId}/courses`),
  lesson: (lessonId: string) => api.get(`/lessons/${lessonId}`),
  completeLesson: (lessonId: string) =>
    api.post(`/lessons/${lessonId}/complete`, { deviceType: "mobile" }),
  updateProgress: (lessonId: string, progress: number) =>
    api.post(`/lessons/${lessonId}/progress`, { progress }),
  attendance: () => api.get("/students/me/attendance"),
  marks: () => api.get("/students/me/marks"),
  timetable: () => api.get("/students/me/timetable"),
  profile: () => api.get("/students/me"),
  updateProfile: (data: Record<string, unknown>) => api.put("/students/me", data),
  rewards: () => api.get("/students/me/rewards"),
  certificates: () => api.get("/students/me/certificates"),
  goals: () => api.get("/students/me/goals"),
  createGoal: (data: { title: string; targetDate?: string }) =>
    api.post("/students/me/goals", data),
  updateGoal: (id: string, data: Record<string, unknown>) =>
    api.put(`/goals/${id}`, data),
  analytics: () => api.get("/students/me/analytics"),
};

export const teacherApi = {
  dashboard: () => api.get("/teacher/dashboard"),
  classes: () => api.get("/teacher/classes"),
  createClass: (data: { name: string; levelId: string }) =>
    api.post("/teacher/classes", data),
  classDetail: (classId: string) => api.get(`/teacher/classes/${classId}`),
  updateClass: (classId: string, data: Record<string, unknown>) =>
    api.put(`/teacher/classes/${classId}`, data),
  archiveClass: (classId: string) =>
    api.post(`/teacher/classes/${classId}/archive`),
  students: (classId: string) => api.get(`/teacher/classes/${classId}/students`),
  addStudent: (data: Record<string, unknown>) =>
    api.post("/teacher/students", data),
  updateStudent: (id: string, data: Record<string, unknown>) =>
    api.put(`/teacher/students/${id}`, data),
  markAttendance: (data: { classId: string; date: string; records: unknown[] }) =>
    api.post("/attendance/bulk", data),
  lessons: () => api.get("/teacher/lessons"),
  createLesson: (data: Record<string, unknown>) =>
    api.post("/teacher/lessons", data),
  updateLesson: (id: string, data: Record<string, unknown>) =>
    api.put(`/teacher/lessons/${id}`, data),
  publishLesson: (id: string) =>
    api.post(`/teacher/lessons/${id}/publish`),
  duplicateLesson: (id: string) =>
    api.post(`/teacher/lessons/${id}/duplicate`),
  archiveLesson: (id: string) =>
    api.post(`/teacher/lessons/${id}/archive`),
  quizzes: () => api.get("/teacher/quizzes"),
  createQuiz: (data: Record<string, unknown>) =>
    api.post("/teacher/quizzes", data),
  updateQuiz: (id: string, data: Record<string, unknown>) =>
    api.put(`/teacher/quizzes/${id}`, data),
  assignQuiz: (id: string, data: { classIds: string[] }) =>
    api.post(`/teacher/quizzes/${id}/assign`, data),
  archiveQuiz: (id: string) =>
    api.post(`/teacher/quizzes/${id}/archive`),
  reports: () => api.get("/teacher/reports"),
  deliverySessions: () => api.get("/teacher/delivery-sessions"),
  createDeliverySession: (data: Record<string, unknown>) =>
    api.post("/teacher/delivery-sessions", data),
  endDeliverySession: (id: string) =>
    api.post(`/teacher/delivery-sessions/${id}/end`),
  resources: () => api.get("/teacher/resources"),
  createResource: (data: Record<string, unknown>) =>
    api.post("/teacher/resources", data),
  messages: () => api.get("/teacher/messages"),
  notifications: () => api.get("/teacher/notifications"),
};

export const learningApi = {
  levels: (levelId: string, subjectId: string) =>
    api.get(`/levels/${levelId}/subjects/${subjectId}`),
  quiz: (quizId: string) => api.get(`/quizzes/${quizId}`),
  submitQuiz: (quizId: string, answers: unknown[]) =>
    api.post(`/quizzes/${quizId}/submit`, { answers }),
  quizResults: (attemptId: string) =>
    api.get(`/quiz-attempts/${attemptId}/results`),
  practiceAttempt: (data: Record<string, unknown>) =>
    api.post("/practice/attempts", data),
};

export const aiApi = {
  chat: (message: string, conversationId?: string) =>
    api.post("/ai/chat", { message, conversationId }),
  hint: (lessonId: string, question: string) =>
    api.post("/ai/hint", { lessonId, question }),
  explainLesson: (lessonId: string) =>
    api.post("/ai/explain-lesson", { lessonId }),
  translate: (text: string, targetLanguage: string) =>
    api.post("/ai/translate", { text, targetLanguage }),
  recommendRemedial: (subjectId: string) =>
    api.post("/ai/recommend-remedial", { subjectId }),
  generatePractice: (subjectId: string, topic: string) =>
    api.post("/ai/generate-practice", { subjectId, topic }),
  conversations: () => api.get("/ai/conversations"),
  conversation: (id: string) => api.get(`/ai/conversations/${id}`),
  lessonObjectives: (topic: string, level: string) =>
    api.post("/ai/lesson-objectives", { topic, level }),
  lessonPlan: (topic: string, level: string, duration: number) =>
    api.post("/ai/lesson-plan", { topic, level, duration }),
  quizGenerate: (subjectId: string, topic: string, count: number) =>
    api.post("/ai/quiz-generate", { subjectId, topic, count }),
  analyzePerformance: (classId: string) =>
    api.post("/ai/analyze-performance", { classId }),
  studentRisk: (classId: string) =>
    api.post("/ai/student-risk", { classId }),
  interventionRecommendations: (studentId: string) =>
    api.post("/ai/intervention-recommendations", { studentId }),
  reportSummary: (classId: string, period: string) =>
    api.post("/ai/report-summary", { classId, period }),
  parentMessageDraft: (studentId: string, topic: string) =>
    api.post("/ai/parent-message-draft", { studentId, topic }),
};

export const libraryApi = {
  list: (params?: Record<string, unknown>) => api.get("/library", { params }),
  detail: (id: string) => api.get(`/library/${id}`),
};

export const notificationsApi = {
  list: () => api.get("/notifications"),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
};

export const messagesApi = {
  list: () => api.get("/messages"),
  thread: (threadId: string) => api.get(`/messages/${threadId}`),
  send: (data: { recipientId: string; content: string; threadId?: string }) =>
    api.post("/messages", data),
};

export default api;
