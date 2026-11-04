import { apiRequest } from "@/lib/api";

export type ContentStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DELETED";

export interface CourseUnit {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  keyCompetence?: string;
  genericCompetencies: string[];
  crossCuttingIssues: string[];
  order: number;
  lessons: CourseLesson[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseLesson {
  id: string;
  courseId: string;
  unitId?: string;
  title: string;
  topic?: string;
  learningObjectives?: string;
  genericCompetencies: string[];
  crossCuttingIssues: string[];
  teacherActivities?: string;
  learnerActivities?: string;
  assessmentCriteria?: string;
  description?: string;
  notes?: string;
  body?: string;
  contentType?: string;
  videoUrl?: string;
  audioUrl?: string;
  mediaUrl?: string;
  attachments: string[];
  images: string[];
  homework?: string;
  status: ContentStatus;
  order: number;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRecord {
  id: string;
  subjectId: string;
  levelId: string;
  title: string;
  description: string;
  coverImage?: string;
  academicYear?: string;
  term?: string;
  language?: string;
  learningObjectives?: string;
  teacherId?: string;
  schoolId?: string;
  status: ContentStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string; icon?: string };
  level?: { id: string; name: string; category: string };
  teacher?: { id: string; user: { id: string; name: string; email: string } };
  school?: { id: string; name: string };
  units: CourseUnit[];
  lessons: CourseLesson[];
  assignments: any[];
  quizzes: any[];
  enrollments: Array<{ id: string; studentId: string; progressPercent: number }>;
  _count?: {
    enrollments: number;
    lessons: number;
    units: number;
    assignments: number;
    quizzes: number;
  };
}

export interface CourseAnalytics {
  totalEnrollments: number;
  completedCount: number;
  avgProgress: number;
  totalLessons: number;
  avgQuizScore: number;
  totalQuizAttempts: number;
}

type CreateCourseInput = {
  title: string;
  subjectId: string;
  levelId: string;
  description?: string;
  coverImage?: string;
  status?: ContentStatus;
  schoolId?: string;
  academicYear?: string;
  term?: string;
  language?: string;
  learningObjectives?: string;
};

type UpdateCourseInput = Partial<CreateCourseInput>;

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const courseApi = {
  // ── Courses ───────────────────────────────────────────────────
  list: (params?: {
    schoolId?: string;
    teacherId?: string;
    status?: string;
    levelId?: string;
    subjectId?: string;
    classId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<{
      success: boolean;
      data: {
        courses: CourseRecord[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      };
    }>(`/courses${buildQuery((params as any) ?? {})}`),

  mine: () => apiRequest<{ courses: CourseRecord[] }>("/courses/mine"),

  get: (courseId: string) => apiRequest<{ course: CourseRecord }>(`/courses/${courseId}`),

  createCourse: (input: CreateCourseInput) =>
    apiRequest<{ course: CourseRecord }>("/courses", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateCourse: (courseId: string, input: UpdateCourseInput) =>
    apiRequest<{ course: CourseRecord }>(`/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  deleteCourse: (courseId: string) =>
    apiRequest<void>(`/courses/${courseId}`, { method: "DELETE" }),

  publishCourse: (courseId: string) =>
    apiRequest<{ course: CourseRecord }>(`/courses/${courseId}/publish`, { method: "POST" }),

  unpublishCourse: (courseId: string) =>
    apiRequest<{ course: CourseRecord }>(`/courses/${courseId}/unpublish`, { method: "POST" }),

  archiveCourse: (courseId: string) =>
    apiRequest<{ course: CourseRecord }>(`/courses/${courseId}/archive`, { method: "POST" }),

  duplicateCourse: (courseId: string) =>
    apiRequest<{ course: CourseRecord }>(`/courses/${courseId}/duplicate`, { method: "POST" }),

  analytics: (courseId: string) =>
    apiRequest<{ analytics: CourseAnalytics }>(`/courses/${courseId}/analytics`),

  listQuizzes: () => apiRequest<{ quizzes: any[] }>("/my/quizzes"),

  listAssignments: () => apiRequest<{ assignments: any[] }>("/my/assignments"),

  // ── Units ─────────────────────────────────────────────────────
  createUnit: (
    courseId: string,
    input: {
      title: string;
      description?: string;
      keyCompetence?: string;
      genericCompetencies?: string[];
      crossCuttingIssues?: string[];
      order?: number;
    },
  ) =>
    apiRequest<{ unit: CourseUnit }>(`/courses/${courseId}/units`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateUnit: (unitId: string, input: { title?: string; description?: string; order?: number }) =>
    apiRequest<{ unit: CourseUnit }>(`/units/${unitId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  deleteUnit: (unitId: string) => apiRequest<void>(`/units/${unitId}`, { method: "DELETE" }),

  reorderUnits: (courseId: string, unitOrder: Array<{ unitId: string; order: number }>) =>
    apiRequest<{ success: boolean }>(`/courses/${courseId}/reorder-units`, {
      method: "POST",
      body: JSON.stringify({ unitOrder }),
    }),

  // ── Lessons ───────────────────────────────────────────────────
  createCourseLesson: (
    courseId: string,
    input: {
      title: string;
      unitId?: string;
      topic?: string;
      learningObjectives?: string;
      genericCompetencies?: string[];
      crossCuttingIssues?: string[];
      teacherActivities?: string;
      learnerActivities?: string;
      assessmentCriteria?: string;
      description?: string;
    },
  ) =>
    apiRequest<{ lesson: CourseLesson }>(`/courses/${courseId}/lessons`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateCourseLesson: (
    lessonId: string,
    input: {
      title?: string;
      description?: string;
      content?: string;
      order?: number;
    },
  ) =>
    apiRequest<{ lesson: CourseLesson }>(`/lessons/${lessonId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  deleteCourseLesson: (lessonId: string) =>
    apiRequest<void>(`/lessons/${lessonId}`, { method: "DELETE" }),

  publishCourseLesson: (lessonId: string) =>
    apiRequest<{ lesson: CourseLesson }>(`/lessons/${lessonId}/publish`, { method: "POST" }),

  unpublishCourseLesson: (lessonId: string) =>
    apiRequest<{ lesson: CourseLesson }>(`/lessons/${lessonId}/unpublish`, { method: "POST" }),

  reorderLessons: (courseId: string, lessonOrder: Array<{ lessonId: string; order: number }>) =>
    apiRequest<{ success: boolean }>(`/courses/${courseId}/reorder-lessons`, {
      method: "POST",
      body: JSON.stringify({ lessonOrder }),
    }),

  // ── Enrollment ────────────────────────────────────────────────
  enroll: (courseId: string, studentId: string) =>
    apiRequest<{ enrollment: unknown }>(`/courses/${courseId}/enroll`, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),

  assignCourse: (courseId: string, input: { classId?: string; studentIds?: string[] }) =>
    apiRequest<{ assignedCount: number }>(`/courses/${courseId}/assign`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // ── Progress ──────────────────────────────────────────────────
  updateLessonProgress: (lessonId: string, status: string) =>
    apiRequest<{ progress: any }>(`/lessons/${lessonId}/progress`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  // ── Assignments ───────────────────────────────────────────────
  createAssignment: (courseId: string, input: any) =>
    apiRequest<{ assignment: any }>(`/courses/${courseId}/assignments`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateAssignment: (id: string, input: any) =>
    apiRequest<{ assignment: any }>(`/assignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteAssignment: (id: string) => apiRequest<void>(`/assignments/${id}`, { method: "DELETE" }),
  submitAssignment: (id: string, input: any) =>
    apiRequest<{ submission: any }>(`/assignments/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // ── Quizzes ───────────────────────────────────────────────────
  createCourseQuiz: (courseId: string, input: any) =>
    apiRequest<{ quiz: any }>(`/courses/${courseId}/quizzes`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateCourseQuiz: (id: string, input: any) =>
    apiRequest<{ quiz: any }>(`/quizzes/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteCourseQuiz: (id: string) => apiRequest<void>(`/quizzes/${id}`, { method: "DELETE" }),
  addQuizQuestions: (id: string, questions: any[]) =>
    apiRequest<{ questions: any }>(`/quizzes/${id}/questions`, {
      method: "POST",
      body: JSON.stringify({ questions }),
    }),
  submitQuizAttempt: (id: string, answers: Record<string, string>) =>
    apiRequest<{ attempt: any }>(`/quizzes/${id}/attempt`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
};
