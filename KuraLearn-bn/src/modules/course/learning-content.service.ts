import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";

// ─── Assignments ──────────────────────────────────────────────

export async function createAssignment(courseId: string, input: {
  title: string;
  description?: string;
  dueDate?: Date;
  points?: number;
  lessonId?: string;
  unitId?: string;
}) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.create({
      data: {
        courseId,
        lessonId: input.lessonId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        points: input.points ?? 100,
      },
    });

    await tx.activity.create({
      data: {
        courseId,
        unitId: input.unitId,
        lessonId: input.lessonId,
        type: "ASSIGNMENT",
        title: input.title,
        description: input.description,
        assignmentId: assignment.id,
      },
    });

    return assignment;
  });
}

export async function updateAssignment(assignmentId: string, input: {
  title?: string;
  description?: string;
  dueDate?: Date;
  points?: number;
  status?: string;
}) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new AppError(404, "Assignment not found", "ASSIGNMENT_NOT_FOUND");

  return prisma.assignment.update({
    where: { id: assignmentId },
    data: input,
  });
}

export async function deleteAssignment(assignmentId: string) {
  return prisma.assignment.delete({ where: { id: assignmentId } });
}

export async function listTeacherAssignments(userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) return [];

  return prisma.assignment.findMany({
    where: {
      course: { teacherId: teacher.id },
    },
    include: {
      course: {
        include: { subject: true, level: true },
      },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function submitAssignment(assignmentId: string, studentId: string, input: {
  content?: string;
  attachments?: string[];
}) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new AppError(404, "Assignment not found", "ASSIGNMENT_NOT_FOUND");

  return prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    create: {
      assignmentId,
      studentId,
      content: input.content,
      attachments: input.attachments ?? [],
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      content: input.content,
      attachments: input.attachments ?? [],
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
}

// ─── Quizzes ──────────────────────────────────────────────────

export async function createQuiz(courseId: string, input: {
  title: string;
  lessonId?: string;
  unitId?: string;
  timeLimit?: number;
  description?: string;
}) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const quiz = await tx.quiz.create({
      data: {
        courseId,
        lessonId: input.lessonId,
        title: input.title,
        timeLimit: input.timeLimit,
      },
    });

    await tx.activity.create({
      data: {
        courseId,
        unitId: input.unitId,
        lessonId: input.lessonId,
        type: "QUIZ",
        title: input.title,
        description: input.description,
        quizId: quiz.id,
      },
    });

    return quiz;
  });
}

export async function updateQuiz(quizId: string, input: {
  title?: string;
  timeLimit?: number;
  status?: string;
}) {
  const { status, ...rest } = input;
  return prisma.quiz.update({
    where: { id: quizId },
    data: {
      ...rest,
      ...(status && { status: status as any }),
    },
  });
}

export async function deleteQuiz(quizId: string) {
  return prisma.quiz.delete({ where: { id: quizId } });
}

export async function listTeacherQuizzes(userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) return [];

  return prisma.quiz.findMany({
    where: {
      course: { teacherId: teacher.id },
    },
    include: {
      course: {
        include: { subject: true, level: true },
      },
      questions: true,
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function addQuizQuestions(quizId: string, questions: Array<{
  questionText: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options?: string[];
  correctAnswer: string;
  points?: number;
  explanation?: string;
}>) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new AppError(404, "Quiz not found", "QUIZ_NOT_FOUND");

  const count = await prisma.quizQuestion.count({ where: { quizId } });

  const data = questions.map((q, i) => ({
    quizId,
    questionText: q.questionText,
    type: q.type as any,
    options: q.options ?? [],
    answer: q.correctAnswer,  // Schema uses `answer`, not `correctAnswer`
    points: q.points ?? 1,
    explanation: q.explanation,
    order: count + i,
    status: "ACTIVE" as const,
  }));

  return prisma.quizQuestion.createMany({ data });
}

export async function submitQuizAttempt(quizId: string, studentId: string, input: {
  answers: Record<string, string>;
}) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });
  if (!quiz) throw new AppError(404, "Quiz not found", "QUIZ_NOT_FOUND");

  let correctCount = 0;
  const results = quiz.questions.map((q) => {
    const studentAnswer = input.answers[q.id];
    const correctAnswer = typeof q.answer === "string" ? q.answer : JSON.stringify(q.answer);
    const isCorrect = studentAnswer === correctAnswer;
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      selectedAnswer: studentAnswer,
      isCorrect,
    };
  });

  const score = quiz.questions.length > 0 ? Math.round((correctCount / quiz.questions.length) * 100) : 0;

  return prisma.quizAttempt.create({
    data: {
      quizId,
      studentId,
      score,
      answers: {
        create: results.map((r) => ({
          questionId: r.questionId,
          selectedAnswer: r.selectedAnswer ?? "",
          isCorrect: r.isCorrect,
        })),
      },
    },
  });
}

// ─── Progress Tracking ──────────────────────────────────────────

export async function updateLessonProgress(lessonId: string, studentId: string, status: "COMPLETED" | "IN_PROGRESS") {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { include: { lessons: { select: { id: true } } } } },
  });
  if (!lesson) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");

  // Track progress
  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { lessonId, studentId } },
    create: { lessonId, studentId, status, completedAt: status === "COMPLETED" ? new Date() : null },
    update: { status, completedAt: status === "COMPLETED" ? new Date() : null },
  });

  // Calculate overall course progress
  const completedLessons = await prisma.lessonProgress.count({
    where: { studentId, status: "COMPLETED", lesson: { courseId: lesson.courseId } },
  });
  const totalLessons = lesson.course.lessons.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  await prisma.courseEnrollment.update({
    where: { courseId_studentId: { courseId: lesson.courseId, studentId } },
    data: {
      progressPercent,
      lastAccessedAt: new Date(),
      completedAt: progressPercent === 100 ? new Date() : undefined,
    },
  });

  return { progressPercent, completedLessons, totalLessons };
}
