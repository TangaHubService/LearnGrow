import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { chromium } from "playwright";
import {
  AssessmentType,
  MarkSubmissionStatus,
  Prisma,
  StudentStatus,
  UserRole
} from "@prisma/client";
import { assertCanViewStudent } from "../../middleware/access.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import { callRequiredOpenAIJson } from "../ai/ai.service.js";

type ActorContext = NonNullable<Awaited<ReturnType<typeof getActorContext>>>;
type DraftRecord = {
  studentId: string;
  score?: number | null;
  missingReason?: string | null;
  teacherComments?: string | null;
};

type DraftInput = {
  classId: string;
  subjectId: string;
  academicYearId: string;
  termId: string;
  assessmentType: string;
  assessmentKey?: string;
  maxScore: number;
  records: DraftRecord[];
};

type SubmissionFilters = {
  schoolId?: string;
  classId?: string;
  subjectId?: string;
  academicYearId?: string;
  termId?: string;
  teacherId?: string;
  status?: string;
  assessmentType?: string;
  page?: number;
  pageSize?: number;
};

const DEFAULT_GRADING_SCALE = [
  { minPercentage: 80, maxPercentage: 100, grade: "A", description: "Excellent", points: 1, remarks: "Outstanding performance" },
  { minPercentage: 70, maxPercentage: 79.99, grade: "B", description: "Very Good", points: 2, remarks: "Very strong understanding" },
  { minPercentage: 60, maxPercentage: 69.99, grade: "C", description: "Good", points: 3, remarks: "Good conceptual grasp" },
  { minPercentage: 50, maxPercentage: 59.99, grade: "D", description: "Satisfactory", points: 4, remarks: "Meets basic requirements" },
  { minPercentage: 40, maxPercentage: 49.99, grade: "E", description: "Adequate", points: 5, remarks: "Requires improvement" },
  { minPercentage: 0, maxPercentage: 39.99, grade: "F", description: "Fail", points: 6, remarks: "Significant support needed" }
];

const REVIEWER_ROLES = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.HEAD_TEACHER,
  UserRole.DIRECTOR_OF_STUDIES,
  UserRole.SUPER_ADMIN
]);

const RECORDING_ROLES = new Set<UserRole>([
  UserRole.TEACHER,
  UserRole.HEAD_TEACHER,
  UserRole.ADMIN,
  UserRole.DIRECTOR_OF_STUDIES,
  UserRole.SUPER_ADMIN
]);

function normalizeAssessmentKey(assessmentType: string, assessmentKey?: string | null) {
  const normalizedType = assessmentType.trim().toUpperCase();
  if (assessmentKey?.trim()) return assessmentKey.trim();
  return `type:${normalizedType}`;
}

function clampPage(value?: number) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 1;
}

function clampPageSize(value?: number) {
  if (!Number.isFinite(value) || !value) return 20;
  return Math.min(Math.max(Math.floor(value), 5), 100);
}

function getGradeFromPercentage(percentage: number, scales: Array<{ minPercentage: number; maxPercentage: number; grade: string; remarks?: string | null }>) {
  const activeScales = scales.length ? scales : DEFAULT_GRADING_SCALE;
  const match = activeScales.find((scale) => percentage >= scale.minPercentage && percentage <= scale.maxPercentage);
  return match
    ? { grade: match.grade, remarks: match.remarks || match.grade }
    : { grade: "F", remarks: "Significant support needed" };
}

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function percent(score: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return Number(((score / maxScore) * 100).toFixed(2));
}

function ensureUuidLike(id: string, label: string) {
  if (!id || typeof id !== "string") {
    throw new AppError(400, `${label} is required`, "PARAMETER_REQUIRED");
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "kuralearn";
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function getActorContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teacher: true,
      staff: true,
      student: true,
      parent: { include: { students: { include: { student: true } } } }
    }
  });
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  return user;
}

async function resolveSchoolId(context: ActorContext, requestedSchoolId?: string) {
  if (context.role === UserRole.SUPER_ADMIN && requestedSchoolId) return requestedSchoolId;
  const parentSchoolId = context.parent?.students.find((link) => link.student.schoolId)?.student.schoolId;
  const schoolId = context.teacher?.schoolId || context.staff?.schoolId || context.student?.schoolId || parentSchoolId;
  if (schoolId) return schoolId;
  if (context.role === UserRole.SUPER_ADMIN) {
    const school = await prisma.school.findFirst({ orderBy: { name: "asc" } });
    if (school) return school.id;
  }
  throw new AppError(400, "User is not linked to a school context", "SCHOOL_CONTEXT_REQUIRED");
}

function assertReviewer(context: ActorContext) {
  if (!REVIEWER_ROLES.has(context.role)) {
    throw new AppError(403, "Only school reviewers can approve or reject marks", "FORBIDDEN");
  }
}

function assertCanRecord(context: ActorContext) {
  if (!RECORDING_ROLES.has(context.role)) {
    throw new AppError(403, "Only teachers and school staff can record marks", "FORBIDDEN");
  }
  if (!context.teacher) {
    throw new AppError(403, "This user is not linked to a teacher profile for marks entry", "TEACHER_REQUIRED");
  }
}

type AssignmentSubject = { id: string; name: string };

type MarksAssignmentScope = {
  classIds: Set<string>;
  allSubjectClassIds: Set<string>;
  subjectIdsByClassId: Map<string, Set<string>>;
  subjectNamesByClassId: Map<string, Set<string>>;
};

function normalizeSubjectKey(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function isAllSubjectsAssignment(value?: string | null) {
  const normalized = normalizeSubjectKey(value);
  return normalized === "all" || normalized === "all subjects";
}

function addMapValue(map: Map<string, Set<string>>, key: string, value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return;
  const current = map.get(key) ?? new Set<string>();
  current.add(normalized);
  map.set(key, current);
}

function createEmptyAssignmentScope(): MarksAssignmentScope {
  return {
    classIds: new Set<string>(),
    allSubjectClassIds: new Set<string>(),
    subjectIdsByClassId: new Map<string, Set<string>>(),
    subjectNamesByClassId: new Map<string, Set<string>>()
  };
}

async function getTeacherMarkAssignmentScope(context: ActorContext) {
  const scope = createEmptyAssignmentScope();
  const [teacherAssignments, staffAssignments] = await Promise.all([
    context.teacher
      ? prisma.teacherClassAssignment.findMany({
          where: { teacherId: context.teacher.id, status: "ACTIVE" },
          select: { classId: true, subjectName: true }
        })
      : Promise.resolve([]),
    context.staff
      ? prisma.staffAssignment.findMany({
          where: { staffId: context.staff.id, status: "ACTIVE", classId: { not: null } },
          select: { classId: true, subjectId: true, subjectName: true }
        })
      : Promise.resolve([])
  ]);

  for (const assignment of teacherAssignments) {
    scope.classIds.add(assignment.classId);
    if (isAllSubjectsAssignment(assignment.subjectName)) {
      scope.allSubjectClassIds.add(assignment.classId);
      continue;
    }
    addMapValue(scope.subjectNamesByClassId, assignment.classId, assignment.subjectName);
    addMapValue(scope.subjectIdsByClassId, assignment.classId, assignment.subjectName);
  }

  for (const assignment of staffAssignments) {
    if (!assignment.classId) continue;
    scope.classIds.add(assignment.classId);
    if (!assignment.subjectId && (assignment.subjectName === null || isAllSubjectsAssignment(assignment.subjectName))) {
      scope.allSubjectClassIds.add(assignment.classId);
      continue;
    }
    addMapValue(scope.subjectIdsByClassId, assignment.classId, assignment.subjectId);
    addMapValue(scope.subjectNamesByClassId, assignment.classId, assignment.subjectName);
  }

  return scope;
}

function classLevelSubjectWhere(classId: string, schoolId: string): Prisma.SubjectWhereInput {
  return { level: { classes: { some: { id: classId, schoolId } } } };
}

function subjectIdentityWhere(subjectIds: string[], subjectNames: string[]): Prisma.SubjectWhereInput | null {
  const or: Prisma.SubjectWhereInput[] = [];
  if (subjectIds.length) or.push({ id: { in: subjectIds } });
  for (const subjectName of subjectNames) {
    or.push({ name: { equals: subjectName, mode: "insensitive" } });
  }
  if (!or.length) return null;
  return or.length === 1 ? or[0]! : { OR: or };
}

function assignedSubjectWhere(scope: MarksAssignmentScope, schoolId: string, classId?: string): Prisma.SubjectWhereInput {
  const classIds = classId ? [classId] : [...scope.classIds];
  const perClassWhere: Prisma.SubjectWhereInput[] = [];

  for (const scopedClassId of classIds) {
    const levelWhere = classLevelSubjectWhere(scopedClassId, schoolId);
    if (scope.allSubjectClassIds.has(scopedClassId)) {
      perClassWhere.push(levelWhere);
      continue;
    }

    const identityWhere = subjectIdentityWhere(
      [...(scope.subjectIdsByClassId.get(scopedClassId) ?? [])],
      [...(scope.subjectNamesByClassId.get(scopedClassId) ?? [])]
    );
    if (identityWhere) perClassWhere.push({ AND: [levelWhere, identityWhere] });
  }

  if (!perClassWhere.length) return { id: "__no_assigned_subjects__" };
  return perClassWhere.length === 1 ? perClassWhere[0]! : { OR: perClassWhere };
}

async function assertTeacherAssignment(context: ActorContext, input: Pick<DraftInput, "classId" | "subjectId" | "academicYearId" | "termId">, subject: AssignmentSubject) {
  if (REVIEWER_ROLES.has(context.role) && context.role !== UserRole.TEACHER) return;
  if (!context.teacher) throw new AppError(403, "Teacher profile is required", "TEACHER_REQUIRED");

  const assignment = await prisma.teacherClassAssignment.findFirst({
    where: {
      teacherId: context.teacher.id,
      classId: input.classId,
      status: "ACTIVE",
      AND: [
        {
          OR: [
            { subjectName: { equals: subject.name, mode: "insensitive" } },
            { subjectName: subject.id },
            { subjectName: { equals: "ALL", mode: "insensitive" } },
            { subjectName: { equals: "All Subjects", mode: "insensitive" } }
          ]
        },
        ...(input.academicYearId ? [{ OR: [{ academicYearId: input.academicYearId }, { academicYearId: null }] }] : [])
      ]
    }
  });

  if (assignment) return;

  const staffAssignment = context.staff
    ? await prisma.staffAssignment.findFirst({
        where: {
          staffId: context.staff.id,
          status: "ACTIVE",
          OR: [
            { classId: input.classId, subjectId: input.subjectId },
            { classId: input.classId, subjectName: { equals: subject.name, mode: "insensitive" } },
            { classId: input.classId, subjectName: subject.id },
            { classId: input.classId, subjectName: { equals: "ALL", mode: "insensitive" } },
            { classId: input.classId, subjectName: { equals: "All Subjects", mode: "insensitive" } },
            { classId: input.classId, subjectId: null, subjectName: null }
          ]
        }
      })
    : null;

  if (!staffAssignment) {
    throw new AppError(403, "You are not assigned to record marks for this class and subject", "TEACHER_ASSIGNMENT_REQUIRED");
  }
}

async function getActiveClassStudents(classId: string) {
  return prisma.student.findMany({
    where: { classId, status: StudentStatus.ACTIVE },
    include: { user: true },
    orderBy: [{ user: { name: "asc" } }, { studentCode: "asc" }]
  });
}

async function validateSubmissionScope(context: ActorContext, submissionId: string) {
  const submission = await prisma.markSubmission.findUnique({
    where: { id: submissionId },
    include: {
      school: true,
      class: { include: { level: true } },
      subject: true,
      academicYear: true,
      term: true,
      teacher: { include: { user: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
      events: {
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!submission) throw new AppError(404, "Mark submission not found", "SUBMISSION_NOT_FOUND");
  if (context.role === UserRole.SUPER_ADMIN) return submission;

  const actorSchoolId = await resolveSchoolId(context);
  if (submission.schoolId !== actorSchoolId) {
    throw new AppError(403, "This submission is outside your school scope", "SCOPE_FORBIDDEN");
  }
  if (context.role === UserRole.TEACHER && context.teacher?.id !== submission.teacherId) {
    throw new AppError(403, "You can only access your own marks submissions", "SUBMISSION_FORBIDDEN");
  }
  return submission;
}

async function createSubmissionEvent(tx: Prisma.TransactionClient, input: {
  submissionId: string;
  actorId?: string;
  action: string;
  fromStatus?: MarkSubmissionStatus | null;
  toStatus?: MarkSubmissionStatus | null;
  comment?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  await tx.markSubmissionEvent.create({
    data: {
      submissionId: input.submissionId,
      actorId: input.actorId || null,
      action: input.action,
      fromStatus: input.fromStatus || null,
      toStatus: input.toStatus || null,
      comment: input.comment || null,
      metadata: input.metadata || Prisma.JsonNull
    }
  });
}

export async function getGradingScales(schoolId: string) {
  const scales = await prisma.gradingScale.findMany({
    where: { schoolId },
    orderBy: { minPercentage: "desc" }
  });

  if (scales.length) return scales;

  await prisma.gradingScale.createMany({
    data: DEFAULT_GRADING_SCALE.map((scale) => ({
      schoolId,
      minPercentage: scale.minPercentage,
      maxPercentage: scale.maxPercentage,
      grade: scale.grade,
      description: scale.description,
      points: scale.points,
      remarks: scale.remarks
    })),
    skipDuplicates: true
  });

  return prisma.gradingScale.findMany({
    where: { schoolId },
    orderBy: { minPercentage: "desc" }
  });
}

export async function saveGradingScales(schoolId: string, scales: Array<{ minPercentage: number; maxPercentage: number; grade: string; description?: string; points?: number; remarks?: string }>) {
  return prisma.$transaction(async (tx) => {
    await tx.gradingScale.deleteMany({ where: { schoolId } });
    return tx.gradingScale.createMany({
      data: scales.map((scale) => ({
        schoolId,
        minPercentage: scale.minPercentage,
        maxPercentage: scale.maxPercentage,
        grade: scale.grade,
        description: scale.description || null,
        points: scale.points || null,
        remarks: scale.remarks || null
      }))
    });
  });
}

export async function getMarksContext(userId: string, filters: { schoolId?: string; classId?: string; subjectId?: string; termId?: string } = {}) {
  const context = await getActorContext(userId);
  const schoolId = await resolveSchoolId(context, filters.schoolId);
  if (filters.classId) {
    const cls = await prisma.class.findFirst({ where: { id: filters.classId, schoolId }, select: { id: true } });
    if (!cls) throw new AppError(404, "Class not found in your school", "CLASS_NOT_FOUND");
  }
  const assignmentScope = context.role === UserRole.TEACHER ? await getTeacherMarkAssignmentScope(context) : null;
  const classWhere: Prisma.ClassWhereInput = {
    schoolId,
    ...(assignmentScope && { id: { in: assignmentScope.classIds.size ? [...assignmentScope.classIds] : ["__no_assigned_classes__"] } })
  };
  const subjectWhere: Prisma.SubjectWhereInput = assignmentScope
    ? assignedSubjectWhere(assignmentScope, schoolId, filters.classId)
    : filters.classId
      ? classLevelSubjectWhere(filters.classId, schoolId)
      : {};
  const canReadFilteredClass = !filters.classId || !assignmentScope || assignmentScope.classIds.has(filters.classId);

  const [academicYears, terms, classes, subjects, students, submissions] = await Promise.all([
    prisma.academicYear.findMany({ where: { schoolId }, orderBy: { startDate: "desc" } }),
    prisma.term.findMany({ where: { schoolId }, include: { academicYear: true }, orderBy: { startDate: "desc" } }),
    prisma.class.findMany({
      where: classWhere,
      include: { level: true },
      orderBy: { name: "asc" }
    }),
    prisma.subject.findMany({
      where: subjectWhere,
      orderBy: [{ level: { order: "asc" } }, { order: "asc" }, { name: "asc" }]
    }),
    filters.classId && canReadFilteredClass ? getActiveClassStudents(filters.classId) : Promise.resolve([]),
    prisma.markSubmission.findMany({
      where: {
        schoolId,
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.termId && { termId: filters.termId }),
        ...(context.role === UserRole.TEACHER && context.teacher && { teacherId: context.teacher.id })
      },
      select: { id: true, classId: true, subjectId: true, termId: true, assessmentKey: true, assessmentType: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 25
    })
  ]);

  return {
    schoolId,
    academicYears,
    terms,
    classes,
    subjects,
    students,
    assessmentTypes: Object.values(AssessmentType),
    recentSubmissions: submissions
  };
}

export async function listMarkSubmissions(userId: string, filters: SubmissionFilters = {}) {
  const context = await getActorContext(userId);
  const schoolId = await resolveSchoolId(context, filters.schoolId);
  const page = clampPage(filters.page);
  const pageSize = clampPageSize(filters.pageSize);

  const where: Prisma.MarkSubmissionWhereInput = {
    schoolId,
    ...(filters.classId && { classId: filters.classId }),
    ...(filters.subjectId && { subjectId: filters.subjectId }),
    ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
    ...(filters.termId && { termId: filters.termId }),
    ...(filters.teacherId && { teacherId: filters.teacherId }),
    ...(filters.assessmentType && { assessmentType: filters.assessmentType }),
    ...(filters.status && filters.status !== "ALL" && { status: filters.status as MarkSubmissionStatus }),
    ...(context.role === UserRole.TEACHER && context.teacher && { teacherId: context.teacher.id })
  };

  const [total, submissions] = await Promise.all([
    prisma.markSubmission.count({ where }),
    prisma.markSubmission.findMany({
      where,
      include: {
        class: { include: { level: true } },
        subject: true,
        term: { include: { academicYear: true } },
        academicYear: true,
        teacher: { include: { user: true } },
        reviewedBy: { select: { id: true, name: true } },
        _count: { select: { marks: true, events: true } }
      },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  const items = await Promise.all(submissions.map(async (submission) => {
    const [studentCount, recordedCount] = await Promise.all([
      prisma.student.count({ where: { classId: submission.classId, status: StudentStatus.ACTIVE } }),
      prisma.mark.count({ where: { submissionId: submission.id, score: { not: null } } })
    ]);

    return {
      ...submission,
      completion: {
        totalStudents: studentCount,
        recordedMarks: recordedCount,
        missingMarks: Math.max(studentCount - recordedCount, 0),
        percentage: studentCount ? Math.round((recordedCount / studentCount) * 100) : 0
      }
    };
  }));

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1)
    }
  };
}

export async function getMarkSubmissionDetail(userId: string, submissionId: string) {
  const context = await getActorContext(userId);
  const submission = await validateSubmissionScope(context, submissionId);
  const students = await getActiveClassStudents(submission.classId);
  const marks = await prisma.mark.findMany({
    where: { submissionId },
    include: {
      student: { include: { user: true } },
      auditLogs: { include: { changedBy: { select: { id: true, name: true, role: true } } }, orderBy: { createdAt: "desc" }, take: 5 }
    }
  });
  const markByStudent = new Map(marks.map((mark) => [mark.studentId, mark]));

  const records = students.map((student) => {
    const mark = markByStudent.get(student.id);
    return {
      studentId: student.id,
      student,
      markId: mark?.id || null,
      score: mark?.score ?? null,
      maxScore: mark?.maxScore ?? submission.maxScore,
      percentage: mark?.percentage ?? null,
      grade: mark?.grade ?? null,
      rank: mark?.rank ?? null,
      missingReason: mark?.missingReason ?? null,
      teacherComments: mark?.teacherComments ?? null,
      headteacherComments: mark?.headteacherComments ?? null,
      status: mark?.status ?? submission.status,
      isLocked: mark?.isLocked ?? submission.isLocked,
      auditLogs: mark?.auditLogs || [],
      validation: {
        missing: mark?.score === null || mark?.score === undefined,
        invalid: typeof mark?.score === "number" && mark.score > submission.maxScore
      }
    };
  });

  const recorded = records.filter((record) => typeof record.score === "number").length;
  const totalStudents = records.length;

  return {
    submission,
    records,
    completion: {
      totalStudents,
      recordedMarks: recorded,
      missingMarks: Math.max(totalStudents - recorded, 0),
      percentage: totalStudents ? Math.round((recorded / totalStudents) * 100) : 0
    }
  };
}

export async function saveMarkSubmissionDraft(userId: string, input: DraftInput) {
  const context = await getActorContext(userId);
  assertCanRecord(context);

  const teacher = context.teacher;
  if (!teacher?.schoolId) throw new AppError(403, "Teacher is not assigned to a school", "SCHOOL_REQUIRED");

  const [cls, subject, academicYear, term] = await Promise.all([
    prisma.class.findUnique({ where: { id: input.classId } }),
    prisma.subject.findUnique({ where: { id: input.subjectId } }),
    prisma.academicYear.findUnique({ where: { id: input.academicYearId } }),
    prisma.term.findUnique({ where: { id: input.termId } })
  ]);

  if (!cls || cls.schoolId !== teacher.schoolId) throw new AppError(404, "Class not found in your school", "CLASS_NOT_FOUND");
  if (!subject) throw new AppError(404, "Subject not found", "SUBJECT_NOT_FOUND");
  if (subject.levelId !== cls.levelId) throw new AppError(400, "Subject does not belong to the selected class level", "SUBJECT_SCOPE_INVALID");
  if (!academicYear || academicYear.schoolId !== teacher.schoolId) throw new AppError(404, "Academic year not found in your school", "ACADEMIC_YEAR_NOT_FOUND");
  if (!term || term.schoolId !== teacher.schoolId || term.academicYearId !== academicYear.id) throw new AppError(404, "Term not found in the selected academic year", "TERM_NOT_FOUND");
  await assertTeacherAssignment(context, input, subject);

  if (input.maxScore <= 0) throw new AppError(400, "Maximum marks must be greater than zero", "INVALID_MAX_SCORE");

  const students = await getActiveClassStudents(input.classId);
  const activeStudentIds = new Set(students.map((student) => student.id));
  for (const record of input.records) {
    if (!activeStudentIds.has(record.studentId)) {
      throw new AppError(400, "One or more students are not active members of this class", "STUDENT_SCOPE_INVALID");
    }
    if (record.score !== null && record.score !== undefined && record.score > input.maxScore) {
      throw new AppError(400, `Score cannot exceed maximum marks of ${input.maxScore}`, "INVALID_SCORE");
    }
    if (record.score !== null && record.score !== undefined && record.score < 0) {
      throw new AppError(400, "Score cannot be negative", "INVALID_SCORE");
    }
  }

  const assessmentType = input.assessmentType.trim().toUpperCase();
  const assessmentKey = normalizeAssessmentKey(assessmentType, input.assessmentKey);
  const schoolScales = await getGradingScales(teacher.schoolId);

  const submission = await prisma.$transaction(async (tx) => {
    const existing = await tx.markSubmission.findUnique({
      where: {
        schoolId_classId_subjectId_termId_assessmentKey: {
          schoolId: teacher.schoolId!,
          classId: input.classId,
          subjectId: input.subjectId,
          termId: input.termId,
          assessmentKey
        }
      }
    });

    if (existing?.isLocked || existing?.status === MarkSubmissionStatus.APPROVED) {
      throw new AppError(403, "Approved marks are locked. Ask a reviewer to unlock them before editing.", "MARKS_LOCKED");
    }

    const draft = existing
      ? await tx.markSubmission.update({
          where: { id: existing.id },
          data: {
            teacherId: teacher.id,
            academicYearId: input.academicYearId,
            assessmentType,
            maxScore: input.maxScore,
            updatedById: userId,
            status: existing.status === MarkSubmissionStatus.SUBMITTED ? MarkSubmissionStatus.DRAFT : existing.status
          }
        })
      : await tx.markSubmission.create({
          data: {
            schoolId: teacher.schoolId!,
            classId: input.classId,
            subjectId: input.subjectId,
            academicYearId: input.academicYearId,
            termId: input.termId,
            teacherId: teacher.id,
            assessmentType,
            assessmentKey,
            maxScore: input.maxScore,
            createdById: userId,
            updatedById: userId
          }
        });

    if (!existing) {
      await createSubmissionEvent(tx, {
        submissionId: draft.id,
        actorId: userId,
        action: "DRAFT_CREATED",
        toStatus: MarkSubmissionStatus.DRAFT
      });
    }

    for (const record of input.records) {
      const normalizedScore = record.score === undefined ? null : record.score;
      const markPercentage = typeof normalizedScore === "number" ? percent(normalizedScore, input.maxScore) : null;
      const gradeResult = typeof markPercentage === "number" ? getGradeFromPercentage(markPercentage, schoolScales) : null;

      const existingMark = await tx.mark.findUnique({
        where: {
          studentId_termId_subjectId_assessmentKey: {
            studentId: record.studentId,
            termId: input.termId,
            subjectId: input.subjectId,
            assessmentKey
          }
        }
      });

      if (existingMark?.isLocked) {
        throw new AppError(403, "One or more marks are locked and cannot be edited", "MARK_LOCKED");
      }

      const markData = {
        submissionId: draft.id,
        studentId: record.studentId,
        teacherId: teacher.id,
        schoolId: teacher.schoolId!,
        classId: input.classId,
        subjectId: input.subjectId,
        academicYearId: input.academicYearId,
        termId: input.termId,
        assessmentType,
        assessmentKey,
        score: normalizedScore,
        maxScore: input.maxScore,
        percentage: markPercentage,
        grade: gradeResult?.grade || null,
        missingReason: record.missingReason || null,
        teacherComments: record.teacherComments ?? existingMark?.teacherComments ?? gradeResult?.remarks ?? null,
        status: "DRAFT",
        submittedAt: null,
        reviewedById: null,
        reviewedAt: null,
        reviewComment: null,
        approvedAt: null,
        isLocked: false
      };

      const saved = await tx.mark.upsert({
        where: {
          studentId_termId_subjectId_assessmentKey: {
            studentId: record.studentId,
            termId: input.termId,
            subjectId: input.subjectId,
            assessmentKey
          }
        },
        create: markData,
        update: markData
      });

      if (existingMark && existingMark.score !== normalizedScore) {
        await tx.markAuditLog.create({
          data: {
            markId: saved.id,
            changedById: userId,
            oldScore: existingMark.score,
            newScore: normalizedScore,
            oldValue: {
              score: existingMark.score,
              missingReason: existingMark.missingReason,
              teacherComments: existingMark.teacherComments
            },
            newValue: {
              score: normalizedScore,
              missingReason: record.missingReason || null,
              teacherComments: record.teacherComments || null
            },
            reason: "Draft marks autosave"
          }
        });
      }
    }

    return draft;
  }, { maxWait: 15000, timeout: 60000 });

  await recalculateMarksRanks({
    classId: input.classId,
    subjectId: input.subjectId,
    termId: input.termId,
    assessmentKey
  });

  return getMarkSubmissionDetail(userId, submission.id);
}

export async function submitMarkSubmission(userId: string, submissionId: string) {
  const context = await getActorContext(userId);
  const submission = await validateSubmissionScope(context, submissionId);
  if (submission.isLocked || submission.status === MarkSubmissionStatus.APPROVED) {
    throw new AppError(403, "Approved marks are locked and cannot be submitted again until unlocked", "MARKS_LOCKED");
  }
  if (context.role === UserRole.TEACHER && context.teacher?.id !== submission.teacherId) {
    throw new AppError(403, "Only the assigned teacher can submit this marks batch", "SUBMISSION_FORBIDDEN");
  }

  const students = await getActiveClassStudents(submission.classId);
  const marks = await prisma.mark.findMany({ where: { submissionId } });
  const markByStudent = new Map(marks.map((mark) => [mark.studentId, mark]));
  const missing = students.filter((student) => {
    const mark = markByStudent.get(student.id);
    return mark?.score === null || mark?.score === undefined;
  });

  if (missing.length) {
    throw new AppError(400, `Cannot submit. ${missing.length} active student(s) still have missing marks.`, "MISSING_MARKS");
  }

  const invalid = marks.find((mark) => safeNumber(mark.score) > mark.maxScore || safeNumber(mark.score) < 0);
  if (invalid) throw new AppError(400, "One or more marks are outside the allowed range", "INVALID_SCORE");

  await prisma.$transaction(async (tx) => {
    await tx.markSubmission.update({
      where: { id: submission.id },
      data: {
        status: MarkSubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
        updatedById: userId,
        reviewComment: null
      }
    });
    await tx.mark.updateMany({
      where: { submissionId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        isLocked: false,
        reviewedById: null,
        reviewedAt: null,
        reviewComment: null
      }
    });
    await createSubmissionEvent(tx, {
      submissionId,
      actorId: userId,
      action: "SUBMITTED",
      fromStatus: submission.status,
      toStatus: MarkSubmissionStatus.SUBMITTED
    });
  });

  return getMarkSubmissionDetail(userId, submissionId);
}

async function reviewSubmission(userId: string, submissionId: string, action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION" | "UNLOCK", comment?: string) {
  const context = await getActorContext(userId);
  assertReviewer(context);
  const submission = await validateSubmissionScope(context, submissionId);

  const nextStatus =
    action === "APPROVE"
      ? MarkSubmissionStatus.APPROVED
      : action === "REJECT"
        ? MarkSubmissionStatus.REJECTED
        : MarkSubmissionStatus.CORRECTION_REQUESTED;

  if (action === "APPROVE" && submission.status !== MarkSubmissionStatus.SUBMITTED) {
    throw new AppError(400, "Only submitted marks can be approved", "INVALID_SUBMISSION_STATUS");
  }

  await prisma.$transaction(async (tx) => {
    await tx.markSubmission.update({
      where: { id: submission.id },
      data: {
        status: nextStatus,
        isLocked: action === "APPROVE",
        reviewedById: userId,
        reviewedAt: new Date(),
        reviewComment: comment || null,
        updatedById: userId
      }
    });

    await tx.mark.updateMany({
      where: { submissionId },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "DRAFT",
        isLocked: action === "APPROVE",
        reviewedById: userId,
        reviewedAt: new Date(),
        reviewComment: comment || null,
        approvedAt: action === "APPROVE" ? new Date() : null
      }
    });

    await createSubmissionEvent(tx, {
      submissionId,
      actorId: userId,
      action,
      fromStatus: submission.status,
      toStatus: nextStatus,
      comment: comment || null
    });
  });

  return getMarkSubmissionDetail(userId, submissionId);
}

export function approveMarkSubmission(userId: string, submissionId: string, comment?: string) {
  return reviewSubmission(userId, submissionId, "APPROVE", comment);
}

export function rejectMarkSubmission(userId: string, submissionId: string, comment?: string) {
  return reviewSubmission(userId, submissionId, "REJECT", comment);
}

export function requestMarkSubmissionCorrection(userId: string, submissionId: string, comment?: string) {
  return reviewSubmission(userId, submissionId, "REQUEST_CORRECTION", comment);
}

export function unlockMarkSubmission(userId: string, submissionId: string, comment?: string) {
  return reviewSubmission(userId, submissionId, "UNLOCK", comment || "Unlocked for correction");
}

export async function updateSingleMark(userId: string, markId: string, input: {
  score?: number | null;
  teacherComments?: string;
  headteacherComments?: string;
  status?: string;
  isLocked?: boolean;
  reason?: string;
}) {
  const context = await getActorContext(userId);
  const mark = await prisma.mark.findUnique({ where: { id: markId }, include: { submission: true } });
  if (!mark) throw new AppError(404, "Mark record not found", "MARK_NOT_FOUND");
  if (context.role !== UserRole.SUPER_ADMIN && (await resolveSchoolId(context)) !== mark.schoolId) {
    throw new AppError(403, "This mark is outside your school scope", "SCOPE_FORBIDDEN");
  }
  const changesReviewOnlyFields =
    input.status !== undefined || input.isLocked !== undefined || input.headteacherComments !== undefined;
  if (changesReviewOnlyFields && !REVIEWER_ROLES.has(context.role)) {
    throw new AppError(403, "Only school reviewers can change a mark's status, lock or headteacher comments", "FORBIDDEN");
  }
  if (mark.isLocked && !REVIEWER_ROLES.has(context.role)) {
    throw new AppError(403, "This mark is locked and requires reviewer unlock", "MARK_LOCKED");
  }
  if (context.role === UserRole.TEACHER && context.teacher?.id !== mark.teacherId) {
    throw new AppError(403, "You can only update your own marks", "MARK_FORBIDDEN");
  }

  const schoolScales = await getGradingScales(mark.schoolId);
  const nextScore = input.score === undefined ? mark.score : input.score;
  if (nextScore !== null && nextScore !== undefined && (nextScore < 0 || nextScore > mark.maxScore)) {
    throw new AppError(400, `Score cannot exceed maximum marks of ${mark.maxScore}`, "INVALID_SCORE");
  }

  const nextPercentage = typeof nextScore === "number" ? percent(nextScore, mark.maxScore) : null;
  const grade = typeof nextPercentage === "number" ? getGradeFromPercentage(nextPercentage, schoolScales).grade : null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.mark.update({
      where: { id: markId },
      data: {
        score: nextScore,
        percentage: nextPercentage,
        grade,
        ...(input.teacherComments !== undefined && { teacherComments: input.teacherComments }),
        ...(input.headteacherComments !== undefined && { headteacherComments: input.headteacherComments }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.isLocked !== undefined && { isLocked: input.isLocked })
      }
    });

    if (mark.score !== nextScore) {
      await tx.markAuditLog.create({
        data: {
          markId,
          changedById: userId,
          oldScore: mark.score,
          newScore: nextScore,
          oldValue: { score: mark.score, percentage: mark.percentage, grade: mark.grade },
          newValue: { score: nextScore, percentage: nextPercentage, grade },
          reason: input.reason || "Updated mark"
        }
      });
    }

    if (mark.submissionId && mark.submission?.status === MarkSubmissionStatus.SUBMITTED) {
      await tx.markSubmission.update({
        where: { id: mark.submissionId },
        data: { status: MarkSubmissionStatus.DRAFT, reviewComment: null, updatedById: userId }
      });
      await createSubmissionEvent(tx, {
        submissionId: mark.submissionId,
        actorId: userId,
        action: "DRAFT_UPDATED_AFTER_MARK_EDIT",
        fromStatus: MarkSubmissionStatus.SUBMITTED,
        toStatus: MarkSubmissionStatus.DRAFT
      });
    }

    return updated;
  });
}

export async function recordMarks(userId: string, input: {
  schoolId: string;
  classId: string;
  subjectId: string;
  academicYearId: string;
  termId: string;
  assessmentType: string;
  maxScore: number;
  records: Array<{ studentId: string; score: number; teacherComments?: string }>;
}) {
  const detail = await saveMarkSubmissionDraft(userId, {
    classId: input.classId,
    subjectId: input.subjectId,
    academicYearId: input.academicYearId,
    termId: input.termId,
    assessmentType: input.assessmentType,
    maxScore: input.maxScore,
    records: input.records
  });

  return { success: true, submission: detail.submission, completion: detail.completion };
}

export async function approveClassMarks(userId: string, filter: {
  classId: string;
  subjectId: string;
  termId: string;
  assessmentType: string;
}) {
  const context = await getActorContext(userId);
  const schoolId = await resolveSchoolId(context);
  const assessmentKey = normalizeAssessmentKey(filter.assessmentType);
  const submission = await prisma.markSubmission.findUnique({
    where: {
      schoolId_classId_subjectId_termId_assessmentKey: {
        schoolId,
        classId: filter.classId,
        subjectId: filter.subjectId,
        termId: filter.termId,
        assessmentKey
      }
    }
  });
  if (!submission) throw new AppError(404, "Marks submission not found", "SUBMISSION_NOT_FOUND");
  await approveMarkSubmission(userId, submission.id);
  const count = await prisma.mark.count({ where: { submissionId: submission.id } });
  return { success: true, count, submissionId: submission.id };
}

export async function getMarks(filters: {
  schoolId: string;
  classId?: string;
  subjectId?: string;
  termId?: string;
  studentId?: string;
  assessmentType?: string;
  status?: string;
}) {
  return prisma.mark.findMany({
    where: {
      schoolId: filters.schoolId,
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(filters.termId && { termId: filters.termId }),
      ...(filters.studentId && { studentId: filters.studentId }),
      ...(filters.assessmentType && { assessmentType: filters.assessmentType }),
      ...(filters.status === "LOCKED" && { isLocked: true }),
      ...(filters.status === "APPROVED" && { status: "APPROVED" }),
      ...(filters.status === "PENDING" && { status: { in: ["DRAFT", "SUBMITTED"] }, isLocked: false })
    },
    include: {
      student: { include: { user: true } },
      subject: true,
      term: true,
      submission: true
    },
    orderBy: [{ student: { user: { name: "asc" } } }]
  });
}

async function recalculateMarksRanks(filter: {
  classId: string;
  subjectId: string;
  termId: string;
  assessmentKey: string;
}) {
  const marks = await prisma.mark.findMany({
    where: {
      classId: filter.classId,
      subjectId: filter.subjectId,
      termId: filter.termId,
      assessmentKey: filter.assessmentKey,
      score: { not: null }
    },
    orderBy: [{ percentage: "desc" }, { updatedAt: "asc" }]
  });

  if (!marks.length) return;
  await prisma.$transaction(
    marks.map((mark, index) =>
      prisma.mark.update({
        where: { id: mark.id },
        data: { rank: index + 1 }
      })
    )
  );
}

async function attendanceSummary(studentId: string, termId: string) {
  const term = await prisma.term.findUnique({ where: { id: termId } });
  if (!term) throw new AppError(404, "Term not found", "TERM_NOT_FOUND");

  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      OR: [
        { termId },
        { date: { gte: term.startDate, lte: term.endDate } }
      ]
    }
  });

  const totalDays = records.length;
  const presentDays = records.filter((record) => record.status === "PRESENT").length;
  const absentDays = records.filter((record) => record.status === "ABSENT").length;
  const lateDays = records.filter((record) => record.status === "LATE").length;
  const excusedDays = records.filter((record) => record.status === "EXCUSED").length;
  const attendanceRate = totalDays ? Number(((presentDays / totalDays) * 100).toFixed(2)) : null;

  return { totalDays, presentDays, absentDays, lateDays, excusedDays, attendanceRate };
}

function groupMarksBySubject(marks: Awaited<ReturnType<typeof prisma.mark.findMany>>) {
  const groups = new Map<string, any>();
  for (const mark of marks as any[]) {
    const existing = groups.get(mark.subjectId) || {
      subjectId: mark.subjectId,
      subjectName: mark.subject?.name || "Subject",
      totalScore: 0,
      totalMaxScore: 0,
      percentage: 0,
      grade: null,
      remarks: null,
      rank: null,
      assessments: []
    };
    existing.totalScore += safeNumber(mark.score);
    existing.totalMaxScore += safeNumber(mark.maxScore);
    existing.assessments.push({
      assessmentType: mark.assessmentType,
      assessmentKey: mark.assessmentKey,
      score: mark.score,
      maxScore: mark.maxScore,
      percentage: mark.percentage,
      grade: mark.grade
    });
    groups.set(mark.subjectId, existing);
  }
  return Array.from(groups.values());
}

async function calculateClassRanks(classId: string, termId: string) {
  const students = await prisma.student.findMany({
    where: { classId, status: StudentStatus.ACTIVE },
    select: { id: true }
  });
  const rows = await Promise.all(students.map(async (student) => {
    const marks = await prisma.mark.findMany({
      where: { studentId: student.id, termId, status: "APPROVED", isLocked: true, score: { not: null } }
    });
    const totalScore = marks.reduce((sum, mark) => sum + safeNumber(mark.score), 0);
    const totalMaxScore = marks.reduce((sum, mark) => sum + safeNumber(mark.maxScore), 0);
    return {
      studentId: student.id,
      averagePercentage: totalMaxScore ? Number(((totalScore / totalMaxScore) * 100).toFixed(2)) : 0
    };
  }));
  rows.sort((a, b) => b.averagePercentage - a.averagePercentage);
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildVerificationCode(studentId: string, termId: string) {
  const suffix = `${studentId.slice(0, 4)}${termId.slice(0, 4)}`.replace(/-/g, "").toUpperCase();
  return `KL-${Date.now().toString(36).toUpperCase()}-${suffix}`;
}

export async function getStudentReportCard(studentId: string, termId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true, class: { include: { level: true, school: true } }, school: true }
  });
  if (!student) throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");
  if (!student.classId) throw new AppError(400, "Student is not assigned to a class", "CLASS_REQUIRED");

  const term = await prisma.term.findUnique({ where: { id: termId }, include: { academicYear: true } });
  if (!term) throw new AppError(404, "Term not found", "TERM_NOT_FOUND");

  const marks = await prisma.mark.findMany({
    where: { studentId, termId, status: "APPROVED", isLocked: true, score: { not: null } },
    include: { subject: true, submission: true },
    orderBy: [{ subject: { order: "asc" } }, { assessmentType: "asc" }]
  });

  const scales = await getGradingScales(student.schoolId || term.schoolId);
  const subjectRows = groupMarksBySubject(marks).map((row) => {
    const percentage = row.totalMaxScore ? Number(((row.totalScore / row.totalMaxScore) * 100).toFixed(2)) : 0;
    const gradeResult = getGradeFromPercentage(percentage, scales);
    return { ...row, percentage, grade: gradeResult.grade, remarks: gradeResult.remarks };
  });

  const totalScore = subjectRows.reduce((sum, row) => sum + row.totalScore, 0);
  const totalMaxScore = subjectRows.reduce((sum, row) => sum + row.totalMaxScore, 0);
  const averagePercentage = totalMaxScore ? Number(((totalScore / totalMaxScore) * 100).toFixed(2)) : 0;
  const gradeResult = getGradeFromPercentage(averagePercentage, scales);
  const ranks = await calculateClassRanks(student.classId, termId);
  const classRank = ranks.find((rank) => rank.studentId === studentId)?.rank || null;
  const attendance = await attendanceSummary(studentId, termId);

  const comments = await prisma.reportComment.findMany({
    where: { studentId, termId },
    orderBy: { updatedAt: "desc" }
  });
  const teacherComment = comments.find((comment) => comment.commentType === "TEACHER")?.commentText || null;
  const headteacherComment = comments.find((comment) => comment.commentType === "HEADTEACHER")?.commentText || null;

  const existing = await prisma.reportCard.findUnique({ where: { studentId_termId: { studentId, termId } } });
  const reportData = {
    totalMaxScore,
    subjects: subjectRows,
    generatedFrom: "APPROVED_LOCKED_MARKS",
    classSize: ranks.length
  };

  const summary = await prisma.reportCard.upsert({
    where: { studentId_termId: { studentId, termId } },
    create: {
      studentId,
      classId: student.classId,
      academicYearId: term.academicYearId,
      termId,
      totalMarks: totalScore,
      averagePercentage,
      grade: gradeResult.grade,
      classRank,
      attendanceSummary: attendance.attendanceRate === null ? "No attendance recorded" : `${attendance.presentDays}/${attendance.totalDays} days present`,
      attendanceData: attendance,
      reportData,
      teacherComments: teacherComment,
      headteacherComments: headteacherComment,
      verificationCode: buildVerificationCode(studentId, termId),
      status: "DRAFT"
    },
    update: {
      totalMarks: totalScore,
      averagePercentage,
      grade: gradeResult.grade,
      classRank,
      attendanceSummary: attendance.attendanceRate === null ? "No attendance recorded" : `${attendance.presentDays}/${attendance.totalDays} days present`,
      attendanceData: attendance,
      reportData,
      teacherComments: teacherComment ?? existing?.teacherComments ?? null,
      headteacherComments: headteacherComment ?? existing?.headteacherComments ?? null,
      verificationCode: existing?.verificationCode || buildVerificationCode(studentId, termId)
    }
  });

  return {
    student,
    term,
    marks,
    subjectRows,
    attendance,
    summary
  };
}

export async function getClassMarksheet(classId: string, termId: string) {
  const cls = await prisma.class.findUnique({ where: { id: classId }, include: { level: true, school: true } });
  if (!cls) throw new AppError(404, "Class not found", "CLASS_NOT_FOUND");

  const students = await getActiveClassStudents(classId);
  const records = await Promise.all(students.map(async (student) => {
    const report = await getStudentReportCard(student.id, termId);
    return {
      studentId: student.id,
      name: student.user.name,
      code: student.studentCode,
      gender: student.gender,
      totalScore: report.summary.totalMarks || 0,
      totalMaxScore: (report.summary.reportData as any)?.totalMaxScore || 0,
      averagePercentage: report.summary.averagePercentage || 0,
      grade: report.summary.grade,
      classRank: report.summary.classRank,
      subjectGrades: report.subjectRows.reduce((acc: Record<string, any>, row) => {
        acc[row.subjectName] = row;
        return acc;
      }, {})
    };
  }));

  records.sort((a, b) => (a.classRank || 9999) - (b.classRank || 9999));
  const subjects = Array.from(new Set(records.flatMap((record) => Object.keys(record.subjectGrades))));
  const classAverage = records.length
    ? Number((records.reduce((sum, record) => sum + record.averagePercentage, 0) / records.length).toFixed(2))
    : 0;

  return { class: cls, subjects, records, classAverage };
}

export async function listReportCards(userId: string, filters: { schoolId?: string; classId?: string; termId?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const context = await getActorContext(userId);
  const schoolId = await resolveSchoolId(context, filters.schoolId);
  const page = clampPage(filters.page);
  const pageSize = clampPageSize(filters.pageSize);
  const guardianScope: Prisma.ReportCardWhereInput =
    context.role === UserRole.STUDENT
      ? { studentId: context.student?.id ?? "__none__" }
      : context.role === UserRole.PARENT
        ? {
            studentId: {
              in: (context.parent?.students ?? []).filter((link) => link.canViewReports).map((link) => link.studentId)
            }
          }
        : {};
  const where: Prisma.ReportCardWhereInput = {
    class: { schoolId },
    ...guardianScope,
    ...(filters.classId && { classId: filters.classId }),
    ...(filters.termId && { termId: filters.termId }),
    ...(filters.status && filters.status !== "ALL" && { status: filters.status })
  };

  const [total, items] = await Promise.all([
    prisma.reportCard.count({ where }),
    prisma.reportCard.findMany({
      where,
      include: {
        student: { include: { user: true } },
        class: true,
        academicYear: true,
        term: true,
        approvedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  return {
    items,
    pagination: { page, pageSize, total, totalPages: Math.max(Math.ceil(total / pageSize), 1) }
  };
}

export async function generateReportCards(userId: string, input: { classId: string; termId: string }) {
  const context = await getActorContext(userId);
  assertReviewer(context);
  const schoolId = await resolveSchoolId(context);
  const cls = await prisma.class.findUnique({ where: { id: input.classId } });
  if (!cls || cls.schoolId !== schoolId) throw new AppError(404, "Class not found in your school", "CLASS_NOT_FOUND");

  const students = await getActiveClassStudents(input.classId);
  const items = [];
  for (const student of students) {
    const report = await getStudentReportCard(student.id, input.termId);
    items.push(report.summary);
  }

  await prisma.reportGenerationLog.create({
    data: {
      schoolId,
      classId: input.classId,
      academicYearId: items[0]?.academicYearId || cls.schoolId,
      termId: input.termId,
      generatedById: userId,
      format: "HTML",
      status: "COMPLETED"
    }
  }).catch(() => undefined);

  return { success: true, count: items.length, items };
}

export async function getReportCardById(userId: string, reportCardId: string) {
  const context = await getActorContext(userId);
  const report = await prisma.reportCard.findUnique({
    where: { id: reportCardId },
    include: {
      student: { include: { user: true, school: true } },
      class: { include: { school: true, level: true } },
      academicYear: true,
      term: true,
      approvedBy: { select: { id: true, name: true } }
    }
  });
  if (!report) throw new AppError(404, "Report card not found", "REPORT_NOT_FOUND");

  // A parent's access comes from the child link checked below, since their children can be in different schools.
  if (context.role !== UserRole.SUPER_ADMIN && context.role !== UserRole.PARENT) {
    const schoolId = await resolveSchoolId(context);
    if (report.class.schoolId !== schoolId) throw new AppError(403, "Report is outside your school scope", "SCOPE_FORBIDDEN");
  }

  if (context.role === UserRole.STUDENT && context.student?.id !== report.studentId) {
    throw new AppError(403, "Students can only view their own reports", "REPORT_FORBIDDEN");
  }

  if (context.role === UserRole.PARENT) {
    const linked = context.parent?.students.some((link) => link.studentId === report.studentId && link.canViewReports);
    if (!linked) throw new AppError(403, "Parent is not linked to this student's reports", "REPORT_FORBIDDEN");
  }

  return report;
}

export async function approveReportCard(userId: string, reportCardId: string, comments?: { headteacherComments?: string; promotionRecommendation?: string }) {
  const context = await getActorContext(userId);
  assertReviewer(context);
  await getReportCardById(userId, reportCardId);

  return prisma.reportCard.update({
    where: { id: reportCardId },
    data: {
      status: "APPROVED",
      approvedById: userId,
      approvedAt: new Date(),
      ...(comments?.headteacherComments !== undefined && { headteacherComments: comments.headteacherComments }),
      ...(comments?.promotionRecommendation !== undefined && { promotionRecommendation: comments.promotionRecommendation })
    }
  });
}

function reportBranding(report: any) {
  const school = report.class?.school || report.student?.school || {};
  const branding = typeof school.reportBranding === "object" && school.reportBranding ? school.reportBranding : {};
  return {
    countryLabel: branding.countryLabel || "REPUBLIC OF RWANDA",
    ministryLabel: branding.ministryLabel || "MINISTRY OF EDUCATION",
    schoolName: branding.schoolName || school.name || "KuraLearn School",
    logoUrl: branding.logoUrl || school.logoUrl || "",
    phone: branding.phone || school.phone || "",
    email: branding.email || school.email || "",
    district: branding.district || school.district || "",
    motto: branding.motto || "",
    sealUrl: branding.sealUrl || "",
    headteacherSignatureUrl: branding.headteacherSignatureUrl || ""
  };
}

function formatReportNumber(value: unknown, fractionDigits = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return numeric.toFixed(fractionDigits);
}

function formatMaximum(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
}

function formatDate(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
}

function gradeComment(grade: unknown, fallback: unknown) {
  const comments: Record<string, string> = {
    A: "Excellent",
    B: "Very Good",
    C: "Good",
    D: "Satisfactory",
    E: "Adequate",
    F: "Needs Improvement"
  };
  const key = String(grade ?? "").trim().toUpperCase();
  return comments[key] || String(fallback ?? "-");
}

function splitSubjectAssessments(subject: any) {
  const assessments = Array.isArray(subject.assessments) ? subject.assessments : [];
  const isExam = (assessment: any) => {
    const label = `${assessment.assessmentType ?? ""} ${assessment.assessmentKey ?? ""}`.toUpperCase();
    return label.includes("EXAM") || label.includes("FINAL");
  };
  const examItems = assessments.filter(isExam);
  const catItems = assessments.filter((assessment: any) => !isExam(assessment));
  const sum = (items: any[], field: "score" | "maxScore") => {
    if (!items.length) return null;
    return items.reduce((total, item) => total + safeNumber(item[field]), 0);
  };

  return {
    catScore: sum(catItems, "score"),
    catMax: sum(catItems, "maxScore"),
    examScore: sum(examItems, "score"),
    examMax: sum(examItems, "maxScore")
  };
}

function renderReportCardStyles() {
  return `
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      color: #000;
      background: #fff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.2;
    }
    .report-card-page {
      width: 100%;
      min-height: 190mm;
      border: 2px solid #000;
      padding: 8px 10px;
      background: #fff;
      page-break-after: always;
    }
    .report-card-page:last-child { page-break-after: auto; }
    .top-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      font-weight: 700;
      font-size: 18px;
    }
    .top-header .right { text-align: right; }
    .school-line { margin-top: 2px; }
    .double-line {
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      height: 5px;
      margin-top: 10px;
    }
    .report-title {
      margin: 4px 0 5px;
      text-align: center;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0;
    }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td {
      border: 1px solid #000;
      padding: 5px 7px;
      color: #000;
      vertical-align: middle;
      overflow-wrap: anywhere;
    }
    th {
      background: #e9e9e9;
      font-weight: 800;
      text-align: center;
    }
    .info-table { margin-top: 12px; font-size: 18px; }
    .info-table td { height: 41px; }
    .student-name { width: 58%; }
    .marks-table { margin-top: 7px; font-size: 14px; }
    .marks-table th, .marks-table td { height: 32px; padding: 4px 7px; }
    .marks-table .subject-col { width: 26%; text-align: left; }
    .marks-table .small-col { width: 7%; text-align: center; }
    .marks-table .rank-col { width: 7.5%; text-align: center; }
    .marks-table .comment-col { width: 24%; text-align: center; }
    .marks-table .subject-name { font-weight: 800; }
    .marks-table .section-divider { border-left-width: 4px; }
    .shade td { background: #d9d9d9; font-weight: 800; }
    .average-row td { height: 40px; font-weight: 800; }
    .sign-table { margin-top: 10px; font-size: 14px; }
    .sign-table th { height: 28px; }
    .sign-table td { height: 76px; vertical-align: middle; }
    .sign-table .observations { width: 20%; vertical-align: top; }
    .sign-table .qr-col { width: 20%; text-align: center; }
    .qr-img { width: 46px; height: 46px; display: block; margin: 0 auto; }
    .muted-cell { color: #000; }
  `;
}

function renderReportCardPage(report: any, qrDataUrl: string) {
  const branding = reportBranding(report);
  const reportData = (report.reportData || {}) as any;
  const subjects = Array.isArray(reportData.subjects) ? reportData.subjects : [];
  const classSize = reportData.classSize || "";
  const rankLabel = report.classRank && classSize ? `${report.classRank}/${classSize}` : report.classRank || "-";
  const student = report.student || {};
  const studentLocation = [student.district, student.sector].filter(Boolean).join(", ");
  const rows = subjects.map((subject: any) => {
    const parts = splitSubjectAssessments(subject);
    return `
    <tr>
      <td class="subject-name">${escapeHtml(subject.subjectName)}</td>
      <td class="small-col">${escapeHtml(parts.catMax === null ? "-" : formatMaximum(parts.catMax))}</td>
      <td class="small-col">${escapeHtml(parts.examMax === null ? "-" : formatMaximum(parts.examMax))}</td>
      <td class="small-col">${escapeHtml(formatMaximum(subject.totalMaxScore))}</td>
      <td class="small-col section-divider">${escapeHtml(parts.catScore === null ? "-" : formatReportNumber(parts.catScore))}</td>
      <td class="small-col">${escapeHtml(parts.examScore === null ? "-" : formatReportNumber(parts.examScore))}</td>
      <td class="small-col">${escapeHtml(formatReportNumber(subject.totalScore))}</td>
      <td class="rank-col">-</td>
      <td class="comment-col">${escapeHtml(gradeComment(subject.grade, subject.remarks))}</td>
    </tr>
  `;
  }).join("");
  const emptyRows = subjects.length ? "" : `
    <tr>
      <td class="subject-name">No approved marks</td>
      <td>-</td><td>-</td><td>-</td>
      <td class="section-divider">-</td><td>-</td><td>-</td>
      <td>-</td><td>-</td>
    </tr>
  `;

  return `
  <main class="report-card-page">
    <section class="top-header">
      <div>
        <div>${escapeHtml(branding.countryLabel)}</div>
        <div class="school-line">${escapeHtml(branding.schoolName)}</div>
        <div class="school-line">${escapeHtml(branding.district)}</div>
        <div class="school-line">${escapeHtml(branding.phone)}</div>
      </div>
      <div class="right">
        <div>${escapeHtml(branding.ministryLabel)}</div>
        <div class="school-line">School Year: ${escapeHtml(report.academicYear?.name || "")}</div>
        <div class="school-line">${escapeHtml(report.term?.name || "")}</div>
      </div>
    </section>

    <div class="double-line"></div>
    <h1 class="report-title">REPORT CARD</h1>
    <div class="double-line"></div>

    <table class="info-table">
      <tr>
        <td class="student-name">Student Name: ${escapeHtml(student.user?.name || "")}</td>
        <td>Class: ${escapeHtml(report.class?.name || "")}</td>
      </tr>
      <tr>
        <td colspan="2">
          Born: ${escapeHtml(formatDate(student.dateOfBirth))} &nbsp;&nbsp;&nbsp;&nbsp;
          at ${escapeHtml(studentLocation)} &nbsp;&nbsp;&nbsp;&nbsp;
          N. Students: ${escapeHtml(classSize || "-")} &nbsp;&nbsp;&nbsp;&nbsp;
          Position: ${escapeHtml(rankLabel)} &nbsp;&nbsp;&nbsp;&nbsp;
          Conduct:
        </td>
      </tr>
      <tr>
        <td colspan="2">ID No.: ${escapeHtml(student.studentCode || student.id || "")}</td>
      </tr>
    </table>

    <table class="marks-table">
      <thead>
        <tr>
          <th rowspan="2" class="subject-col">SUBJECT</th>
          <th colspan="3">MAXIMUM</th>
          <th colspan="3" class="section-divider">OBTAINED</th>
          <th rowspan="2" class="rank-col">Rank</th>
          <th rowspan="2" class="comment-col">Comments</th>
        </tr>
        <tr>
          <th class="small-col">CAT</th>
          <th class="small-col">EXAM</th>
          <th class="small-col">TOTAL</th>
          <th class="small-col section-divider">CAT</th>
          <th class="small-col">EXAM</th>
          <th class="small-col">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${rows || emptyRows}
        <tr class="shade">
          <td>Total</td>
          <td>-</td><td>-</td><td>-</td>
          <td class="section-divider">-</td><td>-</td><td>-</td>
          <td></td><td></td>
        </tr>
        <tr class="average-row">
          <td>Average</td>
          <td></td><td></td><td></td>
          <td class="section-divider"></td><td></td><td>-</td>
          <td>${escapeHtml(rankLabel)}</td>
          <td>${escapeHtml(report.grade || "-")}</td>
        </tr>
      </tbody>
    </table>

    <table class="sign-table">
      <thead>
        <tr>
          <th>Observations</th>
          <th>Teacher</th>
          <th>Head Teacher</th>
          <th>Parent</th>
          <th>QR</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="observations">${escapeHtml(report.teacherComments || "")}</td>
          <td class="comment-col">Daily Teacher</td>
          <td class="comment-col">${escapeHtml(report.approvedBy?.name || "")}</td>
          <td class="comment-col"></td>
          <td class="qr-col"><img class="qr-img" src="${qrDataUrl}" alt="QR" /></td>
        </tr>
      </tbody>
    </table>
  </main>`;
}

function renderReportCardHtml(report: any, qrDataUrl: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${renderReportCardStyles()}</style>
</head>
<body>
  ${renderReportCardPage(report, qrDataUrl)}
</body>
</html>`;
}

function renderReportCardsHtml(pages: string[]) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${renderReportCardStyles()}</style>
</head>
<body>
  ${pages.join("\n")}
</body>
</html>`;
}

async function prepareReportForPdf(report: any) {
  const verification = report.verificationCode || buildVerificationCode(report.studentId, report.termId);
  if (!report.verificationCode) {
    await prisma.reportCard.update({ where: { id: report.id }, data: { verificationCode: verification } });
  }
  const reportWithVerification = { ...report, verificationCode: verification };
  const qrPayload = JSON.stringify({ reportId: report.id, verificationCode: verification });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 160 });
  return { report: reportWithVerification, qrDataUrl };
}

async function renderPdf(html: string, fileName: string) {
  const outDir = path.resolve(process.cwd(), "public/uploads/reports");
  await fs.mkdir(outDir, { recursive: true });
  const filePath = path.join(outDir, fileName);
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1130 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" }
    });
    await fs.writeFile(filePath, pdf);
  } finally {
    await browser.close();
  }
  return `/uploads/reports/${fileName}`;
}

export async function exportReportCardPdf(userId: string, reportCardId: string) {
  const report = await getReportCardById(userId, reportCardId);
  const prepared = await prepareReportForPdf(report);
  const html = renderReportCardHtml(prepared.report, prepared.qrDataUrl);
  const fileName = `${slugify(report.class.school.name)}-${prepared.report.verificationCode}.pdf`;
  const pdfUrl = await renderPdf(html, fileName);

  const updated = await prisma.reportCard.update({
    where: { id: report.id },
    data: { pdfUrl, pdfGeneratedAt: new Date() }
  });

  await prisma.reportGenerationLog.create({
    data: {
      schoolId: report.class.schoolId,
      classId: report.classId,
      academicYearId: report.academicYearId,
      termId: report.termId,
      generatedById: userId,
      format: "PDF",
      status: "COMPLETED"
    }
  }).catch(() => undefined);

  return { success: true, pdfUrl, report: updated };
}

function renderSimpleDocument(title: string, body: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
@page { size: A4; margin: 16mm; }
body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; color: #172033; }
h1 { font-size: 22px; margin: 0 0 14px; }
table { width: 100%; border-collapse: collapse; font-size: 11px; }
th, td { border: 1px solid #d9e2ec; padding: 7px; text-align: left; }
th { background: #f1f5f9; }
.metric { display: inline-block; border: 1px solid #d9e2ec; border-radius: 8px; padding: 10px; margin: 0 8px 14px 0; }
</style></head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
}

export async function exportClassMarksheetPdf(userId: string, input: { classId: string; termId: string }) {
  const sheet = await getClassMarksheet(input.classId, input.termId);
  const header = `<div class="metric"><b>Class average</b><br>${escapeHtml(sheet.classAverage)}%</div><div class="metric"><b>Students</b><br>${escapeHtml(sheet.records.length)}</div>`;
  const rows = sheet.records.map((record) => `<tr><td>${escapeHtml(record.name)}</td><td>${escapeHtml(record.code || "")}</td><td>${escapeHtml(record.totalScore)}</td><td>${escapeHtml(record.averagePercentage)}%</td><td>${escapeHtml(record.grade)}</td><td>${escapeHtml(record.classRank)}</td></tr>`).join("");
  const html = renderSimpleDocument(`${sheet.class.school.name} ${sheet.class.name} Marksheet`, `${header}<table><thead><tr><th>Student</th><th>Code</th><th>Total</th><th>Average</th><th>Grade</th><th>Rank</th></tr></thead><tbody>${rows}</tbody></table>`);
  const fileName = `${slugify(sheet.class.school.name)}-${slugify(sheet.class.name)}-marksheet-${Date.now()}.pdf`;
  const pdfUrl = await renderPdf(html, fileName);
  return { success: true, pdfUrl };
}

export async function exportClassReportPdf(userId: string, input: { classId: string; termId: string }) {
  const context = await getActorContext(userId);
  assertReviewer(context);

  const cls = await prisma.class.findUnique({ where: { id: input.classId }, include: { school: true, level: true } });
  if (!cls) throw new AppError(404, "Class not found", "CLASS_NOT_FOUND");
  if (context.role !== UserRole.SUPER_ADMIN) {
    const schoolId = await resolveSchoolId(context);
    if (cls.schoolId !== schoolId) throw new AppError(403, "Class is outside your school scope", "SCOPE_FORBIDDEN");
  }

  const students = await getActiveClassStudents(input.classId);
  await Promise.all(students.map((student) => getStudentReportCard(student.id, input.termId)));

  const reports = await prisma.reportCard.findMany({
    where: { classId: input.classId, termId: input.termId },
    include: {
      student: { include: { user: true, school: true } },
      class: { include: { school: true, level: true } },
      academicYear: true,
      term: true,
      approvedBy: { select: { id: true, name: true } }
    }
  });

  if (!reports.length) {
    throw new AppError(404, "No report cards found for this class and term", "REPORTS_NOT_FOUND");
  }
  const firstReport = reports[0]!;

  reports.sort((a: any, b: any) => {
    const rankDelta = (a.classRank || 9999) - (b.classRank || 9999);
    if (rankDelta) return rankDelta;
    return String(a.student?.user?.name || "").localeCompare(String(b.student?.user?.name || ""));
  });

  const pages = [];
  for (const report of reports) {
    const prepared = await prepareReportForPdf(report);
    pages.push(renderReportCardPage(prepared.report, prepared.qrDataUrl));
  }

  const html = renderReportCardsHtml(pages);
  const fileName = `${slugify(cls.school.name)}-${slugify(cls.name)}-report-cards-${Date.now()}.pdf`;
  const pdfUrl = await renderPdf(html, fileName);

  await prisma.reportGenerationLog.create({
    data: {
      schoolId: cls.schoolId,
      classId: input.classId,
      academicYearId: firstReport.academicYearId,
      termId: input.termId,
      generatedById: userId,
      format: "PDF",
      status: "COMPLETED"
    }
  }).catch(() => undefined);

  return { success: true, pdfUrl, count: reports.length };
}

export async function exportTranscriptPdf(userId: string, input: { studentId: string }) {
  const context = await getActorContext(userId);
  const student = await prisma.student.findUnique({ where: { id: input.studentId }, include: { user: true, class: { include: { school: true } } } });
  if (!student?.class) throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");
  if (context.role !== UserRole.SUPER_ADMIN) {
    const schoolId = await resolveSchoolId(context);
    if (student.class.schoolId !== schoolId) throw new AppError(403, "Student is outside your school scope", "SCOPE_FORBIDDEN");
  }
  const reports = await prisma.reportCard.findMany({
    where: { studentId: input.studentId, status: { in: ["APPROVED", "LOCKED"] } },
    include: { academicYear: true, term: true },
    orderBy: [{ academicYear: { startDate: "asc" } }, { term: { startDate: "asc" } }]
  });
  const rows = reports.map((report) => `<tr><td>${escapeHtml(report.academicYear.name)}</td><td>${escapeHtml(report.term.name)}</td><td>${escapeHtml(report.totalMarks || 0)}</td><td>${escapeHtml(report.averagePercentage || 0)}%</td><td>${escapeHtml(report.grade)}</td><td>${escapeHtml(report.classRank)}</td></tr>`).join("");
  const html = renderSimpleDocument(`${student.user.name} Transcript`, `<table><thead><tr><th>Academic Year</th><th>Term</th><th>Total</th><th>Average</th><th>Grade</th><th>Rank</th></tr></thead><tbody>${rows}</tbody></table>`);
  const fileName = `${slugify(student.class.school.name)}-${slugify(student.user.name)}-transcript-${Date.now()}.pdf`;
  const pdfUrl = await renderPdf(html, fileName);
  return { success: true, pdfUrl };
}

export async function getMarksAnalytics(userId: string, filters: { schoolId?: string; classId?: string; termId?: string; subjectId?: string } = {}) {
  const context = await getActorContext(userId);
  const schoolId = await resolveSchoolId(context, filters.schoolId);
  const approvedWhere: Prisma.MarkWhereInput = {
    schoolId,
    status: "APPROVED",
    isLocked: true,
    score: { not: null },
    ...(filters.classId && { classId: filters.classId }),
    ...(filters.termId && { termId: filters.termId }),
    ...(filters.subjectId && { subjectId: filters.subjectId }),
    ...(context.role === UserRole.TEACHER && context.teacher && { teacherId: context.teacher.id })
  };

  const [marks, submissions, attendance] = await Promise.all([
    prisma.mark.findMany({ where: approvedWhere, include: { student: true, subject: true, class: true } }),
    prisma.markSubmission.findMany({
      where: {
        schoolId,
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.termId && { termId: filters.termId }),
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(context.role === UserRole.TEACHER && context.teacher && { teacherId: context.teacher.id })
      },
      include: { teacher: { include: { user: true } }, class: true, subject: true }
    }),
    prisma.attendanceRecord.findMany({
      where: {
        schoolId,
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.termId && { termId: filters.termId }),
        ...(filters.subjectId && { subjectId: filters.subjectId })
      }
    })
  ]);

  const average = marks.length
    ? Number((marks.reduce((sum, mark) => sum + safeNumber(mark.percentage), 0) / marks.length).toFixed(2))
    : 0;

  const byStudent = new Map<string, { name: string; total: number; count: number; attendanceRate: number | null }>();
  for (const mark of marks as any[]) {
    const row = byStudent.get(mark.studentId) || { name: mark.student?.user?.name || mark.studentId, total: 0, count: 0, attendanceRate: null };
    row.total += safeNumber(mark.percentage);
    row.count += 1;
    byStudent.set(mark.studentId, row);
  }

  const learners = Array.from(byStudent.entries()).map(([studentId, row]) => {
    const studentAttendance = attendance.filter((record) => record.studentId === studentId);
    const present = studentAttendance.filter((record) => record.status === "PRESENT").length;
    return {
      studentId,
      name: row.name,
      average: row.count ? Number((row.total / row.count).toFixed(2)) : 0,
      attendanceRate: studentAttendance.length ? Number(((present / studentAttendance.length) * 100).toFixed(2)) : null
    };
  }).sort((a, b) => b.average - a.average);

  const bySubject = new Map<string, { subjectId: string; subjectName: string; total: number; count: number }>();
  for (const mark of marks as any[]) {
    const row = bySubject.get(mark.subjectId) || { subjectId: mark.subjectId, subjectName: mark.subject?.name || "Subject", total: 0, count: 0 };
    row.total += safeNumber(mark.percentage);
    row.count += 1;
    bySubject.set(mark.subjectId, row);
  }

  const subjectPerformance = Array.from(bySubject.values()).map((row) => ({
    subjectId: row.subjectId,
    subjectName: row.subjectName,
    average: row.count ? Number((row.total / row.count).toFixed(2)) : 0
  })).sort((a, b) => b.average - a.average);

  const submissionProgress = {
    total: submissions.length,
    draft: submissions.filter((submission) => submission.status === MarkSubmissionStatus.DRAFT).length,
    submitted: submissions.filter((submission) => submission.status === MarkSubmissionStatus.SUBMITTED).length,
    correctionRequested: submissions.filter((submission) => submission.status === MarkSubmissionStatus.CORRECTION_REQUESTED).length,
    rejected: submissions.filter((submission) => submission.status === MarkSubmissionStatus.REJECTED).length,
    approved: submissions.filter((submission) => submission.status === MarkSubmissionStatus.APPROVED).length
  };

  const passCount = learners.filter((learner) => learner.average >= 50).length;

  return {
    source: "REAL_APPROVED_MARKS",
    average,
    passRate: learners.length ? Number(((passCount / learners.length) * 100).toFixed(2)) : 0,
    topPerformers: learners.slice(0, 5),
    weakLearners: learners.filter((learner) => learner.average < 50).slice(-10),
    subjectPerformance,
    submissionProgress,
    attendanceCorrelation: learners.map((learner) => ({
      studentId: learner.studentId,
      name: learner.name,
      average: learner.average,
      attendanceRate: learner.attendanceRate
    })),
    deterministicInsights: buildDeterministicInsights({ average, learners, subjectPerformance, submissionProgress })
  };
}

function buildDeterministicInsights(input: {
  average: number;
  learners: Array<{ name: string; average: number; attendanceRate: number | null }>;
  subjectPerformance: Array<{ subjectName: string; average: number }>;
  submissionProgress: { total: number; approved: number; submitted: number; draft: number; correctionRequested: number; rejected: number };
}) {
  const insights: string[] = [];
  const weakestSubject = [...input.subjectPerformance].sort((a, b) => a.average - b.average)[0];
  const atRisk = input.learners.filter((learner) => learner.average < 50);
  const lowAttendance = input.learners.filter((learner) => learner.attendanceRate !== null && learner.attendanceRate < 75);

  if (weakestSubject) insights.push(`${weakestSubject.subjectName} has the lowest current average at ${weakestSubject.average}%.`);
  if (atRisk.length) insights.push(`${atRisk.length} learner(s) are below the 50% pass threshold and need remedial support.`);
  if (lowAttendance.length) insights.push(`${lowAttendance.length} learner(s) have attendance below 75%, which may be affecting performance.`);
  if (input.submissionProgress.total && input.submissionProgress.approved < input.submissionProgress.total) {
    insights.push(`${input.submissionProgress.total - input.submissionProgress.approved} marks submission(s) still need approval before reports are official.`);
  }
  if (!insights.length) insights.push("Approved marks show stable performance with no immediate high-risk pattern.");
  return insights;
}

export async function getAiMarksInsights(userId: string, studentId: string, termId: string) {
  await assertCanViewStudent(userId, studentId);
  const reportData = await getStudentReportCard(studentId, termId);
  const { student, subjectRows, attendance, summary } = reportData;
  const subjectText = subjectRows.map((row) => `${row.subjectName}: ${row.percentage}% (${row.grade})`).join("\n");
  const deterministic = {
    performanceSummary: `${student.user.name} has an approved term average of ${summary.averagePercentage || 0}%.`,
    weakAreaDetection: subjectRows.length ? `Lowest subject: ${[...subjectRows].sort((a, b) => a.percentage - b.percentage)[0]?.subjectName || "None"}.` : "No approved marks are available.",
    remedialActions: subjectRows.filter((row) => row.percentage < 50).map((row) => `Provide targeted remedial support in ${row.subjectName}.`),
    parentExplanation: `The report is based only on approved and locked marks for ${student.user.name}.`,
    attendancePerformanceRelation: attendance.attendanceRate !== null && attendance.attendanceRate < 75
      ? "Attendance below 75% may be affecting academic performance."
      : "Attendance does not currently show a major risk pattern.",
    aiGenerated: false
  };

  const promptText = `
Student Name: ${student.user.name}
Gender: ${student.gender || "Not recorded"}
Class: ${student.class?.name || "Unassigned"}

Approved Marks This Term:
${subjectText || "No approved marks available."}

Attendance:
Present: ${attendance.presentDays}/${attendance.totalDays}
Attendance Rate: ${attendance.attendanceRate ?? "No attendance data"}%

Average: ${summary.averagePercentage || 0}%
Grade: ${summary.grade || "N/A"}
Class Rank: ${summary.classRank || "N/A"}
`;

  const formatSchema = {
    type: "json_schema",
    name: "kuralearn_marks_insights",
    strict: true,
    schema: {
      type: "object",
      properties: {
        performanceSummary: { type: "string" },
        weakAreaDetection: { type: "string" },
        remedialActions: { type: "array", items: { type: "string" } },
        parentExplanation: { type: "string" },
        attendancePerformanceRelation: { type: "string" }
      },
      required: ["performanceSummary", "weakAreaDetection", "remedialActions", "parentExplanation", "attendancePerformanceRelation"],
      additionalProperties: false
    },
  };

  try {
    const aiResult = await callRequiredOpenAIJson<any>({
      userId,
      feature: "marks-insights",
      prompt: promptText,
      format: formatSchema,
      instructions: "Analyze only the supplied real approved marks and attendance. Do not invent missing data. Return concise, parent-friendly academic insights."
    });
    const persisted = { ...aiResult, aiGenerated: true, generatedAt: new Date().toISOString() };
    await prisma.reportCard.update({
      where: { id: summary.id },
      data: { aiInsights: persisted }
    });
    return persisted;
  } catch {
    await prisma.reportCard.update({
      where: { id: summary.id },
      data: { aiInsights: { ...deterministic, generatedAt: new Date().toISOString() } }
    });
    return deterministic;
  }
}

export async function getAiReportCardComment(userId: string, studentId: string, termId: string) {
  const insights = await getAiMarksInsights(userId, studentId, termId);
  return {
    comment: insights.performanceSummary,
    aiGenerated: insights.aiGenerated === true
  };
}
