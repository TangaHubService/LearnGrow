import type { Request, Response } from "express";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import { assertCanViewStudent, assertSchoolAccess, getActor, isStaffRole } from "../../middleware/access.js";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import {
  createCourseSchema,
  updateCourseSchema,
  createUnitSchema,
  updateUnitSchema,
  createLessonSchema,
  updateLessonSchema,
  enrollStudentSchema,
  listCoursesSchema,
} from "./course.schemas.js";
import {
  listCourses,
  getCourseById,
  getMyCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  archiveCourse,
  duplicateCourse,
  createUnit,
  updateUnit,
  deleteUnit,
  reorderUnits,
  createLesson,
  updateLesson,
  deleteLesson,
  publishLesson,
  unpublishLesson,
  reorderLessons,
  enrollStudent,
  assignCourse,
  getStudentCourses,
  getTeacherCourses,
  getSchoolCourses,
  getCourseAnalytics,
} from "./course.service.js";
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  listTeacherQuizzes,
  addQuizQuestions,
  submitQuizAttempt,
  listTeacherAssignments,
  updateLessonProgress,
} from "./learning-content.service.js";

/** Shared courses have no school. A school's own courses are only for that school's users. */
async function assertCourseSchoolAccess(userId: string, schoolId: string | null) {
  if (!schoolId) return;
  await assertSchoolAccess(userId, schoolId, { allowGuardians: true });
}

// ─── Course CRUD ────────────────────────────────────────────────

export async function listCoursesController(req: Request, res: Response) {
  const query = listCoursesSchema.parse(req.query);
  
  const user = getAuthenticatedUser(req);
  
  if (!user.roles.includes("SUPER_ADMIN")) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.sub } });
    if (teacher?.schoolId) {
      query.schoolId = teacher.schoolId;
      
      // Teachers (non-admins) see only their own courses
      if (user.roles.includes("TEACHER") && !user.roles.includes("ADMIN") && !user.roles.includes("HEAD_TEACHER")) {
        query.teacherId = teacher.id;
      }
    } else {
      const student = await prisma.student.findUnique({ where: { userId: user.sub } });
      if (student?.schoolId) {
        query.schoolId = student.schoolId;
        // Students see only published courses
        query.status = "PUBLISHED";
      }
    }
  }

  if (user.roles.includes("SUPER_ADMIN")) {
    if (!query.schoolId) {
      const firstSchool = await prisma.school.findFirst({ orderBy: { name: "asc" } });
      if (firstSchool) query.schoolId = firstSchool.id;
    }
  } else {
    // Everyone else is limited to their own school, whatever schoolId they ask for.
    const actor = await getActor(user.sub);
    const schoolId = actor.schoolId ?? [...actor.childSchoolIds][0];
    if (!schoolId) throw new AppError(403, "Your account is not linked to a school", "NO_SCHOOL");
    query.schoolId = schoolId;
    if (!isStaffRole(actor.role)) query.status = "PUBLISHED";
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  const { courses, total } = await listCourses({
    ...query,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  res.json({
    success: true,
    data: {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    },
  });
}

export async function getMyCoursesController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const courses = await getMyCourses(user.sub, user.roles);
  res.json({ courses });
}

export async function getCourseController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const course = await getCourseById(courseId);
  await assertCourseSchoolAccess(getAuthenticatedUser(req).sub, course.schoolId);
  res.json({ course });
}

export async function getCourseAnalyticsController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const { schoolId } = await getCourseById(courseId);
  await assertCourseSchoolAccess(getAuthenticatedUser(req).sub, schoolId);
  const analytics = await getCourseAnalytics(courseId);
  res.json({ analytics });
}

export async function createCourseController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const input = createCourseSchema.parse(req.body);
  const course = await createCourse(input, user.sub);
  res.status(201).json({ course });
}

export async function updateCourseController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const courseId = String(req.params.id);
  const input = updateCourseSchema.parse(req.body);
  const course = await updateCourse(courseId, input, user.sub);
  res.json({ course });
}

export async function deleteCourseController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const courseId = String(req.params.id);
  await deleteCourse(courseId, user.sub);
  res.status(204).end();
}

export async function publishCourseController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const course = await publishCourse(courseId);
  res.json({ course });
}

export async function unpublishCourseController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const course = await unpublishCourse(courseId);
  res.json({ course });
}

export async function archiveCourseController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const course = await archiveCourse(courseId);
  res.json({ course });
}

export async function duplicateCourseController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const courseId = String(req.params.id);
  const course = await duplicateCourse(courseId, user.sub);
  res.status(201).json({ course });
}

// ─── Unit CRUD ──────────────────────────────────────────────────

export async function createUnitController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const input = createUnitSchema.parse(req.body);
  const unit = await createUnit(courseId, input);
  res.status(201).json({ unit });
}

export async function updateUnitController(req: Request, res: Response) {
  const unitId = String(req.params.unitId);
  const input = updateUnitSchema.parse(req.body);
  const unit = await updateUnit(unitId, input);
  res.json({ unit });
}

export async function deleteUnitController(req: Request, res: Response) {
  const unitId = String(req.params.unitId);
  await deleteUnit(unitId);
  res.status(204).end();
}

export async function reorderUnitsController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const input = req.body as { unitOrder: Array<{ unitId: string; order: number }> };
  await reorderUnits(courseId, input.unitOrder);
  res.json({ success: true });
}

// ─── Lesson CRUD ────────────────────────────────────────────────

export async function createLessonController(req: Request, res: Response) {
  const courseId = String(req.params.courseId);
  const input = createLessonSchema.parse(req.body);
  const lesson = await createLesson(courseId, input);
  res.status(201).json({ lesson });
}

export async function updateLessonController(req: Request, res: Response) {
  const lessonId = String(req.params.lessonId);
  const input = updateLessonSchema.parse(req.body);
  const lesson = await updateLesson(lessonId, {
    ...input,
    unitId: input.unitId ?? undefined
  });
  res.json({ lesson });
}

export async function deleteLessonController(req: Request, res: Response) {
  const lessonId = String(req.params.lessonId);
  await deleteLesson(lessonId);
  res.status(204).end();
}

export async function publishLessonController(req: Request, res: Response) {
  const lessonId = String(req.params.lessonId);
  const lesson = await publishLesson(lessonId);
  res.json({ lesson });
}

export async function unpublishLessonController(req: Request, res: Response) {
  const lessonId = String(req.params.lessonId);
  const lesson = await unpublishLesson(lessonId);
  res.json({ lesson });
}

export async function reorderLessonsController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const input = req.body as { lessonOrder: Array<{ lessonId: string; order: number }> };
  await reorderLessons(courseId, input.lessonOrder);
  res.json({ success: true });
}

// ─── Enrollment ─────────────────────────────────────────────────

export async function enrollStudentController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const input = enrollStudentSchema.parse(req.body);
  const enrollment = await enrollStudent(courseId, input.studentId);
  res.status(201).json({ enrollment });
}

export async function assignCourseController(req: Request, res: Response) {
  const courseId = String(req.params.id);
  const input = req.body as { classId?: string; studentIds?: string[] };
  const result = await assignCourse(courseId, input);
  res.status(200).json(result);
}

export async function getStudentCoursesController(req: Request, res: Response) {
  const studentId = String(req.params.studentId);
  await assertCanViewStudent(getAuthenticatedUser(req).sub, studentId);
  const courses = await getStudentCourses(studentId);
  res.json({ courses });
}

export async function getTeacherCoursesController(req: Request, res: Response) {
  const teacherId = String(req.params.teacherId);
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { schoolId: true } });
  if (!teacher) throw new AppError(404, "Teacher not found", "TEACHER_NOT_FOUND");
  await assertCourseSchoolAccess(getAuthenticatedUser(req).sub, teacher.schoolId);
  const courses = await getTeacherCourses(teacherId);
  res.json({ courses });
}

export async function getSchoolCoursesController(req: Request, res: Response) {
  const schoolId = String(req.params.schoolId);
  await assertSchoolAccess(getAuthenticatedUser(req).sub, schoolId, { allowGuardians: true });
  const courses = await getSchoolCourses(schoolId);
  res.json({ courses });
}

// ─── Assignments ──────────────────────────────────────────────

export async function createAssignmentController(req: Request, res: Response) {
  const id = String(req.params.id);
  const assignment = await createAssignment(id, req.body);
  res.status(201).json({ assignment });
}

export async function updateAssignmentController(req: Request, res: Response) {
  const id = String(req.params.id);
  const assignment = await updateAssignment(id, req.body);
  res.json({ assignment });
}

export async function deleteAssignmentController(req: Request, res: Response) {
  const id = String(req.params.id);
  await deleteAssignment(id);
  res.status(204).end();
}

export async function submitAssignmentController(req: Request, res: Response) {
  const id = String(req.params.id);
  const user = getAuthenticatedUser(req);
  const student = await prisma.student.findUnique({ where: { userId: user.sub } });
  if (!student) throw new AppError(403, "Student profile not found", "STUDENT_NOT_FOUND");

  const submission = await submitAssignment(id, student.id, req.body);
  res.json({ submission });
}

export async function listTeacherAssignmentsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const assignments = await listTeacherAssignments(user.sub);
  res.json({ assignments });
}

// ─── Quizzes ──────────────────────────────────────────────────

export async function createQuizController(req: Request, res: Response) {
  const id = String(req.params.id);
  const quiz = await createQuiz(id, req.body);
  res.status(201).json({ quiz });
}

export async function updateQuizController(req: Request, res: Response) {
  const id = String(req.params.id);
  const quiz = await updateQuiz(id, req.body);
  res.json({ quiz });
}

export async function addQuizQuestionsController(req: Request, res: Response) {
  const id = String(req.params.id);
  const questions = await addQuizQuestions(id, req.body.questions);
  res.json({ questions });
}

export async function submitQuizAttemptController(req: Request, res: Response) {
  const id = String(req.params.id);
  const user = getAuthenticatedUser(req);
  const student = await prisma.student.findUnique({ where: { userId: user.sub } });
  if (!student) throw new AppError(403, "Student profile not found", "STUDENT_NOT_FOUND");

  const attempt = await submitQuizAttempt(id, student.id, req.body);
  res.json({ attempt });
}

export async function listTeacherQuizzesController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const quizzes = await listTeacherQuizzes(user.sub);
  res.json({ quizzes });
}

// ─── Progress ─────────────────────────────────────────────────

export async function updateLessonProgressController(req: Request, res: Response) {
  const lessonId = String(req.params.lessonId);
  const user = getAuthenticatedUser(req);
  const student = await prisma.student.findUnique({ where: { userId: user.sub } });
  if (!student) throw new AppError(403, "Student profile not found", "STUDENT_NOT_FOUND");

  const progress = await updateLessonProgress(lessonId, student.id, req.body.status);
  res.json({ progress });
}