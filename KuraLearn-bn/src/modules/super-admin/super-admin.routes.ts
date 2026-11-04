import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  activityController,
  overviewController,
  schoolsController,
  subscriptionController,
  usersController,
  userStatusController
} from "./super-admin.controller.js";

export const superAdminRouter = Router();

superAdminRouter.use(requireAuth, requireRole("SUPER_ADMIN"));

superAdminRouter.get("/overview", asyncHandler(overviewController));
superAdminRouter.get("/schools", asyncHandler(schoolsController));
superAdminRouter.get("/users", asyncHandler(usersController));
superAdminRouter.get("/activity", asyncHandler(activityController));
superAdminRouter.patch("/schools/:schoolId/subscription", asyncHandler(subscriptionController));
superAdminRouter.patch("/users/:userId/status", asyncHandler(userStatusController));
