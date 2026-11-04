import { resolveActorSchoolId } from "../../middleware/access.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import type { ContentStatus } from "@prisma/client";

const courseIncludes = {
  subject: true,
  level: true,
  teacher: { include: { user: { select: { id: true, name: true, email: true } } } },
  school: { select: { id: true, name: true } },
  units: { include: { lessons: { orderBy: { order: "asc" as const } } }, orderBy: { order: "asc" as const } },
  lessons: { orderBy: { order: "asc" as const } },
  assignments: { orderBy: { createdAt: "desc" as const } },
  quizzes: { include: { questions: true }, orderBy: { createdAt: "desc" as const } },
  enrollments: { select: { id: true, studentId: true, progressPercent: true } },
  _count: { select: { enrollments: true, lessons: true, units: true, assignments: true, quizzes: true } },
};

// ─── Course CRUD ────────────────────────────────────────────────

export async function listCourses(filters: {
  schoolId?: string;
  teacherId?: string;
  status?: ContentStatus;
  levelId?: string;
  subjectId?: string;
  classId?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  let targetLevelId = filters.levelId;
  if (filters.classId) {
    const classRecord = await prisma.class.findUnique({
      where: { id: filters.classId },
      select: { levelId: true },
    });
    if (classRecord) {
      targetLevelId = classRecord.levelId;
    }
  }

  const searchClause = filters.search
    ? {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" as const } },
          { description: { contains: filters.search, mode: "insensitive" as const } },
          { subject: { name: { contains: filters.search, mode: "insensitive" as const } } },
          { level: { name: { contains: filters.search, mode: "insensitive" as const } } },
          { teacher: { user: { name: { contains: filters.search, mode: "insensitive" as const } } } },
        ],
      }
    : {};

  const whereClause = {
    ...(filters.schoolId && { schoolId: filters.schoolId }),
    ...(filters.teacherId && { teacherId: filters.teacherId }),
    ...(filters.status && { status: filters.status }),
    ...(targetLevelId && { levelId: targetLevelId }),
    ...(filters.subjectId && { subjectId: filters.subjectId }),
    ...searchClause,
  };

  const total = await prisma.course.count({ where: whereClause });
  const skip = (filters.page - 1) * filters.limit;

  const courses = await prisma.course.findMany({
    where: whereClause,
    include: courseIncludes,
    orderBy: { createdAt: "desc" },
    skip,
    take: filters.limit,
  });

  return { courses, total };
}

export async function getMyCourses(userId: string, roles: string[]) {
  if (roles.includes("STUDENT")) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError(404, "Student profile not found", "STUDENT_NOT_FOUND");
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: student.id },
      include: {
        course: {
          include: {
            ...courseIncludes,
            quizzes: {
              include: {
                questions: true,
                attempts: {
                  where: { studentId: student.id },
                  orderBy: { submittedAt: "desc" as const },
                  take: 1,
                },
              },
              orderBy: { createdAt: "desc" as const },
            },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return enrollments.map((e) => ({
      ...e.course,
      enrolledAt: e.enrolledAt,
      progressPercent: e.progressPercent,
      enrollmentId: e.id
    }));
  }

  // Teacher / admin path
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    // A super admin sees all courses, and a school admin those of their own school.
    if (roles.includes("ADMIN") || roles.includes("SUPER_ADMIN")) {
      const schoolId = roles.includes("SUPER_ADMIN") ? undefined : await resolveActorSchoolId(userId);
      return prisma.course.findMany({ where: schoolId ? { schoolId } : undefined, include: courseIncludes, orderBy: { createdAt: "desc" } });
    }
    // Otherwise return empty for non-teachers
    return [];
  }
  return prisma.course.findMany({
    where: { teacherId: teacher.id },
    include: courseIncludes,
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourseById(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: courseIncludes,
  });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");
  return course;
}

export async function createCourse(input: {
  title: string;
  subjectId: string;
  levelId: string;
  description?: string;
  coverImage?: string;
  status?: ContentStatus;
  schoolId?: string;
  academicYear?: string;
  term?: string;
  language?: string;
  learningObjectives?: string;
}, userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new AppError(403, "Teacher profile not found", "TEACHER_NOT_FOUND");

  return prisma.course.create({
    data: {
      title: input.title,
      subjectId: input.subjectId,
      levelId: input.levelId,
      description: input.description ?? "",
      coverImage: input.coverImage,
      status: input.status ?? "DRAFT",
      teacherId: teacher.id,
      schoolId: input.schoolId ?? teacher.schoolId,
      academicYear: input.academicYear,
      term: input.term,
      language: input.language ?? "en",
      learningObjectives: input.learningObjectives,
    },
    include: courseIncludes,
  });
}

export async function updateCourse(courseId: string, input: {
  title?: string;
  subjectId?: string;
  levelId?: string;
  description?: string;
  coverImage?: string;
  status?: ContentStatus;
  academicYear?: string;
  term?: string;
  language?: string;
  learningObjectives?: string;
}, userId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  return prisma.course.update({
    where: { id: courseId },
    data: input,
    include: courseIncludes,
  });
}

export async function deleteCourse(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  return prisma.course.delete({ where: { id: courseId } });
}

export async function duplicateCourse(courseId: string, userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new AppError(403, "Teacher profile not found", "TEACHER_NOT_FOUND");

  const sourceCourse = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      units: {
        include: {
          lessons: {
            include: {
              activities: {
                include: {
                  quiz: { include: { questions: true } },
                  assignment: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!sourceCourse) throw new AppError(404, "Source course not found", "COURSE_NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    // 1. Duplicate Course
    const newCourse = await tx.course.create({
      data: {
        title: `${sourceCourse.title} (Copy)`,
        description: sourceCourse.description,
        subjectId: sourceCourse.subjectId,
        levelId: sourceCourse.levelId,
        coverImage: sourceCourse.coverImage,
        academicYear: sourceCourse.academicYear,
        term: sourceCourse.term,
        language: sourceCourse.language,
        learningObjectives: sourceCourse.learningObjectives,
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
        status: "DRAFT",
      },
    });

    // 2. Duplicate Units & Lessons & Activities
    for (const unit of sourceCourse.units) {
      const newUnit = await tx.unit.create({
        data: {
          courseId: newCourse.id,
          title: unit.title,
          description: unit.description,
          keyCompetence: (unit as any).keyCompetence,
          genericCompetencies: (unit as any).genericCompetencies,
          crossCuttingIssues: (unit as any).crossCuttingIssues,
          order: unit.order,
        },
      });

      for (const lesson of unit.lessons) {
        const newLesson = await tx.lesson.create({
          data: {
            courseId: newCourse.id,
            unitId: newUnit.id,
            title: lesson.title,
            topic: (lesson as any).topic,
            learningObjectives: (lesson as any).learningObjectives,
            genericCompetencies: (lesson as any).genericCompetencies,
            crossCuttingIssues: (lesson as any).crossCuttingIssues,
            teacherActivities: (lesson as any).teacherActivities,
            learnerActivities: (lesson as any).learnerActivities,
            assessmentCriteria: (lesson as any).assessmentCriteria,
            description: lesson.description,
            notes: lesson.notes,
            body: lesson.body,
            contentType: lesson.contentType,
            videoUrl: lesson.videoUrl,
            audioUrl: lesson.audioUrl,
            attachments: lesson.attachments as any,
            images: lesson.images as any,
            homework: lesson.homework,
            order: lesson.order,
            estimatedMinutes: lesson.estimatedMinutes,
            status: "DRAFT",
          },
        });

        for (const activity of lesson.activities) {
          let newQuizId: string | undefined;
          let newAssignmentId: string | undefined;

          if (activity.quiz) {
            const newQuiz = await tx.quiz.create({
              data: {
                courseId: newCourse.id,
                lessonId: newLesson.id,
                title: activity.quiz.title,
                timeLimit: activity.quiz.timeLimit,
                status: "DRAFT",
                questions: {
                  create: activity.quiz.questions.map((q) => ({
                    questionText: q.questionText,
                    type: q.type,
                    options: q.options as any,
                    answer: q.answer as any,
                    points: q.points,
                    explanation: q.explanation,
                    order: q.order,
                    status: q.status,
                  })),
                },
              },
            });
            newQuizId = newQuiz.id;
          }

          if (activity.assignment) {
            const newAssignment = await tx.assignment.create({
              data: {
                courseId: newCourse.id,
                lessonId: newLesson.id,
                title: activity.assignment.title,
                description: activity.assignment.description,
                points: activity.assignment.points,
                dueDate: activity.assignment.dueDate,
              },
            });
            newAssignmentId = newAssignment.id;
          }

          await tx.activity.create({
            data: {
              courseId: newCourse.id,
              unitId: newUnit.id,
              lessonId: newLesson.id,
              type: activity.type,
              title: activity.title,
              description: activity.description,
              quizId: newQuizId,
              assignmentId: newAssignmentId,
              order: activity.order,
              status: activity.status,
            },
          });
        }
      }
    }

    return newCourse;
  });
}

export async function publishCourse(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  return prisma.course.update({
    where: { id: courseId },
    data: { status: "PUBLISHED" },
    include: courseIncludes,
  });
}

export async function unpublishCourse(courseId: string) {
  return prisma.course.update({
    where: { id: courseId },
    data: { status: "DRAFT" },
    include: courseIncludes,
  });
}

export async function archiveCourse(courseId: string) {
  return prisma.course.update({
    where: { id: courseId },
    data: { status: "ARCHIVED" },
    include: courseIncludes,
  });
}

// ─── Unit CRUD ──────────────────────────────────────────────────

export async function createUnit(courseId: string, input: {
  title: string;
  description?: string;
  keyCompetence?: string;
  genericCompetencies?: string[];
  crossCuttingIssues?: string[];
  order?: number;
}) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  const maxOrder = await prisma.unit.aggregate({
    where: { courseId },
    _max: { order: true },
  });

  return prisma.unit.create({
    data: {
      courseId,
      title: input.title,
      description: input.description,
      keyCompetence: input.keyCompetence,
      genericCompetencies: input.genericCompetencies ?? [],
      crossCuttingIssues: input.crossCuttingIssues ?? [],
      order: input.order ?? (maxOrder._max.order !== null ? maxOrder._max.order + 1 : 0),
    },
    include: { lessons: { orderBy: { order: "asc" } } },
  });
}

export async function updateUnit(unitId: string, input: {
  title?: string;
  description?: string;
  order?: number;
}) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) throw new AppError(404, "Unit not found", "UNIT_NOT_FOUND");

  return prisma.unit.update({
    where: { id: unitId },
    data: input,
    include: { lessons: { orderBy: { order: "asc" } } },
  });
}

export async function deleteUnit(unitId: string) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) throw new AppError(404, "Unit not found", "UNIT_NOT_FOUND");

  return prisma.unit.delete({ where: { id: unitId } });
}

export async function reorderUnits(courseId: string, unitOrder: Array<{ unitId: string; order: number }>) {
  const updates = unitOrder.map(({ unitId, order }) =>
    prisma.unit.update({ where: { id: unitId }, data: { order } })
  );
  return prisma.$transaction(updates);
}

// ─── Lesson CRUD ────────────────────────────────────────────────

export async function createLesson(courseId: string, input: {
  title: string;
  unitId?: string;
  topic?: string;
  learningObjectives?: string;
  genericCompetencies?: string[];
  crossCuttingIssues?: string[];
  teacherActivities?: string;
  learnerActivities?: string;
  assessmentCriteria?: string;
  description?: string;
  notes?: string;
  videoUrl?: string;
  attachments?: string[];
  images?: string[];
  audioUrl?: string;
  estimatedMinutes?: number;
  homework?: string;
  status?: ContentStatus;
  body?: string;
  contentType?: string;
}) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  if (input.unitId) {
    const unit = await prisma.unit.findUnique({ where: { id: input.unitId } });
    if (!unit || unit.courseId !== courseId) throw new AppError(404, "Unit not found in this course", "UNIT_NOT_FOUND");
  }

  const maxOrder = await prisma.lesson.aggregate({
    where: { courseId, unitId: input.unitId ?? null },
    _max: { order: true },
  });

  return prisma.lesson.create({
    data: {
      courseId,
      unitId: input.unitId ?? null,
      title: input.title,
      topic: input.topic,
      learningObjectives: input.learningObjectives,
      genericCompetencies: input.genericCompetencies ?? [],
      crossCuttingIssues: input.crossCuttingIssues ?? [],
      teacherActivities: input.teacherActivities,
      learnerActivities: input.learnerActivities,
      assessmentCriteria: input.assessmentCriteria,
      description: input.description,
      notes: input.notes,
      body: input.body ?? "",
      contentType: (input.contentType as any) ?? "MIXED",
      videoUrl: input.videoUrl,
      audioUrl: input.audioUrl,
      attachments: input.attachments ?? [],
      images: input.images ?? [],
      homework: input.homework,
      status: input.status ?? "DRAFT",
      estimatedMinutes: input.estimatedMinutes ?? 10,
      order: maxOrder._max.order !== null ? maxOrder._max.order + 1 : 0,
    },
  });
}

export async function updateLesson(lessonId: string, input: {
  title?: string;
  unitId?: string;
  description?: string;
  notes?: string;
  videoUrl?: string;
  attachments?: string[];
  images?: string[];
  audioUrl?: string;
  estimatedMinutes?: number;
  homework?: string;
  status?: ContentStatus;
  body?: string;
  contentType?: string;
}) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");

  return prisma.lesson.update({
    where: { id: lessonId },
    data: input as any,
  });
}

export async function deleteLesson(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");

  return prisma.lesson.delete({ where: { id: lessonId } });
}

export async function publishLesson(lessonId: string) {
  return prisma.lesson.update({
    where: { id: lessonId },
    data: { status: "PUBLISHED" },
  });
}

export async function unpublishLesson(lessonId: string) {
  return prisma.lesson.update({
    where: { id: lessonId },
    data: { status: "DRAFT" },
  });
}

export async function reorderLessons(courseId: string, lessonOrder: Array<{ lessonId: string; order: number }>) {
  const updates = lessonOrder.map(({ lessonId, order }) =>
    prisma.lesson.update({ where: { id: lessonId }, data: { order } })
  );
  return prisma.$transaction(updates);
}

// ─── Enrollment ─────────────────────────────────────────────────

export async function enrollStudent(courseId: string, studentId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");

  const existing = await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (existing) throw new AppError(409, "Student is already enrolled in this course", "ALREADY_ENROLLED");

  return prisma.courseEnrollment.create({
    data: { courseId, studentId },
  });
}

export async function assignCourse(courseId: string, input: { classId?: string; studentIds?: string[] }) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  let targetStudentIds: string[] = [];

  if (input.classId) {
    const studentsInClass = await prisma.student.findMany({
      where: { classId: input.classId },
      select: { id: true },
    });
    targetStudentIds = studentsInClass.map((s) => s.id);
  } else if (input.studentIds && input.studentIds.length > 0) {
    targetStudentIds = input.studentIds;
  } else {
    throw new AppError(400, "Must provide either classId or studentIds", "INVALID_INPUT");
  }

  if (targetStudentIds.length === 0) {
    return { assignedCount: 0 };
  }

  const existingEnrollments = await prisma.courseEnrollment.findMany({
    where: {
      courseId,
      studentId: { in: targetStudentIds },
    },
    select: { studentId: true },
  });

  const existingIds = new Set(existingEnrollments.map((e) => e.studentId));
  const newStudentIds = targetStudentIds.filter((id) => !existingIds.has(id));

  if (newStudentIds.length === 0) {
    return { assignedCount: 0 };
  }

  const result = await prisma.courseEnrollment.createMany({
    data: newStudentIds.map((studentId) => ({ courseId, studentId })),
    skipDuplicates: true,
  });

  return { assignedCount: result.count };
}

export async function getStudentCourses(studentId: string) {
  return prisma.courseEnrollment.findMany({
    where: { studentId },
    include: {
      course: { include: courseIncludes },
    },
    orderBy: { enrolledAt: "desc" },
  });
}

export async function getTeacherCourses(teacherId: string) {
  return prisma.course.findMany({
    where: { teacherId },
    include: courseIncludes,
    orderBy: { createdAt: "desc" },
  });
}

export async function getSchoolCourses(schoolId: string) {
  return prisma.course.findMany({
    where: { schoolId },
    include: courseIncludes,
    orderBy: { createdAt: "desc" },
  });
}

// ─── Analytics ──────────────────────────────────────────────────

export async function getCourseAnalytics(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      enrollments: true,
      lessons: { select: { id: true } },
      quizzes: {
        include: {
          attempts: { select: { score: true } },
        },
      },
    },
  });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  const totalEnrollments = course.enrollments.length;
  const completedCount = course.enrollments.filter((e) => e.completedAt !== null).length;
  const avgProgress = totalEnrollments
    ? Math.round(course.enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / totalEnrollments)
    : 0;
  const totalLessons = course.lessons.length;
  const quizScores = course.quizzes.flatMap((q) => q.attempts.map((a) => a.score));
  const avgQuizScore = quizScores.length
    ? Math.round(quizScores.reduce((sum, s) => sum + s, 0) / quizScores.length)
    : 0;

  return {
    totalEnrollments,
    completedCount,
    avgProgress,
    totalLessons,
    avgQuizScore,
    totalQuizAttempts: quizScores.length,
  };
}