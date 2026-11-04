import type { Request, Response } from "express";
import { getAdminDashboard } from "./admin.service.js";
import { provisionSchool, getSchoolAnalytics } from "./tenant.service.js";
import { createSchoolSchema } from "./admin.schemas.js";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { createAuditLog } from "../audit/audit.service.js";

export async function adminDashboardController(req: Request, res: Response) {
  const dashboard = await getAdminDashboard(req.tenantId, getAuthenticatedUser(req).sub);
  res.json(dashboard);
}

export async function createSchoolController(req: Request, res: Response) {
  const input = createSchoolSchema.parse(req.body);
  const result = await provisionSchool(input);
  await createAuditLog({
    userId: req.user?.sub,
    schoolId: result.school.id,
    role: "SUPER_ADMIN",
    action: "CREATE_SCHOOL",
    entityType: "School",
    entityId: result.school.id
  });
  res.status(201).json(result);
}

export async function getSchoolAnalyticsController(req: Request, res: Response) {
  const analytics = await getSchoolAnalytics(req.params.schoolId as string);
  res.json(analytics);
}
