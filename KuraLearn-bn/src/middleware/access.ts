import { UserRole } from "@prisma/client";
import { AppError } from "../http/errors.js";
import { prisma } from "../prisma/client.js";

/**
 * Record-level access checks. `requireRole` only says what kind of user is calling;
 * these helpers decide whether that user may touch a specific school, class or student.
 */

export type Actor = {
  id: string;
  role: UserRole;
  /** The school the actor works or studies in. Parents and super admins have none. */
  schoolId: string | null;
  /** The actor's own student record, for students. */
  studentId: string | null;
  /** Children a parent is linked to and allowed to view reports for. */
  childStudentIds: Set<string>;
  /** School of each linked child, because a parent can have children in different schools. */
  childSchoolIds: Set<string>;
};

const SENSITIVE_STUDENT_FIELDS = [
  "dateOfBirth",
  "birthCertificateNumber",
  "nationalId",
  "nationality",
  "medicalNotes",
  "hasDisability",
  "disabilityType",
  "inclusiveEducationNotes",
  "specialSupportNeeds",
  "previousSchool",
  "province",
  "district",
  "sector",
  "cell",
  "village"
] as const;

export function isStaffRole(role: UserRole) {
  return role !== UserRole.STUDENT && role !== UserRole.PARENT;
}

export async function getActor(userId: string): Promise<Actor> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      teacher: { select: { schoolId: true } },
      staff: { select: { schoolId: true } },
      student: { select: { id: true, schoolId: true } },
      parent: {
        select: {
          students: {
            select: {
              studentId: true,
              canViewReports: true,
              student: { select: { schoolId: true } }
            }
          }
        }
      }
    }
  });
  if (!user) throw new AppError(401, "Authentication is required", "AUTH_REQUIRED");

  const viewableChildren = user.parent?.students.filter((link) => link.canViewReports) ?? [];

  return {
    id: user.id,
    role: user.role,
    schoolId: user.teacher?.schoolId ?? user.staff?.schoolId ?? user.student?.schoolId ?? null,
    studentId: user.student?.id ?? null,
    childStudentIds: new Set(viewableChildren.map((link) => link.studentId)),
    childSchoolIds: new Set(
      viewableChildren.map((link) => link.student.schoolId).filter((id): id is string => !!id)
    )
  };
}

/** The school a user acts within. Only a super admin, who has no school of their own, falls back to the first one. */
export async function resolveActorSchoolId(userId: string): Promise<string> {
  const actor = await getActor(userId);
  if (actor.schoolId) return actor.schoolId;
  if (actor.role === UserRole.SUPER_ADMIN) {
    const school = await prisma.school.findFirst({ orderBy: { name: "asc" }, select: { id: true } });
    if (school) return school.id;
    throw new AppError(404, "No school found", "SCHOOL_NOT_FOUND");
  }
  throw new AppError(403, "Your account is not linked to a school", "NO_SCHOOL");
}

/** Students see themselves, parents their linked children, and staff students in their own school. */
export async function assertCanViewStudent(userId: string, studentId: string): Promise<Actor> {
  const actor = await getActor(userId);
  if (actor.role === UserRole.SUPER_ADMIN) return actor;

  const forbidden = new AppError(403, "You do not have access to this student", "STUDENT_FORBIDDEN");

  if (actor.role === UserRole.STUDENT) {
    if (actor.studentId !== studentId) throw forbidden;
    return actor;
  }
  if (actor.role === UserRole.PARENT) {
    if (!actor.childStudentIds.has(studentId)) throw forbidden;
    return actor;
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { schoolId: true }
  });
  if (!student) throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");
  if (!actor.schoolId || student.schoolId !== actor.schoolId) throw forbidden;
  return actor;
}

/**
 * Checks the actor belongs to this school. School-wide data is for staff only unless
 * `allowGuardians` is set, in which case students and parents can also read their own school.
 */
export async function assertSchoolAccess(
  userId: string,
  schoolId: unknown,
  options: { allowGuardians?: boolean } = {}
): Promise<Actor> {
  if (typeof schoolId !== "string" || !schoolId) {
    throw new AppError(400, "Missing schoolId", "MISSING_SCHOOL_ID");
  }

  const actor = await getActor(userId);
  if (actor.role === UserRole.SUPER_ADMIN) return actor;

  const forbidden = new AppError(403, "You do not have access to this school", "SCHOOL_FORBIDDEN");

  if (!isStaffRole(actor.role) && !options.allowGuardians) throw forbidden;

  const belongs = actor.role === UserRole.PARENT ? actor.childSchoolIds.has(schoolId) : actor.schoolId === schoolId;
  if (!belongs) throw forbidden;
  return actor;
}

export async function assertClassInSchool(classId: unknown, schoolId: string) {
  if (typeof classId !== "string" || !classId) {
    throw new AppError(400, "Missing classId", "MISSING_CLASS_ID");
  }
  const cls = await prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } });
  if (!cls) throw new AppError(404, "Class not found in this school", "CLASS_NOT_FOUND");
}

/** Staff from the class's own school, or a super admin. */
export async function assertStaffCanViewClass(userId: string, classId: unknown): Promise<Actor> {
  if (typeof classId !== "string" || !classId) {
    throw new AppError(400, "Missing classId", "MISSING_CLASS_ID");
  }
  const cls = await prisma.class.findUnique({ where: { id: classId }, select: { schoolId: true } });
  if (!cls) throw new AppError(404, "Class not found", "CLASS_NOT_FOUND");
  return assertSchoolAccess(userId, cls.schoolId);
}

/** Removes identity, medical and home-address details before a student record is sent in a report. */
export function toReportStudent(student: object) {
  const safe = { ...student } as Record<string, unknown>;
  for (const field of SENSITIVE_STUDENT_FIELDS) delete safe[field];

  const user = safe.user as { id?: string; name?: string } | null | undefined;
  if (user) safe.user = { id: user.id, name: user.name };
  return safe;
}
