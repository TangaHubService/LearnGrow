import { apiRequest } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────

export type AssessmentType =
  | "ASSIGNMENT"
  | "QUIZ"
  | "TEST"
  | "CAT"
  | "EXAM"
  | "PRACTICE_ASSESSMENT"
  | "PROJECT"
  | "PRACTICAL"
  | "ORAL"
  | "HOMEWORK";
export type AssessmentVisibility = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
export type AssessmentStatus = AssessmentVisibility | "SCHEDULED";
export type SubmissionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "LATE"
  | "MARKED"
  | "RETURNED";
export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "FILE_UPLOAD"
  | "PRACTICAL"
  | "MATCHING"
  | "ORDERING";

export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  questionText: string;
  type: QuestionType;
  options: string[] | null;
  correctAnswer: unknown | null;
  marks: number;
  explanation: string | null;
  orderIndex: number;
  difficulty: string | null;
  topicId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  schoolId: string;
  courseId: string;
  unitId: string | null;
  lessonId: string | null;
  teacherId: string;
  title: string;
  description: string | null;
  type: AssessmentType;
  totalMarks: number;
  passMark: number;
  dueDate: string | null;
  startDate: string | null;
  durationMinutes: number | null;
  instructions: string | null;
  rubric: RubricItem[] | null;
  attachments: string[];
  visibility: AssessmentVisibility;
  status?: AssessmentStatus;
  allowLateSubmission: boolean;
  aiGenerated: boolean;
  subjectId: string | null;
  classId: string | null;
  attemptsAllowed: number;
  randomizeQuestions: boolean;
  showResults: boolean;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
  course: { id: string; title: string; subject: { id: string; name: string } };
  subject?: { id: string; name: string } | null;
  class?: { id: string; name: string } | null;
  teacher: { id: string; user: { id: string; name: string } };
  lesson: { id: string; title: string } | null;
  unit: { id: string; title: string } | null;
  questions: AssessmentQuestion[];
  _count: { submissions: number; questions: number };
  submissionStats?: {
    assignedStudents: number;
    totalAttempts: number;
    submitted: number;
    inProgress: number;
    marked: number;
    averageScore: number | null;
  };
  permissions?: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canPublish: boolean;
  };
}

export interface RubricItem {
  criterion: string;
  maxMarks: number;
  description: string;
}

export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  studentId: string;
  status: SubmissionStatus;
  answers: Record<string, unknown> | null;
  uploadedFiles: string[];
  submittedAt: string | null;
  score: number | null;
  feedback: string | null;
  markedBy: string | null;
  markedAt: string | null;
  aiAssisted: boolean;
  timerRemaining: number | null;
  aiFeedback: any | null;
  questionMarking: Record<string, { marks: number; feedback?: string }> | null;
  createdAt: string;
  updatedAt: string;
  assessment?: Assessment;
  student?: { id: string; user: { id: string; name: string; email?: string } };
  teacherFeedback?: SubmissionFeedback[];
}

export interface SubmissionFeedback {
  id: string;
  submissionId: string;
  teacherId: string;
  comment: string | null;
  rubricScores: Record<string, number> | null;
  strengths: string[];
  improvements: string[];
  nextSteps: string | null;
  createdAt: string;
}

export interface AssessmentAnalytics {
  totalEnrolled: number;
  totalSubmissions: number;
  markedCount: number;
  submissionRate: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  lateSubmissions: number;
  statusBreakdown: Record<SubmissionStatus, number>;
  distribution: { range: string; count: number }[];
  questionPerformance: {
    questionId: string;
    text: string;
    avgScore: number;
    maxScore: number;
    difficulty: string;
  }[];
  genderStats: Record<string, { avg: number; count: number; passRate: number }>;
  disabilityStats: Record<string, { avg: number; count: number; passRate: number }>;
}

// ─── API ──────────────────────────────────────────────────────────────

export const assessmentApi = {
  // ── Assessments ──────────────────────────────────────────────────
  list: (params?: {
    courseId?: string;
    lessonId?: string;
    teacherId?: string;
    visibility?: string;
    status?: string;
    type?: string;
    schoolId?: string;
    subjectId?: string;
    classId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") searchParams.set(k, String(v));
    });
    const q = searchParams.toString();
    return apiRequest<{
      success: boolean;
      data: {
        assessments: Assessment[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        };
      };
    }>(`/assessments${q ? `?${q}` : ""}`);
  },

  get: (id: string) => apiRequest<{ assessment: Assessment }>(`/assessments/${id}`),

  create: (input: {
    courseId: string;
    unitId?: string;
    lessonId?: string;
    title: string;
    description?: string;
    type: AssessmentType;
    totalMarks?: number;
    passMark?: number;
    dueDate?: string;
    startDate?: string;
    durationMinutes?: number;
    instructions?: string;
    rubric?: RubricItem[];
    attachments?: string[];
    allowLateSubmission?: boolean;
    subjectId?: string;
    classId?: string;
    attemptsAllowed?: number;
    randomizeQuestions?: boolean;
    showResults?: boolean;
    passingScore?: number;
  }) =>
    apiRequest<{ assessment: Assessment }>("/assessments", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (
    id: string,
    input: Partial<{
      courseId: string;
      unitId?: string;
      lessonId?: string;
      title: string;
      description?: string;
      type: AssessmentType;
      totalMarks?: number;
      passMark?: number;
      dueDate?: string;
      startDate?: string;
      durationMinutes?: number;
      instructions?: string;
      rubric?: RubricItem[];
      attachments?: string[];
      allowLateSubmission?: boolean;
      subjectId?: string;
      classId?: string;
      attemptsAllowed?: number;
      randomizeQuestions?: boolean;
      showResults?: boolean;
      passingScore?: number;
    }>,
  ) =>
    apiRequest<{ assessment: Assessment }>(`/assessments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/assessments/${id}`, { method: "DELETE" }),

  publish: (id: string) =>
    apiRequest<{ assessment: Assessment }>(`/assessments/${id}/publish`, { method: "POST" }),
  close: (id: string) =>
    apiRequest<{ assessment: Assessment }>(`/assessments/${id}/close`, { method: "POST" }),

  analytics: (id: string) =>
    apiRequest<{ analytics: AssessmentAnalytics }>(`/assessments/${id}/analytics`),

  // ── Questions ────────────────────────────────────────────────────
  addQuestions: (
    assessmentId: string,
    questions: {
      questionText: string;
      type: QuestionType;
      options?: string[];
      correctAnswer?: unknown;
      marks?: number;
      explanation?: string;
      orderIndex?: number;
    }[],
  ) =>
    apiRequest<{ questions: AssessmentQuestion[] }>(`/assessments/${assessmentId}/questions`, {
      method: "POST",
      body: JSON.stringify({ questions }),
    }),

  updateQuestion: (
    questionId: string,
    input: Partial<{
      questionText: string;
      type: QuestionType;
      options: string[];
      correctAnswer: unknown;
      marks: number;
      explanation: string;
      orderIndex: number;
    }>,
  ) =>
    apiRequest<{ question: AssessmentQuestion }>(`/assessments/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  deleteQuestion: (questionId: string) =>
    apiRequest<{ success: boolean }>(`/assessments/questions/${questionId}`, { method: "DELETE" }),

  // ── Teacher: Submission Management ───────────────────────────────
  getSubmissions: (assessmentId: string) =>
    apiRequest<{ submissions: AssessmentSubmission[] }>(`/assessments/${assessmentId}/submissions`),

  markSubmission: (
    submissionId: string,
    data: {
      score: number;
      feedback?: string;
      aiAssisted?: boolean;
      rubricScores?: Record<string, number>;
      strengths?: string[];
      improvements?: string[];
      nextSteps?: string;
      questionMarking?: Record<string, { marks: number; feedback?: string }>;
    },
  ) =>
    apiRequest<{ submission: AssessmentSubmission }>(`/submissions/${submissionId}/mark`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  returnSubmission: (submissionId: string) =>
    apiRequest<{ submission: AssessmentSubmission }>(`/submissions/${submissionId}/return`, {
      method: "POST",
    }),

  // ── Student: Take Assessment ──────────────────────────────────────
  start: (assessmentId: string) =>
    apiRequest<{ submission: AssessmentSubmission }>(`/assessments/${assessmentId}/start`, {
      method: "POST",
    }),

  saveDraft: (submissionId: string, answers: Record<string, unknown>) =>
    apiRequest<{ submission: AssessmentSubmission }>(`/submissions/${submissionId}/save`, {
      method: "PATCH",
      body: JSON.stringify({ answers }),
    }),

  submit: (
    submissionId: string,
    data: { answers?: Record<string, unknown>; uploadedFiles?: string[] },
  ) =>
    apiRequest<{ submission: AssessmentSubmission }>(`/submissions/${submissionId}/submit`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSubmission: (submissionId: string) =>
    apiRequest<{ submission: AssessmentSubmission }>(`/submissions/${submissionId}`),

  // ── Student: My Assessments ───────────────────────────────────────
  myAssessments: () =>
    apiRequest<{ assessments: (Assessment & { mySubmission: AssessmentSubmission | null })[] }>(
      "/students/me/assessments",
    ),
  mySubmissions: () =>
    apiRequest<{ submissions: AssessmentSubmission[] }>("/students/me/submissions"),

  // ── AI Features ───────────────────────────────────────────────────
  aiGenerate: (input: {
    type: string;
    subject: string;
    topic: string;
    gradeLevel: string;
    numberOfQuestions: number;
    difficulty: "easy" | "medium" | "hard";
    totalMarks?: number;
    language?: "en" | "rw" | "fr";
    competencies?: string[];
    alignCBC?: boolean;
  }) =>
    apiRequest<any>("/ai/assessments/generate", { method: "POST", body: JSON.stringify(input) }),

  aiFeedbackSuggest: (input: {
    assessmentTitle: string;
    totalMarks: number;
    passMark: number;
    instructions?: string;
    rubric?: unknown;
    studentAnswer: string;
    modelAnswer?: string;
  }) =>
    apiRequest<any>("/ai/submissions/feedback-suggest", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  aiExplainSolution: (input: {
    assessmentTitle: string;
    questionText?: string;
    modelAnswer?: string;
    studentAnswer: string;
    subject: string;
    gradeLevel: string;
    language?: "en" | "rw" | "fr";
  }) =>
    apiRequest<any>("/ai/submissions/explain-after-submit", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
