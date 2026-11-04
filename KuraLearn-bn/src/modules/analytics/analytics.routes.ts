import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { asyncHandler } from "../../http/async-handler.js";
import { getAnalyticsOverviewController } from "./analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.get(
  "/overview",
  requireAuth,
  requireRole("PARENT", "TEACHER", "ADMIN"),
  asyncHandler(getAnalyticsOverviewController)
);
