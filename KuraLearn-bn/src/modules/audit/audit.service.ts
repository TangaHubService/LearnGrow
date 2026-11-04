import { prisma } from "../../prisma/client.js";
import type { UserRole } from "@prisma/client";

export interface AuditEntry {
  userId?: string;
  schoolId?: string;
  role?: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      schoolId: entry.schoolId,
      role: entry.role,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: (entry.metadata ?? {}) as any,
    },
  });
}

interface AuditFilter {
  schoolId?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function queryAuditLogs(filter: AuditFilter) {
  const where: any = {};

  if (filter.schoolId) where.schoolId = filter.schoolId;
  if (filter.userId) where.userId = filter.userId;
  if (filter.action) where.action = filter.action;
  if (filter.entityType) where.entityType = filter.entityType;
  if (filter.startDate || filter.endDate) {
    where.createdAt = {};
    if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
    if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
  }

  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // AuditLog.userId is a plain column, not a Prisma relation, so users are loaded separately.
  const userIds = [...new Set(logs.map((l) => l.userId).filter((id): id is string => !!id))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, role: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return {
    logs: logs.map((l) => {
      const user = l.userId ? userById.get(l.userId) : undefined;
      return {
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        metadata: l.metadata,
        createdAt: l.createdAt,
        user: user ? { name: user.name, email: user.email, role: user.role } : null,
      };
    }),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getAuditStats(schoolId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalLogs, recentActions, actionBreakdown] = await Promise.all([
    prisma.auditLog.count({ where: { schoolId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.auditLog.findMany({
      where: { schoolId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      where: { schoolId, createdAt: { gte: thirtyDaysAgo } },
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
    }),
  ]);

  return {
    totalLogs,
    recentActions: recentActions.map((a) => ({
      action: a.action,
      entityType: a.entityType,
      createdAt: a.createdAt,
    })),
    actionBreakdown: actionBreakdown.map((a) => ({
      action: a.action,
      count: a._count.action,
    })),
  };
}
