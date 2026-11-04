import { z } from "zod";

export const profileSetupSchema = z.object({
  fullName: z.string().min(2),
  dateOfBirth: z.coerce.date().optional(),
  levelId: z.string().uuid(),
  classId: z.string().uuid().optional(),
  schoolId: z.string().uuid().optional(),
  interests: z.array(z.string().min(1)).default([]),
  avatar: z.string().optional(),
  language: z.enum(["en", "rw", "fr"]).default("en")
});

export const profileUpdateSchema = profileSetupSchema.partial();

export const progressSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
  timeSpent: z.coerce.number().int().min(0).optional(),
  deviceType: z.string().optional()
});

export const quizSubmitSchema = z.object({
  answers: z.record(z.unknown()).default({}),
  timeUsed: z.coerce.number().int().min(0).optional()
});

export const practiceAttemptSchema = z.object({
  lessonId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  questionId: z.string().optional(),
  selectedAnswer: z.unknown().optional(),
  correctAnswer: z.unknown().optional()
});

export const goalCreateSchema = z.object({
  type: z.enum(["DAILY", "WEEKLY", "SUBJECT", "READING", "QUIZ_SCORE", "STREAK"]),
  target: z.coerce.number().int().positive(),
  progress: z.coerce.number().int().min(0).default(0),
  dueDate: z.coerce.date().optional()
});

export const goalUpdateSchema = z.object({
  target: z.coerce.number().int().positive().optional(),
  progress: z.coerce.number().int().min(0).optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "EXPIRED"]).optional()
});

export const messageCreateSchema = z.object({
  recipientId: z.string().uuid(),
  threadId: z.string().min(1).optional(),
  body: z.string().min(1).max(1000)
});

export const libraryQuerySchema = z.object({
  levelId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  type: z.string().optional(),
  language: z.enum(["en", "rw", "fr"]).optional(),
  search: z.string().optional()
});
