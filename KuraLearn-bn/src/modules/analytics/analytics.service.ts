import { prisma } from "../../prisma/client.js";

export async function getAnalyticsOverview() {
  const [students, completedLessons, quizAttempts] = await Promise.all([
    prisma.student.count(),
    prisma.lessonProgress.count({ where: { status: "COMPLETED" } }),
    prisma.quizAttempt.count()
  ]);

  return {
    students,
    completedLessons,
    quizAttempts
  };
}
