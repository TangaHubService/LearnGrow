import {
  AttendanceStatus,
  ContentStatus,
  Prisma,
  RecordStatus,
  TeacherResourceType,
  UserRole
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { resolveActorSchoolId } from "../../middleware/access.js";
import { AppError } from "../../http/errors.js";
import { prisma } from "../../prisma/client.js";
import { saveMarkSubmissionDraft } from "../marks/marks.service.js";

const teacherRoles = ["TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"];
const teacherOnlyRole = UserRole.TEACHER;

type ListQuery = {
  search?: string;
  status?: string;
  classId?: string;
  subjectName?: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortDir: "asc" | "desc";
  stream?: string;
  gender?: string;
  disability?: string;
  disabilityStatus?: string;
  academicYear?: string;
};

async function context(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(401, "User not found. Your session may have expired or the database was reset. Please log in again.", "USER_NOT_FOUND");
    }
    if (!teacherRoles.includes(user.role)) {
      throw new AppError(403, "Teacher access is required to access reference data", "TEACHER_ACCESS_REQUIRED");
    }
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    const schoolId = await resolveActorSchoolId(userId);
    return { user, teacher, schoolId };
  } catch (error) {
    console.error(`Error in context(userId: ${userId}):`, error);
    throw error;
  }
}

type TeacherContext = Awaited<ReturnType<typeof context>>;

function isTeacherOnly(ctx: TeacherContext) {
  return ctx.user.role === teacherOnlyRole;
}

function requireTeacherProfile(ctx: TeacherContext) {
  if (isTeacherOnly(ctx) && !ctx.teacher) {
    throw new AppError(403, "Teacher profile required", "TEACHER_PROFILE_REQUIRED");
  }
}

function activeAssignmentWhere(ctx: TeacherContext): Prisma.TeacherClassAssignmentWhereInput {
  requireTeacherProfile(ctx);
  return isTeacherOnly(ctx)
    ? { teacherId: ctx.teacher!.id, status: RecordStatus.ACTIVE }
    : { schoolId: ctx.schoolId, status: RecordStatus.ACTIVE };
}

async function teacherScope(userId: string) {
  try {
    const ctx = await context(userId);
    const assignments = await prisma.teacherClassAssignment.findMany({
      where: activeAssignmentWhere(ctx),
      orderBy: [{ updatedAt: "desc" }, { subjectName: "asc" }]
    });
    const classIds = [...new Set(assignments.map((assignment) => assignment.classId))];
    const subjectNames = [...new Set(assignments.map((assignment) => assignment.subjectName).filter(Boolean))];
    return { ...ctx, assignments, classIds, subjectNames };
  } catch (error) {
    console.error(`Error in teacherScope(userId: ${userId}):`, error);
    throw error;
  }
}

function assignedClassFilter(scope: Awaited<ReturnType<typeof teacherScope>>): Prisma.StringFilter | undefined {
  if (isTeacherOnly(scope)) return { in: scope.classIds.length ? scope.classIds : ["__no_assigned_classes__"] };
  return undefined;
}

function lessonDashboardWhere(scope: Awaited<ReturnType<typeof teacherScope>>, extra: Prisma.LessonWhereInput = {}): Prisma.LessonWhereInput {
  return {
    schoolId: scope.schoolId,
    status: { not: ContentStatus.ARCHIVED },
    ...(isTeacherOnly(scope) ? { teacherId: scope.teacher!.id, classId: assignedClassFilter(scope) } : {}),
    ...extra
  };
}

function quizDashboardWhere(scope: Awaited<ReturnType<typeof teacherScope>>, extra: Prisma.QuizWhereInput = {}): Prisma.QuizWhereInput {
  return {
    schoolId: scope.schoolId,
    status: { not: ContentStatus.ARCHIVED },
    ...(isTeacherOnly(scope) ? { teacherId: scope.teacher!.id, classId: assignedClassFilter(scope) } : {}),
    ...extra
  };
}

function classScopedWhere(scope: Awaited<ReturnType<typeof teacherScope>>, extra: Record<string, unknown> = {}) {
  return {
    schoolId: scope.schoolId,
    ...(isTeacherOnly(scope) ? { teacherId: scope.teacher!.id, classId: { in: scope.classIds.length ? scope.classIds : ["__no_assigned_classes__"] } } : {}),
    ...extra
  };
}

function dashboardDateRange(dateText?: string) {
  const match = dateText?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const source = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : new Date();
  const start = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const date = start.toISOString().slice(0, 10);
  return { date, start, end };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatTime(date: Date) {
  return date.toISOString().slice(11, 16);
}

function lessonScheduleStatus(lesson: { status: ContentStatus; deliverySessions?: Array<{ status: RecordStatus }> }) {
  if (lesson.status === ContentStatus.COMPLETED || lesson.deliverySessions?.some((session) => session.status === RecordStatus.COMPLETED)) return "Taught";
  if (lesson.status === ContentStatus.DRAFT) return "Draft";
  if (lesson.status === ContentStatus.IN_PROGRESS) return "Pending";
  if (lesson.status === ContentStatus.PUBLISHED || lesson.status === ContentStatus.SCHEDULED) return "Prepared";
  return "Not Prepared";
}

function scheduleActionForStatus(status: string) {
  if (status === "Taught") return "View";
  if (status === "Draft" || status === "Not Prepared") return "Prepare with AI";
  if (status === "Pending") return "Continue";
  return "Mark as Taught";
}

function assessmentStatus(quiz: { status: ContentStatus; dueAt: Date | null; completionRate?: number; responses?: unknown[] }) {
  if (quiz.status === ContentStatus.DRAFT) return "Draft";
  if (quiz.status === ContentStatus.COMPLETED || (quiz.completionRate ?? 0) >= 100) return "Marked";
  if (quiz.dueAt && quiz.dueAt < new Date() && (quiz.completionRate ?? 0) < 100) return "Overdue";
  if ((quiz.responses?.length ?? 0) > 0 && (quiz.completionRate ?? 0) < 100) return "To Mark";
  if (quiz.status === ContentStatus.PUBLISHED) return "Published";
  return "Published";
}

function assessmentActionForStatus(status: string) {
  if (status === "Draft") return "Continue Draft";
  if (status === "Marked") return "View Results";
  if (status === "Not Marked" || status === "To Mark" || status === "Overdue") return "Mark";
  return "Open";
}

function aiOutputType(taskType: string) {
  return taskType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bAi\b/g, "AI");
}

function pageArgs(query: ListQuery) {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
}

async function audit(userId: string, role: UserRole, action: string, entityType: string, entityId: string | null, metadata: Prisma.InputJsonValue = {}) {
  await prisma.auditLog.create({
    data: { userId, role, action, entityType, entityId, metadata }
  });
}

async function classesByAssignment(userId: string) {
  const ctx = await context(userId);
  const { schoolId } = ctx;
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: activeAssignmentWhere(ctx),
    orderBy: { updatedAt: "desc" }
  });
  const classRecords = await prisma.class.findMany({
    where: { id: { in: assignments.map((item) => item.classId) } },
    include: { level: true, students: { include: { user: true } } }
  });
  const byId = new Map(classRecords.map((item) => [item.id, item]));
  return assignments.map((assignment) => ({ assignment, classRecord: byId.get(assignment.classId) })).filter((item) => item.classRecord);
}

export async function getTeacherReferenceData(userId: string) {
  const scope = await teacherScope(userId);
  const { schoolId, assignments } = scope;
  const [school, levels, classes, subjects, teachers, students, parents, resourceTopics, academicYears, terms] = await Promise.all([
    prisma.school.findUnique({ where: { id: schoolId } }),
    prisma.level.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.class.findMany({ where: { schoolId }, include: { level: true, students: { include: { user: true } } }, orderBy: { name: "asc" } }),
    prisma.subject.findMany({ include: { level: true }, orderBy: [{ level: { order: "asc" } }, { name: "asc" }] }),
    prisma.teacher.findMany({ where: { schoolId }, include: { user: true }, orderBy: { user: { name: "asc" } } }),
    prisma.student.findMany({ where: { schoolId }, include: { user: true, class: { include: { level: true } } }, orderBy: { user: { name: "asc" } } }),
    prisma.user.findMany({ where: { role: UserRole.PARENT }, orderBy: { name: "asc" } }),
    prisma.teacherResource.findMany({ where: { schoolId }, select: { subjectName: true, topic: true, title: true, tags: true, className: true }, orderBy: { updatedAt: "desc" } }),
    prisma.academicYear.findMany({ where: { schoolId }, orderBy: { startDate: "desc" } }),
    prisma.term.findMany({ where: { schoolId }, include: { academicYear: true }, orderBy: { startDate: "desc" } })
  ]);
  const subjectByName = new Map(subjects.map((subject) => [subject.name.toLowerCase(), subject]));
  // Topics come only from resources (lessons/quizzes no longer carry topic metadata)
  const topics = uniqueBy(
    resourceTopics
      .filter((item) => item.topic)
      .map((item) => {
        const subject = item.subjectName ? subjectByName.get(item.subjectName.toLowerCase()) : undefined;
        return {
          id: `${item.subjectName ?? "general"}:${item.topic}`,
          name: item.topic!,
          subjectId: subject?.id,
          subjectName: item.subjectName,
          classId: item.className ?? undefined,
          sourceTitle: item.title
        };
      }),
    (item) => `${item.subjectName ?? ""}:${item.name}`.toLowerCase()
  );
  const subtopics = uniqueBy(resourceTopics.flatMap((resource) => (resource.tags ?? []).map((tag) => {
    const subject = resource.subjectName ? subjectByName.get(resource.subjectName.toLowerCase()) : undefined;
    return {
      id: `${resource.subjectName ?? "general"}:${resource.topic ?? "topic"}:${tag}`,
      name: tag,
      topicName: resource.topic,
      subjectId: subject?.id,
      subjectName: resource.subjectName,
      sourceTitle: resource.title
    };
  })), (item) => `${item.subjectName ?? ""}:${item.topicName ?? ""}:${item.name}`.toLowerCase());

  return {
    school: school ? { id: school.id, name: school.name, district: school.district, type: school.type } : null,
    levels: levels.map((level) => ({ id: level.id, name: level.name, category: level.category, order: level.order })),
    classes: classes.map((classRecord) => ({
      id: classRecord.id,
      name: classRecord.name,
      levelId: classRecord.levelId,
      levelName: classRecord.level.name,
      levelCategory: classRecord.level.category,
      students: classRecord.students.length
    })),
    subjects: subjects.map((subject) => ({ id: subject.id, name: subject.name, levelId: subject.levelId, levelName: subject.level.name, category: subject.level.category })),
    teachers: teachers.map((teacher) => ({ id: teacher.id, userId: teacher.userId, name: teacher.user.name, email: teacher.user.email, status: teacher.user.status })),
    students: students.map((student) => ({
      id: student.id,
      userId: student.userId,
      name: student.user.name,
      email: student.user.email,
      classId: student.classId,
      className: student.class?.name,
      levelName: student.class?.level.name,
      language: student.language,
      status: student.user.status
    })),
    parents: parents.map((parent) => ({ id: parent.id, name: parent.name, email: parent.email, status: parent.status })),
    topics,
    subtopics,
    academicYears: academicYears.map((year) => ({ id: year.id, name: year.name, startDate: year.startDate, endDate: year.endDate, status: year.status })),
    terms: terms.map((term) => ({ id: term.id, name: term.name, academicYearId: term.academicYearId, academicYearName: term.academicYear.name, startDate: term.startDate, endDate: term.endDate, status: term.status })),
    assignments: assignments.map((a) => ({
      id: a.id,
      classId: a.classId,
      subjectName: a.subjectName
    }))
  };
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getCurrentTeacherDashboardProfile(userId: string) {
  const { user, teacher, schoolId } = await context(userId);
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  return {
    id: teacher?.id ?? user.id,
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImageUrl: null,
    schoolName: school?.name ?? null
  };
}

export async function getTeacherDashboardStats(userId: string, dateText?: string) {
  try {
    const scope = await teacherScope(userId);
    const { start, end } = dashboardDateRange(dateText);
    const todaysLessonWhere = lessonDashboardWhere(scope, { scheduledAt: { gte: start, lt: end } });

    const [todaysLessons, completedLessons, pendingLessonPlans, pendingAssessments, newQuizzes, newAssignments] = await Promise.all([
      prisma.lesson.count({
        where: {
          teacherId: scope.teacher?.id,
          scheduledAt: todaysLessonWhere.scheduledAt
        }
      }),
      prisma.lesson.count({
        where: {
          teacherId: scope.teacher?.id,
          OR: [
            { status: ContentStatus.COMPLETED },
            { deliverySessions: { some: { status: RecordStatus.COMPLETED } } }
          ]
        }
      }),
      prisma.lesson.count({
        where: {
          teacherId: scope.teacher?.id,
          status: { in: [ContentStatus.DRAFT, ContentStatus.IN_PROGRESS] },
          scheduledAt: { not: null }
        }
      }),
      prisma.quiz.count({
        where: {
          teacherId: scope.teacher?.id,
          status: { in: [ContentStatus.DRAFT, ContentStatus.PUBLISHED] }
        }
      }),
      prisma.quiz.count({
        where: { course: { teacherId: scope.teacher?.id } }
      }),
      prisma.assignment.count({
        where: { course: { teacherId: scope.teacher?.id } }
      })
    ]);

    return {
      todaysLessons,
      completedLessons,
      myClasses: scope.classIds.length,
      mySubjects: scope.subjectNames.length,
      pendingLessonPlans,
      pendingAssessments: pendingAssessments + newQuizzes + newAssignments
    };
  } catch (error) {
    console.error("Error in getTeacherDashboardStats:", error);
    throw error;
  }
}

export async function getTeacherDashboardSchedule(userId: string, dateText?: string) {
  try {
    const scope = await teacherScope(userId);
    const { date, start, end } = dashboardDateRange(dateText);
    if (isTeacherOnly(scope) && !scope.classIds.length) return { date, items: [] };

    const lessons = await prisma.lesson.findMany({
      where: {
        teacherId: scope.teacher?.id,
        scheduledAt: { gte: start, lt: end }
      },
      include: {
        deliverySessions: {
          where: isTeacherOnly(scope) ? { teacherId: scope.teacher!.id } : {},
          orderBy: { updatedAt: "desc" },
          take: 1
        },
        class: { include: { level: true } }
      },
      orderBy: [{ scheduledAt: "asc" }, { title: "asc" }]
    });

    const classes = await prisma.class.findMany({
      where: { id: { in: [...new Set(lessons.map((lesson) => lesson.classId).filter((id): id is string => id !== null))] } },
      include: { level: true }
    });
    const classById = new Map(classes.map((classRecord) => [classRecord.id, classRecord]));

    return {
      date,
      items: lessons.map((lesson) => {
        const startAt = lesson.scheduledAt ?? lesson.createdAt;
        const defaultDuration = lesson.estimatedMinutes ?? 40;
        const endAt = new Date(startAt.getTime() + defaultDuration * 60 * 1000);
        const status = lesson.status; // Directly use status
        return {
          id: lesson.id,
          scheduleId: lesson.id,
          lessonPlanId: lesson.id,
          classId: lesson.classId,
          className: lesson.class?.name ?? "Assigned class",
          levelName: lesson.class?.level.name ?? null,
          subjectName: lesson.title, // Simplified for now
          topic: null,
          title: lesson.title,
          date: startAt.toISOString(),
          startTime: formatTime(startAt),
          endTime: formatTime(endAt),
          durationMinutes: defaultDuration,
          status,
          rawStatus: lesson.status,
          action: scheduleActionForStatus(status as any)
        };
      })
    };
  } catch (error) {
    console.error("Error in getTeacherDashboardSchedule:", error);
    throw error;
  }
}

export async function getTeacherDashboardClasses(userId: string) {
  try {
    const scope = await teacherScope(userId);
    if (!scope.assignments.length) return { items: [] };

    const classRecords = await prisma.class.findMany({
      where: { id: { in: scope.classIds } },
      include: { level: true, students: { include: { user: true } } }
    });
    const classById = new Map(classRecords.map((classRecord) => [classRecord.id, classRecord]));
    const subjects = await prisma.subject.findMany({
      where: {
        name: { in: scope.subjectNames },
        levelId: { in: classRecords.map((classRecord) => classRecord.levelId) }
      }
    });
    const subjectByLevelAndName = new Map(subjects.map((subject) => [`${subject.levelId}:${subject.name.toLowerCase()}`, subject]));

    const [nextLessons, attendance] = await Promise.all([
      prisma.lesson.findMany({
        where: lessonDashboardWhere(scope, { scheduledAt: { gte: new Date() } }),
        include: { class: true, course: { include: { subject: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 100
      }),
      prisma.attendanceRecord.findMany({
        where: {
          schoolId: scope.schoolId,
          classId: { in: scope.classIds },
          ...(isTeacherOnly(scope) ? { teacherId: scope.teacher!.id } : {})
        },
        orderBy: { date: "desc" },
        take: 500
      })
    ]);

    const nextLessonByClassSubject = new Map<string, (typeof nextLessons)[number]>();
    for (const lesson of nextLessons) {
      const subjectName = lesson.course?.subject?.name ?? '';
      const key = `${lesson.classId}:${subjectName}`;
      if (!nextLessonByClassSubject.has(key)) nextLessonByClassSubject.set(key, lesson);
    }

    const attendanceByClass = new Map<string, { present: number; total: number; date: Date }>();
    for (const record of attendance) {
      const current = attendanceByClass.get(record.classId);
      if (!current || record.date > current.date) {
        const recordsForDate = attendance.filter((item) => item.classId === record.classId && item.date.toISOString().slice(0, 10) === record.date.toISOString().slice(0, 10));
        attendanceByClass.set(record.classId, {
          present: recordsForDate.filter((item) => item.status === AttendanceStatus.PRESENT).length,
          total: recordsForDate.length,
          date: record.date
        });
      }
    }

    return {
      items: scope.assignments.map((assignment) => {
        const classRecord = classById.get(assignment.classId);
        const subject = classRecord ? subjectByLevelAndName.get(`${classRecord.levelId}:${assignment.subjectName.toLowerCase()}`) : undefined;
        const nextLesson = nextLessonByClassSubject.get(`${assignment.classId}:${assignment.subjectName}`);
        const classAttendance = attendanceByClass.get(assignment.classId);
        return {
          id: assignment.id,
          assignmentId: assignment.id,
          classId: assignment.classId,
          className: classRecord?.name ?? "Assigned class",
          levelName: classRecord?.level.name ?? null,
          subjectId: subject?.id ?? null,
          subjectName: assignment.subjectName,
          learnerCount: classRecord?.students.length ?? 0,
          nextLesson: nextLesson ? {
            id: nextLesson.id,
            topic: null,
            title: nextLesson.class?.name ? `${nextLesson.class.name} - ${nextLesson.title}` : nextLesson.title,
            scheduledAt: nextLesson.scheduledAt
          } : null,
          attendance: classAttendance ? {
            present: classAttendance.present,
            total: classAttendance.total,
            date: classAttendance.date,
            percentage: classAttendance.total ? Math.round((classAttendance.present / classAttendance.total) * 100) : null
          } : null
        };
      })
    };
  } catch (error) {
    console.error("Error in getTeacherDashboardClasses:", error);
    throw error;
  }
}

/**
 * Attendance per class for a date range (inclusive). The rate uses the same rule
 * as the school-wide attendance summary: present and late count as attended.
 * Classes with nothing marked in the range come back with a null rate.
 */
export async function getTeacherDashboardClassAttendance(userId: string, range: { from: string; to: string }) {
  const scope = await teacherScope(userId);
  if (!scope.classIds.length) return { from: range.from, to: range.to, items: [] };

  const [classRecords, counts] = await Promise.all([
    prisma.class.findMany({
      where: { id: { in: scope.classIds } },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    }),
    prisma.attendanceRecord.groupBy({
      by: ["classId", "status"],
      where: {
        schoolId: scope.schoolId,
        classId: { in: scope.classIds },
        ...(isTeacherOnly(scope) ? { teacherId: scope.teacher!.id } : {}),
        date: {
          gte: new Date(`${range.from}T00:00:00.000Z`),
          lt: addDays(new Date(`${range.to}T00:00:00.000Z`), 1)
        }
      },
      _count: { _all: true }
    })
  ]);

  const countFor = (classId: string, status: AttendanceStatus) =>
    counts.find((row) => row.classId === classId && row.status === status)?._count._all ?? 0;

  return {
    from: range.from,
    to: range.to,
    items: classRecords.map((classRecord) => {
      const present = countFor(classRecord.id, AttendanceStatus.PRESENT);
      const late = countFor(classRecord.id, AttendanceStatus.LATE);
      const absent = countFor(classRecord.id, AttendanceStatus.ABSENT);
      const excused = countFor(classRecord.id, AttendanceStatus.EXCUSED);
      const total = present + late + absent + excused;
      return {
        classId: classRecord.id,
        className: classRecord.name,
        present,
        late,
        absent,
        excused,
        total,
        rate: total ? Math.round(((present + late) / total) * 100) : null
      };
    })
  };
}

export async function getTeacherDashboardAssessments(userId: string) {
  const scope = await teacherScope(userId);
  if (isTeacherOnly(scope) && !scope.classIds.length) return { items: [] };

  const [quizzes, assignments] = await Promise.all([
    prisma.quiz.findMany({
      where: { teacherId: scope.teacher?.id },
      include: {
        course: { include: { subject: true } },
        class: true,
        attempts: true
      },
      orderBy: { createdAt: "desc" },
      take: 12
    }),
    prisma.assignment.findMany({
      where: { course: { teacherId: scope.teacher?.id } },
      include: { course: { include: { subject: true } } },
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  const items = [
    ...quizzes.map((q) => {
      const status = assessmentStatus(q as any);
      const avgScore = q.attempts.length
        ? Math.round(q.attempts.reduce((sum, a) => sum + a.score, 0) / q.attempts.length)
        : 0;
      return {
        id: q.id,
        item: q.title,
        title: q.title,
        classId: q.classId,
        className: q.class?.name ?? "Assigned class",
        subjectName: q.course?.subject?.name ?? "General",
        topic: "Assessment",
        dueDate: q.dueAt,
        status,
        rawStatus: q.status,
        completionRate: 0,
        averageScore: avgScore,
        action: assessmentActionForStatus(status),
        type: "QUIZ"
      };
    }),
    ...assignments.map((a) => ({
      id: a.id,
      item: a.title,
      title: a.title,
      classId: a.courseId,
      className: a.course?.title ?? "Course Assignment",
      subjectName: a.course?.subject?.name ?? "General",
      topic: "Assignment",
      dueDate: a.dueDate,
      status: "Active",
      rawStatus: "ACTIVE",
      completionRate: 0,
      averageScore: 0,
      action: "View",
      type: "ASSIGNMENT"
    }))
  ];

  return { items: items.slice(0, 12) };
}

export async function getTeacherDashboardLearnersNeedingSupport(userId: string) {
  const scope = await teacherScope(userId);
  if (isTeacherOnly(scope) && !scope.classIds.length) return { items: [] };

  const studentWhere: Prisma.StudentWhereInput = {
    schoolId: scope.schoolId,
    ...(isTeacherOnly(scope) ? { classId: { in: scope.classIds } } : {})
  };
  const [students, classRecords, interventions, performance, attendance, overdueAssignments] = await Promise.all([
    prisma.student.findMany({ where: studentWhere, include: { user: true, class: true }, take: 500 }),
    prisma.class.findMany({ where: { schoolId: scope.schoolId, ...(isTeacherOnly(scope) ? { id: { in: scope.classIds } } : {}) } }),
    prisma.intervention.findMany({
      where: classScopedWhere(scope, { status: RecordStatus.ACTIVE }) as Prisma.InterventionWhereInput,
      orderBy: [{ riskLevel: "desc" }, { updatedAt: "desc" }],
      take: 25
    }),
    prisma.performanceRecord.findMany({
      where: classScopedWhere(scope, { status: RecordStatus.ACTIVE }) as Prisma.PerformanceRecordWhereInput,
      orderBy: { recordedAt: "desc" },
      take: 150
    }),
    prisma.attendanceRecord.findMany({
      where: classScopedWhere(scope, { date: { gte: addDays(new Date(), -30) }, status: { in: [AttendanceStatus.ABSENT, AttendanceStatus.LATE] } }) as Prisma.AttendanceRecordWhereInput,
      orderBy: { date: "desc" },
      take: 150
    }),
    // Replace removed teacherQuizAssignment with quiz-based overdue logic
    prisma.quiz.findMany({
      where: {
        schoolId: scope.schoolId,
        dueAt: { lt: new Date() },
        status: { not: ContentStatus.ARCHIVED },
        ...(isTeacherOnly(scope) ? { teacherId: scope.teacher!.id } : {})
      },
      include: { attempts: true },
      orderBy: { dueAt: "desc" },
      take: 20
    })
  ]);

  const studentById = new Map(
    students.map((student) => [student.id, student] as const)
  );
  const studentsByClass = new Map<string, typeof students>();
  for (const student of students) {
    if (!student.classId) continue;
    const list = studentsByClass.get(student.classId) ?? [];
    list.push(student);
    studentsByClass.set(student.classId, list);
  }
  const classById = new Map(
    classRecords.map((classRecord) => [classRecord.id, classRecord] as const)
  );
  const supportItems = new Map<string, {
    id: string;
    learnerId: string;
    learnerName: string;
    classId: string;
    className: string;
    issue: string;
    action: string;
    source: string;
    severity: string;
  }>();

  function addSupport(studentId: string, classId: string, issue: string, action: string, source: string, severity = "medium") {
    const student = studentById.get(studentId);
    if (!student) return;
    const key = `${studentId}:${source}:${issue}`;
    if (supportItems.has(key)) return;
    supportItems.set(key, {
      id: key,
      learnerId: studentId,
      learnerName: student.user.name,
      classId,
      className: classById.get(classId)?.name ?? student.class?.name ?? "Assigned class",
      issue,
      action,
      source,
      severity
    });
  }

  for (const item of interventions) {
    addSupport(item.studentId, item.classId, item.title, "Provide Support", "intervention", item.riskLevel.toLowerCase());
  }

  for (const item of performance) {
    if (!item.maxScore || item.score / item.maxScore >= 0.6) continue;
    addSupport(item.studentId, item.classId, `Low ${item.assessmentType.toLowerCase()} score`, "Give Remedial", "performance", "high");
  }

  const attendanceByStudent = new Map<string, typeof attendance>();
  for (const record of attendance) {
    const list = attendanceByStudent.get(record.studentId) ?? [];
    list.push(record);
    attendanceByStudent.set(record.studentId, list);
  }
  for (const [studentId, records] of attendanceByStudent) {
    const firstRecord = records[0];
    if (!firstRecord) continue;
    const absences = records.filter((record) => record.status === AttendanceStatus.ABSENT).length;
    if (absences >= 2) addSupport(studentId, firstRecord.classId, "Repeated absence", "Follow Up", "attendance", "high");
    else if (records.length >= 3) addSupport(studentId, firstRecord.classId, "Poor attendance", "Contact Parent", "attendance", "medium");
  }

  for (const quiz of overdueAssignments) {
    if (!quiz.classId) continue;
    const submittedStudentIds = new Set(quiz.attempts.map((attempt) => attempt.studentId));
    for (const student of (studentsByClass.get(quiz.classId) ?? []).slice(0, 5)) {
      if (!submittedStudentIds.has(student.id)) {
        addSupport(student.id, quiz.classId, `Missed quiz: ${quiz.title}`, "Follow Up", "assessment", "medium");
      }
    }
  }

  return { items: [...supportItems.values()].slice(0, 12) };
}

export async function getTeacherDashboardNotifications(userId: string) {
  const scope = await teacherScope(userId);
  const today = dashboardDateRange();
  const tomorrowStart = addDays(today.start, 1);
  const tomorrowEnd = addDays(today.end, 1);

  const [stored, tomorrowDrafts, assessments, classes, support] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.lesson.findMany({
      where: lessonDashboardWhere(scope, {
        scheduledAt: { gte: tomorrowStart, lt: tomorrowEnd },
        status: { in: [ContentStatus.DRAFT, ContentStatus.IN_PROGRESS] }
      }),
      include: { class: true, course: { include: { subject: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 4
    }),
    getTeacherDashboardAssessments(userId),
    getTeacherDashboardClasses(userId),
    getTeacherDashboardLearnersNeedingSupport(userId)
  ]);

  const generated: Array<{ id: string; title: string; body: string; type: string; createdAt: Date; readAt: null; source: string }> = [];
  for (const lesson of tomorrowDrafts) {
    const className = classes.items.find((item) => item.classId === lesson.classId)?.className ?? "assigned class";
    const lessonSubjectName = lesson.course?.subject?.name ?? lesson.title;
    generated.push({
      id: `generated-lesson-${lesson.id}`,
      title: "Lesson needs attention",
      body: `${className} ${lessonSubjectName} is scheduled tomorrow and still needs preparation.`,
      type: "SYSTEM",
      createdAt: new Date(),
      readAt: null,
      source: "lesson-plan"
    });
  }

  for (const assessment of assessments.items.filter((item) => ["Overdue", "To Mark", "Not Marked"].includes(item.status)).slice(0, 3)) {
    generated.push({
      id: `generated-assessment-${assessment.id}`,
      title: "Assessment marking pending",
      body: `${assessment.item} for ${assessment.className} is ${assessment.status.toLowerCase()}.`,
      type: "SYSTEM",
      createdAt: new Date(),
      readAt: null,
      source: "assessment"
    });
  }

  for (const classItem of classes.items.filter((item) => !item.attendance).slice(0, 3)) {
    generated.push({
      id: `generated-attendance-${classItem.assignmentId}`,
      title: "Attendance not submitted",
      body: `${classItem.className} ${classItem.subjectName} has no recent attendance record.`,
      type: "SYSTEM",
      createdAt: new Date(),
      readAt: null,
      source: "attendance"
    });
  }

  if (support.items.length) {
    generated.push({
      id: "generated-learner-support",
      title: "Learners need support",
      body: `${support.items.length} learner${support.items.length === 1 ? "" : "s"} currently flagged from marks, attendance, or interventions.`,
      type: "AI",
      createdAt: new Date(),
      readAt: null,
      source: "learner-support"
    });
  }

  return {
    items: [
      ...stored.map((item) => ({ ...item, source: "notification" })),
      ...generated
    ].slice(0, 10)
  };
}

export async function getTeacherDashboardRecentAiOutputs(userId: string) {
  try {
    await context(userId);
    const items = await prisma.teacherAiOutput.findMany({
      where: { teacherId: userId },
      orderBy: { createdAt: "desc" },
      take: 8
    });
    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title || item.topicName || item.subjectName || aiOutputType(item.taskType),
        type: aiOutputType(item.taskType),
        taskType: item.taskType,
        date: item.createdAt,
        subjectName: item.subjectName,
        className: item.className,
        topicName: item.topicName,
        output: item.output,
        teacherRequest: item.teacherRequest,
        action: "Open"
      }))
    };
  } catch (error) {
    console.error("Error in getTeacherDashboardRecentAiOutputs:", error);
    throw error;
  }
}

export async function getTeacherDashboard(userId: string, filters: Partial<ListQuery>) {
  const [teacher, stats, schedule, classOverview, notifications, learnersNeedingSupport, assessments, recentAiOutputs, aiInsights, messages, recentActivities] = await Promise.all([
    getCurrentTeacherDashboardProfile(userId),
    getTeacherDashboardStats(userId),
    getTeacherDashboardSchedule(userId),
    getTeacherDashboardClasses(userId),
    getTeacherDashboardNotifications(userId),
    getTeacherDashboardLearnersNeedingSupport(userId),
    getTeacherDashboardAssessments(userId),
    getTeacherDashboardRecentAiOutputs(userId),
    prisma.aIInsight.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.message.findMany({ where: { OR: [{ senderId: userId }, { recipientId: userId }] }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.auditLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 })
  ]);
  const studentsCount = classOverview.items.reduce((sum, item) => sum + item.learnerCount, 0);

  return {
    filters,
    teacher,
    stats,
    cards: {
      myClasses: stats.myClasses,
      students: studentsCount,
      todaysLessons: stats.todaysLessons,
      pendingTasks: stats.pendingLessonPlans + stats.pendingAssessments
    },
    schedule: schedule.items,
    classOverview: classOverview.items.map((item) => ({
      ...item,
      id: item.classId,
      name: item.className,
      level: item.levelName,
      students: item.learnerCount,
      performance: 0,
      status: "ACTIVE"
    })),
    notifications: notifications.items,
    learnersNeedingSupport: learnersNeedingSupport.items,
    assessments: assessments.items,
    recentAiOutputs: recentAiOutputs.items,
    recentActivities,
    aiInsights,
    messages
  };
}

export async function listTeacherClasses(userId: string, query: ListQuery) {
  const items = await classesByAssignment(userId);
  const filtered = items.filter((item) => {
    const text = `${item.classRecord?.name} ${item.assignment.subjectName}`.toLowerCase();
    return !query.search || text.includes(query.search.toLowerCase());
  });
  return {
    items: filtered.slice((query.page - 1) * query.pageSize, query.page * query.pageSize).map((item) => ({
      id: item.assignment.classId,
      assignmentId: item.assignment.id,
      classId: item.assignment.classId,
      levelId: item.classRecord?.levelId,
      name: item.classRecord?.name,
      level: item.classRecord?.level.name,
      subjectName: item.assignment.subjectName,
      students: item.classRecord?.students.length ?? 0,
      performance: item.assignment.performance,
      status: item.assignment.status
    })),
    meta: { page: query.page, pageSize: query.pageSize, total: filtered.length }
  };
}

export async function createTeacherClass(userId: string, input: { name: string; levelId: string; subjectName: string; performance: number }) {
  const { user, teacher, schoolId } = await context(userId);
  if (!teacher && user.role === "TEACHER") throw new AppError(403, "Teacher profile required", "TEACHER_PROFILE_REQUIRED");
  const classRecord = await prisma.class.upsert({
    where: { schoolId_name: { schoolId, name: input.name } },
    update: { levelId: input.levelId },
    create: { schoolId, levelId: input.levelId, name: input.name }
  });
  const targetTeacher = teacher ?? await prisma.teacher.findFirst({ where: { schoolId } });
  if (!targetTeacher) throw new AppError(404, "No teacher profile found", "TEACHER_NOT_FOUND");
  const assignment = await prisma.teacherClassAssignment.upsert({
    where: { teacherId_classId_subjectName: { teacherId: targetTeacher.id, classId: classRecord.id, subjectName: input.subjectName } },
    update: { performance: input.performance, status: RecordStatus.ACTIVE, updatedById: user.id },
    create: {
      schoolId,
      teacherId: targetTeacher.id,
      classId: classRecord.id,
      subjectName: input.subjectName,
      performance: input.performance,
      createdById: user.id,
      updatedById: user.id
    }
  });
  await audit(user.id, user.role, "CREATE_CLASS", "Class", classRecord.id, { name: classRecord.name, subjectName: input.subjectName });
  return { class: classRecord, assignment };
}

export async function updateTeacherClass(userId: string, classId: string, input: { name?: string; levelId?: string; subjectName?: string; performance?: number }) {
  const scope = await teacherScope(userId);
  const { user, schoolId } = scope;
  if (isTeacherOnly(scope) && !scope.classIds.includes(classId)) {
    throw new AppError(403, "You can only update your assigned classes", "CLASS_NOT_ASSIGNED");
  }

  const existingClass = await prisma.class.findFirst({ where: { id: classId, schoolId } });
  if (!existingClass) throw new AppError(404, "Class not found", "CLASS_NOT_FOUND");

  const assignmentWhere: Prisma.TeacherClassAssignmentWhereInput = {
    classId,
    schoolId,
    status: { not: RecordStatus.DELETED },
    ...(isTeacherOnly(scope) ? { teacherId: scope.teacher!.id } : {})
  };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const classRecord = input.name || input.levelId
        ? await tx.class.update({
          where: { id: classId },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.levelId && { levelId: input.levelId })
          }
        })
        : existingClass;

      const assignment = await tx.teacherClassAssignment.findFirst({ where: assignmentWhere, orderBy: { updatedAt: "desc" } });
      const updatedAssignment = assignment
        ? await tx.teacherClassAssignment.update({
          where: { id: assignment.id },
          data: {
            ...(input.subjectName && { subjectName: input.subjectName }),
            ...(input.performance !== undefined && { performance: input.performance }),
            updatedById: user.id
          }
        })
        : null;

      return { class: classRecord, assignment: updatedAssignment };
    });

    await audit(user.id, user.role, "UPDATE_CLASS", "Class", classId, { name: result.class.name, subjectName: result.assignment?.subjectName });
    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "A class with this name already exists", "CLASS_NAME_TAKEN");
    }
    throw error;
  }
}

export async function getTeacherClassDetails(userId: string, classId: string) {
  const scope = await teacherScope(userId);
  if (isTeacherOnly(scope) && !scope.classIds.includes(classId)) {
    throw new AppError(403, "You can only access your assigned classes", "CLASS_NOT_ASSIGNED");
  }
  const [classRecord, assignment, students, lessons, quizzes, attendance, performance, interventions] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId }, include: { level: true } }),
    prisma.teacherClassAssignment.findFirst({ where: { classId, ...(isTeacherOnly(scope) ? { teacherId: scope.teacher!.id } : { schoolId: scope.schoolId }) } }),
    prisma.student.findMany({ where: { classId, schoolId: scope.schoolId }, include: { user: true } }),
    prisma.lesson.findMany({ where: { classId, teacherId: scope.teacher?.id }, orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.quiz.findMany({ where: { classId, teacherId: scope.teacher?.id }, orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.attendanceRecord.findMany({ where: classScopedWhere(scope, { classId }) as Prisma.AttendanceRecordWhereInput, orderBy: { date: "desc" }, take: 50 }),
    prisma.performanceRecord.findMany({ where: classScopedWhere(scope, { classId }) as Prisma.PerformanceRecordWhereInput, orderBy: { recordedAt: "desc" }, take: 50 }),
    prisma.intervention.findMany({ where: classScopedWhere(scope, { classId }) as Prisma.InterventionWhereInput, orderBy: { updatedAt: "desc" }, take: 20 })
  ]);
  if (!classRecord) throw new AppError(404, "Class not found", "CLASS_NOT_FOUND");
  return { class: classRecord, assignment, students, lessons, quizzes, attendance, performance, interventions };
}

export async function archiveTeacherClass(userId: string, classId: string) {
  const scope = await teacherScope(userId);
  const { user } = scope;
  if (isTeacherOnly(scope) && !scope.classIds.includes(classId)) {
    throw new AppError(403, "You can only archive your assigned classes", "CLASS_NOT_ASSIGNED");
  }
  const updated = await prisma.teacherClassAssignment.updateMany({
    where: {
      classId,
      schoolId: scope.schoolId,
      status: { not: RecordStatus.DELETED },
      ...(isTeacherOnly(scope) ? { teacherId: scope.teacher!.id } : {})
    },
    data: { status: RecordStatus.ARCHIVED, updatedById: user.id }
  });
  if (!updated.count) throw new AppError(404, "Class assignment not found", "CLASS_ASSIGNMENT_NOT_FOUND");
  await audit(user.id, user.role, "ARCHIVE_CLASS", "Class", classId, { count: updated.count });
  return { archived: updated.count };
}

export async function listStudents(userId: string, query: ListQuery) {
  const scope = await teacherScope(userId);
  if (isTeacherOnly(scope) && query.classId && !scope.classIds.includes(query.classId)) {
    throw new AppError(403, "You can only view learners in your assigned classes", "CLASS_NOT_ASSIGNED");
  }

  const filterConditions: Prisma.StudentWhereInput = {};

  if (query.classId) {
    filterConditions.classId = query.classId;
  }

  if (query.stream) {
    filterConditions.stream = { equals: query.stream, mode: "insensitive" };
  }

  if (query.gender) {
    const validGenders = ["MALE", "FEMALE", "OTHER"];
    const upperGender = query.gender.toUpperCase();
    if (validGenders.includes(upperGender)) {
      filterConditions.gender = upperGender as any;
    }
  }

  if (query.status) {
    const validStatuses = ["ACTIVE", "TRANSFERRED", "GRADUATED", "DROPPED_OUT", "ARCHIVED"];
    const upperStatus = query.status.toUpperCase();
    if (validStatuses.includes(upperStatus)) {
      filterConditions.status = upperStatus as any;
    }
  }

  const disabilityVal = query.disabilityStatus || query.disability;
  if (disabilityVal) {
    if (disabilityVal === "true" || disabilityVal === "yes" || disabilityVal === "Yes") {
      filterConditions.hasDisability = true;
    } else if (disabilityVal === "false" || disabilityVal === "no" || disabilityVal === "No") {
      filterConditions.hasDisability = false;
    }
  }

  if (query.academicYear) {
    const assignments = await prisma.teacherClassAssignment.findMany({
      where: {
        schoolId: scope.schoolId,
        academicYearId: query.academicYear,
        status: { not: RecordStatus.DELETED }
      },
      select: { classId: true }
    });
    const classIds = [...new Set(assignments.map(a => a.classId))];
    if (classIds.length > 0) {
      if (filterConditions.classId) {
        if (!classIds.includes(filterConditions.classId as string)) {
          filterConditions.classId = "none";
        }
      } else {
        filterConditions.classId = { in: classIds };
      }
    } else {
      filterConditions.classId = "none";
    }
  }

  let searchCondition: Prisma.StudentWhereInput | undefined;
  if (query.search) {
    const searchVal = query.search.trim();
    searchCondition = {
      OR: [
        { user: { name: { contains: searchVal, mode: "insensitive" } } },
        { studentCode: { contains: searchVal, mode: "insensitive" } },
        { stream: { contains: searchVal, mode: "insensitive" } },
        { disabilityType: { contains: searchVal, mode: "insensitive" } },
        { specialSupportNeeds: { contains: searchVal, mode: "insensitive" } },
        { class: { name: { contains: searchVal, mode: "insensitive" } } },
        { parents: { some: { parent: { user: { name: { contains: searchVal, mode: "insensitive" } } } } } },
        { parents: { some: { parent: { phone: { contains: searchVal } } } } }
      ]
    };
  }

  const where: Prisma.StudentWhereInput = {
    schoolId: scope.schoolId,
    ...(isTeacherOnly(scope) ? { classId: { in: scope.classIds } } : {}),
    ...filterConditions,
    ...searchCondition
  };

  const [items, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: true,
        class: { include: { level: true } },
        parents: {
          include: {
            parent: {
              include: {
                user: true
              }
            }
          }
        }
      },
      ...pageArgs(query),
      orderBy: { updatedAt: "desc" }
    }),
    prisma.student.count({ where })
  ]);

  return { items, meta: { page: query.page, pageSize: query.pageSize, total } };
}

export async function exportStudentsCsvData(userId: string, query: ListQuery) {
  const scope = await teacherScope(userId);
  if (isTeacherOnly(scope) && query.classId && !scope.classIds.includes(query.classId)) {
    throw new AppError(403, "You can only export learners in your assigned classes", "CLASS_NOT_ASSIGNED");
  }

  const filterConditions: Prisma.StudentWhereInput = {};
  if (query.classId) filterConditions.classId = query.classId;
  if (query.stream) filterConditions.stream = { equals: query.stream, mode: "insensitive" };
  if (query.gender) {
    const validGenders = ["MALE", "FEMALE", "OTHER"];
    if (validGenders.includes(query.gender.toUpperCase())) {
      filterConditions.gender = query.gender.toUpperCase() as any;
    }
  }
  if (query.status) {
    const validStatuses = ["ACTIVE", "TRANSFERRED", "GRADUATED", "DROPPED_OUT", "ARCHIVED"];
    if (validStatuses.includes(query.status.toUpperCase())) {
      filterConditions.status = query.status.toUpperCase() as any;
    }
  }
  const disabilityVal = query.disabilityStatus || query.disability;
  if (disabilityVal) {
    if (disabilityVal === "true" || disabilityVal === "yes" || disabilityVal === "Yes") {
      filterConditions.hasDisability = true;
    } else if (disabilityVal === "false" || disabilityVal === "no" || disabilityVal === "No") {
      filterConditions.hasDisability = false;
    }
  }
  if (query.academicYear) {
    const assignments = await prisma.teacherClassAssignment.findMany({
      where: {
        schoolId: scope.schoolId,
        academicYearId: query.academicYear,
        status: { not: RecordStatus.DELETED }
      },
      select: { classId: true }
    });
    const classIds = [...new Set(assignments.map(a => a.classId))];
    if (classIds.length > 0) {
      if (filterConditions.classId) {
        if (!classIds.includes(filterConditions.classId as string)) {
          filterConditions.classId = "none";
        }
      } else {
        filterConditions.classId = { in: classIds };
      }
    } else {
      filterConditions.classId = "none";
    }
  }

  let searchCondition: Prisma.StudentWhereInput | undefined;
  if (query.search) {
    const searchVal = query.search.trim();
    searchCondition = {
      OR: [
        { user: { name: { contains: searchVal, mode: "insensitive" } } },
        { studentCode: { contains: searchVal, mode: "insensitive" } },
        { stream: { contains: searchVal, mode: "insensitive" } },
        { disabilityType: { contains: searchVal, mode: "insensitive" } },
        { specialSupportNeeds: { contains: searchVal, mode: "insensitive" } },
        { class: { name: { contains: searchVal, mode: "insensitive" } } },
        { parents: { some: { parent: { user: { name: { contains: searchVal, mode: "insensitive" } } } } } },
        { parents: { some: { parent: { phone: { contains: searchVal } } } } }
      ]
    };
  }

  const where: Prisma.StudentWhereInput = {
    schoolId: scope.schoolId,
    ...(isTeacherOnly(scope) ? { classId: { in: scope.classIds } } : {}),
    ...filterConditions,
    ...searchCondition
  };

  const items = await prisma.student.findMany({
    where,
    include: {
      user: true,
      class: { include: { level: true } },
      parents: {
        include: {
          parent: {
            include: {
              user: true
            }
          }
        }
      }
    },
    orderBy: { user: { name: "asc" } }
  });

  const headers = ["Admission No", "Student Name", "Class", "Stream", "Gender", "Date of Birth", "Disability Status", "Disability Type", "Parent Name", "Parent Phone", "Status"];
  const rows = items.map(student => {
    const firstParentRelation = student.parents?.[0];
    const parentName = firstParentRelation?.parent?.user?.name || "N/A";
    const parentPhone = firstParentRelation?.parent?.phone || "N/A";
    const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A";

    return [
      `"${student.studentCode || ''}"`,
      `"${student.user?.name || ''}"`,
      `"${student.class?.name || 'No Class'}"`,
      `"${student.stream || 'N/A'}"`,
      `"${student.gender || 'N/A'}"`,
      `"${dob}"`,
      `"${student.hasDisability ? 'Yes' : 'No'}"`,
      `"${student.disabilityType || 'N/A'}"`,
      `"${parentName}"`,
      `"${parentPhone}"`,
      `"${student.status || 'ACTIVE'}"`
    ];
  });

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

export async function exportStudentsPdfHtml(userId: string, query: ListQuery) {
  const scope = await teacherScope(userId);
  if (isTeacherOnly(scope) && query.classId && !scope.classIds.includes(query.classId)) {
    throw new AppError(403, "You can only export learners in your assigned classes", "CLASS_NOT_ASSIGNED");
  }

  const filterConditions: Prisma.StudentWhereInput = {};
  if (query.classId) filterConditions.classId = query.classId;
  if (query.stream) filterConditions.stream = { equals: query.stream, mode: "insensitive" };
  if (query.gender) {
    const validGenders = ["MALE", "FEMALE", "OTHER"];
    if (validGenders.includes(query.gender.toUpperCase())) {
      filterConditions.gender = query.gender.toUpperCase() as any;
    }
  }
  if (query.status) {
    const validStatuses = ["ACTIVE", "TRANSFERRED", "GRADUATED", "DROPPED_OUT", "ARCHIVED"];
    if (validStatuses.includes(query.status.toUpperCase())) {
      filterConditions.status = query.status.toUpperCase() as any;
    }
  }
  const disabilityVal = query.disabilityStatus || query.disability;
  if (disabilityVal) {
    if (disabilityVal === "true" || disabilityVal === "yes" || disabilityVal === "Yes") {
      filterConditions.hasDisability = true;
    } else if (disabilityVal === "false" || disabilityVal === "no" || disabilityVal === "No") {
      filterConditions.hasDisability = false;
    }
  }
  if (query.academicYear) {
    const assignments = await prisma.teacherClassAssignment.findMany({
      where: {
        schoolId: scope.schoolId,
        academicYearId: query.academicYear,
        status: { not: RecordStatus.DELETED }
      },
      select: { classId: true }
    });
    const classIds = [...new Set(assignments.map(a => a.classId))];
    if (classIds.length > 0) {
      if (filterConditions.classId) {
        if (!classIds.includes(filterConditions.classId as string)) {
          filterConditions.classId = "none";
        }
      } else {
        filterConditions.classId = { in: classIds };
      }
    } else {
      filterConditions.classId = "none";
    }
  }

  let searchCondition: Prisma.StudentWhereInput | undefined;
  if (query.search) {
    const searchVal = query.search.trim();
    searchCondition = {
      OR: [
        { user: { name: { contains: searchVal, mode: "insensitive" } } },
        { studentCode: { contains: searchVal, mode: "insensitive" } },
        { stream: { contains: searchVal, mode: "insensitive" } },
        { disabilityType: { contains: searchVal, mode: "insensitive" } },
        { specialSupportNeeds: { contains: searchVal, mode: "insensitive" } },
        { class: { name: { contains: searchVal, mode: "insensitive" } } },
        { parents: { some: { parent: { user: { name: { contains: searchVal, mode: "insensitive" } } } } } },
        { parents: { some: { parent: { phone: { contains: searchVal } } } } }
      ]
    };
  }

  const where: Prisma.StudentWhereInput = {
    schoolId: scope.schoolId,
    ...(isTeacherOnly(scope) ? { classId: { in: scope.classIds } } : {}),
    ...filterConditions,
    ...searchCondition
  };

  const [items, school] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        user: true,
        class: { include: { level: true } },
        parents: {
          include: {
            parent: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: { user: { name: "asc" } }
    }),
    prisma.school.findUnique({ where: { id: scope.schoolId } })
  ]);

  const schoolName = school?.name || "KuraLearn Partner School";
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const tableRows = items.map((student, idx) => {
    const firstParentRelation = student.parents?.[0];
    const parentName = firstParentRelation?.parent?.user?.name || "N/A";
    const parentPhone = firstParentRelation?.parent?.phone || "N/A";

    return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${student.studentCode || 'N/A'}</strong></td>
        <td>${student.user?.name || 'N/A'}</td>
        <td>${student.class?.name || 'No Class'}</td>
        <td>${student.stream || 'N/A'}</td>
        <td>${student.gender || 'N/A'}</td>
        <td>${student.hasDisability ? `<span class="badge warning">Yes (${student.disabilityType || 'N/A'})</span>` : 'No'}</td>
        <td>
          <div style="font-size: 11px;">
            <div><strong>${parentName}</strong></div>
            <div style="color: #64748b;">${parentPhone}</div>
          </div>
        </td>
        <td><span class="badge ${student.status === 'ACTIVE' ? 'success' : 'default'}">${student.status || 'ACTIVE'}</span></td>
      </tr>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Learners Report - ${schoolName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 40px;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header-left h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 5px 0;
        }
        .header-left p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }
        .header-right {
          text-align: right;
        }
        .header-right h2 {
          font-size: 16px;
          font-weight: 700;
          color: #4f46e5;
          margin: 0 0 5px 0;
        }
        .header-right p {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #f8fafc;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #475569;
          text-align: left;
          padding: 12px 16px;
          border-bottom: 2px solid #e2e8f0;
        }
        td {
          font-size: 13px;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }
        tr:nth-child(even) td {
          background: #f8fafc;
        }
        .badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .badge.success {
          background: #dcfce7;
          color: #15803d;
        }
        .badge.warning {
          background: #fef9c3;
          color: #a16207;
        }
        .badge.default {
          background: #f1f5f9;
          color: #475569;
        }
        .footer {
          margin-top: 50px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 20px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;">Print / Save as PDF</button>
      </div>
      <div class="header">
        <div class="header-left">
          <h1>Learners Directory</h1>
          <p>\${schoolName}</p>
        </div>
        <div class="header-right">
          <h2>KuraLearn Report</h2>
          <p>Generated on \${dateStr}</p>
          <p>Total Learners: \${items.length}</p>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>Admission No</th>
            <th>Name</th>
            <th>Class</th>
            <th>Stream</th>
            <th>Gender</th>
            <th>Disability</th>
            <th>Parent Contact</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          \${tableRows || \`<tr><td colspan="9" style="text-align: center; color: #64748b;">No matching learners found</td></tr>\`}
        </tbody>
      </table>
      
      <div class="footer">
        <p>This report was generated securely through the KuraLearn Teacher Portal. Confidential Student Information.</p>
      </div>
    </body>
    </html>
  `;
}

export async function createStudent(userId: string, input: { classId: string; name: string; email: string; language: string; interests: string[] }) {
  const scope = await teacherScope(userId);
  const { user, schoolId } = scope;
  if (isTeacherOnly(scope) && !scope.classIds.includes(input.classId)) {
    throw new AppError(403, "You can only add learners to your assigned classes", "CLASS_NOT_ASSIGNED");
  }
  const classRecord = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!classRecord) throw new AppError(404, "Class not found", "CLASS_NOT_FOUND");
  const passwordHash = await bcrypt.hash("Demo1234", 12);
  try {
    const newUser = await prisma.user.create({ data: { name: input.name, email: input.email.toLowerCase(), passwordHash, role: "STUDENT" } });
    const student = await prisma.student.create({
      data: { userId: newUser.id, schoolId, classId: input.classId, levelId: classRecord.levelId, language: input.language, interests: input.interests }
    });
    await audit(user.id, user.role, "CREATE_STUDENT", "Student", student.id, { name: input.name });
    return student;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "A user with this email already exists", "EMAIL_TAKEN");
    }
    throw error;
  }
}

export async function updateStudent(userId: string, studentId: string, input: { name?: string; email?: string; classId?: string; language?: string; interests?: string[] }) {
  const scope = await teacherScope(userId);
  const { user } = scope;
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");
  if (student.schoolId !== scope.schoolId) throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");
  if (isTeacherOnly(scope) && student.classId && !scope.classIds.includes(student.classId)) {
    throw new AppError(403, "You can only update learners in your assigned classes", "CLASS_NOT_ASSIGNED");
  }
  if (input.classId && isTeacherOnly(scope) && !scope.classIds.includes(input.classId)) {
    throw new AppError(403, "You can only move learners into your assigned classes", "CLASS_NOT_ASSIGNED");
  }

  const nextClass = input.classId ? await prisma.class.findFirst({ where: { id: input.classId, schoolId: scope.schoolId } }) : null;
  if (input.classId && !nextClass) throw new AppError(404, "Class not found", "CLASS_NOT_FOUND");

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (input.name || input.email) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.email && { email: input.email.toLowerCase() })
          }
        });
      }
      return tx.student.update({
        where: { id: studentId },
        data: {
          ...(input.classId && { classId: input.classId }),
          ...(nextClass && { levelId: nextClass.levelId }),
          ...(input.language && { language: input.language }),
          ...(input.interests && { interests: input.interests })
        },
        include: { user: true, class: { include: { level: true } } }
      });
    });
    await audit(user.id, user.role, "UPDATE_STUDENT", "Student", studentId, {});
    return updated;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(409, "A user with this email already exists", "EMAIL_TAKEN");
    }
    throw error;
  }
}

export async function listLessons(userId: string, query: ListQuery) {
  const scope = await teacherScope(userId);
  if (isTeacherOnly(scope) && query.classId && !scope.classIds.includes(query.classId)) {
    throw new AppError(403, "You can only view lessons for your assigned classes", "CLASS_NOT_ASSIGNED");
  }
  const where: Prisma.LessonWhereInput = {
    ...(isTeacherOnly(scope) ? { teacherId: scope.teacher?.id } : { schoolId: scope.schoolId }),
    ...(query.classId && { classId: query.classId }),
    ...(query.status && { status: query.status as ContentStatus }),
    ...(query.search && { title: { contains: query.search, mode: "insensitive" } })
  };
  const [items, total] = await Promise.all([
    prisma.lesson.findMany({
      where,
      include: {
        resourcesLinked: true,
        course: { include: { subject: true } },
        class: true
      },
      ...pageArgs(query),
      orderBy: { updatedAt: query.sortDir }
    }),
    prisma.lesson.count({ where })
  ]);
  return { items, meta: { page: query.page, pageSize: query.pageSize, total } };
}

export async function createLesson(userId: string, input: any) {
  const scope = await teacherScope(userId);
  const { user, teacher, schoolId } = scope;
  if (!teacher) throw new AppError(403, "Teacher profile required", "TEACHER_PROFILE_REQUIRED");

  if (isTeacherOnly(scope) && input.classId && !scope.classIds.includes(input.classId)) {
    throw new AppError(403, "You can only create lessons for your assigned classes", "CLASS_NOT_ASSIGNED");
  }

  // Ensure course exists or find one
  let courseId = input.courseId;
  if (!courseId && input.classId && input.subjectId) {
    const classRecord = await prisma.class.findUnique({
      where: { id: input.classId },
      include: { level: true }
    });
    if (classRecord) {
      // Find course matching this level and subject for the teacher
      let course = await prisma.course.findFirst({
        where: { teacherId: teacher.id, levelId: classRecord.levelId, subjectId: input.subjectId }
      });

      // Zero-friction Parent Course Upsert:
      // If the course doesn't exist yet, automatically create one!
      if (!course) {
        const subjectRecord = await prisma.subject.findUnique({ where: { id: input.subjectId } });
        const subjectName = subjectRecord?.name || "Subject";
        course = await prisma.course.create({
          data: {
            title: `${classRecord.name} - ${subjectName}`,
            description: `Auto-generated course for ${classRecord.name} in ${subjectName}`,
            teacherId: teacher.id,
            levelId: classRecord.levelId,
            subjectId: input.subjectId,
            schoolId: schoolId,
            status: ContentStatus.PUBLISHED
          }
        });
        await audit(user.id, user.role, "CREATE_COURSE", "Course", course.id, { title: course.title });
      }
      courseId = course.id;
    }
  }

  if (!courseId) {
    const anyCourse = await prisma.course.findFirst({ where: { teacherId: teacher.id } });
    courseId = anyCourse?.id;
    if (!courseId) throw new AppError(400, "A course must be selected to create a lesson", "COURSE_REQUIRED");
  }

  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      unitId: input.unitId,
      schoolId,
      teacherId: teacher.id,
      classId: input.classId,
      title: input.title || input.subjectName || "New Lesson",
      body: input.lessonContentHtml || input.body || "",
      notes: input.notes,
      estimatedMinutes: input.estimatedMinutes || 10,
      status: input.status === "published" ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      linkedLessonPlanId: input.linkedLessonPlanId || null,
      videoUrl: input.videoUrl || null,
      attachments: input.attachments || []
    }
  });

  await audit(user.id, user.role, "CREATE_LESSON", "Lesson", lesson.id, { courseId: lesson.courseId });
  return lesson;
}

export async function updateLesson(userId: string, lessonId: string, input: any) {
  const scope = await teacherScope(userId);
  const { user, teacher } = scope;
  const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!existing) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");
  if (user.role === UserRole.TEACHER && existing.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only update your own lessons", "LESSON_FORBIDDEN");
  }
  if (input.classId && isTeacherOnly(scope) && !scope.classIds.includes(input.classId)) {
    throw new AppError(403, "You can only move lessons into your assigned classes", "CLASS_NOT_ASSIGNED");
  }

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(input.classId && { classId: input.classId }),
      ...(input.unitId && { unitId: input.unitId }),
      ...(input.title && { title: input.title }),
      ...((input.lessonContentHtml !== undefined || input.body !== undefined) && {
        body: input.lessonContentHtml !== undefined ? input.lessonContentHtml : input.body
      }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.estimatedMinutes !== undefined && { estimatedMinutes: input.estimatedMinutes }),
      ...(input.status && { status: input.status === "published" ? ContentStatus.PUBLISHED : ContentStatus.DRAFT }),
      ...(input.linkedLessonPlanId !== undefined && { linkedLessonPlanId: input.linkedLessonPlanId }),
      ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl }),
      ...(input.attachments && { attachments: input.attachments }),
    }
  });
  await audit(user.id, user.role, "UPDATE_LESSON", "Lesson", lesson.id, { title: lesson.title });
  return lesson;
}

export async function archiveLesson(userId: string, lessonId: string) {
  const { user, teacher } = await context(userId);
  const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!existing) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");
  if (user.role === UserRole.TEACHER && existing.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only archive your own lessons", "LESSON_FORBIDDEN");
  }
  const lesson = await prisma.lesson.update({ where: { id: lessonId }, data: { status: ContentStatus.ARCHIVED } });
  await audit(user.id, user.role, "ARCHIVE_LESSON", "Lesson", lesson.id, { title: lesson.title });
  return lesson;
}

export async function publishLesson(userId: string, lessonId: string) {
  const { user, teacher } = await context(userId);
  const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!existing) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");
  if (user.role === UserRole.TEACHER && existing.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only publish your own lessons", "LESSON_FORBIDDEN");
  }
  const lesson = await prisma.lesson.update({ where: { id: lessonId }, data: { status: ContentStatus.PUBLISHED, publishedAt: new Date() } });
  await audit(user.id, user.role, "PUBLISH_LESSON", "Lesson", lesson.id, { title: lesson.title });
  return lesson;
}

export async function duplicateLesson(userId: string, lessonId: string) {
  const { user, teacher } = await context(userId);
  const original = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!original) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");
  if (user.role === UserRole.TEACHER && original.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only duplicate your own lessons", "LESSON_FORBIDDEN");
  }
  const copy = await prisma.lesson.create({
    data: {
      courseId: original.courseId,
      unitId: original.unitId,
      schoolId: original.schoolId,
      teacherId: original.teacherId,
      classId: original.classId,
      title: `${original.title} (Copy)`,
      body: original.body,
      notes: original.notes,
      estimatedMinutes: original.estimatedMinutes,
      status: ContentStatus.DRAFT,
    }
  });
  await audit(user.id, user.role, "DUPLICATE_LESSON", "Lesson", copy.id, { sourceId: lessonId });
  return copy;
}

export async function startDeliverySession(userId: string, input: { lessonId: string; classId: string; slideIndex: number; notes?: string; participation?: unknown }) {
  const { user, teacher, schoolId } = await context(userId);
  if (!teacher) throw new AppError(403, "Teacher profile required", "TEACHER_PROFILE_REQUIRED");
  const session = await prisma.teacherLessonDeliverySession.create({
    data: { schoolId, lessonId: input.lessonId, teacherId: teacher.id, classId: input.classId, slideIndex: input.slideIndex, notes: input.notes, participation: (input.participation ?? {}) as Prisma.InputJsonValue, startedAt: new Date(), createdById: user.id, updatedById: user.id }
  });
  await audit(user.id, user.role, "START_LESSON_DELIVERY", "TeacherLessonDeliverySession", session.id, {});
  return session;
}

export async function updateDeliverySession(userId: string, sessionId: string, input: any) {
  const { user } = await context(userId);
  return prisma.teacherLessonDeliverySession.update({ where: { id: sessionId }, data: { ...input, updatedById: user.id } });
}

export async function endDeliverySession(userId: string, sessionId: string, summary?: string) {
  const { user } = await context(userId);
  const session = await prisma.teacherLessonDeliverySession.update({ where: { id: sessionId }, data: { status: RecordStatus.COMPLETED, endedAt: new Date(), summary, updatedById: user.id } });
  await audit(user.id, user.role, "END_LESSON_DELIVERY", "TeacherLessonDeliverySession", session.id, {});
  return session;
}











export async function getReports(userId: string, query: Partial<ListQuery>) {
  const scope = await teacherScope(userId);
  const classId = query.classId;
  if (isTeacherOnly(scope) && classId && !scope.classIds.includes(classId)) {
    throw new AppError(403, "You can only view reports for your assigned classes", "CLASS_NOT_ASSIGNED");
  }
  const [performance, attendance, interventions, quizzes] = await Promise.all([
    prisma.performanceRecord.findMany({ where: classScopedWhere(scope, { ...(classId && { classId }) }) as Prisma.PerformanceRecordWhereInput, orderBy: { recordedAt: "desc" }, take: 100 }),
    prisma.attendanceRecord.findMany({ where: classScopedWhere(scope, { ...(classId && { classId }) }) as Prisma.AttendanceRecordWhereInput, orderBy: { date: "desc" }, take: 100 }),
    prisma.intervention.findMany({ where: classScopedWhere(scope, { ...(classId && { classId }) }) as Prisma.InterventionWhereInput, orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.quiz.findMany({
      where: {
        ...(scope.teacher ? { teacherId: scope.teacher.id } : { teacher: { schoolId: scope.schoolId } }),
        ...(classId && { classId })
      },
      include: { attempts: true }
    })
  ]);

  const quizScores = quizzes.flatMap(q => q.attempts.map(a => a.score));
  const quizAverage = quizScores.length
    ? Math.round(quizScores.reduce((sum, s) => sum + s, 0) / quizScores.length)
    : 0;

  const averageScore = performance.length ? Math.round(performance.reduce((sum, item) => sum + item.score, 0) / performance.length) : 0;

  return {
    summary: {
      averageScore,
      attendanceRate: attendance.length ? Math.round((attendance.filter((item) => item.status === AttendanceStatus.PRESENT).length / attendance.length) * 100) : 0,
      atRiskStudents: interventions.filter((item) => item.riskLevel !== "LOW").length,
      quizAverage
    },
    performance,
    attendance,
    interventions,
    quizzes,
    accessibleSummary: `Average score is ${averageScore} percent with ${interventions.length} active interventions.`
  };
}

export async function listTeacherMessages(userId: string) {
  await context(userId);
  return prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    include: { sender: { select: { id: true, name: true, role: true } }, recipient: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" }
  });
}

export async function sendTeacherMessage(userId: string, input: { recipientId: string; body: string; threadId?: string; category?: string }) {
  const { user } = await context(userId);
  const recipient = await prisma.user.findUnique({ where: { id: input.recipientId } });
  if (!recipient) throw new AppError(404, "Recipient not found", "RECIPIENT_NOT_FOUND");
  const message = await prisma.message.create({
    data: {
      threadId: input.threadId ?? [userId, input.recipientId].sort().join(":"),
      senderId: userId,
      recipientId: input.recipientId,
      senderRole: user.role,
      recipientRole: recipient.role,
      body: input.body
    }
  });
  await audit(user.id, user.role, "SEND_MESSAGE", "Message", message.id, { category: input.category ?? "GENERAL" });
  return message;
}

export async function listResources(userId: string, query: ListQuery) {
  const { schoolId } = await context(userId);
  const where: Prisma.TeacherResourceWhereInput = {
    schoolId,
    ...(query.status ? { status: query.status as RecordStatus } : { status: { notIn: [RecordStatus.ARCHIVED, RecordStatus.DELETED] } }),
    ...(query.subjectName && { subjectName: query.subjectName }),
    ...(query.search && { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { topic: { contains: query.search, mode: "insensitive" } }] })
  };
  const [items, total] = await Promise.all([
    prisma.teacherResource.findMany({ where, ...pageArgs(query), orderBy: { updatedAt: query.sortDir } }),
    prisma.teacherResource.count({ where })
  ]);
  return { items, meta: { page: query.page, pageSize: query.pageSize, total } };
}

export async function createResource(userId: string, input: { title: string; type: string; fileUrl?: string; subjectName?: string; className?: string; topic?: string; tags: string[]; sharedScope: string }) {
  const { user, schoolId } = await context(userId);
  const resource = await prisma.teacherResource.create({
    data: { schoolId, ownerId: user.id, ...input, type: input.type as TeacherResourceType, createdById: user.id, updatedById: user.id }
  });
  await audit(user.id, user.role, "CREATE_RESOURCE", "TeacherResource", resource.id, { title: resource.title });
  return resource;
}

export async function updateResource(userId: string, resourceId: string, input: Partial<{ title: string; type: string; fileUrl?: string; subjectName?: string; className?: string; topic?: string; tags: string[]; sharedScope: string }>) {
  const { user, schoolId } = await context(userId);
  const existing = await prisma.teacherResource.findFirst({ where: { id: resourceId, schoolId, status: { not: RecordStatus.DELETED } } });
  if (!existing) throw new AppError(404, "Resource not found", "RESOURCE_NOT_FOUND");
  if (user.role === UserRole.TEACHER && existing.ownerId !== user.id) {
    throw new AppError(403, "You can only update resources you own", "RESOURCE_FORBIDDEN");
  }
  const { type, ...resourceInput } = input;
  const resource = await prisma.teacherResource.update({
    where: { id: resourceId },
    data: {
      ...resourceInput,
      ...(type && { type: type as TeacherResourceType }),
      updatedById: user.id
    }
  });
  await audit(user.id, user.role, "UPDATE_RESOURCE", "TeacherResource", resource.id, { title: resource.title });
  return resource;
}

export async function archiveResource(userId: string, resourceId: string) {
  const { user, schoolId } = await context(userId);
  const existing = await prisma.teacherResource.findFirst({ where: { id: resourceId, schoolId, status: { not: RecordStatus.DELETED } } });
  if (!existing) throw new AppError(404, "Resource not found", "RESOURCE_NOT_FOUND");
  if (user.role === UserRole.TEACHER && existing.ownerId !== user.id) {
    throw new AppError(403, "You can only archive resources you own", "RESOURCE_FORBIDDEN");
  }
  const resource = await prisma.teacherResource.update({ where: { id: resourceId }, data: { status: RecordStatus.ARCHIVED, updatedById: user.id } });
  await audit(user.id, user.role, "ARCHIVE_RESOURCE", "TeacherResource", resource.id, { title: resource.title });
  return resource;
}

export async function getTeacherNotifications(userId: string) {
  await context(userId);
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function getAuditLogs(userId: string) {
  await context(userId);
  return prisma.auditLog.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
}

export async function saveAiOutput(userId: string, input: {
  taskType: string;
  title?: string;
  subjectId?: string | null;
  subjectName?: string;
  classId?: string | null;
  className?: string;
  levelId?: string | null;
  gradeLevel?: string;
  topicId?: string | null;
  topicName?: string;
  subtopicId?: string | null;
  subtopicName?: string;
  output: string;
  teacherRequest?: string;
}) {
  const { user, schoolId } = await context(userId);
  const aiOutput = await prisma.teacherAiOutput.create({
    data: {
      schoolId,
      teacherId: user.id,
      taskType: input.taskType,
      title: input.title || "",
      subjectId: input.subjectId || null,
      subjectName: input.subjectName || "",
      classId: input.classId || null,
      className: input.className || "",
      levelId: input.levelId || null,
      gradeLevel: input.gradeLevel || "",
      topicId: input.topicId || null,
      topicName: input.topicName || "",
      subtopicId: input.subtopicId || null,
      subtopicName: input.subtopicName || "",
      output: input.output,
      teacherRequest: input.teacherRequest || ""
    }
  });
  await audit(user.id, user.role, "SAVE_AI_OUTPUT", "TeacherAiOutput", aiOutput.id, { taskType: input.taskType });
  return aiOutput;
}

export async function listAiOutputs(userId: string, query?: { taskType?: string; subjectId?: string; classId?: string }) {
  const { teacher } = await context(userId);
  const where: Prisma.TeacherAiOutputWhereInput = {
    teacherId: teacher?.userId ?? userId
  };
  if (query?.taskType) where.taskType = query.taskType;
  if (query?.subjectId) where.subjectId = query.subjectId;
  if (query?.classId) where.classId = query.classId;

  const items = await prisma.teacherAiOutput.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return { items };
}

export async function submitAttendance(userId: string, input: {
  classId: string;
  date: Date;
  records: Array<{ studentId: string; status: AttendanceStatus; reason?: string }>;
}) {
  const { teacher, schoolId } = await context(userId);
  const teacherId = teacher?.id ?? userId;

  const data = input.records.map((record) => ({
    schoolId,
    classId: input.classId,
    studentId: record.studentId,
    teacherId,
    date: input.date,
    status: record.status,
    reason: record.reason,
    createdById: userId,
    updatedById: userId,
  }));

  // Using a transaction to ensure clean up and creation are atomic
  return prisma.$transaction(async (tx) => {
    await tx.attendanceRecord.deleteMany({
      where: {
        classId: input.classId,
        date: input.date,
        teacherId,
      },
    });
    return tx.attendanceRecord.createMany({ data });
  });
}

export async function savePerformanceRecords(userId: string, input: {
  classId: string;
  subjectName: string;
  assessmentType: string;
  maxScore: number;
  records: Array<{ studentId: string; score: number }>;
}) {
  const { schoolId } = await context(userId);
  const cls = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!cls || cls.schoolId !== schoolId) {
    throw new AppError(404, "Class not found in your school", "CLASS_NOT_FOUND");
  }

  const subject = await prisma.subject.findFirst({
    where: {
      levelId: cls.levelId,
      name: { equals: input.subjectName, mode: "insensitive" }
    }
  });
  if (!subject) {
    throw new AppError(400, "Legacy marks endpoint requires a subject that exists in the selected class level", "SUBJECT_REQUIRED");
  }

  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, status: RecordStatus.ACTIVE },
    orderBy: { startDate: "desc" }
  });
  if (!academicYear) throw new AppError(400, "No active academic year found for marks entry", "ACADEMIC_YEAR_REQUIRED");

  const term = await prisma.term.findFirst({
    where: { schoolId, academicYearId: academicYear.id, status: RecordStatus.ACTIVE },
    orderBy: { startDate: "desc" }
  });
  if (!term) throw new AppError(400, "No active term found for marks entry", "TERM_REQUIRED");

  const detail = await saveMarkSubmissionDraft(userId, {
    classId: input.classId,
    subjectId: subject.id,
    academicYearId: academicYear.id,
    termId: term.id,
    assessmentType: input.assessmentType,
    maxScore: input.maxScore,
    records: input.records
  });

  return {
    count: detail.records.filter((record) => typeof record.score === "number").length,
    submission: detail.submission,
    completion: detail.completion
  };
}

function computeLessonPlanStatus(lessons: any[]) {
  if (!lessons || lessons.length === 0) return "DRAFT";
  const allPublished = lessons.every((l) => l.status === "PUBLISHED");
  const allArchived = lessons.every((l) => l.status === "ARCHIVED");
  if (allPublished) return "PUBLISHED";
  if (allArchived) return "ARCHIVED";
  const anyPublished = lessons.some((l) => l.status === "PUBLISHED");
  if (anyPublished) return "PUBLISHED";
  return "DRAFT";
}

export async function listLessonPlans(userId: string, query: ListQuery) {
  const scope = await teacherScope(userId);
  if (isTeacherOnly(scope) && query.classId && !scope.classIds.includes(query.classId)) {
    throw new AppError(403, "You can only view lesson plans for your assigned classes", "CLASS_NOT_ASSIGNED");
  }
  const where: Prisma.LessonPlanWhereInput = {
    ...(isTeacherOnly(scope) ? { teacherId: scope.teacher?.id } : { class: { schoolId: scope.schoolId } }),
    ...(query.classId && { classId: query.classId }),
    ...(query.subjectName && {
      subject: {
        name: { equals: query.subjectName, mode: "insensitive" }
      }
    }),
    ...(query.search && { title: { contains: query.search, mode: "insensitive" } })
  };
  const [items, total] = await Promise.all([
    prisma.lessonPlan.findMany({
      where,
      include: {
        subject: true,
        class: true,
        lessons: true
      },
      ...pageArgs(query),
      orderBy: { updatedAt: query.sortDir }
    }),
    prisma.lessonPlan.count({ where })
  ]);
  const mappedItems = items.map((item) => ({
    ...item,
    status: computeLessonPlanStatus(item.lessons)
  }));
  return { items: mappedItems, meta: { page: query.page, pageSize: query.pageSize, total } };
}

export async function createLessonPlan(userId: string, input: any) {
  const scope = await teacherScope(userId);
  const { user, teacher, schoolId } = scope;
  if (!teacher) throw new AppError(403, "Teacher profile required", "TEACHER_PROFILE_REQUIRED");

  if (isTeacherOnly(scope) && input.classId && !scope.classIds.includes(input.classId)) {
    throw new AppError(403, "You can only create lesson plans for your assigned classes", "CLASS_NOT_ASSIGNED");
  }

  const lessonPlan = await prisma.lessonPlan.create({
    data: {
      teacherId: teacher.id,
      classId: input.classId,
      subjectId: input.subjectId,
      title: input.title || "New Lesson Plan",
      topicId: input.topicId,
      objectives: input.objectives,
      competencies: input.competencies || [],
      crossCuttingIssues: input.crossCuttingIssues || [],
      teachingActivities: input.teachingActivities,
      learningActivities: input.learningActivities,
      materialsNeeded: input.materialsNeeded || [],
      assessmentStrategy: input.assessmentStrategy,
      homework: input.homework,
      notes: input.notes,
      duration: input.duration || 40,
    },
    include: {
      subject: true,
      class: true
    }
  });

  await audit(user.id, user.role, "CREATE_LESSON_PLAN", "LessonPlan", lessonPlan.id, {});
  return lessonPlan;
}

export async function getLessonPlanDetails(userId: string, id: string) {
  const { teacher } = await context(userId);
  const lessonPlan = await prisma.lessonPlan.findUnique({
    where: { id },
    include: {
      subject: true,
      class: true,
      lessons: true
    }
  });
  if (!lessonPlan) throw new AppError(404, "Lesson Plan not found", "LESSON_PLAN_NOT_FOUND");
  if (lessonPlan.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only view your own lesson plans", "LESSON_PLAN_FORBIDDEN");
  }
  return {
    ...lessonPlan,
    status: computeLessonPlanStatus(lessonPlan.lessons)
  };
}

export async function updateLessonPlan(userId: string, id: string, input: any) {
  const scope = await teacherScope(userId);
  const { user, teacher } = scope;
  const existing = await prisma.lessonPlan.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Lesson Plan not found", "LESSON_PLAN_NOT_FOUND");
  if (user.role === UserRole.TEACHER && existing.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only update your own lesson plans", "LESSON_PLAN_FORBIDDEN");
  }
  if (input.classId && isTeacherOnly(scope) && !scope.classIds.includes(input.classId)) {
    throw new AppError(403, "You can only move lesson plans into your assigned classes", "CLASS_NOT_ASSIGNED");
  }

  const lessonPlan = await prisma.lessonPlan.update({
    where: { id },
    data: {
      ...(input.classId && { classId: input.classId }),
      ...(input.subjectId && { subjectId: input.subjectId }),
      ...(input.title && { title: input.title }),
      ...(input.topicId !== undefined && { topicId: input.topicId }),
      ...(input.objectives !== undefined && { objectives: input.objectives }),
      ...(input.competencies && { competencies: input.competencies }),
      ...(input.crossCuttingIssues && { crossCuttingIssues: input.crossCuttingIssues }),
      ...(input.teachingActivities !== undefined && { teachingActivities: input.teachingActivities }),
      ...(input.learningActivities !== undefined && { learningActivities: input.learningActivities }),
      ...(input.materialsNeeded && { materialsNeeded: input.materialsNeeded }),
      ...(input.assessmentStrategy !== undefined && { assessmentStrategy: input.assessmentStrategy }),
      ...(input.homework !== undefined && { homework: input.homework }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.duration !== undefined && { duration: input.duration }),
    },
    include: {
      subject: true,
      class: true
    }
  });

  await audit(user.id, user.role, "UPDATE_LESSON_PLAN", "LessonPlan", lessonPlan.id, { title: lessonPlan.title });
  return lessonPlan;
}

export async function deleteLessonPlan(userId: string, id: string) {
  const { user, teacher } = await context(userId);
  const existing = await prisma.lessonPlan.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Lesson Plan not found", "LESSON_PLAN_NOT_FOUND");
  if (user.role === UserRole.TEACHER && existing.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only delete your own lesson plans", "LESSON_PLAN_FORBIDDEN");
  }

  await prisma.lessonPlan.delete({ where: { id } });
  await audit(user.id, user.role, "DELETE_LESSON_PLAN", "LessonPlan", id, { title: existing.title });
  return { success: true };
}

export async function archiveLessonPlan(userId: string, lessonPlanId: string) {
  const { user, teacher } = await context(userId);
  const existing = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } });
  if (!existing) throw new AppError(404, "Lesson Plan not found", "LESSON_PLAN_NOT_FOUND");
  if (user.role === UserRole.TEACHER && existing.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only archive your own lesson plans", "LESSON_PLAN_FORBIDDEN");
  }
  // Update all associated lessons to ARCHIVED
  await prisma.lesson.updateMany({
    where: { linkedLessonPlanId: lessonPlanId },
    data: { status: ContentStatus.ARCHIVED }
  });
  await audit(user.id, user.role, "ARCHIVE_LESSON_PLAN", "LessonPlan", lessonPlanId, { title: existing.title });
  return existing;
}

export async function publishLessonPlan(userId: string, lessonPlanId: string) {
  const { user, teacher } = await context(userId);
  const existing = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } });
  if (!existing) throw new AppError(404, "Lesson Plan not found", "LESSON_PLAN_NOT_FOUND");
  if (user.role === UserRole.TEACHER && existing.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only publish your own lesson plans", "LESSON_PLAN_FORBIDDEN");
  }
  // Update all associated lessons to PUBLISHED
  await prisma.lesson.updateMany({
    where: { linkedLessonPlanId: lessonPlanId },
    data: { status: ContentStatus.PUBLISHED, publishedAt: new Date() }
  });
  await audit(user.id, user.role, "PUBLISH_LESSON_PLAN", "LessonPlan", lessonPlanId, { title: existing.title });
  return existing;
}

export async function duplicateLessonPlan(userId: string, lessonPlanId: string) {
  const { user, teacher } = await context(userId);
  const original = await prisma.lessonPlan.findUnique({ where: { id: lessonPlanId } });
  if (!original) throw new AppError(404, "Lesson Plan not found", "LESSON_PLAN_NOT_FOUND");
  if (user.role === UserRole.TEACHER && original.teacherId !== teacher?.id) {
    throw new AppError(403, "You can only duplicate your own lesson plans", "LESSON_PLAN_FORBIDDEN");
  }
  const copy = await prisma.lessonPlan.create({
    data: {
      teacherId: original.teacherId,
      classId: original.classId,
      subjectId: original.subjectId,
      topicId: original.topicId,
      title: `${original.title} (Copy)`,
      objectives: original.objectives,
      competencies: original.competencies,
      crossCuttingIssues: original.crossCuttingIssues,
      teachingActivities: original.teachingActivities,
      learningActivities: original.learningActivities,
      materialsNeeded: original.materialsNeeded,
      assessmentStrategy: original.assessmentStrategy,
      homework: original.homework,
      notes: original.notes,
      duration: original.duration,
    }
  });
  await audit(user.id, user.role, "DUPLICATE_LESSON_PLAN", "LessonPlan", copy.id, { sourceId: lessonPlanId });
  return copy;
}
