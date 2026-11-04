import {
  AttendanceStatus,
  ContentStatus,
  RecordStatus,
  UserRole
} from "@prisma/client";
import { prisma } from "../../prisma/client.js";

const trendGood = { direction: "up", tone: "good" } as const;
const trendNeutral = { direction: "flat", tone: "neutral" } as const;
const trendBad = { direction: "down", tone: "bad" } as const;

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function recentMonths(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (count - index - 1), 1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short" }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatToday(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric", weekday: "long" }).format(date);
}

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function titleFromAction(action: string) {
  return action.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function metric(id: string, label: string, value: string, icon: string, tone: string, trend: typeof trendGood & { label: string } | typeof trendBad & { label: string } | typeof trendNeutral & { label: string }) {
  return { id, label, value, icon, tone, trend };
}

export async function getAdminDashboard(tenantSchoolId: string | undefined, viewerId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);
  const monthStart = startOfMonth(now);

  const school = await prisma.school.findFirst({
    where: tenantSchoolId ? { id: tenantSchoolId } : undefined,
    orderBy: { name: "asc" },
    include: {
      academicYears: {
        where: { status: RecordStatus.ACTIVE },
        include: { terms: { where: { status: RecordStatus.ACTIVE }, take: 1 } },
        take: 1
      }
    }
  });

  const schoolId = school?.id;
  const studentWhere = schoolId ? { schoolId } : {};
  const teacherWhere = schoolId ? { schoolId } : {};
  const classWhere = schoolId ? { schoolId } : {};

  const [
    students,
    teachers,
    linkedParents,
    classes,
    subjectsCount,
    coursesCount,
    lessonsCount,
    progress,
    todayAttendance,
    performance,
    quizzes,
    quizResponsesCount,
    lessonPlans,
    interventionsCount,
    aiInsights,
    teacherAiOutputsCount,
    auditLogs,
    adminUsers,
    teacherResourcesCount,
    libraryResourcesCount
  ] = await Promise.all([
    prisma.student.findMany({ where: studentWhere, include: { user: true, class: { include: { level: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.teacher.findMany({ where: teacherWhere, include: { user: true } }),
    prisma.studentParent.findMany({ where: schoolId ? { student: { schoolId } } : {}, include: { parent: { include: { user: true } } }, distinct: ["parentId"] }),
    prisma.class.findMany({ where: classWhere, include: { level: true, students: true }, orderBy: { name: "asc" } }),
    prisma.subject.count(),
    prisma.course.count(),
    prisma.lesson.count(),
    prisma.lessonProgress.findMany({ where: schoolId ? { student: { schoolId } } : {}, select: { status: true, createdAt: true, completedAt: true } }),
    prisma.attendanceRecord.findMany({ where: schoolId ? { schoolId, date: { gte: todayStart, lt: todayEnd } } : { date: { gte: todayStart, lt: todayEnd } } }),
    prisma.performanceRecord.findMany({ where: schoolId ? { schoolId, status: RecordStatus.ACTIVE } : { status: RecordStatus.ACTIVE } }),
    prisma.quiz.findMany({ where: schoolId ? { schoolId, status: { not: ContentStatus.ARCHIVED } } : { status: { not: ContentStatus.ARCHIVED } }, include: { attempts: true }, orderBy: { updatedAt: "desc" } }),
    prisma.quizAttempt.count({ where: schoolId ? { quiz: { schoolId } } : {} }),
    prisma.lesson.findMany({ where: schoolId ? { schoolId, status: { not: ContentStatus.ARCHIVED } } : { status: { not: ContentStatus.ARCHIVED } }, include: { course: { include: { subject: true } }, class: true }, orderBy: { updatedAt: "desc" }, take: 80 }),
    prisma.intervention.count({ where: schoolId ? { schoolId, status: RecordStatus.ACTIVE } : { status: RecordStatus.ACTIVE } }),
    prisma.aIInsight.findMany({ where: schoolId ? { schoolId } : {}, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.teacherAiOutput.count({ where: schoolId ? { schoolId } : {} }),
    prisma.auditLog.findMany({ where: schoolId ? { schoolId } : {}, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.user.findMany({ where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } } }),
    prisma.teacherResource.count({ where: schoolId ? { schoolId, status: RecordStatus.ACTIVE } : { status: RecordStatus.ACTIVE } }),
    prisma.libraryResource.count()
  ]);

  const schoolUserIds = [...new Set([
    ...students.map((student) => student.userId),
    ...teachers.map((teacher) => teacher.userId),
    ...linkedParents.map((item) => item.parent.userId),
    ...adminUsers.map((user) => user.id)
  ])];

  const [notifications, messages] = await Promise.all([
    // Notifications are personal, so show only this administrator's own.
    prisma.notification.findMany({ where: { userId: viewerId }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.message.findMany({ where: { OR: [{ senderId: { in: schoolUserIds } }, { recipientId: { in: schoolUserIds } }] }, orderBy: { createdAt: "desc" }, take: 6 })
  ]);

  const present = todayAttendance.filter((item) => item.status === AttendanceStatus.PRESENT).length;
  const absent = todayAttendance.filter((item) => item.status === AttendanceStatus.ABSENT).length;
  const late = todayAttendance.filter((item) => item.status === AttendanceStatus.LATE || item.status === AttendanceStatus.EXCUSED).length;
  const attendanceRate = percent(present, todayAttendance.length);
  const completedProgress = progress.filter((item) => item.status === "COMPLETED").length;
  const progressPercent = percent(completedProgress, progress.length);
  const newStudents = students.filter((student) => student.createdAt >= monthStart).length;
  const newTeachers = teachers.filter((teacher) => teacher.user.createdAt >= monthStart).length;
  const activeDrafts = aiInsights.filter((item) => item.status === RecordStatus.DRAFT).length + teacherAiOutputsCount;

  const months = recentMonths(10);
  const enrollmentTrend = months.map((month) => {
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
    return { month: monthLabel(month), students: students.filter((student) => student.createdAt <= end).length };
  });

  const performanceByClass = new Map<string, { total: number; count: number }>();
  for (const item of performance) {
    const current = performanceByClass.get(item.classId) ?? { total: 0, count: 0 };
    current.total += percent(item.score, item.maxScore);
    current.count += 1;
    performanceByClass.set(item.classId, current);
  }

  const topClasses = classes
    .map((classRecord) => {
      const stats = performanceByClass.get(classRecord.id);
      return {
        name: `${classRecord.name} (${classRecord.level.name})`,
        average: stats?.count ? Math.round((stats.total / stats.count) * 10) / 10 : 0
      };
    })
    .sort((a, b) => b.average - a.average)
    .slice(0, 5)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const pendingLessons = lessonPlans.filter((item) => item.status === ContentStatus.DRAFT || item.status === ContentStatus.IN_PROGRESS).length;
  const pendingAssessments = quizzes.filter((item) => item.status === ContentStatus.DRAFT || item.status === ContentStatus.PUBLISHED).length;
  const upcomingQuizzes = quizzes.filter((item) => item.dueAt && item.dueAt >= now).length;
  const recentActivity = auditLogs.map((item) => ({
    id: item.id,
    title: titleFromAction(item.action),
    detail: item.entityType.replace(/([a-z])([A-Z])/g, "$1 $2"),
    time: timeAgo(item.createdAt),
    tone: item.role === UserRole.ADMIN || item.role === UserRole.SUPER_ADMIN ? "blue" : "green"
  }));

  return {
    source: "api" as const,
    school: {
      id: school?.id ?? "school",
      name: school?.name ?? "KuraLearn School",
      division: school ? `${school.type.toLowerCase()} school in ${school.district}` : "school analytics",
      academicYear: school?.academicYears[0]?.name ?? "Current academic year",
      currentTerm: school?.academicYears[0]?.terms[0]?.name ?? "Current term",
      todayLabel: formatToday(now),
      dateLabel: formatDate(now)
    },
    metrics: [
      metric("students", "Total Students", formatNumber(students.length), "students", "blue", { ...trendGood, label: `${newStudents} this month` }),
      metric("teachers", "Total Teachers", formatNumber(teachers.length), "teachers", "orange", { ...trendGood, label: `${newTeachers} this month` }),
      metric("classes", "Active Classes", formatNumber(classes.length), "classes", "indigo", { ...trendNeutral, label: `${subjectsCount} subjects` }),
      metric("attendance", "Attendance Today", `${attendanceRate}%`, "attendance", "rose", { ...(attendanceRate >= 85 ? trendGood : trendBad), label: todayAttendance.length ? `${present}/${todayAttendance.length} present` : "No records today" }),
      metric("learning", "Learning Progress", `${progressPercent}%`, "learning", "green", { ...trendNeutral, label: `${completedProgress} completed records` }),
      metric("ai", "AI Outputs", formatNumber(activeDrafts), "ai", "purple", { ...trendNeutral, label: `${aiInsights.length} insights tracked` })
    ],
    enrollmentTrend,
    attendance: {
      rate: attendanceRate,
      segments: [
        { label: "Present", value: present, percent: attendanceRate, color: "#28b764" },
        { label: "Absent", value: absent, percent: percent(absent, todayAttendance.length), color: "#f05a72" },
        { label: "Late/Excused", value: late, percent: percent(late, todayAttendance.length), color: "#f5b731" }
      ]
    },
    curriculum: {
      completionPercent: progressPercent,
      subjects: subjectsCount,
      courses: coursesCount,
      lessons: lessonsCount,
      completedLessons: completedProgress,
      teacherResources: teacherResourcesCount,
      libraryResources: libraryResourcesCount
    },
    topClasses,
    activities: recentActivity,
    assessments: [
      { label: "Upcoming Assessments", value: formatNumber(upcomingQuizzes), suffix: "scheduled", tone: "amber" },
      { label: "Assessments Created", value: formatNumber(quizzes.length), suffix: "teacher quizzes", tone: "green" },
      { label: "Responses Submitted", value: formatNumber(quizResponsesCount), suffix: "student responses", tone: "blue" },
      { label: "Pending Review", value: formatNumber(pendingAssessments), suffix: "open assessments", tone: "orange" }
    ],
    quickActions: [
      { id: "add-student", label: "Add Student", icon: "student", tone: "blue" },
      { id: "add-teacher", label: "Add Teacher", icon: "teacher", tone: "orange" },
      { id: "create-class", label: "Create Class", icon: "class", tone: "green" },
      { id: "curriculum", label: "Curriculum", icon: "curriculum", tone: "violet" },
      { id: "ai-report", label: "AI Reports", icon: "ai", tone: "purple" },
      { id: "message", label: "Send Message", icon: "message", tone: "sky" }
    ],
    announcements: notifications.map((item) => ({ id: item.id, title: item.title, date: formatDate(item.createdAt), tone: item.type === "AI" ? "purple" : "blue" })),
    calendar: [
      ...lessonPlans.filter((item) => item.scheduledAt).slice(0, 3).map((item) => ({
        id: item.id,
        day: String(item.scheduledAt!.getDate()).padStart(2, "0"),
        month: monthLabel(item.scheduledAt!).toUpperCase(),
        title: item.class?.name ? `${item.class.name} - ${item.title}` : item.title,
        detail: `${item.course?.subject?.name ?? item.title} lesson`,
        tone: "blue"
      })),
      ...quizzes.filter((item) => item.dueAt).slice(0, 2).map((item) => ({
        id: item.id,
        day: String(item.dueAt!.getDate()).padStart(2, "0"),
        month: monthLabel(item.dueAt!).toUpperCase(),
        title: item.title,
        detail: `Assessment due`,
        tone: "amber"
      }))
    ].slice(0, 4),
    tasks: [
      { id: "lesson-plans", title: "Review pending lesson plans", badge: formatNumber(pendingLessons), tone: pendingLessons ? "amber" : "green" },
      { id: "interventions", title: "Follow learner interventions", badge: formatNumber(interventionsCount), tone: interventionsCount ? "red" : "green" },
      { id: "ai-insights", title: "Review draft AI insights", badge: formatNumber(activeDrafts), tone: activeDrafts ? "purple" : "green" },
      { id: "messages", title: "Check school messages", badge: formatNumber(messages.length), tone: messages.length ? "blue" : "green" }
    ]
  };
}
