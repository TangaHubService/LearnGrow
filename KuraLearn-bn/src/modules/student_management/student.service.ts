import { createAuditLog } from "../audit/audit.service.js";
import { addNotification } from "../platform/platform.service.js";
import { Prisma, UserRole, Gender, StudentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client.js';
import { AppError } from '../../http/errors.js';
import type { AuthRole } from '../../middleware/auth.js';

export class StudentService {
  static async resolveSchoolScope(userId: string, roles: AuthRole[], requestedSchoolId?: string) {
    if (roles.includes("SUPER_ADMIN")) return requestedSchoolId || undefined;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true, staff: true },
    });

    if (!user) {
      throw new AppError(401, "User not found", "USER_NOT_FOUND");
    }

    const schoolId = user.teacher?.schoolId ?? user.staff?.schoolId;
    if (!schoolId) {
      throw new AppError(
        400,
        "User is not linked to any school context",
        "SCHOOL_CONTEXT_REQUIRED"
      );
    }

    return schoolId;
  }

  static async assertStudentInScope(studentId: string, schoolId?: string) {
    if (!schoolId) return;

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      select: { id: true },
    });

    if (!student) {
      throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");
    }
  }

  /**
   * Adds a learner who signed up themselves to the school. The school must know the exact
   * email, so admins cannot browse people who have not chosen to join them.
   */
  static async linkLearner(input: { email: string; classId: string; schoolId: string; actorId: string; actorRole: UserRole }) {
    const classRecord = await prisma.class.findFirst({
      where: { id: input.classId, schoolId: input.schoolId },
      select: { id: true, name: true, levelId: true, school: { select: { name: true } } },
    });
    if (!classRecord) {
      throw new AppError(404, "That class was not found in your school", "CLASS_NOT_FOUND");
    }

    // One message for every failure, so this cannot reveal which school a learner belongs to.
    const notAvailable = new AppError(
      404,
      "No learner account waiting to join a school has this email",
      "LEARNER_NOT_AVAILABLE"
    );
    const student = await prisma.student.findFirst({
      where: {
        schoolId: null,
        user: { email: input.email.trim().toLowerCase(), role: UserRole.STUDENT, status: "ACTIVE" },
      },
      select: { id: true, studentCode: true, user: { select: { id: true, name: true, email: true } } },
    });
    if (!student) throw notAvailable;

    const studentCode = student.studentCode ?? (await this.generateStudentCode());
    // Only updates while still unlinked, so two schools cannot both claim the same learner.
    const { count } = await prisma.student.updateMany({
      where: { id: student.id, schoolId: null },
      data: { schoolId: input.schoolId, classId: classRecord.id, levelId: classRecord.levelId, studentCode },
    });
    if (count === 0) throw notAvailable;

    await createAuditLog({
      userId: input.actorId,
      schoolId: input.schoolId,
      role: input.actorRole,
      action: "LINK_LEARNER",
      entityType: "Student",
      entityId: student.id,
      metadata: { classId: classRecord.id },
    });
    await addNotification(
      student.user.id,
      `You joined ${classRecord.school.name}`,
      `You have been added to class ${classRecord.name}.`
    );

    return { id: student.id, name: student.user.name, email: student.user.email, className: classRecord.name };
  }

  /**
   * Connects a parent's account to a learner, giving that parent access to the learner's
   * marks and attendance. The school confirms who the parent is before doing this.
   */
  static async linkParent(input: { studentId: string; email: string; relationship: string; schoolId: string; actorId: string; actorRole: UserRole }) {
    const user = await prisma.user.findFirst({
      where: { email: input.email.trim().toLowerCase(), role: UserRole.PARENT, status: "ACTIVE" },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      throw new AppError(404, "No parent account has this email", "PARENT_NOT_AVAILABLE");
    }

    const parent = await prisma.parent.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
      select: { id: true },
    });
    const existing = await prisma.studentParent.findUnique({
      where: { studentId_parentId: { studentId: input.studentId, parentId: parent.id } },
      select: { id: true },
    });
    if (existing) {
      throw new AppError(409, "This parent is already linked to this learner", "PARENT_ALREADY_LINKED");
    }

    await prisma.studentParent.create({
      data: { studentId: input.studentId, parentId: parent.id, relationship: input.relationship },
    });
    await createAuditLog({
      userId: input.actorId,
      schoolId: input.schoolId,
      role: input.actorRole,
      action: "LINK_PARENT",
      entityType: "Student",
      entityId: input.studentId,
      metadata: { parentId: parent.id, relationship: input.relationship },
    });
    const student = await prisma.student.findUniqueOrThrow({
      where: { id: input.studentId },
      select: { user: { select: { name: true } } },
    });
    await addNotification(
      user.id,
      "A learner was added to your account",
      `You can now follow ${student.user.name}'s progress. Contact the school if this looks wrong.`
    );

    return { parentId: parent.id, name: user.name, email: user.email };
  }

  static async unlinkParent(input: { studentId: string; parentId: string; schoolId: string; actorId: string; actorRole: UserRole }) {
    const { count } = await prisma.studentParent.deleteMany({
      where: { studentId: input.studentId, parentId: input.parentId },
    });
    if (count === 0) throw new AppError(404, "This parent is not linked to this learner", "PARENT_LINK_NOT_FOUND");

    await createAuditLog({
      userId: input.actorId,
      schoolId: input.schoolId,
      role: input.actorRole,
      action: "UNLINK_PARENT",
      entityType: "Student",
      entityId: input.studentId,
      metadata: { parentId: input.parentId },
    });
  }

  /**
   * Generates a unique student code.
   */
  static async generateStudentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.student.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });
    return `STU-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }

  /**
   * Registers a new student and handles auto-creation or linking of parents.
   */
  static async registerStudent(data: any) {
    const {
      name,
      email,
      dateOfBirth,
      gender,
      nationality,
      nationalId,
      birthCertificateNumber,
      province,
      district,
      sector,
      cell,
      village,
      stream,
      admissionDate,
      previousSchool,
      boardingStatus,
      hasDisability,
      disabilityType,
      specialSupportNeeds,
      medicalNotes,
      inclusiveEducationNotes,
      levelId,
      classId,
      schoolId,
      parentsInfo // [{ name, phone, email, nationalId, occupation, province, ... }]
    } = data;

    // Start a transaction since we create multiple records
    return await prisma.$transaction(async (tx) => {
      // 1. Generate Student Code
      const studentCode = await this.generateStudentCode();

      // 2. Create User for Student (optional if they don't login immediately, but required by schema)
      const studentUserEmail = email || `student_${studentCode.toLowerCase()}@kuralearn.local`;
      const passwordHash = await bcrypt.hash(studentCode, 10);

      const user = await tx.user.create({
        data: {
          name,
          email: studentUserEmail,
          passwordHash,
          role: UserRole.STUDENT,
        },
      });

      // 2.5 Validate Level
      if (levelId) {
        const levelExists = await tx.level.findUnique({ where: { id: levelId } });
        if (!levelExists) {
          throw new Error(`Level with ID "${levelId}" does not exist.`);
        }
      }

      // 3. Create Student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentCode,
          levelId,
          classId,
          schoolId,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender as Gender,
          nationality,
          nationalId,
          birthCertificateNumber,
          province,
          district,
          sector,
          cell,
          village,
          stream,
          admissionDate: admissionDate ? new Date(admissionDate) : null,
          previousSchool,
          boardingStatus,
          hasDisability: Boolean(hasDisability),
          disabilityType,
          specialSupportNeeds,
          medicalNotes,
          inclusiveEducationNotes,
        },
      });

      // 4. Handle Parents
      if (parentsInfo && Array.isArray(parentsInfo)) {
        for (const parentInfo of parentsInfo) {
          if (!parentInfo.phone && !parentInfo.email) continue;

          let parentUser = null;
          if (parentInfo.email) {
            parentUser = await tx.user.findUnique({ where: { email: parentInfo.email } });
          }

          if (!parentUser && parentInfo.phone) {
            const existingParent = await tx.parent.findFirst({
              where: { phone: parentInfo.phone },
              include: { user: true },
            });
            if (existingParent) {
              parentUser = existingParent.user;
            }
          }

          let parent;

          if (!parentUser) {
            const parentPassword = parentInfo.phone ? parentInfo.phone : 'default123';
            const hashedParentPassword = await bcrypt.hash(parentPassword, 10);
            
            parentUser = await tx.user.create({
              data: {
                name: parentInfo.name,
                email: parentInfo.email || `parent_${parentInfo.phone || Math.random().toString(36).substring(7)}@kuralearn.local`,
                passwordHash: hashedParentPassword,
                role: UserRole.PARENT,
              },
            });

            parent = await tx.parent.create({
              data: {
                userId: parentUser.id,
                phone: parentInfo.phone,
                nationalId: parentInfo.nationalId,
                occupation: parentInfo.occupation,
                province: parentInfo.province,
                district: parentInfo.district,
                sector: parentInfo.sector,
                cell: parentInfo.cell,
                village: parentInfo.village,
              },
            });
          } else {
            parent = await tx.parent.findUnique({ where: { userId: parentUser.id } });
            if (!parent) {
              parent = await tx.parent.create({
                data: {
                  userId: parentUser.id,
                  phone: parentInfo.phone,
                  nationalId: parentInfo.nationalId,
                },
              });
            }
          }

          if (parent) {
            await tx.studentParent.create({
              data: {
                studentId: student.id,
                parentId: parent.id,
                relationship: parentInfo.relationship || 'GUARDIAN',
                isEmergencyContact: parentInfo.isEmergencyContact || false,
              },
            });
          }
        }
      }

      return student;
    });
  }

  static async getStudents(filters: any) {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      schoolId, 
      classId, 
      gender, 
      status, 
      disabilityStatus, 
      academicYear 
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: Prisma.StudentWhereInput = {
      ...(schoolId && { schoolId }),
      ...(classId && { classId }),
      ...(gender && { gender: gender as Gender }),
      ...(status && { status: status as StudentStatus }),
      ...(disabilityStatus !== undefined && { hasDisability: disabilityStatus === "Yes" || disabilityStatus === "true" || disabilityStatus === true }),
    };

    if (search) {
      where.OR = [
        { studentCode: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { class: { name: { contains: search, mode: 'insensitive' } } },
        { stream: { contains: search, mode: 'insensitive' } },
        { parents: { some: { parent: { phone: { contains: search } } } } },
        { parents: { some: { parent: { user: { name: { contains: search, mode: 'insensitive' } } } } } },
      ];
    }

    if (academicYear) {
      where.promotions = {
        some: { academicYear: { contains: academicYear } }
      };
    }

    const [students, totalRecords, stats] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, status: true } },
          class: { select: { id: true, name: true } },
          level: { select: { id: true, name: true } },
          parents: {
            include: {
              parent: {
                include: { user: { select: { name: true } } }
              }
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.student.count({ where }),
      this.getStats({ schoolId, academicYear })
    ]);

    const totalPages = Math.ceil(totalRecords / take);

    return {
      data: students,
      pagination: {
        page: Number(page),
        limit: take,
        totalRecords,
        totalPages
      },
      stats
    };
  }

  static async getStats(filters: any) {
    const { schoolId, academicYear } = filters;
    const baseWhere: Prisma.StudentWhereInput = {
      ...(schoolId && { schoolId }),
      status: { not: StudentStatus.ARCHIVED } // Only active/relevant students for stats? 
      // Actually, "Total Students" usually means everyone not archived.
    };
    
    if (academicYear) {
      baseWhere.promotions = { some: { academicYear } };
    }

    const [total, male, female, disability, maleDisability, femaleDisability] = await Promise.all([
      prisma.student.count({ where: baseWhere }),
      prisma.student.count({ where: { ...baseWhere, gender: 'MALE' } }),
      prisma.student.count({ where: { ...baseWhere, gender: 'FEMALE' } }),
      prisma.student.count({ where: { ...baseWhere, hasDisability: true } }),
      prisma.student.count({ where: { ...baseWhere, hasDisability: true, gender: 'MALE' } }),
      prisma.student.count({ where: { ...baseWhere, hasDisability: true, gender: 'FEMALE' } }),
    ]);

    return {
      totalStudents: total,
      maleStudents: male,
      femaleStudents: female,
      studentsWithDisability: disability,
      maleWithDisability: maleDisability,
      femaleWithDisability: femaleDisability
    };
  }

  static async archiveStudent(studentId: string) {
    return prisma.student.update({
      where: { id: studentId },
      data: { status: StudentStatus.ARCHIVED }
    });
  }

  static async deleteStudent(studentId: string) {
    // Soft delete by archiving, or hard delete if really needed.
    // Given the requirement "Prefer archive instead of permanent delete", 
    // we'll implement archive. If they really want delete, they can call this.
    // For now, let's do archive to be safe.
    return this.archiveStudent(studentId);
  }

  static async getStudentDetails(studentId: string) {
    return prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true, status: true, createdAt: true, updatedAt: true } },
        class: { select: { name: true } },
        level: { select: { name: true } },
        parents: {
          include: {
            parent: {
              include: { user: { select: { name: true, email: true } } }
            }
          }
        },
        lessonProgress: { take: 5, orderBy: { updatedAt: 'desc' } }, // Simple summary
        assessmentSubmissions: { take: 5, orderBy: { createdAt: 'desc' }, include: { assessment: true } } // Simple summary
      }
    });
  }

  static async promoteStudent(studentId: string, data: any) {
    const { schoolId, fromClassId, toClassId, toLevelId, academicYear, status, reason, promotedById } = data;
    return prisma.$transaction(async (tx) => {
      const promotion = await tx.studentPromotion.create({
        data: {
          studentId,
          schoolId,
          fromClassId,
          toClassId,
          academicYear,
          status,
          reason,
          promotedById
        }
      });
      if (status === 'PROMOTED') {
        await tx.student.update({
          where: { id: studentId },
          data: {
            classId: toClassId,
            ...(toLevelId && { levelId: toLevelId })
          }
        });
      }
      return promotion;
    });
  }

  static async transferStudent(studentId: string, data: any) {
    const { fromSchoolId, toSchoolId, toClassId, transferDate, reason, status, approvedById } = data;
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.studentTransfer.create({
        data: {
          studentId,
          fromSchoolId,
          toSchoolId,
          transferDate: transferDate ? new Date(transferDate) : new Date(),
          reason,
          status,
          approvedById
        }
      });
      if (status === 'COMPLETED' && toSchoolId) {
        await tx.student.update({
          where: { id: studentId },
          data: {
            schoolId: toSchoolId,
            ...(toClassId && { classId: toClassId }),
            status: StudentStatus.TRANSFERRED
          }
        });
      }
      return transfer;
    });
  }

  static async updateStudent(id: string, data: any) {
    const {
      name,
      email,
      status,
      // student fields
      ...studentData
    } = data;

    // Handle nested date conversions if present
    if (studentData.dateOfBirth) studentData.dateOfBirth = new Date(studentData.dateOfBirth);
    if (studentData.admissionDate) studentData.admissionDate = new Date(studentData.admissionDate);

    // Filter out undefined values from studentData
    const cleanData = Object.fromEntries(
      Object.entries(studentData).filter(([_, v]) => v !== undefined)
    );

    return await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({ 
        where: { id },
        include: { user: true }
      });
      if (!student) throw new Error('Student not found');

      // Update User if name or email or status changed
      if (name || email || status) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            ...(name && { name }),
            ...(email && { email }),
            ...(status && { status })
          }
        });
      }

      // Update Student
      return await tx.student.update({
        where: { id },
        data: cleanData,
        include: { 
          user: { select: { name: true, email: true, status: true } },
          class: { select: { name: true } },
          level: { select: { name: true } }
        }
      });
    });
  }
}
