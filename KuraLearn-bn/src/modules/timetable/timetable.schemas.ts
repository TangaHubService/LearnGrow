import { z } from "zod";

function isValidTimeRange(startTime: string, endTime: string): boolean {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  if (startH === undefined || startM === undefined || endH === undefined || endM === undefined) return false;
  return (endH * 60 + endM) > (startH * 60 + startM);
}

export const createTimetableEntrySchema = z.object({
  classId: z.string().uuid("Invalid class ID"),
  subjectId: z.string().uuid("Invalid subject ID"),
  teacherId: z.string().uuid("Invalid teacher ID"),
  roomId: z.string().uuid().optional().nullable(),
  room: z.string().optional().nullable(),
  periodId: z.string().uuid().optional().nullable(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  isDoublePeriod: z.boolean().default(false),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING"]).default("MORNING"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  termId: z.string().uuid("Invalid term ID")
}).refine(
  (data) => isValidTimeRange(data.startTime, data.endTime),
  { message: "endTime must be after startTime", path: ["endTime"] }
);

export const updateTimetableEntrySchema = z.object({
  classId: z.string().uuid("Invalid class ID").optional(),
  subjectId: z.string().uuid("Invalid subject ID").optional(),
  teacherId: z.string().uuid("Invalid teacher ID").optional(),
  roomId: z.string().uuid().optional().nullable(),
  room: z.string().optional().nullable(),
  periodId: z.string().uuid().optional().nullable(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").optional(),
  isDoublePeriod: z.boolean().optional(),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional(),
  academicYearId: z.string().uuid("Invalid academic year ID").optional(),
  termId: z.string().uuid("Invalid term ID").optional()
});

export const generateTimetableSchema = z.object({
  schoolId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  termId: z.string().uuid(),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional().default("MORNING"),
  classIds: z.array(z.string().uuid()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  respectWorkload: z.boolean().optional().default(true),
  preferDoublePeriods: z.boolean().optional().default(true)
});

export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  type: z.enum(["CLASSROOM", "LABORATORY", "COMPUTER_LAB", "WORKSHOP", "LIBRARY", "HALL", "MUSIC_ROOM", "ART_ROOM", "SPORTS_FIELD", "OTHER"]).default("CLASSROOM"),
  capacity: z.number().int().positive().optional(),
  building: z.string().optional(),
  floor: z.string().optional()
});

export const updateRoomSchema = createRoomSchema.partial();

export const createPeriodSchema = z.object({
  name: z.string().min(1, "Period name is required"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"),
  slotIndex: z.number().int().min(0),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING"]).default("MORNING")
}).refine(
  (data) => isValidTimeRange(data.startTime, data.endTime),
  { message: "endTime must be after startTime", path: ["endTime"] }
);

export const updatePeriodSchema = z.object({
  name: z.string().min(1, "Period name is required").optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").optional(),
  slotIndex: z.number().int().min(0).optional(),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional()
});

export const createTeacherWorkloadSchema = z.object({
  teacherId: z.string().uuid(),
  academicYearId: z.string().uuid().optional().nullable(),
  termId: z.string().uuid().optional().nullable(),
  maxPeriodsPerDay: z.number().int().min(1).max(12).default(8),
  maxPeriodsPerWeek: z.number().int().min(1).max(50).default(40),
  maxConsecutivePeriods: z.number().int().min(1).max(6).default(3)
});

export const updateTeacherWorkloadSchema = createTeacherWorkloadSchema.partial();

export const listQuerySchema = z.object({
  classId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]).optional(),
  termId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  shift: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(50)
});
