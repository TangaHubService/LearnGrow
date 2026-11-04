import { z } from "zod";

export const createSchoolSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(["PUBLIC", "PRIVATE", "COMMUNITY"]),
  district: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  adminName: z.string().min(2).max(200),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});
