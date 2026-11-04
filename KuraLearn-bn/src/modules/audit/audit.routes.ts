import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { requireTenant } from "../../middleware/tenant.js";
import { getAuditLogsController, getAuditStatsController } from "./audit.controller.js";

export const auditRouter = Router();

auditRouter.use(requireAuth, requireRole("ADMIN", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "SUPER_ADMIN"), requireTenant);

auditRouter.get("/logs", asyncHandler(getAuditLogsController));
auditRouter.get("/stats", asyncHandler(getAuditStatsController));
