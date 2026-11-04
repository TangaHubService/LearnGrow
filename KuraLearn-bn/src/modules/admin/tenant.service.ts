import bcrypt from "bcryptjs";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";

interface CreateSchoolInput {
  name: string;
  type: "PUBLIC" | "PRIVATE" | "COMMUNITY";
  district?: string;
  phone?: string;
  email?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function provisionSchool(input: CreateSchoolInput) {
  const existingSchool = await prisma.school.findFirst({ where: { name: input.name } });
  if (existingSchool) {
    throw new AppError(409, "A school with this name already exists", "SCHOOL_EXISTS");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: input.adminEmail.toLowerCase() } });
  if (existingUser) {
    throw new AppError(409, "A user with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(input.adminPassword, 12);

  // All or nothing, so a failure cannot leave a half-made school that blocks a retry.
  const { school, admin } = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name: input.name,
        type: input.type,
        district: input.district,
        phone: input.phone,
        email: input.email,
        subscriptionStatus: "TRIAL",
      },
    });

    const admin = await tx.user.create({
      data: {
        name: input.adminName,
        email: input.adminEmail.toLowerCase(),
        passwordHash,
        role: "ADMIN",
      },
    });

    await tx.staff.create({
      data: {
        userId: admin.id,
        schoolId: school.id,
        staffRole: "SCHOOL_ADMIN",
        employmentStatus: "PERMANENT",
      },
    });

    const level = await tx.level.findFirst({ orderBy: { order: "asc" } });
    if (level) {
      await tx.class.create({
        data: { schoolId: school.id, levelId: level.id, name: `${level.name} A` },
      });
    }

    await tx.gradingScale.createMany({
      data: [
        { schoolId: school.id, minPercentage: 80, maxPercentage: 100, grade: "A", description: "Outstanding" },
        { schoolId: school.id, minPercentage: 70, maxPercentage: 79, grade: "B", description: "Very Good" },
        { schoolId: school.id, minPercentage: 60, maxPercentage: 69, grade: "C", description: "Good" },
        { schoolId: school.id, minPercentage: 50, maxPercentage: 59, grade: "D", description: "Pass" },
        { schoolId: school.id, minPercentage: 0, maxPercentage: 49, grade: "E", description: "Fail" },
      ],
    });

    return { school, admin };
  });

  return {
    school: { id: school.id, name: school.name, type: school.type },
    admin: { id: admin.id, name: admin.name, email: admin.email },
  };
}

export async function getSchoolAnalytics(schoolId: string) {
  const [students, teachers, classes, attendance] = await Promise.all([
    prisma.student.count({ where: { schoolId, status: "ACTIVE" } }),
    prisma.teacher.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.attendanceRecord.findMany({
      where: { schoolId },
      select: { status: true },
      take: 1000,
      orderBy: { date: "desc" },
    }),
  ]);

  const presentCount = attendance.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0;

  return {
    students,
    teachers,
    classes,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
  };
}
