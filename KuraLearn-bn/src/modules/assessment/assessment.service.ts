import { assertCanViewStudent, getActor, resolveActorSchoolId } from "../../middleware/access.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import { Prisma, RecordStatus, UserRole } from "@prisma/client";
import type { AssessmentType, AssessmentVisibility, QuestionType } from "@prisma/client";

type AssessmentAction = "VIEW" | "EDIT" | "DELETE";
type AssessmentStatusFilter = AssessmentVisibility | "SCHEDULED";
type AssessmentTypeFilter = AssessmentType | "TEST" | "CAT" | "PRACTICE_ASSESSMENT";

const ADMIN_ROLES = new Set<UserRole>([UserRole.HEAD_TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN]);
const STUDENT_VISIBLE_SUBMISSION_STATUSES = ["SUBMITTED", "LATE", "MARKED", "RETURNED"] as const;

async function getAssessmentAccessContext(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(401, "User not found", "USER_NOT_FOUND");

  const [teacher, student] = await Promise.all([
    prisma.teacher.findUnique({ where: { userId } }),
    prisma.student.findUnique({ where: { userId } }),
  ]);

  return { user, teacher, student };
}

function isAdminRole(role: UserRole) {
  return ADMIN_ROLES.has(role);
}

function displayStatus(assessment: { visibility: AssessmentVisibility; startDate: Date | null }) {
  return assessment.visibility === "PUBLISHED" &&
    assessment.startDate !== null &&
    assessment.startDate > new Date()
    ? "SCHEDULED"
    : assessment.visibility;
}

function buildStatusWhere(status?: AssessmentStatusFilter): Prisma.AssessmentWhereInput | undefined {
  if (!status) return undefined;
  if (status === "SCHEDULED") {
    return { visibility: "PUBLISHED", startDate: { gt: new Date() } };
  }
  if (status === "PUBLISHED") {
    return {
      visibility: "PUBLISHED",
      OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
    };
  }
  return { visibility: status };
}

function buildSearchWhere(search?: string): Prisma.AssessmentWhereInput | undefined {
  const query = search?.trim();
  if (!query) return undefined;

  const textFilter = { contains: query, mode: "insensitive" as const };
  return {
    OR: [
      { title: textFilter },
      { description: textFilter },
      { instructions: textFilter },
      { course: { title: textFilter } },
      { course: { subject: { name: textFilter } } },
      { subject: { name: textFilter } },
      { class: { name: textFilter } },
      { teacher: { user: { name: textFilter } } },
      { teacher: { user: { email: textFilter } } },
      { unit: { title: textFilter } },
      { unit: { keyCompetence: textFilter } },
      { lesson: { title: textFilter } },
      { lesson: { topic: textFilter } },
      { lesson: { learningObjectives: textFilter } },
      { lesson: { assessmentCriteria: textFilter } },
      { questions: { some: { questionText: textFilter, status: { not: "DELETED" } } } },
      { questions: { some: { explanation: textFilter, status: { not: "DELETED" } } } },
    ],
  };
}

async function assignedAssessmentWhereForTeacher(teacherId: string): Promise<Prisma.AssessmentWhereInput[]> {
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: { teacherId, status: RecordStatus.ACTIVE },
    select: { classId: true, subjectName: true },
  });
  return assignments.map((assignment) => ({
    classId: assignment.classId,
    OR: [
      { subject: { name: assignment.subjectName } },
      { course: { subject: { name: assignment.subjectName } } },
    ],
  }));
}

async function teacherCanAccessAssessment(
  teacherId: string,
  assessment: {
    teacherId: string;
    classId: string | null;
    subject?: { name: string } | null;
    course?: { subject?: { name: string } | null } | null;
  },
) {
  if (assessment.teacherId === teacherId) return true;
  if (!assessment.classId) return false;
  const assignment = await prisma.teacherClassAssignment.findFirst({
    where: {
      teacherId,
      status: RecordStatus.ACTIVE,
      classId: assessment.classId,
      ...(assessment.subject?.name || assessment.course?.subject?.name
        ? {
            OR: [
              ...(assessment.subject?.name ? [{ subjectName: assessment.subject.name }] : []),
              ...(assessment.course?.subject?.name ? [{ subjectName: assessment.course.subject.name }] : []),
            ],
          }
        : {}),
    },
  });
  return Boolean(assignment);
}

async function studentCanAccessAssessment(
  student: { id: string; schoolId: string | null; classId: string | null },
  assessment: {
    schoolId: string;
    courseId: string;
    classId: string | null;
    visibility: AssessmentVisibility;
  },
) {
  if (assessment.visibility !== "PUBLISHED") return false;
  if (student.schoolId && assessment.schoolId !== student.schoolId) return false;
  if (assessment.classId) return assessment.classId === student.classId;

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId: assessment.courseId, studentId: student.id } },
    select: { id: true },
  });
  return Boolean(enrollment);
}

async function buildRoleVisibilityWhere(
  userId: string,
): Promise<{
  where: Prisma.AssessmentWhereInput;
  context: Awaited<ReturnType<typeof getAssessmentAccessContext>>;
}> {
  const context = await getAssessmentAccessContext(userId);
  const { user, teacher, student } = context;

  if (user.role === UserRole.SUPER_ADMIN) return { where: {}, context };

  if (user.role === UserRole.STUDENT) {
    if (!student) throw new AppError(403, "Student profile not found", "STUDENT_NOT_FOUND");
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: student.id },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((enrollment) => enrollment.courseId);
    const assignedClauses: Prisma.AssessmentWhereInput[] = [];
    if (student.classId) assignedClauses.push({ classId: student.classId });
    if (courseIds.length) assignedClauses.push({ classId: null, courseId: { in: courseIds } });

    return {
      context,
      where: {
        ...(student.schoolId && { schoolId: student.schoolId }),
        visibility: "PUBLISHED",
        OR: assignedClauses.length ? assignedClauses : [{ id: "__no_assigned_assessments__" }],
      },
    };
  }

  // School office staff may have no teacher profile, so scope them by the school they belong to.
  if (isAdminRole(user.role) || user.role === UserRole.DIRECTOR_OF_STUDIES) {
    return { context, where: { schoolId: await resolveActorSchoolId(user.id) } };
  }

  if (user.role === UserRole.TEACHER) {
    if (!teacher) throw new AppError(403, "Teacher profile not found", "TEACHER_NOT_FOUND");
    const assignedClauses = await assignedAssessmentWhereForTeacher(teacher.id);
    return {
      context,
      where: {
        ...(teacher.schoolId && { schoolId: teacher.schoolId }),
        OR: [{ teacherId: teacher.id }, ...assignedClauses],
      },
    };
  }

  throw new AppError(403, "You do not have access to assessments", "FORBIDDEN");
}

async function checkAssessmentAccess(assessmentId: string, userId: string, action: AssessmentAction) {
  const context = await getAssessmentAccessContext(userId);
  const { user, teacher, student } = context;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      subject: { select: { id: true, name: true } },
      course: { select: { id: true, subject: { select: { id: true, name: true } } } },
    },
  });
  if (!assessment) throw new AppError(404, "Assessment not found", "ASSESSMENT_NOT_FOUND");

  if (user.role === UserRole.STUDENT) {
    if (action !== "VIEW") throw new AppError(403, "Forbidden", "FORBIDDEN");
    if (!student || !(await studentCanAccessAssessment(student, assessment))) {
      throw new AppError(403, "Assessment not available", "FORBIDDEN");
    }
    return { ...context, assessment };
  }

  if (user.role === UserRole.SUPER_ADMIN) return { ...context, assessment };

  if (isAdminRole(user.role)) {
    const actor = await getActor(userId);
    if (actor.schoolId === assessment.schoolId) return { ...context, assessment };
  }

  if (teacher && (await teacherCanAccessAssessment(teacher.id, assessment))) {
    return { ...context, assessment };
  }

  throw new AppError(403, "Access denied to this assessment", "FORBIDDEN");
}

async function getTeacherOrThrow(userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    // Check if user is an admin - they might not have a teacher record but still have "teacher-like" privileges
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") return { id: "admin-bypass", schoolId: null } as any;
    throw new AppError(403, "Teacher profile not found", "TEACHER_NOT_FOUND");
  }
  return teacher;
}

async function getStudentOrThrow(userId: string) {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw new AppError(403, "Student profile not found", "STUDENT_NOT_FOUND");
  return student;
}

// ─── Assessment CRUD ─────────────────────────────────────────────────

export interface CreateAssessmentInput {
  courseId: string;
  unitId?: string;
  lessonId?: string;
  subjectId?: string;
  classId?: string;
  title: string;
  description?: string;
  type: AssessmentTypeFilter;
  totalMarks?: number;
  passMark?: number;
  passingScore?: number;
  dueDate?: string;
  startDate?: string;
  durationMinutes?: number;
  instructions?: string;
  rubric?: Record<string, unknown>;
  attachments?: string[];
  attemptsAllowed?: number;
  randomizeQuestions?: boolean;
  showResults?: boolean;
  allowLateSubmission?: boolean;
  aiGenerated?: boolean;
}

const assessmentIncludes = {
  course: { select: { id: true, title: true, subject: { select: { id: true, name: true } } } },
  subject: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  teacher: { include: { user: { select: { id: true, name: true } } } },
  lesson: { select: { id: true, title: true } },
  unit: { select: { id: true, title: true } },
  questions: { 
    where: { status: { not: "DELETED" } },
    orderBy: { orderIndex: "asc" as const } 
  },
  _count: { select: { submissions: true, questions: true } },
} as const;

async function decorateAssessments(
  assessments: any[],
  context: Awaited<ReturnType<typeof getAssessmentAccessContext>>,
) {
  if (!assessments.length) return assessments;

  const assessmentIds = assessments.map((assessment) => assessment.id);
  const courseIds = [...new Set(assessments.map((assessment) => assessment.courseId).filter(Boolean))];
  const classIds = [...new Set(assessments.map((assessment) => assessment.classId).filter(Boolean))];

  const [submissionGroups, scoreGroups, courseEnrollmentGroups, classStudentGroups, assignedClauses] =
    await Promise.all([
      prisma.assessmentSubmission.groupBy({
        by: ["assessmentId", "status"],
        where: { assessmentId: { in: assessmentIds } },
        _count: { _all: true },
      }),
      prisma.assessmentSubmission.groupBy({
        by: ["assessmentId"],
        where: { assessmentId: { in: assessmentIds }, score: { not: null } },
        _avg: { score: true },
      }),
      courseIds.length
        ? prisma.courseEnrollment.groupBy({
            by: ["courseId"],
            where: { courseId: { in: courseIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      classIds.length
        ? prisma.student.groupBy({
            by: ["classId"],
            where: { classId: { in: classIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      context.teacher ? assignedAssessmentWhereForTeacher(context.teacher.id) : Promise.resolve([]),
    ]);

  const scoreByAssessment = new Map(scoreGroups.map((group) => [group.assessmentId, group._avg.score ?? null]));
  const courseEnrollmentCount = new Map(courseEnrollmentGroups.map((group) => [group.courseId, group._count._all]));
  const classStudentCount = new Map(
    classStudentGroups
      .filter((group) => group.classId)
      .map((group) => [group.classId as string, group._count._all]),
  );

  const submissionStats = new Map<string, Record<string, number>>();
  for (const group of submissionGroups) {
    const current = submissionStats.get(group.assessmentId) ?? {};
    current[group.status] = group._count._all;
    submissionStats.set(group.assessmentId, current);
  }

  const assignedClassIds = new Set(
    assignedClauses
      .map((clause) => (clause.classId as Prisma.StringFilter | string | undefined))
      .flatMap((classFilter) => {
        if (!classFilter) return [];
        if (typeof classFilter === "string") return [classFilter];
        return Array.isArray(classFilter.in) ? classFilter.in.filter((id): id is string => typeof id === "string") : [];
      }),
  );

  return assessments.map((assessment) => {
    const perStatus = submissionStats.get(assessment.id) ?? {};
    const submitted = STUDENT_VISIBLE_SUBMISSION_STATUSES.reduce(
      (sum, status) => sum + (perStatus[status] ?? 0),
      0,
    );
    const assignedStudents = assessment.classId
      ? classStudentCount.get(assessment.classId) ?? 0
      : courseEnrollmentCount.get(assessment.courseId) ?? 0;
    const averageScore = scoreByAssessment.get(assessment.id);
    const isAdmin = isAdminRole(context.user.role);
    const isOwner = Boolean(context.teacher && assessment.teacherId === context.teacher.id);
    const isAssignedTeacher = Boolean(
      context.teacher &&
        (isOwner || (assessment.classId ? assignedClassIds.has(assessment.classId) : false)),
    );
    const canManage = context.user.role === UserRole.SUPER_ADMIN || isAdmin || isOwner || isAssignedTeacher;

    return {
      ...assessment,
      status: displayStatus(assessment),
      submissionStats: {
        assignedStudents,
        totalAttempts: Object.values(perStatus).reduce((sum, count) => sum + count, 0),
        submitted,
        inProgress: perStatus.IN_PROGRESS ?? 0,
        marked: (perStatus.MARKED ?? 0) + (perStatus.RETURNED ?? 0),
        averageScore: averageScore == null ? null : Math.round(averageScore * 10) / 10,
      },
      permissions: {
        canView: true,
        canEdit: canManage,
        canDelete: canManage,
        canPublish: canManage && assessment.visibility === "DRAFT",
      },
    };
  });
}

export async function listAssessments(filters: {
  courseId?: string;
  lessonId?: string;
  teacherId?: string;
  visibility?: AssessmentVisibility;
  status?: AssessmentStatusFilter;
  type?: AssessmentTypeFilter;
  schoolId?: string;
  subjectId?: string;
  classId?: string;
  search?: string;
  page?: number;
  limit?: number;
}, userId: string) {
  const { where: roleWhere, context } = await buildRoleVisibilityWhere(userId);
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;
  const status = filters.status ?? filters.visibility;

  const filterWhere: Prisma.AssessmentWhereInput = {
    ...(filters.courseId && { courseId: filters.courseId }),
    ...(filters.lessonId && { lessonId: filters.lessonId }),
    ...(filters.teacherId && { teacherId: filters.teacherId }),
    ...(filters.type && { type: filters.type as any }),
    ...(filters.schoolId && context.user.role === UserRole.SUPER_ADMIN && { schoolId: filters.schoolId }),
    ...(filters.classId && { classId: filters.classId }),
  };
  const subjectWhere: Prisma.AssessmentWhereInput | undefined = filters.subjectId
    ? { OR: [{ subjectId: filters.subjectId }, { course: { subjectId: filters.subjectId } }] }
    : undefined;

  const where: Prisma.AssessmentWhereInput = {
    AND: [
      roleWhere,
      filterWhere,
      ...(subjectWhere ? [subjectWhere] : []),
      ...(status ? ([buildStatusWhere(status)].filter(Boolean) as Prisma.AssessmentWhereInput[]) : []),
      ...(filters.search ? ([buildSearchWhere(filters.search)].filter(Boolean) as Prisma.AssessmentWhereInput[]) : []),
    ],
  };

  const [assessments, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      include: assessmentIncludes,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.assessment.count({ where }),
  ]);

  return { assessments: await decorateAssessments(assessments, context), total };
}

function sanitizeAssessmentQuestionsForStudent<T extends { questions?: any[] }>(assessment: T, revealAnswers = false): T {
  return {
    ...assessment,
    questions: assessment.questions?.map((question) => ({
      ...question,
      correctAnswer: revealAnswers ? question.correctAnswer : null,
      explanation: revealAnswers ? question.explanation : null,
    })),
  };
}

export async function getAssessmentById(assessmentId: string, userId: string) {
  const access = await checkAssessmentAccess(assessmentId, userId, "VIEW");
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      ...assessmentIncludes,
      submissions: {
        select: {
          id: true,
          studentId: true,
          status: true,
          score: true,
          submittedAt: true,
          markedAt: true,
          student: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
      questions: {
        where: { status: { not: "DELETED" } },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
  if (!assessment) throw new AppError(404, "Assessment not found", "ASSESSMENT_NOT_FOUND");
  const [decorated] = await decorateAssessments([assessment], access);

  if (access.user.role === UserRole.STUDENT && access.student) {
    const mySubmission = assessment.submissions.find((submission) => submission.studentId === access.student!.id) ?? null;
    const revealAnswers = Boolean(
      assessment.showResults &&
        mySubmission &&
        (mySubmission.status === "MARKED" || mySubmission.status === "RETURNED"),
    );
    return sanitizeAssessmentQuestionsForStudent(
      {
        ...decorated,
        submissions: mySubmission ? [mySubmission] : [],
        mySubmission,
      },
      revealAnswers,
    );
  }

  return decorated;
}

export async function createAssessment(input: CreateAssessmentInput, userId: string) {
  const teacher = await getTeacherOrThrow(userId);

  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) throw new AppError(404, "Course not found", "COURSE_NOT_FOUND");

  const schoolId = teacher.schoolId ?? course.schoolId;
  if (!schoolId) throw new AppError(400, "School ID is required", "SCHOOL_ID_REQUIRED");

  return prisma.assessment.create({
    data: {
      schoolId,
      courseId: input.courseId,
      unitId: input.unitId ?? null,
      lessonId: input.lessonId ?? null,
      subjectId: input.subjectId ?? course.subjectId,
      classId: input.classId ?? null,
      teacherId: teacher.id,
      title: input.title,
      description: input.description,
      type: input.type as any,
      totalMarks: input.totalMarks ?? 100,
      passMark: input.passMark ?? 50,
      passingScore: input.passingScore ?? input.passMark ?? 50,
      attemptsAllowed: input.attemptsAllowed ?? 1,
      randomizeQuestions: input.randomizeQuestions ?? false,
      showResults: input.showResults ?? true,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      durationMinutes: input.durationMinutes,
      instructions: input.instructions,
      rubric: input.rubric as any,
      attachments: input.attachments ?? [],
      allowLateSubmission: input.allowLateSubmission ?? false,
      aiGenerated: input.aiGenerated ?? false,
      visibility: "DRAFT",
    },
    include: assessmentIncludes,
  });
}

export async function updateAssessment(
  assessmentId: string,
  input: Partial<CreateAssessmentInput>,
  userId: string
) {
  const { teacher, assessment } = await checkAssessmentAccess(assessmentId, userId, "EDIT");

  return prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.type && { type: input.type as any }),
      ...(input.totalMarks !== undefined && { totalMarks: input.totalMarks }),
      ...(input.passMark !== undefined && { passMark: input.passMark }),
      ...(input.passingScore !== undefined && { passingScore: input.passingScore }),
      ...(input.attemptsAllowed !== undefined && { attemptsAllowed: input.attemptsAllowed }),
      ...(input.randomizeQuestions !== undefined && { randomizeQuestions: input.randomizeQuestions }),
      ...(input.showResults !== undefined && { showResults: input.showResults }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate ? new Date(input.dueDate) : null }),
      ...(input.startDate !== undefined && { startDate: input.startDate ? new Date(input.startDate) : null }),
      ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
      ...(input.instructions !== undefined && { instructions: input.instructions }),
      ...(input.rubric !== undefined && { rubric: input.rubric as any }),
      ...(input.attachments !== undefined && { attachments: input.attachments }),
      ...(input.allowLateSubmission !== undefined && { allowLateSubmission: input.allowLateSubmission }),
      ...(input.unitId !== undefined && { unitId: input.unitId }),
      ...(input.lessonId !== undefined && { lessonId: input.lessonId }),
      ...(input.subjectId !== undefined && { subjectId: input.subjectId }),
      ...(input.classId !== undefined && { classId: input.classId }),
    },
    include: assessmentIncludes,
  });
}

export async function deleteAssessment(assessmentId: string, userId: string) {
  const { assessment } = await checkAssessmentAccess(assessmentId, userId, "DELETE");
  return prisma.assessment.delete({ where: { id: assessmentId } });
}

export async function publishAssessment(assessmentId: string, userId: string) {
  const { assessment } = await checkAssessmentAccess(assessmentId, userId, "EDIT");
  return prisma.assessment.update({
    where: { id: assessmentId },
    data: { visibility: "PUBLISHED" },
    include: assessmentIncludes,
  });
}

export async function closeAssessment(assessmentId: string, userId: string) {
  const { assessment } = await checkAssessmentAccess(assessmentId, userId, "EDIT");
  return prisma.assessment.update({
    where: { id: assessmentId },
    data: { visibility: "CLOSED" },
    include: assessmentIncludes,
  });
}

// ─── Question Management ──────────────────────────────────────────────

export interface UpsertQuestionInput {
  questionText: string;
  type: QuestionType;
  options?: unknown;
  correctAnswer?: unknown;
  marks?: number;
  explanation?: string;
  orderIndex?: number;
}

export async function addQuestions(
  assessmentId: string,
  questions: UpsertQuestionInput[],
  userId: string
) {
  const { assessment } = await checkAssessmentAccess(assessmentId, userId, "EDIT");

  const created = await prisma.$transaction(
    questions.map((q, idx) => {
      let finalCorrect = q.correctAnswer;
      let finalOptions = q.options;

      // Try parsing JSON strings for complex types (often from AI)
      if (typeof q.correctAnswer === "string" && (q.correctAnswer.startsWith("{") || q.correctAnswer.startsWith("["))) {
        try { finalCorrect = JSON.parse(q.correctAnswer); } catch (e) { /* fallback to string */ }
      }
      if (typeof q.options === "string" && (q.options.startsWith("{") || q.options.startsWith("["))) {
        try { finalOptions = JSON.parse(q.options); } catch (e) { /* fallback to string */ }
      }

      return prisma.assessmentQuestion.create({
        data: {
          assessmentId,
          questionText: q.questionText,
          type: q.type,
          options: finalOptions as any,
          correctAnswer: finalCorrect as any,
          marks: q.marks ?? 1,
          explanation: q.explanation,
          orderIndex: q.orderIndex ?? idx,
        },
      });
    })
  );
  return created;
}

export async function updateQuestion(
  questionId: string,
  input: Partial<UpsertQuestionInput>,
  userId: string
) {
  const question = await prisma.assessmentQuestion.findUnique({
    where: { id: questionId },
    include: { assessment: true },
  });
  if (!question) throw new AppError(404, "Question not found", "QUESTION_NOT_FOUND");
  
  await checkAssessmentAccess(question.assessmentId, userId, "EDIT");

  return prisma.assessmentQuestion.update({
    where: { id: questionId },
    data: {
      ...(input.questionText && { questionText: input.questionText }),
      ...(input.type && { type: input.type }),
      ...(input.options !== undefined && { options: input.options as any }),
      ...(input.correctAnswer !== undefined && { correctAnswer: input.correctAnswer as any }),
      ...(input.marks !== undefined && { marks: input.marks }),
      ...(input.explanation !== undefined && { explanation: input.explanation }),
      ...(input.orderIndex !== undefined && { orderIndex: input.orderIndex }),
    },
  });
}

export async function deleteQuestion(questionId: string, userId: string) {
  const question = await prisma.assessmentQuestion.findUnique({
    where: { id: questionId },
    include: { assessment: { include: { _count: { select: { submissions: true } } } } },
  });
  if (!question) throw new AppError(404, "Question not found", "QUESTION_NOT_FOUND");
  
  await checkAssessmentAccess(question.assessmentId, userId, "EDIT");

  // Soft delete if submissions exist
  if (question.assessment._count.submissions > 0) {
    return prisma.assessmentQuestion.update({
      where: { id: questionId },
      data: { status: "DELETED" },
    });
  }

  return prisma.assessmentQuestion.delete({ where: { id: questionId } });
}

// ─── Submission Workflow (Student) ────────────────────────────────────

export async function startSubmission(assessmentId: string, userId: string) {
  const student = await getStudentOrThrow(userId);

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) throw new AppError(404, "Assessment not found", "ASSESSMENT_NOT_FOUND");
  if (!(await studentCanAccessAssessment(student, assessment))) {
    throw new AppError(403, "This assessment is not assigned to you", "ASSESSMENT_NOT_ASSIGNED");
  }
  if (assessment.visibility !== "PUBLISHED") {
    throw new AppError(403, "This assessment is not currently available", "ASSESSMENT_NOT_PUBLISHED");
  }
  const now = new Date();
  if (assessment.startDate && assessment.startDate > now) {
    throw new AppError(403, "This assessment has not started yet", "ASSESSMENT_NOT_STARTED");
  }
  if (assessment.dueDate && assessment.dueDate < now && !assessment.allowLateSubmission) {
    throw new AppError(403, "The deadline has passed and late submissions are not allowed", "LATE_SUBMISSION_NOT_ALLOWED");
  }

  const existing = await prisma.assessmentSubmission.findUnique({
    where: { assessmentId_studentId: { assessmentId, studentId: student.id } },
  });
  if (existing) {
    if (existing.status === "SUBMITTED" || existing.status === "MARKED" || existing.status === "RETURNED") {
      throw new AppError(409, "You have already submitted this assessment", "ALREADY_SUBMITTED");
    }
    return existing;
  }

  return prisma.assessmentSubmission.create({
    data: {
      assessmentId,
      studentId: student.id,
      status: "IN_PROGRESS",
    },
  });
}

export async function saveDraftSubmission(
  submissionId: string,
  answers: unknown,
  userId: string
) {
  const student = await getStudentOrThrow(userId);
  const submission = await prisma.assessmentSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new AppError(404, "Submission not found", "SUBMISSION_NOT_FOUND");
  if (submission.studentId !== student.id) throw new AppError(403, "Forbidden", "FORBIDDEN");
  if (submission.status === "SUBMITTED" || submission.status === "MARKED") {
    throw new AppError(409, "Cannot update a submitted or marked submission", "ALREADY_SUBMITTED");
  }

  return prisma.assessmentSubmission.update({
    where: { id: submissionId },
    data: { answers: answers as any, status: "IN_PROGRESS" },
  });
}

export async function submitSubmission(
  submissionId: string,
  data: { answers?: unknown; uploadedFiles?: string[] },
  userId: string
) {
  const student = await getStudentOrThrow(userId);
  const submission = await prisma.assessmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assessment: {
        include: {
          questions: {
            where: { status: { not: "DELETED" } }
          }
        }
      }
    },
  });
  if (!submission) throw new AppError(404, "Submission not found", "SUBMISSION_NOT_FOUND");
  if (submission.studentId !== student.id) throw new AppError(403, "Forbidden", "FORBIDDEN");
  if (submission.status === "SUBMITTED" || submission.status === "MARKED") {
    throw new AppError(409, "Already submitted", "ALREADY_SUBMITTED");
  }

  const now = new Date();
  const isLate =
    submission.assessment.dueDate !== null &&
    now > submission.assessment.dueDate &&
    !submission.assessment.allowLateSubmission;

  if (isLate) {
    throw new AppError(403, "The deadline has passed and late submissions are not allowed", "LATE_SUBMISSION_NOT_ALLOWED");
  }

  const answers = data.answers as Record<string, any> ?? submission.answers ?? {};
  const questions = submission.assessment.questions;
  
  // Auto-marking logic
  let autoScore = 0;
  let allObjectiveMarked = true;
  
  questions.forEach((q) => {
    const studentAnswer = answers[q.id];
    if (["MULTIPLE_CHOICE", "TRUE_FALSE", "MATCHING", "ORDERING"].includes(q.type)) {
      const isCorrect = JSON.stringify(studentAnswer) === JSON.stringify(q.correctAnswer);
      if (isCorrect) autoScore += q.marks;
    } else {
      allObjectiveMarked = false;
    }
  });

  const duePassed = submission.assessment.dueDate && now > submission.assessment.dueDate;
  const finalStatus = duePassed ? "LATE" : (allObjectiveMarked ? "MARKED" : "SUBMITTED");

  return prisma.assessmentSubmission.update({
    where: { id: submissionId },
    data: {
      answers: answers as any,
      uploadedFiles: data.uploadedFiles ?? submission.uploadedFiles,
      status: finalStatus,
      submittedAt: now,
      score: allObjectiveMarked ? autoScore : null,
      markedAt: allObjectiveMarked ? now : null,
      markedBy: allObjectiveMarked ? "SYSTEM" : null,
    },
  });
}

// ─── Marking (Teacher) ────────────────────────────────────────────────

export async function markSubmission(
  submissionId: string,
  data: {
    score?: number;
    feedback?: string;
    aiAssisted?: boolean;
    rubricScores?: Record<string, unknown>;
    strengths?: string[];
    improvements?: string[];
    nextSteps?: string;
    questionMarking?: Record<string, { marks: number; feedback?: string }>;
  },
  userId: string
) {
  const submission = await prisma.assessmentSubmission.findUnique({
    where: { id: submissionId },
    include: { assessment: { include: { questions: true } } },
  });
  if (!submission) throw new AppError(404, "Submission not found", "SUBMISSION_NOT_FOUND");
  
  const { teacher } = await checkAssessmentAccess(submission.assessmentId, userId, "EDIT");
  if (!teacher) throw new AppError(403, "Teacher profile required to mark submissions", "TEACHER_NOT_FOUND");

  // Calculate score from questionMarking if provided
  let finalScore = data.score ?? submission.score ?? 0;
  if (data.questionMarking) {
    finalScore = Object.values(data.questionMarking).reduce((sum, q) => sum + (q.marks || 0), 0);
  }

  const [updatedSubmission] = await prisma.$transaction([
    prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: finalScore,
        feedback: data.feedback,
        markedBy: teacher.id,
        markedAt: new Date(),
        status: "MARKED",
        aiAssisted: data.aiAssisted ?? false,
        questionMarking: data.questionMarking as any,
      },
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        assessment: { select: { id: true, title: true, totalMarks: true } },
      },
    }),
    ...(data.feedback || data.strengths?.length || data.improvements?.length || data.nextSteps
      ? [
          prisma.submissionFeedback.create({
            data: {
              submissionId,
              teacherId: teacher.id,
              comment: data.feedback,
              rubricScores: data.rubricScores as any,
              strengths: data.strengths ?? [],
              improvements: data.improvements ?? [],
              nextSteps: data.nextSteps,
            },
          }),
        ]
      : []),
  ]);

  return updatedSubmission;
}

export async function returnSubmission(submissionId: string, userId: string) {
  const submission = await prisma.assessmentSubmission.findUnique({
    where: { id: submissionId },
    include: { assessment: true },
  });
  if (!submission) throw new AppError(404, "Submission not found", "SUBMISSION_NOT_FOUND");
  
  await checkAssessmentAccess(submission.assessmentId, userId, "EDIT");
  if (submission.status !== "MARKED") {
    throw new AppError(400, "Submission must be marked before returning", "NOT_MARKED");
  }
  return prisma.assessmentSubmission.update({
    where: { id: submissionId },
    data: { status: "RETURNED" },
  });
}

// ─── Student Assessment Views ─────────────────────────────────────────

export async function getStudentAssessments(userId: string) {
  const { where, context } = await buildRoleVisibilityWhere(userId);
  if (!context.student) throw new AppError(403, "Student profile not found", "STUDENT_NOT_FOUND");

  const assessments = await prisma.assessment.findMany({
    where,
    include: {
      ...assessmentIncludes,
      submissions: {
        where: { studentId: context.student.id },
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true,
          markedAt: true,
          feedback: true,
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const decorated = await decorateAssessments(assessments, context);
  return decorated.map((assessment: any) => {
    const mySubmission = assessment.submissions[0] ?? null;
    const revealAnswers = Boolean(
      assessment.showResults &&
        mySubmission &&
        (mySubmission.status === "MARKED" || mySubmission.status === "RETURNED"),
    );
    return sanitizeAssessmentQuestionsForStudent(
      {
        ...assessment,
        submissions: undefined,
        mySubmission,
      },
      revealAnswers,
    );
  });
}

export async function getStudentSubmissions(userId: string) {
  const student = await getStudentOrThrow(userId);
  return prisma.assessmentSubmission.findMany({
    where: { studentId: student.id },
    include: {
      assessment: {
        include: {
          course: { select: { id: true, title: true } },
          teacher: { include: { user: { select: { id: true, name: true } } } },
        },
      },
      teacherFeedback: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSubmissionById(submissionId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found", "USER_NOT_FOUND");

  const submission = await prisma.assessmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assessment: {
        include: {
          questions: { orderBy: { orderIndex: "asc" } },
          teacher: { include: { user: { select: { id: true, name: true } } } },
          course: { select: { id: true, title: true } },
        },
      },
      student: { include: { user: { select: { id: true, name: true } } } },
      teacherFeedback: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!submission) throw new AppError(404, "Submission not found", "SUBMISSION_NOT_FOUND");

  // Access control
  const isStudent = user.role === "STUDENT";
  if (isStudent) {
    const student = await getStudentOrThrow(userId);
    if (submission.studentId !== student.id) throw new AppError(403, "Forbidden", "FORBIDDEN");
    // Strip correct answers if not yet returned/marked
    if (!submission.assessment.showResults || (submission.status !== "MARKED" && submission.status !== "RETURNED")) {
      const safeSubmission = {
        ...submission,
        assessment: {
          ...submission.assessment,
          questions: submission.assessment.questions.map((q) => ({
            ...q,
            correctAnswer: null,
          })),
        },
      };
      return safeSubmission;
    }
  } else {
    await assertCanViewStudent(userId, submission.studentId);
  }

  return submission;
}

// ─── Teacher Submission Management ───────────────────────────────────

export async function getAssessmentSubmissions(assessmentId: string, userId: string) {
  const { assessment } = await checkAssessmentAccess(assessmentId, userId, "VIEW");

  return prisma.assessmentSubmission.findMany({
    where: { assessmentId },
    include: {
      student: { include: { user: { select: { id: true, name: true, email: true } } } },
      teacherFeedback: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Analytics ────────────────────────────────────────────────────────

export async function getAssessmentAnalytics(assessmentId: string, userId: string) {
  const { assessment } = await checkAssessmentAccess(assessmentId, userId, "VIEW");

  const submissions = await prisma.assessmentSubmission.findMany({
    where: { assessmentId: assessment.id },
    include: {
      student: {
        select: {
          gender: true,
          hasDisability: true,
        }
      }
    }
  });
  
  const submitted = submissions.filter((s) =>
    ["SUBMITTED", "LATE", "MARKED", "RETURNED"].includes(s.status)
  );
  const marked = submissions.filter((s) => s.status === "MARKED" || s.status === "RETURNED");
  const scores = marked.map((s) => s.score ?? 0);

  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const highestScore = scores.length ? Math.max(...scores) : 0;
  const lowestScore = scores.length ? Math.min(...scores) : 0;
  const passCount = scores.filter((s) => s >= assessment.passMark).length;

  // Score Distribution
  const distribution = [
    { range: "0-20", count: 0 },
    { range: "21-40", count: 0 },
    { range: "41-60", count: 0 },
    { range: "61-80", count: 0 },
    { range: "81-100", count: 0 },
  ];

  scores.forEach(s => {
    const percentage = (s / assessment.totalMarks) * 100;
    if (percentage <= 20) distribution[0]!.count++;
    else if (percentage <= 40) distribution[1]!.count++;
    else if (percentage <= 60) distribution[2]!.count++;
    else if (percentage <= 80) distribution[3]!.count++;
    else distribution[4]!.count++;
  });

  // Performance by Question
  const questions = await prisma.assessmentQuestion.findMany({
    where: { assessmentId: assessment.id },
    orderBy: { orderIndex: "asc" }
  });

  const questionPerformance = questions.map(q => {
    let totalQScore = 0;
    let count = 0;
    marked.forEach(s => {
      const qMarking = (s.questionMarking as any)?.[q.id];
      if (qMarking) {
        totalQScore += qMarking.marks || 0;
        count++;
      }
    });
    return {
      questionId: q.id,
      text: q.questionText,
      avgScore: count ? totalQScore / count : 0,
      maxScore: q.marks,
      difficulty: q.difficulty || "medium"
    };
  });

  // Performance by Gender
  const genderStats = {
    MALE: { avg: 0, count: 0, passRate: 0 },
    FEMALE: { avg: 0, count: 0, passRate: 0 },
    OTHER: { avg: 0, count: 0, passRate: 0 },
  };

  marked.forEach(s => {
    const gender = s.student.gender || "OTHER";
    if (genderStats[gender as keyof typeof genderStats]) {
      const gs = genderStats[gender as keyof typeof genderStats];
      gs.avg += s.score ?? 0;
      gs.count++;
      if ((s.score ?? 0) >= assessment.passMark) gs.passRate++;
    }
  });

  Object.values(genderStats).forEach(gs => {
    if (gs.count) {
      gs.avg /= gs.count;
      gs.passRate = (gs.passRate / gs.count) * 100;
    }
  });

  // Performance by Disability
  const disabilityStats = {
    WITH_DISABILITY: { avg: 0, count: 0, passRate: 0 },
    WITHOUT_DISABILITY: { avg: 0, count: 0, passRate: 0 },
  };

  marked.forEach(s => {
    const key = s.student.hasDisability ? "WITH_DISABILITY" : "WITHOUT_DISABILITY";
    const ds = disabilityStats[key];
    ds.avg += s.score ?? 0;
    ds.count++;
    if ((s.score ?? 0) >= assessment.passMark) ds.passRate++;
  });

  Object.values(disabilityStats).forEach(ds => {
    if (ds.count) {
      ds.avg /= ds.count;
      ds.passRate = (ds.passRate / ds.count) * 100;
    }
  });

  // Get total enrolled students for this course
  const enrollmentCount = await prisma.courseEnrollment.count({
    where: { courseId: assessment.courseId },
  });

  return {
    totalEnrolled: enrollmentCount,
    totalSubmissions: submitted.length,
    markedCount: marked.length,
    submissionRate: enrollmentCount ? (submitted.length / enrollmentCount) * 100 : 0,
    averageScore: Math.round(avgScore * 10) / 10,
    highestScore,
    lowestScore,
    passRate: scores.length ? (passCount / scores.length) * 100 : 0,
    lateSubmissions: submissions.filter((s) => s.status === "LATE").length,
    statusBreakdown: {
      NOT_STARTED: submissions.filter((s) => s.status === "NOT_STARTED").length,
      IN_PROGRESS: submissions.filter((s) => s.status === "IN_PROGRESS").length,
      SUBMITTED: submissions.filter((s) => s.status === "SUBMITTED").length,
      LATE: submissions.filter((s) => s.status === "LATE").length,
      MARKED: submissions.filter((s) => s.status === "MARKED").length,
      RETURNED: submissions.filter((s) => s.status === "RETURNED").length,
    },
    distribution,
    questionPerformance,
    genderStats,
    disabilityStats,
  };
}
