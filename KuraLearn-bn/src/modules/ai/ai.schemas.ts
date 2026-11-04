import { z } from "zod";

export const languageSchema = z.enum(["en", "rw", "fr"]).default("en");

export const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(1200),
  subject: z.string().optional(),
  lessonId: z.string().uuid().optional(),
  quizId: z.string().uuid().optional(),
  language: languageSchema,
  reviewMode: z.boolean().default(false)
});

export const hintSchema = z.object({
  question: z.string().min(1).max(1000),
  selectedAnswer: z.unknown().optional(),
  level: z.string().optional(),
  reviewMode: z.boolean().default(false)
});

export const explainLessonSchema = z.object({
  lessonId: z.string().uuid(),
  language: languageSchema
});

export const translateSchema = z.object({
  text: z.string().min(1).max(4000),
  targetLanguage: languageSchema,
  level: z.string().optional()
});

export const remedialSchema = z.object({
  quizAttemptId: z.string().uuid().optional(),
  quizResult: z.unknown().optional(),
  weakTopics: z.array(z.string()).default([]),
  lessonHistory: z.array(z.string()).default([])
});

export const practiceSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  level: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
  numberOfQuestions: z.coerce.number().int().min(1).max(8).default(3)
});

export const teacherAiSchema = z.object({
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  quizId: z.string().uuid().optional(),
  subjectName: z.string().optional(),
  topic: z.string().optional(),
  objective: z.string().optional(),
  gradeLevel: z.string().optional(),
  language: z.enum(["en", "rw", "fr"]).default("en"),
  performanceData: z.unknown().optional(),
  message: z.string().optional(),
  targetLanguage: z.enum(["en", "rw", "fr"]).optional()
});

export const teacherLessonObjectivesSchema = teacherAiSchema.extend({
  topic: z.string().min(2),
  gradeLevel: z.string().min(1),
  subjectName: z.string().min(2)
});

export const teacherLessonPlanSchema = teacherAiSchema.extend({
  topic: z.string().min(2),
  gradeLevel: z.string().min(1),
  subjectName: z.string().min(2),
  objective: z.string().optional()
});

export const teacherQuizGenerateSchema = teacherAiSchema.extend({
  topic: z.string().min(2),
  gradeLevel: z.string().min(1),
  subjectName: z.string().min(2),
  objective: z.string().optional(),
  numberOfQuestions: z.coerce.number().int().min(1).max(20).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium")
});

export const generateAssessmentSchema = z.object({
  type: z.string().trim().min(2).max(80),
  subject: z.string().trim().min(1).max(120),
  topic: z.string().trim().min(1).max(160),
  gradeLevel: z.string().trim().min(1).max(80),
  numberOfQuestions: z.coerce.number().int().min(1).max(30).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  totalMarks: z.coerce.number().int().min(1).max(500).optional(),
  language: z.enum(["en", "rw", "fr"]).default("en"),
  competencies: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  alignCBC: z.boolean().default(true),
});

export const teacherAnalyzePerformanceSchema = teacherAiSchema.extend({
  performanceData: z.unknown(),
  subjectName: z.string().optional(),
  classId: z.string().uuid().optional()
});

export const teacherStudentRiskSchema = teacherAiSchema.extend({
  studentId: z.string().uuid().optional(),
  performanceData: z.unknown(),
  attendanceData: z.unknown().optional(),
  participationData: z.unknown().optional()
});

export const teacherInterventionSchema = teacherAiSchema.extend({
  studentId: z.string().uuid().optional(),
  performanceData: z.unknown(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  learnerNeeds: z.array(z.string()).default([])
});

export const teacherReportSummarySchema = teacherAiSchema.extend({
  reportData: z.unknown(),
  audience: z.enum(["teacher", "parent", "head_teacher", "admin"]).default("teacher")
});

export const teacherParentMessageDraftSchema = teacherAiSchema.extend({
  studentId: z.string().uuid().optional(),
  messagePurpose: z.string().min(2),
  studentProgress: z.unknown().optional(),
  tone: z.enum(["warm", "professional", "urgent", "encouraging"]).default("warm")
});

export const teacherTranslateOrSimplifySchema = teacherAiSchema.extend({
  text: z.string().min(1).max(6000),
  targetLanguage: z.enum(["en", "rw", "fr"]).optional(),
  simplifyForLevel: z.string().optional()
});

export const teacherTaskTypeSchema = z.enum([
  "lesson_preparation",
  "lesson_notes",
  "scheme_of_work",
  "activity_planning",
  "assessment_questions",
  "homework_preparation",
  "remedial_support",
  "performance_analysis",
  "decision_support",
  "parent_communication",
  "intervention_recommendations",
  "course_outline"
]);

export const teacherAiComprehensiveSchema = z.object({
  taskType: teacherTaskTypeSchema.optional(),
  subjectId: z.string().uuid().optional(),
  subjectName: z.string().optional(),
  classId: z.string().uuid().optional(),
  className: z.string().optional(),
  studentId: z.string().uuid().optional(),
  studentName: z.string().optional(),
  levelId: z.string().uuid().optional(),
  gradeLevel: z.string().optional(),
  topicId: z.string().uuid().optional(),
  topicName: z.string().optional(),
  subtopicId: z.string().uuid().optional(),
  subtopicName: z.string().optional(),
  language: languageSchema.optional().default("en"),
  duration: z.number().int().min(5).max(120).default(40),
  difficultyLevel: z.enum(["easy", "medium", "hard"]).default("medium"),
  learnerNeeds: z.array(z.string()).default([]),
  teacherRequest: z.string().min(10).max(2000),
  schoolContext: z.string().optional(),
  performanceData: z.unknown().optional(),
  studentProgress: z.unknown().optional(),
  numberOfQuestions: z.coerce.number().int().min(1).max(30).default(5),
  audience: z.enum(["teacher", "parent", "head_teacher", "admin"]).optional(),
  tone: z.enum(["warm", "professional", "urgent", "encouraging"]).default("warm"),
  messagePurpose: z.string().optional()
});

export type TeacherTaskType = z.infer<typeof teacherTaskTypeSchema>;
export type TeacherAiComprehensiveInput = z.infer<typeof teacherAiComprehensiveSchema>;
