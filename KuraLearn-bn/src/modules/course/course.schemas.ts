

import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(1, "Course title is required").max(255),
  subjectId: z.string().uuid("Invalid subject ID"),
  levelId: z.string().uuid("Invalid level ID"),
  description: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  schoolId: z.string().uuid("Invalid school ID").optional(),
  academicYear: z.string().optional(),
  term: z.string().optional(),
  language: z.string().default("en"),
  learningObjectives: z.string().optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1, "Course title is required").max(255).optional(),
  subjectId: z.string().uuid("Invalid subject ID").optional(),
  levelId: z.string().uuid("Invalid level ID").optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  academicYear: z.string().optional(),
  term: z.string().optional(),
  language: z.string().optional(),
  learningObjectives: z.string().optional(),
});

export const listCoursesSchema = z.object({
  schoolId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "DELETED"]).optional(),
  levelId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.preprocess((val) => {
    const parsed = parseInt(val as string, 10);
    return isNaN(parsed) ? undefined : parsed;
  }, z.number().int().min(1).optional().default(1)),
  limit: z.preprocess((val) => {
    const parsed = parseInt(val as string, 10);
    return isNaN(parsed) ? undefined : parsed;
  }, z.number().int().min(1).optional().default(10)),
});

export const createUnitSchema = z.object({
  title: z.string().min(1, "Unit title is required").max(255),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateUnitSchema = z.object({
  title: z.string().min(1, "Unit title is required").max(255).optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export const createLessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required").max(255),
  unitId: z.string().uuid().optional(),
  linkedLessonPlanId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  notes: z.string().optional(),
  body: z.string().optional(),
  contentType: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  audioUrl: z.string().url().optional().or(z.literal("")),
  attachments: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  estimatedMinutes: z.number().int().min(1).optional(),
  homework: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1, "Lesson title is required").max(255).optional(),
  unitId: z.string().uuid().optional().nullable(),
  linkedLessonPlanId: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  notes: z.string().optional(),
  body: z.string().optional(),
  contentType: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  audioUrl: z.string().url().optional().or(z.literal("")),
  attachments: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  estimatedMinutes: z.number().int().min(1).optional(),
  homework: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const enrollStudentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
});

export const reorderUnitsSchema = z.object({
  unitOrder: z.array(z.object({
    unitId: z.string().uuid("Invalid unit ID"),
    order: z.number().int().min(0),
  })),
});

export const reorderLessonsSchema = z.object({
  lessonOrder: z.array(z.object({
    lessonId: z.string().uuid("Invalid lesson ID"),
    order: z.number().int().min(0),
  })),
});