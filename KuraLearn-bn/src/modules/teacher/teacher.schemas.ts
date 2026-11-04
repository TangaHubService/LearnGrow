import { z } from "zod";

export const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  classId: z.string().uuid().optional(),
  subjectName: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(12),
  sortBy: z.string().default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  
  // Extra filter parameters added for students/learners search and filters
  stream: z.string().optional(),
  gender: z.string().optional(),
  disability: z.string().optional(),
  disabilityStatus: z.string().optional(),
  academicYear: z.string().optional()
});

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((value) => new Date(`${value}T00:00:00.000Z`).toISOString().startsWith(value), "Not a real date");

export const classAttendanceQuerySchema = z
  .object({ from: dateKeySchema, to: dateKeySchema })
  .refine(({ from, to }) => from <= to, { message: "The start date must be on or before the end date", path: ["from"] });

export const classCreateSchema = z.object({
  name: z.string().min(2),
  levelId: z.string().uuid(),
  subjectName: z.string().min(2),
  performance: z.coerce.number().int().min(0).max(100).default(0)
});

export const classUpdateSchema = classCreateSchema.partial();

export const studentCreateSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  language: z.enum(["en", "rw", "fr"]).default("en"),
  interests: z.array(z.string()).default([])
});

export const studentUpdateSchema = studentCreateSchema.partial();

export const lessonCreateSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  title: z.string().min(1, "Lesson title is required"),
  lessonContentHtml: z.string().optional().default(""),
  notes: z.string().optional().nullable(),
  estimatedMinutes: z.coerce.number().int().default(10),
  attachments: z.array(z.string()).default([]),
  videoUrl: z.string().optional().nullable(),
  linkedLessonPlanId: z.string().uuid().optional().nullable(),
  status: z.enum(["draft", "published"]).default("draft")
});

export const lessonUpdateSchema = lessonCreateSchema.partial().extend({
  status: z.enum(["draft", "published"]).optional()
});

export const lessonPlanCreateSchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  title: z.string().min(1, "Lesson Plan title is required"),
  topicId: z.string().uuid().optional().nullable(),
  objectives: z.string().optional().nullable(),
  competencies: z.array(z.string()).default([]),
  crossCuttingIssues: z.array(z.string()).default([]),
  teachingActivities: z.string().optional().nullable(),
  learningActivities: z.string().optional().nullable(),
  materialsNeeded: z.array(z.string()).default([]),
  assessmentStrategy: z.string().optional().nullable(),
  homework: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  duration: z.coerce.number().int().min(5).default(40)
});

export const lessonPlanUpdateSchema = lessonPlanCreateSchema.partial();

export const deliverySessionSchema = z.object({
  lessonId: z.string().uuid(),
  classId: z.string().uuid(),
  slideIndex: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
  participation: z.unknown().default({})
});

export const deliveryUpdateSchema = z.object({
  slideIndex: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
  participation: z.unknown().optional(),
  evidenceUrl: z.string().optional(),
  summary: z.string().optional()
});

export const quizCreateSchema = z.object({
  classId: z.string().uuid(),
  subjectName: z.string().min(2),
  topic: z.string().min(2),
  title: z.string().min(2),
  durationMinutes: z.coerce.number().int().positive(),
  randomizeQuestions: z.boolean().default(false),
  showResults: z.boolean().default(true),
  questions: z.array(z.object({
    type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "MATCHING", "ORDERING", "IMAGE_BASED"]),
    questionText: z.string().min(2),
    options: z.unknown().default([]),
    answer: z.unknown(),
    explanation: z.string().optional(),
    points: z.coerce.number().int().positive().default(1)
  })).default([])
});

export const quizUpdateSchema = quizCreateSchema.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ASSIGNED", "CLOSED", "ARCHIVED"]).optional()
});

export const assignQuizSchema = z.object({
  dueAt: z.coerce.date().optional(),
  showResults: z.boolean().optional(),
  randomizeQuestions: z.boolean().optional()
});

export const resourceCreateSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["PDF", "WORD", "POWERPOINT", "IMAGE", "VIDEO", "AUDIO", "LINK", "OTHER"]),
  fileUrl: z.string().optional(),
  subjectName: z.string().optional(),
  className: z.string().optional(),
  topic: z.string().optional(),
  tags: z.array(z.string()).default([]),
  sharedScope: z.string().default("PRIVATE")
});

export const resourceUpdateSchema = resourceCreateSchema.partial();

export const messageCreateSchema = z.object({
  recipientId: z.string().uuid(),
  body: z.string().min(1).max(1500),
  category: z.enum(["ANNOUNCEMENT", "REMINDER", "PERFORMANCE_NOTE", "HOMEWORK", "EMERGENCY", "GENERAL"]).default("GENERAL"),
  threadId: z.string().optional()
});

export const attendanceCreateSchema = z.object({
  classId: z.string().uuid(),
  date: z.coerce.date(),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    reason: z.string().optional()
  }))
});

export const marksCreateSchema = z.object({
  classId: z.string().uuid(),
  subjectName: z.string(),
  assessmentType: z.string(),
  maxScore: z.coerce.number().int().positive().default(100),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    score: z.coerce.number().int().min(0)
  }))
});

