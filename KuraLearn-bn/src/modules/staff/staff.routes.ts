import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as controller from "./staff.controller.js";

export const staffRouter = Router();

// All staff management routes require authentication + school admin level role
staffRouter.use(requireAuth, requireRole("HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"));

// Analytics must be before :id routes to avoid route conflict
staffRouter.get("/analytics", asyncHandler(controller.getStaffAnalytics));

// Staff list and creation
staffRouter.get("/", asyncHandler(controller.listStaff));
staffRouter.post("/", asyncHandler(controller.createStaff));

// Single staff operations
staffRouter.get("/:id", asyncHandler(controller.getStaff));
staffRouter.put("/:id", asyncHandler(controller.updateStaff));
staffRouter.patch("/:id/status", asyncHandler(controller.updateStatus));

// Invitation flows
staffRouter.post("/:id/invite", asyncHandler(controller.inviteStaff));
staffRouter.post("/:id/resend-invite", asyncHandler(controller.resendInvite));

// Class/subject assignments
staffRouter.post("/:id/assignments", asyncHandler(controller.assignClasses));
staffRouter.delete("/:id/assignments/:assignmentId", asyncHandler(controller.removeAssignment));
