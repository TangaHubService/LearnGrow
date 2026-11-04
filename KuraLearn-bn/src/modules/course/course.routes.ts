import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  listCoursesController,
  getCourseController,
  createCourseController,
  updateCourseController,
  deleteCourseController,
  publishCourseController,
  unpublishCourseController,
  archiveCourseController,
  duplicateCourseController,
  createUnitController,
  updateUnitController,
  deleteUnitController,
  reorderUnitsController,
  createLessonController,
  updateLessonController,
  deleteLessonController,
  publishLessonController,
  unpublishLessonController,
  reorderLessonsController,
  enrollStudentController,
  assignCourseController,
  getStudentCoursesController,
  getTeacherCoursesController,
  getSchoolCoursesController,
  getMyCoursesController,
  getCourseAnalyticsController,
  createAssignmentController,
  updateAssignmentController,
  deleteAssignmentController,
  submitAssignmentController,
  createQuizController,
  updateQuizController,
  addQuizQuestionsController,
  submitQuizAttemptController,
  listTeacherQuizzesController,
  listTeacherAssignmentsController,
  updateLessonProgressController,
} from "./course.controller.js";

export const courseRouter = Router();

// All course routes require authentication
courseRouter.use(requireAuth);

// ── Course CRUD ─────────────────────────────────────────────────
courseRouter.get("/courses", asyncHandler(listCoursesController));
courseRouter.get("/courses/mine", asyncHandler(getMyCoursesController));
courseRouter.get("/courses/:id", asyncHandler(getCourseController));
courseRouter.get("/courses/:id/analytics", asyncHandler(getCourseAnalyticsController));
courseRouter.post("/courses", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(createCourseController));
courseRouter.put("/courses/:id", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(updateCourseController));
courseRouter.delete("/courses/:id", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(deleteCourseController));
courseRouter.post("/courses/:id/publish", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(publishCourseController));
courseRouter.post("/courses/:id/unpublish", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(unpublishCourseController));
courseRouter.post("/courses/:id/archive", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(archiveCourseController));
courseRouter.post("/courses/:id/duplicate", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(duplicateCourseController));

// ── Unit management ─────────────────────────────────────────────
courseRouter.post("/courses/:id/units", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(createUnitController));
courseRouter.put("/units/:unitId", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(updateUnitController));
courseRouter.delete("/units/:unitId", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(deleteUnitController));
courseRouter.post("/courses/:id/reorder-units", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(reorderUnitsController));

// ── Lesson management ───────────────────────────────────────────
courseRouter.post("/courses/:courseId/lessons", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(createLessonController));
courseRouter.put("/lessons/:lessonId", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(updateLessonController));
courseRouter.delete("/lessons/:lessonId", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(deleteLessonController));
courseRouter.post("/lessons/:lessonId/publish", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(publishLessonController));
courseRouter.post("/lessons/:lessonId/unpublish", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(unpublishLessonController));
courseRouter.post("/courses/:id/reorder-lessons", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(reorderLessonsController));

// ── Enrollment ──────────────────────────────────────────────────
courseRouter.post("/courses/:id/enroll", asyncHandler(enrollStudentController));
courseRouter.post("/courses/:id/assign", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(assignCourseController));

// ── Scoped lists ────────────────────────────────────────────────
courseRouter.get("/teachers/:teacherId/courses", asyncHandler(getTeacherCoursesController));
courseRouter.get("/schools/:schoolId/courses", asyncHandler(getSchoolCoursesController));
courseRouter.get("/students/:studentId/courses", asyncHandler(getStudentCoursesController));

// ── Assignments ───────────────────────────────────────────────
courseRouter.post("/courses/:id/assignments", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(createAssignmentController));
courseRouter.put("/assignments/:id", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(updateAssignmentController));
courseRouter.delete("/assignments/:id", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(deleteAssignmentController));
courseRouter.post("/assignments/:id/submit", requireRole("STUDENT"), asyncHandler(submitAssignmentController));
courseRouter.get("/my/assignments", requireRole("TEACHER"), asyncHandler(listTeacherAssignmentsController));

// ── Quizzes ───────────────────────────────────────────────────
courseRouter.post("/courses/:id/quizzes", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(createQuizController));
courseRouter.put("/quizzes/:id", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(updateQuizController));
courseRouter.post("/quizzes/:id/questions", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"), asyncHandler(addQuizQuestionsController));
courseRouter.post("/quizzes/:id/attempt", requireRole("STUDENT"), asyncHandler(submitQuizAttemptController));
courseRouter.get("/my/quizzes", requireRole("TEACHER"), asyncHandler(listTeacherQuizzesController));

// ── Progress ──────────────────────────────────────────────────
courseRouter.post("/lessons/:lessonId/progress", requireRole("STUDENT"), asyncHandler(updateLessonProgressController));