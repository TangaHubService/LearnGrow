import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { queryAuditLogs, getAuditStats } from "./audit.service.js";

export async function getAuditLogsController(req: Request, res: Response) {
  const { action, entityType, startDate, endDate, page, pageSize } = req.query as any;
  const schoolId = req.tenantId;

  const result = await queryAuditLogs({
    schoolId,
    action,
    entityType,
    startDate,
    endDate,
    page: page ? parseInt(page) : undefined,
    pageSize: pageSize ? parseInt(pageSize) : undefined,
  });

  res.json(result);
}

export async function getAuditStatsController(req: Request, res: Response) {
  const schoolId = req.tenantId!;
  const stats = await getAuditStats(schoolId);
  res.json(stats);
}
