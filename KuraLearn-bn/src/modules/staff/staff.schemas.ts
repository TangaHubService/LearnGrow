import { z } from "zod";

export const staffRoleSchema = z.enum([
  "HEADTEACHER",
  "SCHOOL_ADMIN",
  "DIRECTOR_OF_STUDIES",
  "TEACHER",
  "ACCOUNTANT",
  "DISCIPLINE_OFFICER",
  "LIBRARIAN",
  "ICT_OFFICER",
  "RECEPTIONIST",
  "SUPPORT_STAFF",
]);

export const employmentStatusSchema = z.enum([
  "PERMANENT",
  "CONTRACT",
  "PART_TIME",
  "INTERN",
  "VOLUNTEER",
]);

export const invitationStatusSchema = z.enum([
  "PENDING",
  "SENT",
  "ACCEPTED",
  "EXPIRED",
]);

export const createStaffSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  staffRole: staffRoleSchema,
  schoolId: z.string().uuid().optional(),
  classIds: z.array(z.string().uuid()).optional(),
  subjectIds: z.array(z.string().uuid()).optional(),
  employmentStatus: employmentStatusSchema.default("PERMANENT"),
  sendInvitation: z.boolean().default(true),
});

export const updateStaffSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  staffRole: staffRoleSchema.optional(),
  employmentStatus: employmentStatusSchema.optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]).optional(),
});

export const assignClassesSchema = z.object({
  assignments: z.array(z.object({
    classId: z.string().uuid(),
    subjectName: z.string().min(1).max(200),
    subjectId: z.string().uuid().optional(),
  })).min(1, "At least one assignment is required"),
});

export const staffListQuerySchema = z.object({
  search: z.string().optional(),
  role: staffRoleSchema.optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED"]).optional(),
  invitationStatus: invitationStatusSchema.optional(),
  classId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["name", "email", "createdAt", "staffRole"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type AssignClassesInput = z.infer<typeof assignClassesSchema>;
export type StaffListQuery = z.infer<typeof staffListQuerySchema>;
