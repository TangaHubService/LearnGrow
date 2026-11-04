import {
  AttendanceStatus,
  RecordStatus,
  UserRole,
  LearnerRiskLevel
} from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";

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

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function markPercentage(mark: { percentage: number | null; score?: number | null; maxScore?: number | null }) {
  if (typeof mark.percentage === "number") return mark.percentage;
  if (typeof mark.score === "number" && typeof mark.maxScore === "number" && mark.maxScore > 0) {
    return percent(mark.score, mark.maxScore);
  }
  return 0;
}

function formatToday(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "long", year: "numeric", weekday: "long" }).format(date);
}

async function getSchoolIdFromUser(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacher: true, staff: true }
  });
  if (user?.teacher?.schoolId) {
    return user.teacher.schoolId;
  }
  if (user?.staff?.schoolId) {
    return user.staff.schoolId;
  }
  if (user?.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      400,
      "User is not linked to any school context",
      "SCHOOL_CONTEXT_REQUIRED"
    );
  }
  const school = await prisma.school.findFirst({ orderBy: { name: "asc" } });
  if (!school) throw new AppError(404, "No school found", "SCHOOL_NOT_FOUND");
  return school.id;
}

async function getActiveTerm(schoolId: string) {
  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, status: RecordStatus.ACTIVE },
    include: { terms: { where: { status: RecordStatus.ACTIVE }, take: 1 } }
  });
  return academicYear?.terms[0];
}

export async function getDashboard(userId: string) {
  const schoolId = await getSchoolIdFromUser(userId);
  return getDashboardBySchoolId(schoolId);
}

export async function getDashboardBySchoolId(schoolId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = addDays(todayStart, 1);
  const monthStart = startOfMonth(now);

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { academicYears: { where: { status: RecordStatus.ACTIVE }, include: { terms: { where: { status: RecordStatus.ACTIVE } } }, take: 1 } }
  });

  const [studentsCount, teachersCount, classesCount, todayAttendance, pendingMarksCount, approvedMarksCount, interventionsCount, attendanceAlertsCount] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.teacher.count({ where: { schoolId } }),
    prisma.class.count({ where: { schoolId } }),
    prisma.attendanceRecord.findMany({ where: { schoolId, date: { gte: todayStart, lt: todayEnd } } }),
    prisma.mark.count({ where: { schoolId, status: "SUBMITTED" } }),
    prisma.mark.count({ where: { schoolId, status: "APPROVED" } }),
    prisma.intervention.count({ where: { schoolId, status: RecordStatus.ACTIVE } }),
    prisma.attendanceAlert.count({ where: { schoolId, resolved: false } })
  ]);

  const subjectCount = await prisma.subject.count({ where: { level: { classes: { some: { schoolId } } } } });

  const present = todayAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const absent = todayAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
  const attendanceRate = percent(present, todayAttendance.length);

  const studentsAtRisk = await prisma.studentRiskScore.count({
    where: { student: { schoolId }, riskLevel: { in: ["MEDIUM", "HIGH"] } }
  });

  const parentsLinked = await prisma.studentParent.findMany({
    where: { student: { schoolId } },
    distinct: ["parentId"]
  });
  const parentEngagement = percent(parentsLinked.length, studentsCount);

  return {
    school: {
      id: school?.id,
      name: school?.name || "School",
      type: school?.type,
      district: school?.district,
      academicYear: school?.academicYears[0]?.name || "Current",
      currentTerm: school?.academicYears[0]?.terms[0]?.name || "Term 1",
      todayLabel: formatToday(now)
    },
    stats: {
      totalStudents: studentsCount,
      totalTeachers: teachersCount,
      totalClasses: classesCount,
      totalSubjects: subjectCount,
      attendanceRate,
      absentToday: absent,
      pendingMarksApproval: pendingMarksCount,
      incompleteSubmissions: pendingMarksCount,
      reportGenerated: 0,
      resourcesUploaded: 0,
      parentEngagement,
      studentsAtRisk,
      activeInterventions: interventionsCount,
      unresolvedAlerts: attendanceAlertsCount
    }
  };
}

export async function getSchoolInfo(userId: string) {
  const schoolId = await getSchoolIdFromUser(userId);
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { academicYears: { where: { status: RecordStatus.ACTIVE }, include: { terms: { where: { status: RecordStatus.ACTIVE } } }, take: 1 }, classes: { select: { id: true } }, teachers: { select: { id: true } } }
  });

  const totalStudents = await prisma.student.count({ where: { schoolId } });

  return {
    id: school?.id,
    name: school?.name,
    type: school?.type,
    district: school?.district,
    sector: school?.sector,
    village: school?.village,
    academicYear: school?.academicYears[0]?.name,
    currentTerm: school?.academicYears[0]?.terms[0]?.name,
    totalClasses: school?.classes.length || 0,
    totalStudents,
    totalTeachers: school?.teachers.length || 0
  };
}

export async function getTeachers(schoolId: string, filters: { search?: string; classId?: string; subjectId?: string }) {
  const teachers = await prisma.teacher.findMany({
    where: {
      schoolId,
      ...(filters.search && { user: { name: { contains: filters.search, mode: "insensitive" } } })
    },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  const teacherData = await Promise.all(teachers.map(async (t) => {
    const [coursesCount, lessonsCount, resourcesCount, marksCount] = await Promise.all([
      prisma.course.count({ where: { teacherId: t.id } }),
      prisma.lesson.count({ where: { teacherId: t.id } }),
      prisma.teacherResource.count({ where: { ownerId: t.userId, status: RecordStatus.ACTIVE } }),
      prisma.mark.count({ where: { teacherId: t.id, status: "SUBMITTED" } })
    ]);

    return {
      id: t.id,
      name: t.user.name,
      email: t.user.email,
      assignedClasses: coursesCount,
      assignedSubjects: coursesCount,
      lessonsPrepared: lessonsCount,
      resourcesUploaded: resourcesCount,
      pendingMarks: marksCount
    };
  }));

  return teacherData;
}

export async function getTeacherDetail(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  if (!teacher) throw new AppError(404, "Teacher not found", "TEACHER_NOT_FOUND");

  const [lessonsCount, resourcesCount, marksCount, attendanceCount] = await Promise.all([
    prisma.lesson.count({ where: { teacherId } }),
    prisma.teacherResource.count({ where: { ownerId: teacher.userId } }),
    prisma.mark.count({ where: { teacherId } }),
    prisma.attendanceRecord.count({ where: { teacherId, date: { gte: startOfDay(addDays(new Date(), -30)) } } })
  ]);

  const courses = await prisma.course.findMany({
    where: { teacherId },
    include: { subject: true, level: { include: { classes: true } } }
  });

  const assignedClasses = courses.flatMap(c =>
    c.level.classes.map(cl => ({ id: cl.id, name: cl.name, subject: c.subject.name }))
  );

  const recentMarks = await prisma.mark.findMany({
    where: { teacherId },
    include: { subject: true, class: true, term: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return {
    id: teacher.id,
    name: teacher.user.name,
    email: teacher.user.email,
    assignedClasses,
    totalLessons: lessonsCount,
    totalResources: resourcesCount,
    recentMarks: recentMarks.map(m => ({
      id: m.id,
      subject: m.subject?.name || "Unknown",
      class: m.class?.name || "Unknown",
      term: m.term?.name || "Unknown",
      status: m.status,
      date: m.createdAt
    })),
    attendanceThisMonth: attendanceCount
  };
}

export async function getTeacherWorkload(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new AppError(404, "Teacher not found", "TEACHER_NOT_FOUND");

  const [coursesCount, lessonPlansCount, marksCount, attendanceCount, resourcesCount] = await Promise.all([
    prisma.course.count({ where: { teacherId } }),
    prisma.lessonPlan.count({ where: { teacherId } }),
    prisma.mark.count({ where: { teacherId, term: { status: RecordStatus.ACTIVE } } }),
    prisma.attendanceRecord.count({ where: { teacherId, date: { gte: startOfDay(addDays(new Date(), -30)) } } }),
    prisma.teacherResource.count({ where: { ownerId: teacher.userId, status: RecordStatus.ACTIVE } })
  ]);

  return {
    classesAssigned: coursesCount,
    lessonPlansCreated: lessonPlansCount,
    marksEntered: marksCount,
    attendanceMarked: attendanceCount,
    resourcesUploaded: resourcesCount
  };
}

export async function getStudents(schoolId: string, filters: { search?: string; classId?: string; gender?: string; hasDisability?: boolean; status?: string }) {
  const students = await prisma.student.findMany({
    where: {
      schoolId,
      ...(filters.search && { OR: [{ user: { name: { contains: filters.search, mode: "insensitive" } } }, { studentCode: { contains: filters.search, mode: "insensitive" } }] }),
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.gender && { gender: filters.gender as any }),
      ...(filters.hasDisability !== undefined && { hasDisability: filters.hasDisability }),
      ...(filters.status && { status: filters.status as any })
    },
    include: { user: { select: { name: true } }, class: { include: { level: true } }, riskScore: true }
  });

  const studentData = await Promise.all(students.map(async (s) => {
    const recentAttendance = await prisma.attendanceRecord.findMany({
      where: { studentId: s.id, date: { gte: addDays(startOfDay(), -30) } }
    });

    const attendanceRate = recentAttendance.length > 0
      ? percent(recentAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length, recentAttendance.length)
      : null;

    return {
      id: s.id,
      name: s.user.name,
      studentCode: s.studentCode || "",
      class: s.class?.name || "",
      level: s.class?.level?.name || "",
      gender: s.gender || "OTHER",
      hasDisability: s.hasDisability,
      disabilityType: s.disabilityType || "",
      status: s.status,
      riskLevel: s.riskScore?.riskLevel || "LOW",
      attendanceRate
    };
  }));

  return studentData;
}

export async function getStudentDetail(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { name: true, email: true } }, class: { include: { level: true } }, riskScore: true }
  });

  if (!student) throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");

  const [marks, attendanceRecords, reportCards, parents] = await Promise.all([
    prisma.mark.findMany({ where: { studentId }, include: { subject: true, term: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.attendanceRecord.findMany({ where: { studentId }, orderBy: { date: "desc" }, take: 30 }),
    prisma.reportCard.findMany({ where: { studentId }, include: { term: true, academicYear: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.studentParent.findMany({ where: { studentId }, include: { parent: { include: { user: true } } } })
  ]);

  const avgMarks = marks.length > 0
    ? percent(marks.reduce((acc, m) => acc + markPercentage(m), 0), marks.length)
    : null;

  return {
    id: student.id,
    name: student.user.name,
    email: student.user.email,
    studentCode: student.studentCode || "",
    class: student.class?.name || "",
    level: student.class?.level?.name || "",
    gender: student.gender || "OTHER",
    dateOfBirth: student.dateOfBirth,
    hasDisability: student.hasDisability,
    disabilityType: student.disabilityType || "",
    status: student.status,
    parents: parents.map(p => ({ name: p.parent.user.name, relationship: p.relationship || "", phone: p.parent.phone || "" })),
    marks: marks.map(m => ({ id: m.id, subject: m.subject?.name, term: m.term?.name, score: m.score, maxScore: m.maxScore, percentage: m.percentage, grade: m.grade || "", status: m.status })),
    attendance: attendanceRecords.map(a => ({ date: a.date, status: a.status })),
    reports: reportCards.map(r => ({ id: r.id, term: r.term?.name, totalMarks: r.totalMarks || 0, average: r.averagePercentage || 0, grade: r.grade || "" })),
    riskLevel: student.riskScore?.riskLevel || "LOW",
    averageMarks: avgMarks
  };
}

export async function getStudentRisk(studentId: string) {
  const risk = await prisma.studentRiskScore.findUnique({ where: { studentId } });

  const recentAttendance = await prisma.attendanceRecord.findMany({
    where: { studentId, date: { gte: addDays(startOfDay(), -30) } }
  });

  const recentMarks = await prisma.mark.findMany({
    where: { studentId, term: { status: RecordStatus.ACTIVE } },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  const avgAttendance = recentAttendance.length > 0
    ? percent(recentAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length, recentAttendance.length)
    : null;

  const avgMarks = recentMarks.length > 0
    ? percent(recentMarks.reduce((acc, m) => acc + markPercentage(m), 0), recentMarks.length)
    : null;

  let recommendation = "Continue monitoring";
  if (risk?.riskLevel === "HIGH" || (avgAttendance !== null && avgAttendance < 70) || (avgMarks !== null && avgMarks < 50)) {
    recommendation = "Immediate intervention required - schedule meeting with parents";
  } else if (risk?.riskLevel === "MEDIUM" || avgAttendance! < 85 || avgMarks! < 70) {
    recommendation = "Provide additional support and monitor closely";
  }

  return {
    riskLevel: risk?.riskLevel || "LOW",
    score: risk?.score || 0,
    factors: risk?.factors || {},
    avgAttendance,
    avgMarks,
    recommendation
  };
}

export async function getAttendanceOverview(schoolId: string) {
  const today = startOfDay();
  const todayEnd = addDays(today, 1);

  const todayAttendance = await prisma.attendanceRecord.findMany({
    where: { schoolId, date: { gte: today, lt: todayEnd } },
    include: { student: { include: { class: true } } }
  });

  const present = todayAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const absent = todayAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
  const late = todayAttendance.filter(a => a.status === AttendanceStatus.LATE || a.status === AttendanceStatus.EXCUSED).length;
  const total = todayAttendance.length;

  const byClass: Record<string, { present: number; absent: number; total: number }> = {};
  for (const a of todayAttendance) {
    const className = a.student.class?.name || "Unknown";
    if (!byClass[className]) byClass[className] = { present: 0, absent: 0, total: 0 };
    byClass[className].total++;
    if (a.status === AttendanceStatus.PRESENT) byClass[className].present++;
    if (a.status === AttendanceStatus.ABSENT) byClass[className].absent++;
  }

  return {
    today: { present, absent, late, total, rate: percent(present, total) },
    byClass: Object.entries(byClass).map(([cls, stats]) => ({
      class: cls,
      present: stats.present,
      absent: stats.absent,
      rate: percent(stats.present, stats.total)
    }))
  };
}

export async function getAttendanceTrends(schoolId: string, period: "week" | "month" = "week") {
  const days = period === "week" ? 7 : 30;
  const startDate = addDays(startOfDay(), -days);

  const records = await prisma.attendanceRecord.findMany({
    where: { schoolId, date: { gte: startDate } },
    select: { date: true, status: true }
  });

  const byDate: Record<string, { present: number; total: number }> = {};
  for (const r of records) {
    const dateKey = r.date.toISOString().split("T")[0] as string;
    if (!byDate[dateKey]) byDate[dateKey] = { present: 0, total: 0 };
    byDate[dateKey]!.total++;
    if (r.status === AttendanceStatus.PRESENT) byDate[dateKey]!.present++;
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({
      date: date.slice(5),
      rate: percent(stats.present, stats.total),
      present: stats.present,
      absent: stats.total - stats.present
    }));
}

export async function getClassAttendance(classId: string) {
  const records = await prisma.attendanceRecord.findMany({
    where: { classId, date: { gte: addDays(startOfDay(), -30) } },
    include: { student: { include: { user: true } } }
  });

  const studentStats: Record<string, { name: string; present: number; absent: number; rate: number }> = {};
  for (const r of records) {
    const studentName = r.student.user.name;
    if (!studentStats[studentName]) studentStats[studentName] = { name: studentName, present: 0, absent: 0, rate: 0 };
    if (r.status === AttendanceStatus.PRESENT) studentStats[studentName].present++;
    if (r.status === AttendanceStatus.ABSENT) studentStats[studentName].absent++;
  }

  return Object.values(studentStats).map(s => ({
    ...s,
    rate: percent(s.present, s.present + s.absent)
  }));
}

export async function getTeacherAttendanceStatus(schoolId: string) {
  const today = startOfDay();
  const todayEnd = addDays(today, 1);

  const teachers = await prisma.teacher.findMany({
    where: { schoolId },
    include: { user: true }
  });

  const teacherData = await Promise.all(teachers.map(async (t) => {
    const submittedToday = await prisma.attendanceRecord.count({
      where: { teacherId: t.id, date: { gte: today, lt: todayEnd } }
    }) > 0;

    const hasLessonsToday = await prisma.lesson.count({
      where: { teacherId: t.id, scheduledAt: { gte: today, lt: todayEnd } }
    }) > 0;

    return {
      id: t.id,
      name: t.user.name,
      submittedToday,
      hasLessonsToday
    };
  }));

  return teacherData;
}

export async function getPendingMarks(schoolId: string, filters: { classId?: string; subjectId?: string; termId?: string }) {
  const term = await getActiveTerm(schoolId);
  const termId = filters.termId || term?.id;

  const marks = await prisma.mark.findMany({
    where: {
      schoolId,
      status: "SUBMITTED",
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(termId && { termId })
    },
    include: { student: { include: { user: true } }, subject: true, class: true, term: true, teacher: { include: { user: true } } },
    orderBy: { updatedAt: "desc" },
    take: 50
  });

  return marks.map(m => ({
    id: m.id,
    student: m.student.user.name,
    studentCode: m.student.studentCode || "",
    subject: m.subject?.name || "",
    class: m.class?.name || "",
    term: m.term?.name || "",
    score: m.score,
    maxScore: m.maxScore,
    percentage: m.percentage,
    teacher: m.teacher.user.name,
    submittedAt: m.updatedAt
  }));
}

export async function getApprovedMarks(schoolId: string, filters: { classId?: string; subjectId?: string; termId?: string }) {
  const term = await getActiveTerm(schoolId);
  const termId = filters.termId || term?.id;

  const marks = await prisma.mark.findMany({
    where: {
      schoolId,
      status: "APPROVED",
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(termId && { termId })
    },
    include: { student: { include: { user: true } }, subject: true, class: true, term: true },
    take: 50
  });

  return marks.map(m => ({
    id: m.id,
    student: m.student.user.name,
    subject: m.subject?.name || "",
    class: m.class?.name || "",
    term: m.term?.name || "",
    percentage: m.percentage,
    isLocked: m.isLocked,
    approvedAt: m.updatedAt
  }));
}

export async function approveMark(userId: string, markId: string) {
  const mark = await prisma.mark.findUnique({ where: { id: markId } });
  if (!mark) throw new AppError(404, "Mark not found", "MARK_NOT_FOUND");

  await prisma.mark.update({
    where: { id: markId },
    data: { status: "APPROVED", isLocked: true }
  });

  await prisma.markAuditLog.create({
    data: {
      markId,
      changedById: userId,
      newScore: mark.score,
      reason: "Approved by headteacher"
    }
  });

  return { success: true, message: "Mark approved and locked" };
}

export async function rejectMark(userId: string, markId: string, reason: string) {
  const mark = await prisma.mark.findUnique({ where: { id: markId } });
  if (!mark) throw new AppError(404, "Mark not found", "MARK_NOT_FOUND");

  await prisma.mark.update({
    where: { id: markId },
    data: { status: "DRAFT" }
  });

  await prisma.markAuditLog.create({
    data: {
      markId,
      changedById: userId,
      oldScore: mark.score,
      newScore: mark.score,
      reason: `Rejected: ${reason}`
    }
  });

  return { success: true, message: "Mark rejected and returned to teacher" };
}

export async function lockMark(markId: string) {
  const mark = await prisma.mark.findUnique({ where: { id: markId } });
  if (!mark) throw new AppError(404, "Mark not found", "MARK_NOT_FOUND");

  if (mark.status !== "APPROVED") {
    throw new AppError(400, "Only approved marks can be locked", "INVALID_STATUS");
  }

  await prisma.mark.update({
    where: { id: markId },
    data: { isLocked: true }
  });

  return { success: true, message: "Mark locked" };
}

export async function unlockMark(userId: string, markId: string, reason: string) {
  const mark = await prisma.mark.findUnique({ where: { id: markId } });
  if (!mark) throw new AppError(404, "Mark not found", "MARK_NOT_FOUND");

  if (!mark.isLocked) {
    throw new AppError(400, "Mark is not locked", "INVALID_STATUS");
  }

  await prisma.mark.update({
    where: { id: markId },
    data: { isLocked: false }
  });

  await prisma.markAuditLog.create({
    data: {
      markId,
      changedById: userId,
      oldScore: mark.score,
      newScore: mark.score,
      reason: `Unlocked: ${reason}`
    }
  });

  return { success: true, message: "Mark unlocked" };
}

export async function getMarkAuditLog(markId: string) {
  const logs = await prisma.markAuditLog.findMany({
    where: { markId },
    include: { changedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return logs.map(l => ({
    id: l.id,
    changedBy: l.changedBy.name,
    oldScore: l.oldScore,
    newScore: l.newScore,
    reason: l.reason,
    createdAt: l.createdAt
  }));
}

export async function getReports(schoolId: string, filters: { classId?: string; termId?: string; status?: string }) {
  const term = await getActiveTerm(schoolId);
  const termId = filters.termId || term?.id;

  const reports = await prisma.reportCard.findMany({
    where: {
      class: { schoolId },
      ...(filters.classId && { classId: filters.classId }),
      ...(termId && { termId }),
      ...(filters.status && { status: filters.status })
    },
    include: { student: { include: { user: true } }, class: true, term: true, academicYear: true },
    take: 50
  });

  return reports.map(r => ({
    id: r.id,
    student: r.student.user.name,
    studentCode: r.student.studentCode || "",
    class: r.class.name,
    term: r.term?.name || "",
    academicYear: r.academicYear?.name || "",
    totalMarks: r.totalMarks || 0,
    average: r.averagePercentage || 0,
    grade: r.grade || "",
    status: r.status,
    createdAt: r.createdAt
  }));
}

export async function generateReport(userId: string, schoolId: string, classId: string, termId: string) {
  const academicYear = await prisma.academicYear.findFirst({
    where: { schoolId, status: RecordStatus.ACTIVE }
  });

  if (!academicYear) throw new AppError(400, "No active academic year", "NO_ACADEMIC_YEAR");

  const students = await prisma.student.findMany({
    where: { classId, status: "ACTIVE" }
  });

  const marks = await prisma.mark.findMany({
    where: {
      student: { classId },
      termId,
      status: "APPROVED"
    }
  });

  const results = [];
  for (const student of students) {
    const studentMarks = marks.filter(m => m.studentId === student.id);
    const totalMarks = studentMarks.reduce((acc, m) => acc + (m.score ?? 0), 0);
    const avgPercentage = studentMarks.length > 0 ? studentMarks.reduce((acc, m) => acc + markPercentage(m), 0) / studentMarks.length : 0;
    const grade = avgPercentage >= 90 ? "A" : avgPercentage >= 80 ? "B" : avgPercentage >= 70 ? "C" : avgPercentage >= 60 ? "D" : "F";

    const report = await prisma.reportCard.upsert({
      where: { studentId_termId: { studentId: student.id, termId } },
      create: { studentId: student.id, classId, academicYearId: academicYear.id, termId, totalMarks, averagePercentage: avgPercentage, grade, status: "DRAFT" },
      update: { totalMarks, averagePercentage: avgPercentage, grade, status: "DRAFT" }
    });

    results.push({ studentId: student.id, reportId: report.id });
  }

  await prisma.reportGenerationLog.create({
    data: { schoolId, classId, academicYearId: academicYear.id, termId, generatedById: userId, format: "SYSTEM", status: "COMPLETED" }
  });

  return { success: true, generated: results.length };
}

export async function getReportDetail(reportId: string) {
  const report = await prisma.reportCard.findUnique({
    where: { id: reportId },
    include: { student: { include: { user: true, class: true } }, class: true, term: true, academicYear: true }
  });

  if (!report) throw new AppError(404, "Report not found", "REPORT_NOT_FOUND");

  const marks = await prisma.mark.findMany({
    where: { studentId: report.studentId, termId: report.termId, status: "APPROVED" },
    include: { subject: true }
  });

  return {
    id: report.id,
    student: report.student.user.name,
    studentCode: report.student.studentCode || "",
    class: report.class.name,
    term: report.term?.name || "",
    academicYear: report.academicYear?.name || "",
    totalMarks: report.totalMarks || 0,
    average: report.averagePercentage || 0,
    grade: report.grade || "",
    classRank: report.classRank,
    attendanceSummary: report.attendanceSummary,
    teacherComments: report.teacherComments,
    headteacherComments: report.headteacherComments,
    status: report.status,
    subjects: marks.map(m => ({ name: m.subject?.name, score: m.score, maxScore: m.maxScore, percentage: m.percentage, grade: m.grade || "" }))
  };
}

export async function updateHeadteacherComment(reportId: string, comment: string) {
  await prisma.reportCard.update({ where: { id: reportId }, data: { headteacherComments: comment } });
  return { success: true };
}

export async function approveReport(reportId: string, userId: string) {
  await prisma.reportCard.update({ where: { id: reportId }, data: { status: "APPROVED", approvedById: userId, approvedAt: new Date() } });
  return { success: true, message: "Report approved" };
}

export async function getPerformanceAnalytics(schoolId: string, filters: { classId?: string; subjectId?: string; termId?: string }) {
  const term = await getActiveTerm(schoolId);
  const termId = filters.termId || term?.id;

  const marks = await prisma.mark.findMany({
    where: {
      schoolId,
      status: "APPROVED",
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(termId && { termId })
    },
    include: { student: true, subject: true, class: true }
  });

  const bySubject: Record<string, { total: number; count: number }> = {};
  const byClass: Record<string, { total: number; count: number }> = {};
  const byGender: Record<string, { total: number; count: number }> = {};
  const byDisability: Record<string, { total: number; count: number }> = {};

  for (const m of marks) {
    const subjectName = m.subject?.name || "Unknown";
    const className = m.class?.name || "Unknown";
    const gender = m.student.gender || "OTHER";
    const hasDisability = m.student.hasDisability ? "With Disability" : "Without Disability";

    if (!bySubject[subjectName]) bySubject[subjectName] = { total: 0, count: 0 };
    bySubject[subjectName].total += markPercentage(m);
    bySubject[subjectName].count++;

    if (!byClass[className]) byClass[className] = { total: 0, count: 0 };
    byClass[className].total += markPercentage(m);
    byClass[className].count++;

    if (!byGender[gender]) byGender[gender] = { total: 0, count: 0 };
    byGender[gender].total += markPercentage(m);
    byGender[gender].count++;

    if (!byDisability[hasDisability]) byDisability[hasDisability] = { total: 0, count: 0 };
    byDisability[hasDisability].total += markPercentage(m);
    byDisability[hasDisability].count++;
  }

  return {
    bySubject: Object.entries(bySubject).map(([subject, stats]) => ({ subject, average: Math.round((stats.total / stats.count) * 10) / 10, students: stats.count })),
    byClass: Object.entries(byClass).map(([cls, stats]) => ({ class: cls, average: Math.round((stats.total / stats.count) * 10) / 10, students: stats.count })),
    byGender: Object.entries(byGender).map(([gender, stats]) => ({ gender, average: Math.round((stats.total / stats.count) * 10) / 10, students: stats.count })),
    byDisability: Object.entries(byDisability).map(([cat, stats]) => ({ category: cat, average: Math.round((stats.total / stats.count) * 10) / 10, students: stats.count }))
  };
}

export async function getAttendanceAnalytics(schoolId: string) {
  const trends = await getAttendanceTrends(schoolId, "month");
  const overview = await getAttendanceOverview(schoolId);

  return { dailyTrends: trends, todayOverview: overview.today, classOverview: overview.byClass };
}

export async function getComparisonAnalytics(schoolId: string) {
  const term = await getActiveTerm(schoolId);
  const termId = term?.id;

  const marks = await prisma.mark.findMany({
    where: { schoolId, status: "APPROVED", ...(termId && { termId }) },
    include: { student: true }
  });

  const students = await prisma.student.findMany({
    where: { schoolId },
    include: {
      attendanceRecords: { where: { date: { gte: addDays(startOfDay(), -30) } } },
      marks: { where: { ...(termId && { termId }), status: "APPROVED" } }
    }
  });

  const correlation: { attendance: number; marks: number; studentId: string }[] = [];
  for (const s of students) {
    const attendanceRate = s.attendanceRecords.length > 0
      ? percent(s.attendanceRecords.filter(a => a.status === AttendanceStatus.PRESENT).length, s.attendanceRecords.length)
      : null;
    const avgMarks = s.marks.length > 0
      ? percent(s.marks.reduce((acc, m) => acc + markPercentage(m), 0), s.marks.length)
      : null;
    if (attendanceRate !== null && avgMarks !== null) {
      correlation.push({ attendance: attendanceRate, marks: avgMarks, studentId: s.id });
    }
  }

  return { totalStudents: students.length, dataPoints: correlation };
}

export async function getParents(schoolId: string, filters: { search?: string }) {
  const parents = await prisma.parent.findMany({
    where: {
      students: { some: { student: { schoolId } } },
      ...(filters.search && { user: { name: { contains: filters.search, mode: "insensitive" } } })
    },
    include: { user: { select: { id: true, name: true, email: true } }, students: { include: { student: { include: { class: true, user: true } } } } }
  });

  return parents.map(p => ({
    id: p.id,
    name: p.user.name,
    email: p.user.email,
    phone: p.phone || "",
    children: p.students.map(s => ({ name: s.student.user.name, class: s.student.class?.name || "", relationship: s.relationship || "" })),
    childrenCount: p.students.length
  }));
}

export async function getParentChildren(parentId: string) {
  const studentParents = await prisma.studentParent.findMany({
    where: { parentId },
    include: { student: { include: { class: true, user: true } } }
  });

  const result = [];
  for (const sp of studentParents) {
    const student = sp.student;
    const marks = await prisma.mark.findMany({ where: { studentId: student.id, status: "APPROVED" }, take: 10 });
    const attendance = await prisma.attendanceRecord.findMany({ where: { studentId: student.id }, orderBy: { date: "desc" }, take: 10 });

    const avgMarks = marks.length > 0 ? percent(marks.reduce((acc, m) => acc + markPercentage(m), 0), marks.length) : null;
    const attendanceRate = attendance.length > 0 ? percent(attendance.filter(a => a.status === AttendanceStatus.PRESENT).length, attendance.length) : null;

    result.push({
      id: student.id,
      name: student.user.name,
      studentCode: student.studentCode || "",
      class: student.class?.name || "",
      averageMarks: avgMarks,
      attendanceRate
    });
  }

  return result;
}

export async function getParentMessages(parentId: string) {
  const parent = await prisma.parent.findUnique({ where: { id: parentId } });
  if (!parent) throw new AppError(404, "Parent not found", "PARENT_NOT_FOUND");

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: parent.userId }, { recipientId: parent.userId }] },
    include: { sender: { select: { name: true, role: true } }, recipient: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return messages.map(m => ({ id: m.id, from: m.sender.name, fromRole: m.sender.role, to: m.recipient.name, body: m.body, readAt: m.readAt, createdAt: m.createdAt }));
}

export async function getParentEngagement(schoolId: string) {
  const parents = await prisma.parent.findMany({
    where: { students: { some: { student: { schoolId } } } },
    include: { students: true, user: { include: { receivedMessages: { where: { createdAt: { gte: addDays(startOfDay(), -30) } } } } } }
  });

  const activeParents = parents.filter(p => p.user.receivedMessages.length > 0).length;
  const totalParents = parents.length;
  const linkedStudents = await prisma.studentParent.findMany({ where: { student: { schoolId } }, distinct: ["parentId"] });

  return { totalParents, linkedParents: linkedStudents.length, activeEngaged: activeParents, engagementRate: percent(activeParents, totalParents || 1) };
}

export async function getAIInsights(schoolId: string) {
  const [atRiskStudents, attendance, performance, interventions] = await Promise.all([
    prisma.studentRiskScore.findMany({ where: { student: { schoolId }, riskLevel: { in: ["MEDIUM", "HIGH"] } }, include: { student: { include: { user: true, class: true } } } }),
    prisma.attendanceRecord.findMany({ where: { schoolId, date: { gte: addDays(startOfDay(), -30) } } }),
    prisma.mark.findMany({ where: { schoolId, status: "APPROVED", term: { status: RecordStatus.ACTIVE } }, include: { subject: true } }),
    prisma.intervention.findMany({ where: { schoolId, status: RecordStatus.ACTIVE } })
  ]);

  const atRiskList = atRiskStudents.map(s => ({ name: s.student.user.name, class: s.student.class?.name || "", riskLevel: s.riskLevel, score: s.score }));

  const subjectPerformance: Record<string, number[]> = {};
  for (const m of performance) {
    const subject = m.subject?.name || "Unknown";
    if (!subjectPerformance[subject]) subjectPerformance[subject] = [];
    subjectPerformance[subject].push(markPercentage(m));
  }

  const weakSubjects = Object.entries(subjectPerformance)
    .map(([subject, scores]) => ({ subject, average: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .filter(s => s.average < 60)
    .sort((a, b) => a.average - b.average)
    .slice(0, 5);

  const absentTrend = percent(attendance.filter(a => a.status === AttendanceStatus.ABSENT).length, attendance.length);

  const insights = [];
  if (atRiskList.length > 0) insights.push({ type: "STUDENT_RISK", title: `${atRiskList.length} students at risk`, summary: `Immediate attention needed for ${atRiskList.slice(0, 3).map(s => s.name).join(", ")}`, priority: "HIGH" });
  if (weakSubjects.length > 0) {
    const firstWeak = weakSubjects[0];
    insights.push({ type: "WEAK_SUBJECT", title: "Subjects needing intervention", summary: `${firstWeak?.subject || "Unknown"} has lowest average at ${firstWeak?.average.toFixed(1) || "0"}%`, priority: "MEDIUM" });
  }
  if (absentTrend > 15) insights.push({ type: "ATTENDANCE", title: "Attendance concerns", summary: `Absenteeism rate is ${absentTrend.toFixed(1)}% over the past 30 days`, priority: "MEDIUM" });
  insights.push({ type: "INTERVENTION", title: "Active interventions", summary: `${interventions.length} students currently under intervention programs`, priority: "LOW" });

  return { insights, atRiskStudents: atRiskList, weakSubjects, absentTrend, totalInterventions: interventions.length };
}

export async function getAIActionPlan(schoolId: string) {
  const insights = await getAIInsights(schoolId);

  const actions = [];
  if (insights.atRiskStudents.length > 0) actions.push({ priority: "HIGH", action: "Schedule meetings with parents of at-risk students", target: `${insights.atRiskStudents.length} students`, timeline: "This week" });
  if (insights.weakSubjects.length > 0) {
    const firstWeak = insights.weakSubjects[0];
    actions.push({ priority: "MEDIUM", action: `Arrange remedial support for ${firstWeak?.subject || "subject"}`, target: "Underperforming students", timeline: "Within 2 weeks" });
  }
  if (insights.absentTrend > 10) actions.push({ priority: "MEDIUM", action: "Send attendance reminders to parents", target: "Students with >3 absences", timeline: "This week" });
  actions.push({ priority: "LOW", action: "Review teacher workload distribution", target: "Teachers with high pending marks", timeline: "End of month" });

  return { actions };
}

export async function getAISchoolSummary(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  const dashboard = await getDashboardBySchoolId(schoolId);
  const insights = await getAIInsights(schoolId);

  const stats = dashboard.stats;
  const parts: string[] = [];
  parts.push(`${school?.name || "School"} has ${stats.totalStudents} students and ${stats.totalTeachers} teachers.`);
  parts.push(`Today's attendance is ${stats.attendanceRate}%, with ${stats.absentToday} students absent.`);
  if (insights.atRiskStudents.length > 0) parts.push(`${insights.atRiskStudents.length} students are at risk and need immediate intervention.`);
  if (insights.weakSubjects.length > 0) {
    const firstWeak = insights.weakSubjects[0];
    parts.push(`${firstWeak?.subject || "Subject"} is the weakest subject with ${firstWeak?.average.toFixed(1) || "0"}% average performance.`);
  }
  parts.push(`${stats.pendingMarksApproval} marks are pending approval.`);

  return { summary: parts.join(" ") };
}
