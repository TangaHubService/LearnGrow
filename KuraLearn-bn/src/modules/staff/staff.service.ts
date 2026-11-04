import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { resolveActorSchoolId } from "../../middleware/access.js";
import { AppError } from "../../http/errors.js";
import { env } from "../../config/env.js";
import { sendStaffInvitationEmail } from "../../services/email.service.js";
import type {
  CreateStaffInput,
  UpdateStaffInput,
  AssignClassesInput,
  StaffListQuery,
} from "./staff.schemas.js";

// ─── Token helpers ──────────────────────────────────────────────────────────

const TOKEN_TTL_HOURS = 48;

function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function tokenExpiresAt(): Date {
  const date = new Date();
  date.setHours(date.getHours() + TOKEN_TTL_HOURS);
  return date;
}

// ─── School resolution helper ────────────────────────────────────────────────

export function resolveSchoolId(userId: string): Promise<string> {
  return resolveActorSchoolId(userId);
}

// ─── Map staffRole to UserRole ───────────────────────────────────────────────

function staffRoleToUserRole(staffRole: string): UserRole {
  if (staffRole === "HEADTEACHER") return UserRole.HEAD_TEACHER;
  if (staffRole === "SCHOOL_ADMIN") return UserRole.ADMIN;
  if (staffRole === "DIRECTOR_OF_STUDIES") return UserRole.DIRECTOR_OF_STUDIES;
  if (staffRole === "TEACHER") return UserRole.TEACHER;
  return UserRole.TEACHER; // All other staff use TEACHER role for portal access
}

// ─── Sync teachers to staff automatically ─────────────────────────────────────

async function syncTeachersToStaff(schoolId: string) {
  try {
    const teachers = await prisma.teacher.findMany({
      where: {
        schoolId,
        user: {
          staff: null,
        },
      },
      include: {
        user: true,
      },
    });

    if (teachers.length === 0) return;

    for (const t of teachers) {
      let staffRole = "TEACHER";
      if (t.user.role === UserRole.HEAD_TEACHER) {
        staffRole = "HEADTEACHER";
      } else if (t.user.role === UserRole.ADMIN) {
        staffRole = "SCHOOL_ADMIN";
      } else if (t.user.role === UserRole.DIRECTOR_OF_STUDIES) {
        staffRole = "DIRECTOR_OF_STUDIES";
      }

      try {
        await prisma.$transaction(async (tx) => {
          const staff = await tx.staff.create({
            data: {
              userId: t.userId,
              schoolId: t.schoolId,
              staffRole: staffRole as any,
              employmentStatus: "PERMANENT",
              invitationStatus: "ACCEPTED",
            },
          });

          // Sync existing assignments
          const legacyAssignments = await tx.teacherClassAssignment.findMany({
            where: { teacherId: t.id, status: "ACTIVE" },
          });

          for (const la of legacyAssignments) {
            const subject = await tx.subject.findFirst({
              where: { name: la.subjectName, level: { classes: { some: { id: la.classId } } } },
            });

            await tx.staffAssignment.create({
              data: {
                staffId: staff.id,
                classId: la.classId,
                subjectId: subject?.id ?? null,
                subjectName: la.subjectName,
                status: "ACTIVE",
              },
            }).catch(() => {});
          }
        });
      } catch (err) {
        console.error(`[Staff Sync] Failed to sync teacher ${t.id} to staff:`, err);
      }
    }
  } catch (err) {
    console.error("[Staff Sync] Failed during teacher-to-staff sync:", err);
  }
}

// ─── List staff ──────────────────────────────────────────────────────────────

export async function listStaff(schoolId: string, query: StaffListQuery) {
  await syncTeachersToStaff(schoolId);
  const { search, role, status, invitationStatus, classId, subjectId, page, pageSize, sortBy, sortDir } = query;

  // Build the where clause for Staff
  const where: Record<string, unknown> = { schoolId };

  if (role) where.staffRole = role;
  if (invitationStatus) where.invitationStatus = invitationStatus;

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  } else if (status) {
    where.user = { status };
  }

  if (search && status) {
    where.user = {
      AND: [
        { OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]},
        { status },
      ],
    };
  }

  if (classId || subjectId) {
    where.assignments = {
      some: {
        ...(classId ? { classId } : {}),
        ...(subjectId ? { subjectId } : {}),
        status: "ACTIVE",
      },
    };
  }

  // Phone search requires joining through staff.phone field directly
  if (search) {
    const phoneSearch = {
      AND: [
        {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        },
        ...(status ? [{ user: { status } }] : []),
      ],
    };
    Object.assign(where, phoneSearch);
    // Remove redundant user key if phone search overrides it
    if ("user" in where && search) {
      delete where.user;
    }
  }

  const orderByMap: Record<string, object> = {
    name: { user: { name: sortDir } },
    email: { user: { email: sortDir } },
    createdAt: { createdAt: sortDir },
    staffRole: { staffRole: sortDir },
  };

  const [total, items] = await Promise.all([
    prisma.staff.count({ where: where as any }),
    prisma.staff.findMany({
      where: where as any,
      include: {
        user: { select: { id: true, name: true, email: true, status: true, lastLoginAt: true } },
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            class: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: orderByMap[sortBy] || { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = items.map((s) => ({
    id: s.id,
    userId: s.userId,
    name: s.user.name,
    email: s.user.email,
    phone: s.phone ?? null,
    gender: s.gender ?? null,
    staffRole: s.staffRole,
    employmentStatus: s.employmentStatus,
    status: s.user.status,
    invitationStatus: s.invitationStatus,
    invitationSentAt: s.invitationSentAt ?? null,
    lastLoginAt: s.user.lastLoginAt ?? null,
    assignedClasses: [...new Set(s.assignments.map((a) => a.class?.name).filter(Boolean))],
    assignedSubjects: [...new Set(s.assignments.map((a) => a.subjectName).filter(Boolean))],
    assignmentCount: s.assignments.length,
  }));

  return {
    data,
    pagination: {
      page,
      limit: pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// ─── Get staff by ID ─────────────────────────────────────────────────────────

export async function getStaffById(staffId: string, schoolId: string) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, schoolId },
    include: {
      user: { select: { id: true, name: true, email: true, status: true, lastLoginAt: true, createdAt: true } },
      assignments: {
        where: { status: "ACTIVE" },
        include: {
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
        },
      },
      invitedBy: { select: { id: true, name: true } },
    },
  });

  if (!staff) throw new AppError(404, "Staff member not found", "STAFF_NOT_FOUND");

  // If teacher, load performance summary
  let teacherSummary = null;
  if (staff.staffRole === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: staff.userId } });
    if (teacher) {
      const [lessonsCount, marksSubmitted, marksApproved, resourcesCount, attendanceCount] =
        await Promise.all([
          prisma.lesson.count({ where: { teacherId: teacher.id } }),
          prisma.mark.count({ where: { teacherId: teacher.id, status: "SUBMITTED" } }),
          prisma.mark.count({ where: { teacherId: teacher.id, status: "APPROVED" } }),
          prisma.teacherResource.count({ where: { ownerId: staff.userId, status: "ACTIVE" } }),
          prisma.attendanceRecord.count({
            where: {
              teacherId: teacher.id,
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ]);

      teacherSummary = {
        assignedClassesCount: [...new Set(staff.assignments.map((a) => a.classId).filter(Boolean))].length,
        assignedSubjectsCount: [...new Set(staff.assignments.map((a) => a.subjectName).filter(Boolean))].length,
        lessonsCreated: lessonsCount,
        marksSubmitted,
        marksApproved,
        resourcesUploaded: resourcesCount,
        attendanceSessionsThisMonth: attendanceCount,
      };
    }
  }

  return {
    id: staff.id,
    userId: staff.userId,
    name: staff.user.name,
    email: staff.user.email,
    phone: staff.phone ?? null,
    gender: staff.gender ?? null,
    staffRole: staff.staffRole,
    employmentStatus: staff.employmentStatus,
    status: staff.user.status,
    invitationStatus: staff.invitationStatus,
    invitationSentAt: staff.invitationSentAt ?? null,
    lastLoginAt: staff.user.lastLoginAt ?? null,
    createdAt: staff.user.createdAt,
    invitedBy: staff.invitedBy ? { id: staff.invitedBy.id, name: staff.invitedBy.name } : null,
    assignments: staff.assignments.map((a) => ({
      id: a.id,
      classId: a.classId ?? null,
      className: a.class?.name ?? null,
      subjectId: a.subjectId ?? null,
      subjectName: a.subjectName ?? null,
    })),
    teacherSummary,
  };
}

// ─── Create staff ─────────────────────────────────────────────────────────────

export async function createStaff(
  inviterId: string,
  schoolId: string,
  input: CreateStaffInput
) {
  const email = input.email.toLowerCase();

  // Check email uniqueness
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "A user with this email already exists", "EMAIL_TAKEN");
  }

  // Get school
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } });
  if (!school) throw new AppError(404, "School not found", "SCHOOL_NOT_FOUND");

  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const userRole = staffRoleToUserRole(input.staffRole);

  // Generate temporary password (never returned to client)
  const tempPassword = crypto.randomBytes(8).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // Generate invitation token
  const invitationToken = generateInvitationToken();
  const tokenExpiry = tokenExpiresAt();

  const result = await prisma.$transaction(async (tx) => {
    // Create user account
    const user = await tx.user.create({
      data: {
        email,
        name: fullName,
        passwordHash,
        role: userRole,
        status: UserStatus.PENDING,
      },
    });

    // Create staff record
    const staff = await tx.staff.create({
      data: {
        userId: user.id,
        schoolId,
        staffRole: input.staffRole as any,
        phone: input.phone ?? null,
        gender: input.gender as any ?? null,
        employmentStatus: input.employmentStatus as any,
        invitationStatus: "PENDING",
        invitationToken,
        invitedById: inviterId,
      },
    });

    // Create Teacher record if staffRole is TEACHER
    let teacherId: string | null = null;
    if (input.staffRole === "TEACHER") {
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          schoolId,
        },
      });
      teacherId = teacher.id;
    }

    // If teacher and assignments provided, create them
    if (input.staffRole === "TEACHER" && input.classIds?.length && input.subjectIds?.length) {
      const subjects = await tx.subject.findMany({
        where: { id: { in: input.subjectIds } },
        select: { id: true, name: true },
      });
      const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

      const activeYear = await tx.academicYear.findFirst({
        where: { schoolId, status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      });

      for (const classId of input.classIds) {
        for (const subjectId of input.subjectIds) {
          const subjectName = subjectMap.get(subjectId) ?? "";
          await tx.staffAssignment.create({
            data: {
              staffId: staff.id,
              classId,
              subjectId,
              subjectName,
              status: "ACTIVE",
            },
          }).catch(() => {
            // Ignore duplicate constraint violations
          });

          if (teacherId) {
            await tx.teacherClassAssignment.create({
              data: {
                schoolId,
                teacherId: teacherId,
                classId,
                subjectName,
                academicYearId: activeYear?.id ?? null,
                status: "ACTIVE",
              },
            }).catch(() => {
              // Ignore duplicate
            });
          }
        }
      }
    }

    return { user, staff };
  });

  // Send invitation email if requested
  if (input.sendInvitation) {
    const setupLink = `${env.FRONTEND_URL}/setup-password?token=${invitationToken}&expires=${tokenExpiry.getTime()}`;
    await sendStaffInvitationEmail({
      staffName: fullName,
      schoolName: school.name,
      role: input.staffRole,
      email,
      setupLink,
    }).catch((err) => {
      // Non-fatal: log the error, don't fail the creation
      console.error("[Staff] Failed to send invitation email:", err);
    });

    // Update invitation status to SENT
    await prisma.staff.update({
      where: { id: result.staff.id },
      data: { invitationStatus: "SENT", invitationSentAt: new Date() },
    });
  }

  return {
    id: result.staff.id,
    userId: result.user.id,
    name: fullName,
    email,
    staffRole: input.staffRole,
    invitationStatus: input.sendInvitation ? "SENT" : "PENDING",
  };
}

// ─── Update staff ─────────────────────────────────────────────────────────────

export async function updateStaff(
  staffId: string,
  schoolId: string,
  input: UpdateStaffInput
) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, schoolId },
    include: { user: true },
  });
  if (!staff) throw new AppError(404, "Staff member not found", "STAFF_NOT_FOUND");

  // Prevent modifying SUPER_ADMIN users
  if (staff.user.role === "SUPER_ADMIN") {
    throw new AppError(403, "Cannot modify super admin users", "FORBIDDEN");
  }

  // Compute new full name if either first/last name changed
  const currentParts = staff.user.name.split(" ");
  const currentFirst = currentParts[0] ?? "";
  const currentLast = currentParts.slice(1).join(" ");

  const newFirst = input.firstName ?? currentFirst;
  const newLast = input.lastName ?? currentLast;
  const newName = `${newFirst} ${newLast}`.trim();

  await prisma.$transaction(async (tx) => {
    // Update user name and status
    const userUpdate: Record<string, unknown> = { name: newName };
    if (input.status) userUpdate.status = input.status;
    await tx.user.update({ where: { id: staff.userId }, data: userUpdate });

    // Update staff fields
    const staffUpdate: Record<string, unknown> = {};
    if (input.phone !== undefined) staffUpdate.phone = input.phone;
    if (input.gender) staffUpdate.gender = input.gender;
    if (input.staffRole) staffUpdate.staffRole = input.staffRole;
    if (input.employmentStatus) staffUpdate.employmentStatus = input.employmentStatus;

    if (Object.keys(staffUpdate).length > 0) {
      await tx.staff.update({ where: { id: staffId }, data: staffUpdate });
    }

    // Sync legacy Teacher record if staff role changes to TEACHER
    if (input.staffRole === "TEACHER") {
      const existingTeacher = await tx.teacher.findUnique({ where: { userId: staff.userId } });
      if (!existingTeacher) {
        await tx.teacher.create({
          data: {
            userId: staff.userId,
            schoolId,
          },
        });
      }
    }
  });

  return { success: true, message: "Staff member updated" };
}

// ─── Send invitation ──────────────────────────────────────────────────────────

export async function sendInvitation(staffId: string, schoolId: string, inviterId: string) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, schoolId },
    include: { user: { select: { name: true, email: true, status: true } }, school: { select: { name: true } } },
  });
  if (!staff) throw new AppError(404, "Staff member not found", "STAFF_NOT_FOUND");

  if (staff.invitationStatus === "ACCEPTED") {
    throw new AppError(400, "Staff member has already accepted the invitation", "ALREADY_ACCEPTED");
  }

  if (staff.user.status === "SUSPENDED") {
    throw new AppError(400, "Cannot invite an inactive staff member", "STAFF_INACTIVE");
  }

  const token = generateInvitationToken();
  const expiry = tokenExpiresAt();
  const setupLink = `${env.FRONTEND_URL}/setup-password?token=${token}&expires=${expiry.getTime()}`;

  await prisma.staff.update({
    where: { id: staffId },
    data: {
      invitationToken: token,
      invitationStatus: "SENT",
      invitationSentAt: new Date(),
      invitedById: inviterId,
    },
  });

  await sendStaffInvitationEmail({
    staffName: staff.user.name,
    schoolName: staff.school?.name ?? "Your School",
    role: staff.staffRole,
    email: staff.user.email,
    setupLink,
  });

  return { success: true, message: "Invitation email sent" };
}

// ─── Resend invitation ────────────────────────────────────────────────────────

export async function resendInvitation(staffId: string, schoolId: string, inviterId: string) {
  return sendInvitation(staffId, schoolId, inviterId);
}

// ─── Upsert class/subject assignments ────────────────────────────────────────

export async function upsertAssignments(
  staffId: string,
  schoolId: string,
  input: AssignClassesInput
) {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, schoolId },
    select: { id: true, userId: true, staffRole: true },
  });
  if (!staff) throw new AppError(404, "Staff member not found", "STAFF_NOT_FOUND");

  if (staff.staffRole !== "TEACHER") {
    throw new AppError(400, "Class/subject assignments are only for teachers", "NOT_A_TEACHER");
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: staff.userId } });
  const activeYear = await prisma.academicYear.findFirst({
    where: { schoolId, status: "ACTIVE" },
    orderBy: { startDate: "desc" },
  });

  const created: string[] = [];
  const skipped: string[] = [];

  for (const a of input.assignments) {
    const subjectName = a.subjectName.trim();
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.staffAssignment.findFirst({
        where: {
          staffId,
          classId: a.classId,
          subjectName,
        },
      });

      if (existing) {
        if (existing.status !== "ACTIVE" || existing.subjectId !== (a.subjectId ?? null)) {
          await tx.staffAssignment.update({
            where: { id: existing.id },
            data: {
              subjectId: a.subjectId ?? null,
              status: "ACTIVE",
            },
          });
        }

        if (teacher) {
          const teacherAssignment = await tx.teacherClassAssignment.findUnique({
            where: {
              teacherId_classId_subjectName: {
                teacherId: teacher.id,
                classId: a.classId,
                subjectName,
              },
            },
          });

          if (!teacherAssignment) {
            await tx.teacherClassAssignment.create({
              data: {
                schoolId,
                teacherId: teacher.id,
                classId: a.classId,
                subjectName,
                academicYearId: activeYear?.id ?? null,
                status: "ACTIVE",
              },
            });
          } else if (teacherAssignment.status !== "ACTIVE") {
            await tx.teacherClassAssignment.update({
              where: { id: teacherAssignment.id },
              data: {
                academicYearId: teacherAssignment.academicYearId ?? activeYear?.id ?? null,
                status: "ACTIVE",
              },
            });
          }
        }

        return existing.status === "ACTIVE" ? "skipped" : "created";
      }

      await tx.staffAssignment.create({
        data: {
          staffId,
          classId: a.classId,
          subjectId: a.subjectId ?? null,
          subjectName,
          status: "ACTIVE",
        },
      });

      if (teacher) {
        const teacherAssignment = await tx.teacherClassAssignment.findUnique({
          where: {
            teacherId_classId_subjectName: {
              teacherId: teacher.id,
              classId: a.classId,
              subjectName,
            },
          },
        });

        if (!teacherAssignment) {
          await tx.teacherClassAssignment.create({
            data: {
              schoolId,
              teacherId: teacher.id,
              classId: a.classId,
              subjectName,
              academicYearId: activeYear?.id ?? null,
              status: "ACTIVE",
            },
          });
        } else if (teacherAssignment.status !== "ACTIVE") {
          await tx.teacherClassAssignment.update({
            where: { id: teacherAssignment.id },
            data: {
              academicYearId: teacherAssignment.academicYearId ?? activeYear?.id ?? null,
              status: "ACTIVE",
            },
          });
        }
      }

      return "created";
    });

    if (result === "created") {
      created.push(a.classId);
    } else {
      skipped.push(a.classId);
    }
  }

  return {
    success: true,
    created: created.length,
    skipped: skipped.length,
    message: `${created.length} assignment(s) added, ${skipped.length} duplicate(s) skipped`,
  };
}

// ─── Delete assignment ────────────────────────────────────────────────────────

export async function deleteAssignment(staffId: string, assignmentId: string, schoolId: string) {
  const assignment = await prisma.staffAssignment.findFirst({
    where: { id: assignmentId, staffId, staff: { schoolId } },
    include: { staff: true },
  });
  if (!assignment) throw new AppError(404, "Assignment not found", "ASSIGNMENT_NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await tx.staffAssignment.delete({ where: { id: assignmentId } });

    if (assignment.staff.staffRole === "TEACHER") {
      const teacher = await tx.teacher.findUnique({ where: { userId: assignment.staff.userId } });
      if (teacher) {
        await tx.teacherClassAssignment.deleteMany({
          where: {
            teacherId: teacher.id,
            classId: assignment.classId ?? undefined,
            subjectName: assignment.subjectName ?? undefined,
          },
        });
      }
    }
  });

  return { success: true, message: "Assignment removed" };
}

// ─── Update staff status ──────────────────────────────────────────────────────

export async function updateStaffStatus(staffId: string, schoolId: string, status: "ACTIVE" | "PENDING" | "SUSPENDED") {
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, schoolId },
    include: { user: { select: { role: true } } },
  });
  if (!staff) throw new AppError(404, "Staff member not found", "STAFF_NOT_FOUND");

  if (staff.user.role === "SUPER_ADMIN") {
    throw new AppError(403, "Cannot modify super admin users", "FORBIDDEN");
  }

  await prisma.user.update({
    where: { id: staff.userId },
    data: { status },
  });

  return { success: true, status, message: `Staff member ${status === "ACTIVE" ? "activated" : "deactivated"}` };
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getStaffAnalytics(schoolId: string) {
  await syncTeachersToStaff(schoolId);
  const [
    totalStaff,
    teachers,
    activeStaff,
    pendingInvitations,
    inactiveStaff,
    byRole,
  ] = await Promise.all([
    prisma.staff.count({ where: { schoolId } }),
    prisma.staff.count({ where: { schoolId, staffRole: "TEACHER" } }),
    prisma.staff.count({ where: { schoolId, user: { status: "ACTIVE" } } }),
    prisma.staff.count({ where: { schoolId, invitationStatus: { in: ["PENDING", "SENT"] } } }),
    prisma.staff.count({ where: { schoolId, user: { status: "SUSPENDED" } } }),
    prisma.staff.groupBy({
      by: ["staffRole"],
      where: { schoolId },
      _count: { id: true },
    }),
  ]);

  return {
    totalStaff,
    teachers,
    activeStaff,
    pendingInvitations,
    inactiveStaff,
    byRole: byRole.map((r) => ({ role: r.staffRole, count: r._count.id })),
  };
}

// ─── Setup password (public endpoint) ────────────────────────────────────────

export async function setupPassword(token: string, password: string) {
  if (!token || token.length !== 64) {
    throw new AppError(400, "Invalid or expired setup link", "INVALID_TOKEN");
  }

  const staff = await prisma.staff.findFirst({
    where: { invitationToken: token },
    include: { user: true },
  });

  if (!staff) {
    throw new AppError(400, "Invalid or expired setup link", "INVALID_TOKEN");
  }

  // Check token expiry (48h from invitationSentAt)
  if (staff.invitationSentAt) {
    const expiresAt = new Date(staff.invitationSentAt);
    expiresAt.setHours(expiresAt.getHours() + TOKEN_TTL_HOURS);
    if (new Date() > expiresAt) {
      await prisma.staff.update({
        where: { id: staff.id },
        data: { invitationStatus: "EXPIRED" },
      });
      throw new AppError(400, "This setup link has expired. Please ask your admin to resend the invitation.", "TOKEN_EXPIRED");
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: staff.userId },
      data: { passwordHash, status: UserStatus.ACTIVE, lastLoginAt: new Date() },
    }),
    prisma.staff.update({
      where: { id: staff.id },
      data: {
        invitationStatus: "ACCEPTED",
        invitationToken: null,
      },
    }),
  ]);

  return { success: true, message: "Password set successfully. You can now log in." };
}
