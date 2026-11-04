import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { adminDashboardController, createSchoolController, getSchoolAnalyticsController } from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN", "SUPER_ADMIN"));

adminRouter.get("/dashboard", requireTenant, asyncHandler(adminDashboardController));

adminRouter.post("/schools", requireRole("SUPER_ADMIN"), asyncHandler(createSchoolController));
adminRouter.get("/schools/:schoolId/analytics", requireRole("SUPER_ADMIN", "ADMIN", "HEAD_TEACHER"), asyncHandler(getSchoolAnalyticsController));
