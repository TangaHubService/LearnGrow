import { SubscriptionStatus, UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

const pageQuery = {
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
  search: z.string().trim().max(120).optional()
};

export const schoolsQuerySchema = z.object({
  ...pageQuery,
  status: z.nativeEnum(SubscriptionStatus).optional()
});

export const usersQuerySchema = z.object({
  ...pageQuery,
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional()
});

export const activityQuerySchema = z.object({
  ...pageQuery,
  schoolId: z.string().uuid().optional()
});

export const subscriptionUpdateSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus)
});

export const userStatusUpdateSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED])
});
