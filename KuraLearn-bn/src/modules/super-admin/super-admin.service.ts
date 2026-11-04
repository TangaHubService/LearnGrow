import { Prisma, type SubscriptionStatus, type UserStatus } from "@prisma/client";
import type { z } from "zod";
import { AppError } from "../../http/errors.js";
import { prisma } from "../../prisma/client.js";
import { createAuditLog } from "../audit/audit.service.js";
import type { activityQuerySchema, schoolsQuerySchema, usersQuerySchema } from "./super-admin.schemas.js";

const ACTIVE_WINDOW_DAYS = 30;

function pageMeta(total: number, page: number, pageSize: number) {
  return { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

function contains(search: string): Prisma.StringFilter {
  return { contains: search, mode: "insensitive" };
}

export async function listSchools(query: z.infer<typeof schoolsQuerySchema>) {
  const { page, pageSize, search, status } = query;
  const where: Prisma.SchoolWhereInput = {
    ...(status ? { subscriptionStatus: status } : {}),
    ...(search ? { OR: [{ name: contains(search) }, { district: contains(search) }] } : {})
  };
  const [schools, total] = await Promise.all([
    prisma.school.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        district: true,
        province: true,
        type: true,
        subscriptionStatus: true,
        email: true,
        phone: true,
        _count: { select: { students: true, teachers: true, staff: true, classes: true } }
      }
    }),
    prisma.school.count({ where })
  ]);

  return {
    items: schools.map(({ _count, ...school }) => ({
      ...school,
      learners: _count.students,
      teachers: _count.teachers,
      staff: _count.staff,
      classes: _count.classes
    })),
    ...pageMeta(total, page, pageSize)
  };
}

export async function listUsers(query: z.infer<typeof usersQuerySchema>) {
  const { page, pageSize, search, role, status } = query;
  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search ? { OR: [{ name: contains(search) }, { email: contains(search) }] } : {})
  };
  const schoolName = { select: { school: { select: { name: true } } } };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        student: schoolName,
        teacher: schoolName,
        staff: schoolName,
        parent: { select: { students: { take: 1, select: { student: schoolName } } } }
      }
    }),
    prisma.user.count({ where })
  ]);

  return {
    items: users.map(({ student, teacher, staff, parent, ...user }) => ({
      ...user,
      schoolName:
        student?.school?.name ??
        teacher?.school?.name ??
        staff?.school?.name ??
        parent?.students[0]?.student.school?.name ??
        null
    })),
    ...pageMeta(total, page, pageSize)
  };
}

/** Audit metadata can hold personal details, so only the summary fields leave this function. */
export async function listActivity(query: z.infer<typeof activityQuerySchema>) {
  const { page, pageSize, search, schoolId } = query;
  const where: Prisma.AuditLogWhereInput = {
    ...(schoolId ? { schoolId } : {}),
    ...(search ? { OR: [{ action: contains(search) }, { entityType: contains(search) }] } : {})
  };
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, action: true, entityType: true, role: true, createdAt: true, userId: true, schoolId: true }
    }),
    prisma.auditLog.count({ where })
  ]);

  const ids = (values: Array<string | null>) => [...new Set(values.filter((value): value is string => Boolean(value)))];
  const [users, schools] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: ids(logs.map((log) => log.userId)) } }, select: { id: true, name: true } }),
    prisma.school.findMany({ where: { id: { in: ids(logs.map((log) => log.schoolId)) } }, select: { id: true, name: true } })
  ]);
  const userNames = new Map(users.map((user) => [user.id, user.name]));
  const schoolNames = new Map(schools.map((school) => [school.id, school.name]));

  return {
    items: logs.map(({ userId, schoolId: logSchoolId, ...log }) => ({
      ...log,
      actorName: userId ? (userNames.get(userId) ?? null) : null,
      schoolName: logSchoolId ? (schoolNames.get(logSchoolId) ?? null) : null
    })),
    ...pageMeta(total, page, pageSize)
  };
}

export async function getOverview() {
  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [schoolsByStatus, usersByRole, usersByStatus, activeUsers, classes, aiUsage, schools, activity] = await Promise.all([
    prisma.school.groupBy({ by: ["subscriptionStatus"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.user.count({ where: { lastLoginAt: { gte: activeSince } } }),
    prisma.class.count(),
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: activeSince } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, costEstimate: true }
    }),
    listSchools({ page: 1, pageSize: 5 }),
    listActivity({ page: 1, pageSize: 6 })
  ]);

  const totalOf = (rows: Array<{ _count: { _all: number } }>) => rows.reduce((sum, row) => sum + row._count._all, 0);

  return {
    activeWindowDays: ACTIVE_WINDOW_DAYS,
    schools: {
      total: totalOf(schoolsByStatus),
      byStatus: schoolsByStatus.map((row) => ({ status: row.subscriptionStatus, count: row._count._all }))
    },
    users: {
      total: totalOf(usersByRole),
      active: activeUsers,
      byRole: usersByRole
        .map((row) => ({ role: row.role, count: row._count._all }))
        .sort((a, b) => b.count - a.count),
      byStatus: usersByStatus.map((row) => ({ status: row.status, count: row._count._all }))
    },
    classes,
    aiUsage: {
      requests: aiUsage._count._all,
      tokens: (aiUsage._sum.inputTokens ?? 0) + (aiUsage._sum.outputTokens ?? 0),
      estimatedCost: aiUsage._sum.costEstimate ?? 0
    },
    schoolsPreview: schools.items,
    recentActivity: activity.items
  };
}

export async function updateSchoolSubscription(actorId: string, schoolId: string, status: SubscriptionStatus) {
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { subscriptionStatus: true } });
  if (!school) throw new AppError(404, "School not found", "SCHOOL_NOT_FOUND");

  const updated = await prisma.school.update({
    where: { id: schoolId },
    data: { subscriptionStatus: status },
    select: { id: true, name: true, subscriptionStatus: true }
  });
  await createAuditLog({
    userId: actorId,
    schoolId,
    role: "SUPER_ADMIN",
    action: "UPDATE_SUBSCRIPTION",
    entityType: "School",
    entityId: schoolId,
    metadata: { from: school.subscriptionStatus, to: status }
  });
  return updated;
}

export async function updateUserStatus(actorId: string, userId: string, status: UserStatus) {
  if (actorId === userId) {
    throw new AppError(400, "You cannot change the status of your own account", "CANNOT_CHANGE_OWN_STATUS");
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, name: true, status: true }
  });
  await createAuditLog({
    userId: actorId,
    role: "SUPER_ADMIN",
    action: status === "SUSPENDED" ? "SUSPEND_USER" : "REACTIVATE_USER",
    entityType: "User",
    entityId: userId,
    metadata: { from: user.status, to: status }
  });
  return updated;
}
