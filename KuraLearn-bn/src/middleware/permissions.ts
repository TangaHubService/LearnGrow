import type { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { AppError } from "../http/errors.js";
import type { AuthRole } from "./auth.js";

export type Permission =
  | "student:read" | "student:write" | "student:delete"
  | "mark:read" | "mark:write" | "mark:approve"
  | "attendance:read" | "attendance:write"
  | "class:read" | "class:write" | "class:delete"
  | "lesson:read" | "lesson:write" | "lesson:publish"
  | "course:read" | "course:write" | "course:delete"
  | "assessment:read" | "assessment:write" | "assessment:delete"
  | "timetable:read" | "timetable:write"
  | "report:read" | "report:generate"
  | "analytics:read"
  | "staff:read" | "staff:write"
  | "ai:use"
  | "settings:read" | "settings:write"
  | "audit:read"
  | "export:csv" | "export:excel" | "export:pdf";

const ROLE_PERMISSIONS: Record<AuthRole, Permission[]> = {
  SUPER_ADMIN: [
    "student:read", "student:write", "student:delete",
    "mark:read", "mark:write", "mark:approve",
    "attendance:read", "attendance:write",
    "class:read", "class:write", "class:delete",
    "lesson:read", "lesson:write", "lesson:publish",
    "course:read", "course:write", "course:delete",
    "assessment:read", "assessment:write", "assessment:delete",
    "timetable:read", "timetable:write",
    "report:read", "report:generate",
    "analytics:read",
    "staff:read", "staff:write",
    "ai:use",
    "settings:read", "settings:write",
    "audit:read",
    "export:csv", "export:excel", "export:pdf",
  ],
  ADMIN: [
    "student:read", "student:write",
    "mark:read", "mark:approve",
    "attendance:read", "attendance:write",
    "class:read", "class:write",
    "lesson:read", "lesson:write", "lesson:publish",
    "course:read", "course:write",
    "assessment:read", "assessment:write",
    "timetable:read", "timetable:write",
    "report:read", "report:generate",
    "analytics:read",
    "staff:read", "staff:write",
    "ai:use",
    "settings:read", "settings:write",
    "audit:read",
    "export:csv", "export:excel", "export:pdf",
  ],
  HEAD_TEACHER: [
    "student:read", "student:write",
    "mark:read", "mark:approve",
    "attendance:read", "attendance:write",
    "class:read", "class:write",
    "lesson:read", "lesson:publish",
    "course:read",
    "assessment:read",
    "timetable:read",
    "report:read", "report:generate",
    "analytics:read",
    "staff:read",
    "ai:use",
    "settings:read",
    "audit:read",
    "export:csv", "export:excel", "export:pdf",
  ],
  DIRECTOR_OF_STUDIES: [
    "student:read",
    "mark:read", "mark:approve",
    "attendance:read",
    "class:read",
    "lesson:read",
    "assessment:read",
    "timetable:read",
    "report:read", "report:generate",
    "analytics:read",
    "export:csv", "export:excel", "export:pdf",
  ],
  TEACHER: [
    "student:read",
    "mark:read", "mark:write",
    "attendance:read", "attendance:write",
    "class:read",
    "lesson:read", "lesson:write",
    "course:read",
    "assessment:read", "assessment:write",
    "timetable:read",
    "report:read",
    "ai:use",
    "export:csv",
  ],
  PARENT: [
    "student:read",
    "mark:read",
    "attendance:read",
    "report:read",
    "analytics:read",
  ],
  STUDENT: [
    "lesson:read",
    "course:read",
    "assessment:read",
    "mark:read",
    "attendance:read",
    "timetable:read",
    "report:read",
    "analytics:read",
    "ai:use",
  ],
};

export function getRolePermissions(role: AuthRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "Authentication is required", "AUTH_REQUIRED");
    }

    const userPermissions = req.user.roles.flatMap((role) =>
      getRolePermissions(role as AuthRole)
    );

    const hasAll = permissions.every((p) => userPermissions.includes(p));
    if (!hasAll) {
      throw new AppError(403, "You do not have permission for this action", "FORBIDDEN");
    }

    next();
  };
}

export class PolicyEngine {
  static async canEditClass(userId: string, classId: string): Promise<boolean> {
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) return false;
    const assignment = await prisma.teacherClassAssignment.findFirst({
      where: { teacherId: teacher.id, classId, status: "ACTIVE" },
    });
    return !!assignment;
  }

  static async canEditStudent(userId: string, studentId: string): Promise<boolean> {
    const parent = await prisma.parent.findUnique({ where: { userId } });
    if (parent) {
      const link = await prisma.studentParent.findUnique({
        where: { studentId_parentId: { studentId, parentId: parent.id } },
      });
      return !!link;
    }
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (teacher) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { classId: true },
      });
      if (!student?.classId) return false;
      return this.canEditClass(userId, student.classId);
    }
    return false;
  }

  static async canAccessStudentData(userId: string, studentId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, student: true, parent: true, teacher: true, staff: true },
    });
    if (!user) return false;
    if (["SUPER_ADMIN", "ADMIN", "HEAD_TEACHER"].includes(user.role)) return true;
    if (user.student && user.student.id === studentId) return true;
    if (user.parent) {
      const link = await prisma.studentParent.findUnique({
        where: { studentId_parentId: { studentId, parentId: user.parent.id } },
      });
      return !!link;
    }
    return false;
  }
}
