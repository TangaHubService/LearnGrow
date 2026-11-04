import {
  GoalStatus,
  GoalType,
  LessonStatus,
  LibraryResourceType,
  NotificationType,
  Prisma,
  QuizAttemptStatus,
  UserRole
} from "@prisma/client";
import { AppError } from "../../http/errors.js";
import { prisma } from "../../prisma/client.js";

type ProfileSetupInput = {
  fullName?: string;
  dateOfBirth?: Date;
  levelId?: string;
  classId?: string;
  schoolId?: string;
  interests?: string[];
  avatar?: string;
  language?: string;
};

function ensureStudentRole(role?: string) {
  if (role !== "STUDENT") {
    throw new AppError(403, "Only students can access this resource", "STUDENT_REQUIRED");
  }
}

function toProgressPercent(completed: number, total: number) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

function normalizeJson(value: Prisma.JsonValue | unknown) {
  return value;
}

function selectedFromAnswers(answers: Record<string, unknown>, questionId: string) {
  const answer = answers[questionId];
  if (answer && typeof answer === "object" && "selectedAnswer" in answer) {
    return (answer as { selectedAnswer: unknown }).selectedAnswer;
  }
  return answer;
}

function safeMessageBody(body: string) {
  return body.replace(/https?:\/\/\S+/gi, "[link removed]").trim();
}

export async function getStudentByUserId(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, status: true } },
      school: true,
      level: true,
      class: true
    }
  });

  if (!student) {
    throw new AppError(404, "Student profile is not set up yet", "STUDENT_PROFILE_REQUIRED");
  }

  return student;
}

export async function getStudentProfile(userId: string) {
  return getStudentByUserId(userId);
}

export async function setupStudentProfile(userId: string, input: ProfileSetupInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  ensureStudentRole(user.role);

  if (!input.levelId) {
    throw new AppError(400, "levelId is required", "LEVEL_REQUIRED");
  }

  const level = await prisma.level.findUnique({ where: { id: input.levelId } });
  if (!level) throw new AppError(404, "Level not found", "LEVEL_NOT_FOUND");

  // Learners choose their level only. Joining a school or class is done by the school,
  // otherwise anyone who signs up could place themselves among another school's learners.
  const existing = await prisma.student.findUnique({
    where: { userId },
    select: { schoolId: true, classId: true, class: { select: { levelId: true } } }
  });
  const school = existing?.schoolId ? { id: existing.schoolId } : null;
  const classRecord = existing?.classId && existing.class?.levelId === level.id ? { id: existing.classId } : null;

  await prisma.user.update({
    where: { id: userId },
    data: input.fullName ? { name: input.fullName } : {}
  });

  return prisma.student.upsert({
    where: { userId },
    update: {
      schoolId: school?.id,
      levelId: level.id,
      classId: classRecord?.id,
      dateOfBirth: input.dateOfBirth,
      avatar: input.avatar,
      language: input.language ?? "en",
      interests: input.interests ?? []
    },
    create: {
      userId,
      schoolId: school?.id,
      levelId: level.id,
      classId: classRecord?.id,
      dateOfBirth: input.dateOfBirth,
      avatar: input.avatar,
      language: input.language ?? "en",
      interests: input.interests ?? []
    },
    include: { user: true, school: true, level: true, class: true }
  });
}

export async function updateStudentProfile(userId: string, input: ProfileSetupInput) {
  const student = await getStudentByUserId(userId);
  if (input.fullName) {
    await prisma.user.update({ where: { id: userId }, data: { name: input.fullName } });
  }

  return prisma.student.update({
    where: { id: student.id },
    data: {
      ...(input.levelId && { levelId: input.levelId }),
      ...(input.dateOfBirth && { dateOfBirth: input.dateOfBirth }),
      ...(input.avatar !== undefined && { avatar: input.avatar }),
      ...(input.language && { language: input.language }),
      ...(input.interests && { interests: input.interests })
    },
    include: { user: true, school: true, level: true, class: true }
  });
}

export async function getStudentDashboard(userId: string) {
  const student = await getStudentByUserId(userId);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [subjects, progress, badges, goals, notifications, certificates, attempts, attendanceRecords] = await Promise.all([
    prisma.subject.findMany({
      where: {
        OR: [
          { levelId: student.levelId },
          { courses: { some: { enrollments: { some: { studentId: student.id } } } } }
        ],
        courses: {
          some: {
            OR: [
              { enrollments: { some: { studentId: student.id } } },
              { schoolId: student.schoolId },
              { schoolId: null }
            ]
          }
        }
      },
      include: {
        courses: {
          where: {
            OR: [
              { enrollments: { some: { studentId: student.id } } },
              { schoolId: student.schoolId },
              { schoolId: null }
            ]
          },
          include: {
            lessons: {
              where: {
                status: "PUBLISHED",
                OR: [
                  { course: { enrollments: { some: { studentId: student.id } } } },
                  { classId: student.classId },
                  { classId: null }
                ]
              },
              orderBy: { order: "asc" }
            },
            quizzes: {
              where: {
                OR: [
                  { course: { enrollments: { some: { studentId: student.id } } } },
                  { classId: student.classId },
                  { classId: null }
                ]
              }
            }
          },
          orderBy: { order: "asc" }
        }
      },
      orderBy: { order: "asc" }
    }),
    prisma.lessonProgress.findMany({ where: { studentId: student.id }, include: { lesson: { include: { course: { include: { subject: true } } } } } }),
    prisma.studentBadge.findMany({ where: { studentId: student.id }, include: { badge: true }, orderBy: { earnedAt: "desc" } }),
    prisma.goal.findMany({ where: { studentId: student.id }, orderBy: { dueDate: "asc" } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.certificate.findMany({ where: { studentId: student.id }, include: { course: true } }),
    prisma.quizAttempt.findMany({
      where: { studentId: student.id, submittedAt: { gte: startOfWeek } },
      include: { quiz: { include: { course: { include: { subject: true } } } } },
      orderBy: { submittedAt: "desc" }
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId: student.id, date: { gte: startOfWeek } },
      orderBy: { date: "asc" }
    })
  ]);

  const completedLessonIds = new Set(progress.filter((item) => item.status === "COMPLETED").map((item) => item.lessonId));
  const progressByLesson = new Map(progress.map((item) => [item.lessonId, item]));
  const allLessons = subjects.flatMap((subject) => subject.courses.flatMap((course) => course.lessons.map((lesson) => ({ ...lesson, course, subject }))));
  const continueLearning = allLessons.find((lesson) => progressByLesson.get(lesson.id)?.status === "IN_PROGRESS") ?? allLessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? allLessons[0];

  const subjectProgress = subjects.map((subject) => {
    const lessons = subject.courses.flatMap((course) => course.lessons);
    const completed = lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;
    return {
      id: subject.id,
      name: subject.name,
      icon: subject.icon,
      progress: toProgressPercent(completed, lessons.length),
      lessonCount: lessons.length,
      completedLessons: completed
    };
  });

  const points = badges.reduce((sum, item) => sum + item.badge.rewardPoints, 0) + completedLessonIds.size * 5;

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyActivity = dayNames.map((name) => {
    const dayIndex = dayNames.indexOf(name);
    const dayStart = new Date(startOfWeek);
    dayStart.setDate(dayStart.getDate() + dayIndex);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayProgress = progress.filter(
      (p) => p.updatedAt >= dayStart && p.updatedAt < dayEnd
    );
    const minutes = Math.round(dayProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60);
    return { day: name, minutes };
  });

  const avgQuizScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;

  const attendanceByDay = dayNames.map((name) => {
    const dayIndex = dayNames.indexOf(name);
    const dayStart = new Date(startOfWeek);
    dayStart.setDate(dayStart.getDate() + dayIndex);
    const dayRecords = attendanceRecords.filter(
      (r) => r.date.toDateString() === dayStart.toDateString()
    );
    const present = dayRecords.filter((r) => r.status === "PRESENT").length;
    const absent = dayRecords.filter((r) => r.status === "ABSENT").length;
    return {
      day: name,
      present,
      absent,
      total: dayRecords.length
    };
  });

  const totalAttendanceWeek = attendanceRecords.length;
  const presentCountWeek = attendanceRecords.filter((r) => r.status === "PRESENT").length;
  const attendanceRate = totalAttendanceWeek > 0
    ? Math.round((presentCountWeek / totalAttendanceWeek) * 100)
    : 0;

  const weakTopicsData = progress.filter((p) => p.status === "COMPLETED" && p.lesson?.course?.subject)
    .reduce<Record<string, { subjectName: string; completed: number; timeSpent: number }>>((acc, p) => {
      const subjectName = p.lesson.course.subject.name;
      if (!acc[subjectName]) acc[subjectName] = { subjectName, completed: 0, timeSpent: 0 };
      acc[subjectName].completed++;
      acc[subjectName].timeSpent += p.timeSpent;
      return acc;
    }, {});

  const studyInsights = generateStudyInsights(
    Object.values(weakTopicsData),
    subjectProgress,
    attempts,
    avgQuizScore,
    attendanceRate
  );

  return {
    student: {
      id: student.id,
      name: student.user.name,
      level: student.level.name,
      levelId: student.levelId,
      category: student.level.category,
      className: student.class?.name,
      schoolName: student.school?.name,
      avatar: student.avatar,
      language: student.language,
      interests: student.interests
    },
    stats: {
      points,
      stars: points,
      badges: badges.length,
      completedLessons: completedLessonIds.size,
      certificates: certificates.length,
      streakDays: 3,
      avgQuizScore,
      attendanceRate,
      totalQuizzes: attempts.length,
      totalTimeSpentMinutes: Math.round(progress.reduce((sum, p) => sum + p.timeSpent, 0) / 60)
    },
    weeklyActivity,
    attendanceByDay,
    attendanceRate,
    quizPerformance: attempts.map((a) => ({
      quizTitle: a.quiz.title,
      subjectName: a.quiz.course.subject.name,
      score: a.score,
      submittedAt: a.submittedAt
    })),
    goals,
    continueLearning: continueLearning
      ? {
          lessonId: continueLearning.id,
          courseId: continueLearning.courseId,
          subjectId: continueLearning.subject.id,
          title: continueLearning.title,
          courseTitle: continueLearning.course.title,
          subjectName: continueLearning.subject.name,
          progressStatus: progressByLesson.get(continueLearning.id)?.status ?? "NOT_STARTED"
        }
      : null,
    subjects: subjectProgress,
    recentBadges: badges.slice(0, 4).map((item) => ({
      id: item.id,
      badgeId: item.badgeId,
      name: item.badge.name,
      icon: item.badge.icon,
      rewardPoints: item.badge.rewardPoints,
      earnedAt: item.earnedAt,
      sourceActivity: item.sourceActivity
    })),
    notifications,
    insights: studyInsights
  };
}

function generateStudyInsights(
  subjectsData: { subjectName: string; completed: number; timeSpent: number }[],
  subjectProgress: { name: string; progress: number }[],
  attempts: { score: number; quiz: { course: { subject: { name: string } } } }[],
  avgQuizScore: number,
  attendanceRate: number
) {
  const insights: { type: string; message: string; severity: "info" | "warning" | "success"; action?: string; actionLabel?: string }[] = [];

  const weakSubjects = subjectProgress.filter((s) => s.progress < 30);
  if (weakSubjects.length > 0) {
    insights.push({
      type: "progress_gap",
      message: `You have ${weakSubjects.length} subject${weakSubjects.length > 1 ? "s" : ""} with less than 30% progress: ${weakSubjects.map((s) => s.name).join(", ")}.`,
      severity: "warning",
      action: "/subjects",
      actionLabel: "View subjects"
    });
  }

  if (avgQuizScore > 0 && avgQuizScore < 50) {
    insights.push({
      type: "quiz_alert",
      message: `Your average quiz score is ${avgQuizScore}%. Try reviewing lesson materials before attempting quizzes.`,
      severity: "warning",
      action: "/student/quizzes",
      actionLabel: "Practice quizzes"
    });
  } else if (avgQuizScore >= 80) {
    insights.push({
      type: "quiz_excellent",
      message: `Excellent quiz performance! Your average score is ${avgQuizScore}%. You're mastering the material.`,
      severity: "success"
    });
  }

  if (attendanceRate > 0 && attendanceRate < 50) {
    insights.push({
      type: "attendance_warning",
      message: `Your attendance rate this week is ${attendanceRate}%. Regular attendance helps you stay on track.`,
      severity: "warning",
      action: "/student/attendance",
      actionLabel: "View attendance"
    });
  } else if (attendanceRate >= 90) {
    insights.push({
      type: "attendance_great",
      message: `Great attendance! You've been present ${attendanceRate}% of the time this week. Keep it up!`,
      severity: "success"
    });
  }

  const lowTimeSubjects = subjectsData.filter((s) => s.timeSpent < 300 && s.completed > 0);
  if (lowTimeSubjects.length > 0) {
    insights.push({
      type: "time_tip",
      message: `You're completing lessons quickly in ${lowTimeSubjects.map((s) => s.subjectName).join(", ")}. Consider spending more time reviewing to deepen understanding.`,
      severity: "info"
    });
  }

  const completedCount = subjectProgress.reduce((sum, s) => sum + (s.progress > 0 ? 1 : 0), 0);
  if (completedCount >= subjectProgress.length && subjectProgress.length > 0) {
    insights.push({
      type: "milestone",
      message: `You've started all ${subjectProgress.length} subjects! Stay consistent and keep progressing.`,
      severity: "success",
      action: "/student/marks",
      actionLabel: "View progress"
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "welcome",
      message: "Welcome! Start exploring your subjects and complete lessons to unlock insights about your learning journey.",
      severity: "info",
      action: "/subjects",
      actionLabel: "Browse subjects"
    });
  }

  return insights;
}

export async function getSubjectsForLevel(levelId: string, userId?: string) {
  const student = userId ? await prisma.student.findUnique({ where: { userId } }) : null;

  const subjects = await prisma.subject.findMany({
    where: {
      OR: [
        { levelId },
        { courses: { some: { enrollments: { some: { studentId: student?.id ?? "" } } } } }
      ],
      courses: {
        some: {
          OR: [
            { enrollments: { some: { studentId: student?.id ?? "" } } },
            { schoolId: student?.schoolId ?? null },
            { schoolId: null }
          ]
        }
      }
    },
    include: {
      courses: {
        where: {
          OR: [
            { enrollments: { some: { studentId: student?.id ?? "" } } },
            { schoolId: student?.schoolId ?? null },
            { schoolId: null }
          ]
        },
        include: {
          lessons: {
            where: {
              status: "PUBLISHED",
              OR: [
                { course: { enrollments: { some: { studentId: student?.id ?? "" } } } },
                { classId: student?.classId ?? null },
                { classId: null }
              ]
            },
            orderBy: { order: "asc" }
          }
        },
        orderBy: { order: "asc" }
      }
    },
    orderBy: { order: "asc" }
  });

  const progress = student
    ? await prisma.lessonProgress.findMany({ where: { studentId: student.id, lesson: { course: { levelId } } } })
    : [];
  const completed = new Set(progress.filter((item) => item.status === "COMPLETED").map((item) => item.lessonId));

  return subjects.map((subject) => {
    const lessons = subject.courses.flatMap((course) => course.lessons);
    return {
      ...subject,
      lessonCount: lessons.length,
      courseCount: subject.courses.length,
      progress: toProgressPercent(lessons.filter((lesson) => completed.has(lesson.id)).length, lessons.length)
    };
  });
}

export async function getMySubjects(userId: string) {
  const student = await getStudentByUserId(userId);
  return getSubjectsForLevel(student.levelId, userId);
}

export async function getCoursesForSubject(subjectId: string, userId?: string) {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId }, include: { level: true } });
  if (!subject) throw new AppError(404, "Subject not found", "SUBJECT_NOT_FOUND");
  const student = userId ? await prisma.student.findUnique({ where: { userId } }) : null;
  const courses = await prisma.course.findMany({
    where: {
      subjectId,
      OR: [
        { enrollments: { some: { studentId: student?.id ?? "" } } },
        { schoolId: student?.schoolId ?? null },
        { schoolId: null }
      ]
    },
    include: {
      lessons: {
        where: {
          status: "PUBLISHED",
          OR: [
            { course: { enrollments: { some: { studentId: student?.id ?? "" } } } },
            { classId: student?.classId ?? null },
            { classId: null }
          ]
        },
        orderBy: { order: "asc" }
      },
      quizzes: {
        where: {
          OR: [
            { course: { enrollments: { some: { studentId: student?.id ?? "" } } } },
            { classId: student?.classId ?? null },
            { classId: null }
          ]
        }
      }
    },
    orderBy: { order: "asc" }
  });
  const progress = student
    ? await prisma.lessonProgress.findMany({ where: { studentId: student.id, lesson: { course: { subjectId } } } })
    : [];
  const completed = new Set(progress.filter((item) => item.status === "COMPLETED").map((item) => item.lessonId));

  return {
    subject,
    courses: courses.map((course, index) => ({
      ...course,
      locked: index > 0 && courses[index - 1]?.lessons.some((lesson) => !completed.has(lesson.id)),
      lessonCount: course.lessons.length,
      quizCount: course.quizzes.length,
      progress: toProgressPercent(course.lessons.filter((lesson) => completed.has(lesson.id)).length, course.lessons.length),
      pathSteps: ["Introduction", "Learn", "Practice", "Quiz", "Mastered"].map((label, stepIndex) => ({
        label,
        status: stepIndex === 0 || course.lessons.some((lesson) => completed.has(lesson.id)) ? "unlocked" : "locked"
      }))
    }))
  };
}

export async function getLesson(lessonId: string, userId: string) {
  const student = await prisma.student.findUnique({ where: { userId } });
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: { include: { subject: { include: { level: true } }, lessons: { where: { status: "PUBLISHED" }, orderBy: { order: "asc" } }, quizzes: true } }
    }
  });
  if (!lesson) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");
  if (lesson.status !== "PUBLISHED") {
    throw new AppError(403, "Access denied. This lesson is not published yet.", "LESSON_UNPUBLISHED");
  }

  const isEnrolled = student ? await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId: lesson.courseId, studentId: student.id } }
  }) : false;

  if (!isEnrolled) {
    if (lesson.schoolId && student?.schoolId && lesson.schoolId !== student.schoolId) {
      throw new AppError(403, "Access denied to this school's content", "ACCESS_DENIED");
    }
    if (lesson.classId && student?.classId && lesson.classId !== student.classId) {
      throw new AppError(403, "Access denied to this class's content", "ACCESS_DENIED");
    }
  }

  const progress = student
    ? await prisma.lessonProgress.findUnique({ where: { studentId_lessonId: { studentId: student.id, lessonId } } })
    : null;
  const ordered = lesson.course.lessons;
  const currentIndex = ordered.findIndex((item) => item.id === lessonId);
  let nextLessonData = ordered[currentIndex + 1] ? { id: ordered[currentIndex + 1]!.id } : null;

  // If no next lesson in current course, look for the first lesson of the next course in the same subject
  if (!nextLessonData) {
    const nextCourse = await prisma.course.findFirst({
      where: {
        subjectId: lesson.course.subjectId,
        order: { gt: lesson.course.order },
        status: "PUBLISHED",
        OR: [
          { schoolId: student?.schoolId },
          { schoolId: null }
        ]
      },
      orderBy: { order: "asc" },
      include: { 
        lessons: { 
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" }, 
          take: 1 
        } 
      }
    });
    if (nextCourse && nextCourse.lessons[0]) {
      nextLessonData = { id: nextCourse.lessons[0].id };
    }
  }

  const lessonPlain = JSON.parse(JSON.stringify(lesson));

  // Get all progress for this course to show in sidebar and calculate percentage
  const [courseProgress, totalLessons] = await Promise.all([
    student ? prisma.lessonProgress.findMany({
      where: { studentId: student.id, lesson: { courseId: lesson.courseId } },
      select: { lessonId: true, status: true }
    }) : Promise.resolve([]),
    prisma.lesson.count({ where: { courseId: lesson.courseId, status: "PUBLISHED" } })
  ]);

  const courseLessons = lessonPlain.course.lessons.map((l: any) => ({
    ...l,
    status: courseProgress.find(cp => cp.lessonId === l.id)?.status || "NOT_STARTED"
  }));

  const completedCount = courseProgress.filter(cp => cp.status === "COMPLETED").length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return {
    lesson: {
      ...lessonPlain,
      courseLessons,
      nextLesson: nextLessonData,
      previousLesson: ordered[currentIndex - 1] ? { id: ordered[currentIndex - 1]!.id } : null,
      progressStatus: progress?.status ?? "NOT_STARTED"
    },
    progress: {
      ...progress,
      percent: progressPercent
    },
    navigation: {
      previousLessonId: ordered[currentIndex - 1]?.id ?? null,
      nextLessonId: nextLessonData?.id ?? null,
      quizId: lesson.course.quizzes[0]?.id ?? null
    }
  };
}

export async function updateLessonProgress(lessonId: string, userId: string, input: { status?: string; timeSpent?: number; deviceType?: string }) {
  const student = await getStudentByUserId(userId);
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");
  const status = (input.status as LessonStatus | undefined) ?? "IN_PROGRESS";
  const completedAt = status === "COMPLETED" ? new Date() : undefined;

  return prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: student.id, lessonId } },
    update: {
      status,
      ...(input.timeSpent !== undefined && { timeSpent: { increment: input.timeSpent } }),
      ...(input.deviceType && { deviceType: input.deviceType }),
      ...(completedAt && { completedAt })
    },
    create: {
      studentId: student.id,
      lessonId,
      status,
      timeSpent: input.timeSpent ?? 0,
      startedAt: new Date(),
      completedAt,
      deviceType: input.deviceType
    }
  });
}

export function completeLesson(lessonId: string, userId: string, deviceType?: string) {
  return updateLessonProgress(lessonId, userId, { status: "COMPLETED", deviceType });
}

export async function recordPracticeAttempt(userId: string, input: { selectedAnswer?: unknown; correctAnswer?: unknown }) {
  await getStudentByUserId(userId);
  const isCorrect = input.correctAnswer === undefined ? null : JSON.stringify(input.selectedAnswer) === JSON.stringify(input.correctAnswer);
  return {
    id: `practice-${Date.now()}`,
    isCorrect,
    encouragement: isCorrect ? "Nice work. You are building confidence." : "Good try. Use the hint and try again.",
    explanation: isCorrect === false ? "Read the question slowly, then compare each choice." : "Practice saved."
  };
}

export async function getQuiz(quizId: string, userId?: string) {
  const student = userId ? await prisma.student.findUnique({ where: { userId } }) : null;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { course: { include: { subject: true } }, questions: { orderBy: { order: "asc" } } }
  });
  if (!quiz) throw new AppError(404, "Quiz not found", "QUIZ_NOT_FOUND");

  const isEnrolled = student ? await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId: quiz.courseId, studentId: student.id } }
  }) : false;

  if (student && !isEnrolled) {
    if (quiz.schoolId && quiz.schoolId !== student.schoolId) {
      throw new AppError(403, "Access denied to this school's quiz", "ACCESS_DENIED");
    }
    if (quiz.classId && quiz.classId !== student.classId) {
      throw new AppError(403, "Access denied to this class's quiz", "ACCESS_DENIED");
    }
  }

  return {
    ...quiz,
    questions: quiz.questions.map(({ answer: _answer, ...question }) => question)
  };
}

export async function submitQuiz(quizId: string, userId: string, input: { answers: Record<string, unknown>; timeUsed?: number }) {
  const student = await getStudentByUserId(userId);
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: { orderBy: { order: "asc" } } } });
  if (!quiz) throw new AppError(404, "Quiz not found", "QUIZ_NOT_FOUND");

  let correctCount = 0;
  const graded = quiz.questions.map((question) => {
    const selectedAnswer = selectedFromAnswers(input.answers, question.id);
    const isCorrect = JSON.stringify(selectedAnswer) === JSON.stringify(question.answer);
    if (isCorrect) correctCount += 1;
    return { question, selectedAnswer, isCorrect };
  });
  const score = quiz.questions.length ? Math.round((correctCount / quiz.questions.length) * 100) : 0;

  const attempt = await prisma.quizAttempt.create({
    data: {
      studentId: student.id,
      quizId,
      score,
      timeUsed: input.timeUsed,
      status: QuizAttemptStatus.SUBMITTED,
      answers: {
        create: graded.map((item) => ({
          questionId: item.question.id,
          selectedAnswer: item.selectedAnswer === undefined ? Prisma.JsonNull : (item.selectedAnswer as Prisma.InputJsonValue),
          isCorrect: item.isCorrect
        }))
      }
    },
    include: { answers: { include: { question: true } }, quiz: true }
  });

  if (score >= quiz.passMark) {
    const firstBadge = await prisma.badge.findFirst({ where: { name: "Quiz Brave" } });
    if (firstBadge) {
      await prisma.studentBadge.upsert({
        where: { studentId_badgeId: { studentId: student.id, badgeId: firstBadge.id } },
        update: {},
        create: { studentId: student.id, badgeId: firstBadge.id, sourceActivity: "quiz-submit" }
      });
    }
  }

  return {
    attemptId: attempt.id,
    score,
    passMark: quiz.passMark,
    passed: score >= quiz.passMark,
    stars: Math.max(1, Math.round(score / 20)),
    correctCount,
    totalQuestions: quiz.questions.length,
    results: attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      questionText: answer.question.questionText,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: answer.question.answer,
      isCorrect: answer.isCorrect,
      explanation: answer.question.explanation
    }))
  };
}

export async function getQuizAttemptResults(attemptId: string, userId: string) {
  const student = await getStudentByUserId(userId);
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, studentId: student.id },
    include: { quiz: { include: { course: true } }, answers: { include: { question: true } } }
  });
  if (!attempt) throw new AppError(404, "Quiz attempt not found", "QUIZ_ATTEMPT_NOT_FOUND");
  return {
    id: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quiz.title,
    courseId: attempt.quiz.courseId,
    courseTitle: attempt.quiz.course.title,
    score: attempt.score,
    passMark: attempt.quiz.passMark,
    passed: attempt.score >= attempt.quiz.passMark,
    timeUsed: attempt.timeUsed,
    submittedAt: attempt.submittedAt,
    stars: Math.max(1, Math.round(attempt.score / 20)),
    answers: attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      questionText: answer.question.questionText,
      selectedAnswer: normalizeJson(answer.selectedAnswer),
      correctAnswer: normalizeJson(answer.question.answer),
      isCorrect: answer.isCorrect,
      hint: answer.question.hint,
      explanation: answer.question.explanation
    }))
  };
}

export async function getStudentAnalytics(userId: string) {
  const student = await getStudentByUserId(userId);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfTerm = new Date(today.getFullYear(), Math.floor(today.getMonth() / 4) * 4, 1);

  const [progress, attempts, subjects, attendanceRecords, badges] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { studentId: student.id },
      include: { lesson: { include: { course: { include: { subject: true } } } } },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.quizAttempt.findMany({
      where: { studentId: student.id },
      include: { quiz: { include: { course: { include: { subject: true } } } } },
      orderBy: { submittedAt: "desc" }
    }),
    prisma.subject.findMany({
      where: { levelId: student.levelId },
      include: { courses: { include: { lessons: true } } },
      orderBy: { order: "asc" }
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
      orderBy: { date: "desc" }
    }),
    prisma.studentBadge.findMany({
      where: { studentId: student.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" }
    })
  ]);

  const completed = progress.filter((item) => item.status === "COMPLETED");
  const weekProgress = progress.filter((p) => p.updatedAt >= startOfWeek);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyActivity = dayNames.map((name) => {
    const dayIndex = dayNames.indexOf(name);
    const dayStart = new Date(startOfWeek);
    dayStart.setDate(dayStart.getDate() + dayIndex);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayProgress = progress.filter(
      (p) => p.updatedAt >= dayStart && p.updatedAt < dayEnd
    );
    const minutes = Math.round(dayProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60);
    return { day: name, minutes };
  });

  const monthlyLabels: string[] = [];
  const monthlyMinutes: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const monthProgress = progress.filter((p) => p.updatedAt >= m && p.updatedAt < mEnd);
    monthlyLabels.push(m.toLocaleString("default", { month: "short" }));
    monthlyMinutes.push(Math.round(monthProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60));
  }

  const subjectProgress = subjects.map((subject) => {
    const lessonIds = new Set(subject.courses.flatMap((course) => course.lessons.map((lesson) => lesson.id)));
    const completedCount = completed.filter((item) => lessonIds.has(item.lessonId)).length;
    return { subjectId: subject.id, subjectName: subject.name, progress: toProgressPercent(completedCount, lessonIds.size) };
  });

  const totalLessons = subjects.reduce((sum, s) => sum + s.courses.reduce((cs, c) => cs + c.lessons.length, 0), 0);
  const overallProgress = totalLessons > 0 ? toProgressPercent(completed.length, totalLessons) : 0;

  const attemptsBySubject = attempts.reduce<Record<string, { scores: number[]; count: number }>>((acc, a) => {
    const name = a.quiz.course.subject.name;
    if (!acc[name]) acc[name] = { scores: [], count: 0 };
    acc[name].scores.push(a.score);
    acc[name].count++;
    return acc;
  }, {});

  const avgScoresBySubject = Object.entries(attemptsBySubject).map(([subjectName, data]) => ({
    subjectName,
    avgScore: Math.round(data.scores.reduce((s, sc) => s + sc, 0) / data.scores.length),
    attemptCount: data.count
  }));

  const weakTopics = attempts.filter((item) => item.score < 70).map((item) => item.quiz.course.subject.name);
  const weakSubjectCounts = [...new Set(weakTopics)].reduce<Record<string, number>>((acc, name) => {
    acc[name] = weakTopics.filter((t) => t === name).length;
    return acc;
  }, {});

  const totalTimeSpentSeconds = progress.reduce((sum, item) => sum + item.timeSpent, 0);
  const totalTimeMinutes = Math.round(totalTimeSpentSeconds / 60);

  const attendanceThisTerm = attendanceRecords.filter((r) => r.date >= startOfTerm);
  const termPresent = attendanceThisTerm.filter((r) => r.status === "PRESENT").length;
  const termAbsent = attendanceThisTerm.filter((r) => r.status === "ABSENT").length;
  const termLate = attendanceThisTerm.filter((r) => r.status === "LATE").length;
  const termAttendanceRate = attendanceThisTerm.length > 0
    ? Math.round((termPresent / attendanceThisTerm.length) * 100)
    : 0;

  const attendanceTrend = monthlyLabels.map((month, i) => {
    const m = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const monthAttendance = attendanceRecords.filter((r) => r.date >= m && r.date < mEnd);
    const monthPresent = monthAttendance.filter((r) => r.status === "PRESENT").length;
    return {
      month,
      rate: monthAttendance.length > 0 ? Math.round((monthPresent / monthAttendance.length) * 100) : 0,
      present: monthPresent,
      total: monthAttendance.length
    };
  });

  const topicPerformanceBySubject = subjectProgress.map((sp) => {
    const subjAttempts = attempts.filter((a) => a.quiz.course.subject.name === sp.subjectName);
    const avgScore = subjAttempts.length > 0
      ? Math.round(subjAttempts.reduce((s, a) => s + a.score, 0) / subjAttempts.length)
      : 0;
    const lowScorers = subjAttempts.filter((a) => a.score < 50);
    return {
      subjectName: sp.subjectName,
      progress: sp.progress,
      avgQuizScore: avgScore,
      weakCount: lowScorers.length,
      competencyGap: avgScore > 0 && sp.progress > 0
        ? Math.abs(avgScore - sp.progress)
        : null
    };
  });

  const recommendedNextStudy = (() => {
    const [weakestEntry] = Object.entries(weakSubjectCounts).sort((a, b) => b[1] - a[1]);
    if (weakestEntry) {
      const [weakest, weakCount] = weakestEntry;
      return {
        subject: weakest,
        reason: `You scored below 70% on ${weakCount} quiz(zes) in ${weakest}. Review the basics and try again.`,
        action: "/subjects",
        actionLabel: "Review subject"
      };
    }
    const nextSubject = subjectProgress.find((s) => s.progress < 100 && s.progress > 0);
    if (nextSubject) {
      return {
        subject: nextSubject.subjectName,
        reason: `You're ${nextSubject.progress}% through ${nextSubject.subjectName}. Keep going!`,
        action: "/subjects",
        actionLabel: "Continue"
      };
    }
    return {
      subject: "All subjects",
      reason: "You're making great progress! Keep exploring new topics.",
      action: "/subjects",
      actionLabel: "Explore subjects"
    };
  })();

  const totalPoints = badges.reduce((sum, b) => sum + b.badge.rewardPoints, 0) + completed.length * 5;

  return {
    summary: {
      totalTimeMinutes,
      completedLessons: completed.length,
      totalLessons,
      overallProgress,
      totalPoints,
      totalBadges: badges.length,
      avgQuizScore: attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
        : 0,
      totalQuizzes: attempts.length,
      termAttendanceRate
    },
    weeklyActivity,
    monthlyTrend: { labels: monthlyLabels, minutes: monthlyMinutes },
    subjectProgress,
    topicPerformance: topicPerformanceBySubject,
    quizTrend: attempts.slice(0, 10).reverse().map((a) => ({
      date: a.submittedAt.toISOString().split("T")[0],
      score: a.score,
      subject: a.quiz.course.subject.name,
      title: a.quiz.title
    })),
    avgScoresBySubject,
    weakTopics: Object.entries(weakSubjectCounts).map(([subject, count]) => ({ subject, lowScoreCount: count })),
    recommendedNextStudy,
    attendance: {
      termRate: termAttendanceRate,
      termPresent,
      termAbsent,
      termLate,
      termTotal: attendanceThisTerm.length,
      trend: attendanceTrend
    },
    insights: [
      ...(completed.length === 0 ? [{
        type: "welcome",
        message: "Start learning to see analytics about your performance and progress.",
        severity: "info" as const
      }] : []),
      ...(completed.length > 0 && completed.length < 5 ? [{
        type: "early_stage",
        message: "You've completed a few lessons — consistency is key. Try to learn a little every day!",
        severity: "info" as const
      }] : []),
      ...(overallProgress >= 80 ? [{
        type: "almost_done",
        message: `You've completed ${overallProgress}% of your lessons — almost there! Finish strong and aim for that certificate.`,
        severity: "success" as const
      }] : []),
      ...(Object.keys(weakSubjectCounts).length > 0 ? [{
        type: "weak_areas",
        message: `Focus on: ${Object.entries(weakSubjectCounts).slice(0, 3).map(([s, c]) => `${s} (${c} low scores)`).join(", ")}. Review lessons and retry quizzes to improve.`,
        severity: "warning" as const
      }] : []),
      ...(attempts.length >= 5 && avgScoresBySubject.filter((s) => s.avgScore >= 80).length >= 2 ? [{
        type: "strength_areas",
        message: `Your strongest subjects are ${avgScoresBySubject.filter((s) => s.avgScore >= 80).map((s) => s.subjectName).join(", ")} with 80%+ average. Consider helping classmates!`,
        severity: "success" as const
      }] : []),
      ...(totalTimeMinutes > 0 && totalTimeMinutes < 60 ? [{
        type: "time_short",
        message: `You've spent ${totalTimeMinutes} minutes learning total. Try to reach at least 60 minutes for deeper understanding.`,
        severity: "info" as const
      }] : []),
      ...(totalTimeMinutes >= 300 ? [{
        type: "time_dedicated",
        message: `You've spent ${totalTimeMinutes} minutes learning — that's amazing dedication! Keep up the great work.`,
        severity: "success" as const
      }] : [])
    ]
  };
}

export async function getStudentRewards(userId: string) {
  const student = await getStudentByUserId(userId);
  const [badges, certificates, completedLessons] = await Promise.all([
    prisma.studentBadge.findMany({ where: { studentId: student.id }, include: { badge: true }, orderBy: { earnedAt: "desc" } }),
    prisma.certificate.findMany({ where: { studentId: student.id }, include: { course: true }, orderBy: { issuedAt: "desc" } }),
    prisma.lessonProgress.count({ where: { studentId: student.id, status: "COMPLETED" } })
  ]);
  const stars = badges.reduce((sum, item) => sum + item.badge.rewardPoints, 0) + completedLessons * 5;
  return {
    stars,
    streaks: [{ label: "Current streak", days: 3 }, { label: "Best streak", days: 5 }],
    badges,
    certificates,
    recentAchievements: badges.slice(0, 5).map((item) => ({ title: item.badge.name, earnedAt: item.earnedAt }))
  };
}

export async function getStudentCertificates(userId: string) {
  const student = await getStudentByUserId(userId);
  return prisma.certificate.findMany({ where: { studentId: student.id }, include: { course: true }, orderBy: { issuedAt: "desc" } });
}

export async function listLibraryResources(query: { levelId?: string; subjectId?: string; type?: string; language?: string; search?: string }) {
  return prisma.libraryResource.findMany({
    where: {
      ...(query.levelId && { levelId: query.levelId }),
      ...(query.subjectId && { subjectId: query.subjectId }),
      ...(query.type && { type: query.type as LibraryResourceType }),
      ...(query.language && { language: query.language }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } }
        ]
      })
    },
    include: { level: true, subject: true },
    orderBy: { title: "asc" }
  });
}

export async function getLibraryResource(resourceId: string) {
  const resource = await prisma.libraryResource.findUnique({ where: { id: resourceId }, include: { level: true, subject: true } });
  if (!resource) throw new AppError(404, "Library resource not found", "LIBRARY_RESOURCE_NOT_FOUND");
  return resource;
}

export async function getGoals(userId: string) {
  const student = await getStudentByUserId(userId);
  return prisma.goal.findMany({ where: { studentId: student.id }, orderBy: { dueDate: "asc" } });
}

export async function createGoal(userId: string, input: { type: string; target: number; progress?: number; dueDate?: Date }) {
  const student = await getStudentByUserId(userId);
  return prisma.goal.create({
    data: {
      studentId: student.id,
      type: input.type as GoalType,
      target: input.target,
      progress: input.progress ?? 0,
      dueDate: input.dueDate,
      status: GoalStatus.ACTIVE
    }
  });
}

export async function updateGoal(goalId: string, userId: string, input: { target?: number; progress?: number; dueDate?: Date; status?: string }) {
  const student = await getStudentByUserId(userId);
  const goal = await prisma.goal.findFirst({ where: { id: goalId, studentId: student.id } });
  if (!goal) throw new AppError(404, "Goal not found", "GOAL_NOT_FOUND");
  return prisma.goal.update({
    where: { id: goalId },
    data: {
      ...(input.target !== undefined && { target: input.target }),
      ...(input.progress !== undefined && { progress: input.progress }),
      ...(input.dueDate && { dueDate: input.dueDate }),
      ...(input.status && { status: input.status as GoalStatus })
    }
  });
}

export async function listMessages(userId: string) {
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    include: { sender: { select: { id: true, name: true, role: true } }, recipient: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" }
  });
  const threads = new Map<string, typeof messages>();
  for (const message of messages) {
    threads.set(message.threadId, [...(threads.get(message.threadId) ?? []), message]);
  }
  return [...threads.entries()].map(([threadId, items]) => ({
    threadId,
    lastMessage: items[0],
    unreadCount: items.filter((item) => item.recipientId === userId && !item.readAt).length,
    messages: items.reverse()
  }));
}

export async function getMessageThread(userId: string, threadId: string) {
  const messages = await prisma.message.findMany({
    where: { threadId, OR: [{ senderId: userId }, { recipientId: userId }] },
    include: { sender: { select: { id: true, name: true, role: true } }, recipient: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" }
  });
  return messages;
}

export async function createMessage(userId: string, input: { recipientId: string; threadId?: string; body: string }) {
  const [sender, recipient] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.user.findUnique({ where: { id: input.recipientId } })
  ]);
  if (!sender || !recipient) throw new AppError(404, "Sender or recipient not found", "USER_NOT_FOUND");
  if (sender.role === "ADMIN" || recipient.role === "ADMIN") {
    throw new AppError(403, "Students cannot message admin accounts", "MESSAGE_FORBIDDEN");
  }
  return prisma.message.create({
    data: {
      senderId: userId,
      recipientId: input.recipientId,
      senderRole: sender.role as UserRole,
      recipientRole: recipient.role as UserRole,
      threadId: input.threadId ?? [userId, input.recipientId].sort().join(":"),
      body: safeMessageBody(input.body)
    }
  });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function getAnnouncements(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
      type: NotificationType.TEACHER_ANNOUNCEMENT
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notification) throw new AppError(404, "Notification not found", "NOTIFICATION_NOT_FOUND");
  return prisma.notification.update({ where: { id: notificationId }, data: { readAt: new Date() } });
}

function attendanceSummary(records: Array<{ status: string }>) {
  const total = records.length;
  const present = records.filter((item) => item.status === "PRESENT").length;
  const late = records.filter((item) => item.status === "LATE").length;
  const absent = records.filter((item) => item.status === "ABSENT").length;
  const excused = records.filter((item) => item.status === "EXCUSED").length;
  const rate = total ? Math.round(((present + late) / total) * 100) : 0;
  return { total, present, late, absent, excused, rate };
}

function parentNextAction(input: { attendanceRate: number; average?: number | null; hasSupportPlan: boolean }) {
  if (input.attendanceRate && input.attendanceRate < 85) return "Call the school or class teacher about attendance this week.";
  if (input.average !== undefined && input.average !== null && input.average < 55) return "Review the latest report and plan a short home practice routine.";
  if (input.hasSupportPlan) return "Check the learner support plan review date and confirm accommodations are working.";
  return "Encourage today study time and read the latest teacher message.";
}

function generateAiRecommendations(child: {
  marks: Array<{ subject: { name: string }; percentage?: number | null; grade?: string | null }>;
  attendance: { rate: number; absent: number };
  riskScore?: { riskLevel: string } | null;
  name: string;
}): Array<{ type: string; title: string; description: string; priority: "high" | "medium" | "low" }> {
  const recommendations: Array<{ type: string; title: string; description: string; priority: "high" | "medium" | "low" }> = [];

  const lowPerformingSubjects = child.marks
    .filter((m) => m.percentage != null && m.percentage < 50)
    .map((m) => m.subject.name);

  if (lowPerformingSubjects.length > 0) {
    const subjects = [...new Set(lowPerformingSubjects)].slice(0, 3);
    recommendations.push({
      type: "academic",
      title: "Needs Improvement",
      description: `${child.name} needs extra support in ${subjects.join(", ")}. Consider arranging tutoring sessions.`,
      priority: "high",
    });
  }

  if (child.attendance.rate < 85) {
    recommendations.push({
      type: "attendance",
      title: "Attendance Concern",
      description: `Attendance rate is ${child.attendance.rate}%. ${child.name} has been absent ${child.attendance.absent} times recently.`,
      priority: "high",
    });
  }

  if (child.riskScore?.riskLevel === "HIGH") {
    recommendations.push({
      type: "wellness",
      title: "Risk Alert",
      description: `${child.name} has been flagged with a high risk score. Please contact the school counselor.`,
      priority: "high",
    });
  }

  const strongSubjects = child.marks
    .filter((m) => m.percentage != null && m.percentage >= 75)
    .map((m) => m.subject.name);

  if (strongSubjects.length > 0) {
    const subjects = [...new Set(strongSubjects)].slice(0, 2);
    recommendations.push({
      type: "growth",
      title: "Strengths",
      description: `${child.name} is excelling in ${subjects.join(", ")}. Consider enrichment materials.`,
      priority: "medium",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "general",
      title: "On Track",
      description: `${child.name} is doing well. Keep encouraging daily study habits.`,
      priority: "low",
    });
  }

  return recommendations;
}

async function getFeesForStudent(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: { select: { name: true } },
      user: { select: { name: true } },
    },
  });
  if (!student) return null;

  return {
    studentName: student.user.name,
    className: student.class?.name ?? "—",
    totalFee: 0,
    paid: 0,
    balance: 0,
    status: "no_data" as const,
  };
}

async function getPerformanceTrends(studentId: string, monthsBack = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  const marks = await prisma.mark.findMany({
    where: {
      studentId,
      createdAt: { gte: since },
      percentage: { not: null },
    },
    include: { subject: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const bySubject: Record<string, Array<{ date: string; percentage: number }>> = {};
  for (const mark of marks) {
    if (mark.percentage == null) continue;
    const subject = mark.subject.name;
    if (!bySubject[subject]) bySubject[subject] = [];
    bySubject[subject].push({
      date: mark.createdAt.toISOString().slice(0, 10),
      percentage: mark.percentage,
    });
  }

  const overallTrend = marks
    .filter((m) => m.percentage != null)
    .map((m) => ({
      date: m.createdAt.toISOString().split("T")[0],
      percentage: m.percentage!,
      subject: m.subject.name,
    }));

  return { bySubject, overallTrend };
}

export async function getParentDashboard(userId: string) {
  // Parents who signed up themselves have no profile until now.
  await prisma.parent.upsert({ where: { userId }, update: {}, create: { userId } });

  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      students: {
        include: {
          student: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              school: { select: { id: true, name: true } },
              level: true,
              class: true,
              combination: true,
              learnerSupportPlans: { orderBy: { updatedAt: "desc" }, take: 1 },
              riskScore: true,
              reportCards: {
                orderBy: { updatedAt: "desc" },
                take: 1,
                include: { term: true, academicYear: true }
              },
              marks: {
                orderBy: { updatedAt: "desc" },
                take: 20,
                include: { subject: true, term: true }
              },
              attendanceRecords: {
                orderBy: { date: "desc" },
                take: 20
              }
            }
          }
        }
      }
    }
  });

  if (!parent) throw new AppError(404, "Parent profile not found", "PARENT_NOT_FOUND");

  const notifications = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 6 });
  const unreadMessages = await prisma.message.count({ where: { recipientId: userId, readAt: null } });

  const children = await Promise.all(parent.students.map(async (link) => {
    const student = link.student;
    const attendance = attendanceSummary(student.attendanceRecords);
    const latestReport = student.reportCards[0] ?? null;
    const average = latestReport?.averagePercentage ?? (
      student.marks.length
        ? Math.round(student.marks.reduce((sum, mark) => sum + (mark.percentage ?? 0), 0) / student.marks.length)
        : null
    );
    const supportPlan = student.learnerSupportPlans[0] ?? null;
    const aiRecommendations = generateAiRecommendations({
      marks: student.marks,
      attendance,
      riskScore: student.riskScore,
      name: student.user.name,
    });
    const fees = await getFeesForStudent(student.id);
    const trends = await getPerformanceTrends(student.id);

    return {
      id: student.id,
      name: student.user.name,
      studentCode: student.studentCode,
      schoolName: student.school?.name,
      level: student.level.name,
      className: student.class?.name,
      pathway: student.pathway,
      combination: student.combination ? { code: student.combination.code, name: student.combination.name } : null,
      attendance,
      average,
      latestReport: latestReport
        ? {
            id: latestReport.id,
            term: latestReport.term.name,
            academicYear: latestReport.academicYear.name,
            grade: latestReport.grade,
            status: latestReport.status,
            averagePercentage: latestReport.averagePercentage,
            pdfUrl: latestReport.pdfUrl,
            teacherComments: latestReport.teacherComments,
            headteacherComments: latestReport.headteacherComments
          }
        : null,
      recentMarks: student.marks.map((mark) => ({
        id: mark.id,
        subjectName: mark.subject.name,
        term: mark.term.name,
        percentage: mark.percentage,
        grade: mark.grade,
        status: mark.status
      })),
      supportPlan: supportPlan
        ? {
            id: supportPlan.id,
            title: supportPlan.title,
            status: supportPlan.status,
            reviewDate: supportPlan.reviewDate,
            accommodations: supportPlan.accommodations
          }
        : null,
      riskLevel: student.riskScore?.riskLevel ?? "LOW",
      nextAction: parentNextAction({
        attendanceRate: attendance.rate,
        average,
        hasSupportPlan: Boolean(supportPlan)
      }),
      aiRecommendations,
      fees,
      performanceTrends: trends,
    };
  }));

  const averageAttendance = children.length
    ? Math.round(children.reduce((sum, child) => sum + child.attendance.rate, 0) / children.length)
    : 0;
  const childrenWithAlerts = children.filter((child) => child.riskLevel !== "LOW" || child.attendance.absent > 0).length;

  return {
    parent: {
      id: parent.id,
      name: parent.user.name,
      email: parent.user.email,
      phone: parent.phone,
      notificationPreference: parent.notificationPreference
    },
    stats: {
      children: children.length,
      averageAttendance,
      childrenWithAlerts,
      unreadMessages,
      unreadNotifications: notifications.filter((item) => !item.readAt).length
    },
    children,
    notifications,
    guardianBrief: children.map((child) => ({
      childId: child.id,
      childName: child.name,
      message: `${child.name}: ${child.nextAction}`
    }))
  };
}

export async function getStudentMarks(userId: string) {
  const student = await getStudentByUserId(userId);
  const marks = await prisma.mark.findMany({
    where: { studentId: student.id },
    include: {
      subject: { select: { id: true, name: true, icon: true } },
      term: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } },
      teacher: { include: { user: { select: { id: true, name: true } } } }
    },
    orderBy: [{ academicYear: { name: "desc" } }, { term: { name: "desc" } }, { subject: { name: "asc" } }]
  });

  const groupedByYear: Record<string, any> = {};
  for (const mark of marks) {
    const year = mark.academicYear.name;
    if (!groupedByYear[year]) groupedByYear[year] = {};
    const term = mark.term.name;
    if (!groupedByYear[year][term]) groupedByYear[year][term] = [];
    groupedByYear[year][term].push({
      id: mark.id,
      subjectId: mark.subjectId,
      subjectName: mark.subject.name,
      subjectIcon: mark.subject.icon,
      score: mark.score,
      percentage: mark.percentage,
      grade: mark.grade,
      outOf: mark.maxScore,
      status: mark.status,
      type: mark.assessmentType,
      teacherName: mark.teacher.user.name,
      createdAt: mark.createdAt
    });
  }

  const latestMarks = marks.slice(0, 5).map(m => ({
    id: m.id,
    subjectName: m.subject.name,
    percentage: m.percentage,
    grade: m.grade,
    term: m.term.name,
    academicYear: m.academicYear.name
  }));

  return { marks: groupedByYear, latestMarks, totalEntries: marks.length };
}

export async function getStudentReportCards(userId: string) {
  const student = await getStudentByUserId(userId);
  const cards = await prisma.reportCard.findMany({
    where: { studentId: student.id },
    include: {
      term: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true } }
    },
    orderBy: [{ academicYear: { name: "desc" } }, { term: { name: "desc" } }]
  });

  return cards.map(card => ({
    id: card.id,
    term: card.term.name,
    academicYear: card.academicYear.name,
    averagePercentage: card.averagePercentage,
    grade: card.grade,
    classRank: card.classRank,
    status: card.status,
    pdfUrl: card.pdfUrl,
    totalMarks: card.totalMarks,
    teacherComments: card.teacherComments,
    headteacherComments: card.headteacherComments,
    promotionRecommendation: card.promotionRecommendation,
    verificationCode: card.verificationCode
  }));
}

export async function getStudentTimetable(userId: string) {
  const student = await getStudentByUserId(userId);
  if (!student.classId) {
    throw new AppError(400, "Student is not assigned to a class", "CLASS_REQUIRED");
  }

  const periods = await prisma.timetablePeriod.findMany({
    where: { classId: student.classId },
    include: {
      period: { select: { id: true, name: true, startTime: true, endTime: true, shift: true } },
      subject: { select: { id: true, name: true, icon: true } },
      teacher: { include: { user: { select: { id: true, name: true } } } },
      roomRef: { select: { id: true, name: true, type: true } }
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
  });

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const grid = days.map(day => ({
    day,
    label: day.charAt(0) + day.slice(1).toLowerCase(),
    periods: periods
      .filter(p => p.dayOfWeek === day)
      .map(p => ({
        id: p.id,
        periodName: p.period?.name ?? null,
        startTime: p.startTime,
        endTime: p.endTime,
        subjectName: p.subject?.name ?? null,
        subjectIcon: p.subject?.icon ?? null,
        teacherName: p.teacher?.user?.name ?? null,
        roomName: p.roomRef?.name ?? null,
        roomType: p.roomRef?.type ?? null
      }))
  }));

  return {
    className: student.class?.name,
    levelName: student.level?.name,
    schoolName: student.school?.name,
    grid
  };
}

export async function getStudentNationalExams(userId: string) {
  const student = await getStudentByUserId(userId);
  const [registrations, results] = await Promise.all([
    prisma.nationalExamRegistration.findMany({
      where: { studentId: student.id },
      include: {
        academicYear: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.nationalExamResult.findMany({
      where: { studentId: student.id },
      include: {
        subject: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return {
    registrations: registrations.map(r => ({
      id: r.id,
      examYear: r.academicYear?.name ?? null,
      examLevel: r.examLevel,
      status: r.status,
      candidateNumber: r.candidateNumber,
      registeredAt: r.registeredAt,
      className: r.class?.name ?? null
    })),
    results: results.map(r => ({
      id: r.id,
      examLevel: r.examLevel,
      subjectName: r.subject?.name ?? null,
      score: r.score,
      grade: r.grade,
      aggregatePoints: r.aggregatePoints,
      remarks: r.remarks
    }))
  };
}

export async function getStudentAttendanceSummary(userId: string) {
  const student = await getStudentByUserId(userId);
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 60
  });

  const summary = attendanceSummary(records);

  const byMonth: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
  for (const record of records) {
    const monthKey = record.date.toISOString().slice(0, 7);
    if (!byMonth[monthKey]) byMonth[monthKey] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    byMonth[monthKey][record.status.toLowerCase() as keyof typeof byMonth[string]]++;
    byMonth[monthKey].total++;
  }

  const monthlyTrend = Object.entries(byMonth).map(([month, data]) => ({
    month,
    present: data.present,
    absent: data.absent,
    late: data.late,
    excused: data.excused,
    rate: data.total ? Math.round(((data.present + data.late) / data.total) * 100) : 0
  }));

  const recentRecords = records.slice(0, 20).map(r => ({
    id: r.id,
    date: r.date,
    status: r.status,
    reason: r.reason ?? null
  }));

  return { summary, monthlyTrend, recentRecords };
}

export async function getStudentPathway(userId: string) {
  const student = await getStudentByUserId(userId);

  const [pathway, combination, promotions, transfers] = await Promise.all([
    prisma.studentAcademicPathway.findFirst({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" }
    }),
    student.combinationId
      ? prisma.secondaryCombination.findUnique({
          where: { id: student.combinationId },
          include: {
            subjects: {
              include: { subject: { select: { id: true, name: true, icon: true } } }
            }
          }
        })
      : null,
    prisma.studentPromotion.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.studentTransfer.findMany({
      where: { studentId: student.id },
      orderBy: { transferDate: "desc" }
    })
  ]);

  // Promotions and transfers store plain ids rather than Prisma relations, so names are loaded separately.
  const classIds = [...new Set(promotions.flatMap((p) => [p.fromClassId, p.toClassId]).filter((id): id is string => !!id))];
  const schoolIds = [...new Set(transfers.flatMap((t) => [t.fromSchoolId, t.toSchoolId]).filter((id): id is string => !!id))];
  const [classes, schools] = await Promise.all([
    prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, level: { select: { name: true } } }
    }),
    prisma.school.findMany({ where: { id: { in: schoolIds } }, select: { id: true, name: true } })
  ]);
  const classById = new Map(classes.map((c) => [c.id, c]));
  const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));
  const classOf = (id: string | null) => (id ? classById.get(id) : undefined);
  const schoolNameOf = (id: string | null) => (id ? schoolNameById.get(id) ?? null : null);

  return {
    pathway: pathway
      ? {
          id: pathway.id,
          pathway: pathway.pathway,
          details: pathway.notes,
          startedAt: pathway.startDate,
          status: pathway.status
        }
      : null,
    combination: combination
      ? {
          id: combination.id,
          code: combination.code,
          name: combination.name,
          description: combination.description,
          subjects: combination.subjects.map(s => ({
            id: s.subject.id,
            name: s.subject.name,
            icon: s.subject.icon,
            role: s.role,
            weight: s.nationalExamWeight
          }))
        }
      : null,
    promotions: promotions.map(p => ({
      id: p.id,
      fromLevel: classOf(p.fromClassId)?.level.name ?? null,
      fromClass: classOf(p.fromClassId)?.name ?? null,
      toLevel: classOf(p.toClassId)?.level.name ?? null,
      toClass: classOf(p.toClassId)?.name ?? null,
      status: p.status,
      decisionDate: p.createdAt,
      reason: p.reason ?? null
    })),
    transfers: transfers.map(t => ({
      id: t.id,
      fromSchool: schoolNameOf(t.fromSchoolId),
      toSchool: schoolNameOf(t.toSchoolId),
      transferDate: t.transferDate,
      reason: t.reason ?? null,
      status: t.status
    }))
  };
}

export async function getAdminPlaceholder(resource: string) {
  return {
    resource,
    status: "ready",
    message: `${resource} admin module is scaffolded for future content management.`
  };
}

export async function addNotification(userId: string, title: string, body: string, type: NotificationType = NotificationType.SYSTEM) {
  return prisma.notification.create({ data: { userId, title, body, type } });
}

export async function listLevels() {
  return prisma.level.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } });
}
