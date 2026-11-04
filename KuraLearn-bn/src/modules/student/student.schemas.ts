import { z } from "zod";

export const courseQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  levelId: z.string().uuid().optional(),
  academicYear: z.string().optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]).optional().default("PUBLISHED")
});

export const lessonCompleteSchema = z.object({
  deviceType: z.string().optional().default("web"),
  timeSpent: z.number().int().min(0).optional()
});

export const startCourseSchema = z.object({
  forceReset: z.boolean().optional().default(false)
});
