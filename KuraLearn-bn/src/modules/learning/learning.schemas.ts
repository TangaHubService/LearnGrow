import { z } from "zod";

export const learningQuerySchema = z
  .object({
    levelId: z.string().uuid().optional()
  })
  .passthrough();

export const updateProgressSchema = z.object({
  completed: z.boolean().optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
  timeSpentSec: z.number().int().min(0).optional(),
  timeSpent: z.number().int().min(0).optional(),
  deviceType: z.string().optional()
});

export const submitQuizSchema = z.object({
  answers: z.record(z.unknown()),
  timeSpentSec: z.number().int().min(0).optional(),
  timeUsed: z.number().int().min(0).optional()
});
