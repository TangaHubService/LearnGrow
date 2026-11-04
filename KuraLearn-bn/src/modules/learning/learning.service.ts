import { prisma } from "../../prisma/client.js";
import {
  getLesson,
  getQuiz,
  getStudentAnalytics,
  submitQuiz as submitPlatformQuiz,
  updateLessonProgress as updatePlatformProgress
} from "../platform/platform.service.js";

export function listLessons(filters: { levelId?: string }) {
  return prisma.lesson.findMany({
    where: filters.levelId ? { course: { levelId: filters.levelId } } : undefined,
    orderBy: [{ course: { order: "asc" } }, { order: "asc" }],
    select: {
      id: true,
      title: true,
      contentType: true,
      estimatedMinutes: true,
      course: { select: { id: true, title: true, subject: { select: { id: true, name: true, icon: true } } } }
    }
  });
}

export function listQuizzes(filters?: { levelId?: string }) {
  return prisma.quiz.findMany({
    where: filters?.levelId ? { course: { levelId: filters.levelId } } : undefined,
    take: 30,
    orderBy: { title: "asc" },
    select: { id: true, title: true, courseId: true, passMark: true, timeLimit: true }
  });
}

export function getLessonById(lessonId: string, userId: string) {
  return getLesson(lessonId, userId);
}

export function updateLessonProgress(
  lessonId: string,
  userId: string,
  data: { completed?: boolean; status?: string; timeSpentSec?: number; timeSpent?: number; deviceType?: string }
) {
  return updatePlatformProgress(lessonId, userId, {
    status: data.completed ? "COMPLETED" : data.status,
    timeSpent: data.timeSpent ?? data.timeSpentSec,
    deviceType: data.deviceType
  });
}

export function getStudentProgress(userId: string) {
  return getStudentAnalytics(userId);
}

export async function getLearningPaths(levelId?: string) {
  const subjects = await prisma.subject.findMany({
    where: levelId ? { levelId } : undefined,
    include: { courses: { include: { lessons: { orderBy: { order: "asc" } }, quizzes: true }, orderBy: { order: "asc" } } },
    orderBy: [{ level: { order: "asc" } }, { order: "asc" }]
  });
  return subjects.flatMap((subject) =>
    subject.courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      subject: { id: subject.id, name: subject.name, icon: subject.icon },
      lessons: course.lessons,
      quizId: course.quizzes[0]?.id ?? null,
      steps: ["Introduction", "Learn", "Practice", "Quiz", "Mastered"]
    }))
  );
}

export function getQuizById(quizId: string) {
  return getQuiz(quizId);
}

export function submitQuiz(quizId: string, userId: string, answers: Record<string, unknown>, timeSpentSec?: number) {
  return submitPlatformQuiz(quizId, userId, { answers, timeUsed: timeSpentSec });
}
