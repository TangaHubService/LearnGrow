import { z } from "zod";

export const assessmentStatusSchema = z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "CLOSED", "ARCHIVED"]);
export const assessmentTypeSchema = z.enum([
  "ASSIGNMENT",
  "QUIZ",
  "TEST",
  "CAT",
  "EXAM",
  "PRACTICE_ASSESSMENT",
  "PROJECT",
  "PRACTICAL",
  "ORAL",
  "HOMEWORK",
]);

export const listAssessmentsSchema = z.object({
  courseId: z.string().uuid("Invalid course ID").optional(),
  lessonId: z.string().uuid("Invalid lesson ID").optional(),
  teacherId: z.string().uuid("Invalid teacher ID").optional(),
  visibility: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
  status: assessmentStatusSchema.optional(),
  type: assessmentTypeSchema.optional(),
  schoolId: z.string().uuid("Invalid school ID").optional(),
  subjectId: z.string().uuid("Invalid subject ID").optional(),
  classId: z.string().uuid("Invalid class ID").optional(),
  search: z.string().trim().max(120).optional(),
  page: z.preprocess((val) => (val ? parseInt(val as string, 10) : 1), z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => (val ? parseInt(val as string, 10) : 10), z.number().int().min(1).max(100).default(10)),
});
