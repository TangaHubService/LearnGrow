import { prisma } from "../../prisma/client.js";

export function getCurrentUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true
    }
  });
}

export function listStudents(schoolId: string) {
  return prisma.student.findMany({
    where: { schoolId },
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      level: { select: { id: true, name: true, category: true } },
      class: { select: { id: true, name: true } },
      school: { select: { id: true, name: true } }
    }
  });
}
