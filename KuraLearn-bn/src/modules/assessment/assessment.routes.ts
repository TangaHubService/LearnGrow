import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  listAssessmentsController,
  getAssessmentController,
  createAssessmentController,
  updateAssessmentController,
  deleteAssessmentController,
  publishAssessmentController,
  closeAssessmentController,
  addQuestionsController,
  updateQuestionController,
  deleteQuestionController,
  startSubmissionController,
  saveDraftController,
  submitSubmissionController,
  getSubmissionController,
  getAssessmentSubmissionsController,
  markSubmissionController,
  returnSubmissionController,
  getStudentAssessmentsController,
  getStudentSubmissionsController,
  getAssessmentAnalyticsController,
} from "./assessment.controller.js";

export const assessmentRouter = Router();

const TEACHER_ROLES = ["TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"] as const;

assessmentRouter.use(requireAuth);

// ── Assessment CRUD ──────────────────────────────────────────────────
assessmentRouter.get("/assessments", asyncHandler(listAssessmentsController));
assessmentRouter.post("/assessments", requireRole(...TEACHER_ROLES), asyncHandler(createAssessmentController));
assessmentRouter.get("/assessments/:id", asyncHandler(getAssessmentController));
assessmentRouter.patch("/assessments/:id", requireRole(...TEACHER_ROLES), asyncHandler(updateAssessmentController));
assessmentRouter.delete("/assessments/:id", requireRole(...TEACHER_ROLES), asyncHandler(deleteAssessmentController));
assessmentRouter.post("/assessments/:id/publish", requireRole(...TEACHER_ROLES), asyncHandler(publishAssessmentController));
assessmentRouter.post("/assessments/:id/close", requireRole(...TEACHER_ROLES), asyncHandler(closeAssessmentController));

// ── Analytics ────────────────────────────────────────────────────────
assessmentRouter.get("/assessments/:id/analytics", requireRole(...TEACHER_ROLES), asyncHandler(getAssessmentAnalyticsController));

// ── Questions ────────────────────────────────────────────────────────
assessmentRouter.post("/assessments/:id/questions", requireRole(...TEACHER_ROLES), asyncHandler(addQuestionsController));
assessmentRouter.patch("/assessments/questions/:questionId", requireRole(...TEACHER_ROLES), asyncHandler(updateQuestionController));
assessmentRouter.delete("/assessments/questions/:questionId", requireRole(...TEACHER_ROLES), asyncHandler(deleteQuestionController));

// ── Teacher: Submission Management ───────────────────────────────────
assessmentRouter.get("/assessments/:id/submissions", requireRole(...TEACHER_ROLES), asyncHandler(getAssessmentSubmissionsController));
assessmentRouter.patch("/submissions/:submissionId/mark", requireRole(...TEACHER_ROLES), asyncHandler(markSubmissionController));
assessmentRouter.post("/submissions/:submissionId/return", requireRole(...TEACHER_ROLES), asyncHandler(returnSubmissionController));

// ── Student: Start / Save / Submit ───────────────────────────────────
assessmentRouter.post("/assessments/:id/start", requireRole("STUDENT"), asyncHandler(startSubmissionController));
assessmentRouter.patch("/submissions/:submissionId/save", requireRole("STUDENT"), asyncHandler(saveDraftController));
assessmentRouter.post("/submissions/:submissionId/submit", requireRole("STUDENT"), asyncHandler(submitSubmissionController));
assessmentRouter.get("/submissions/:submissionId", asyncHandler(getSubmissionController));

// ── Student: My Assessments & Submissions ────────────────────────────
assessmentRouter.get("/students/me/assessments", requireRole("STUDENT"), asyncHandler(getStudentAssessmentsController));
assessmentRouter.get("/students/me/submissions", requireRole("STUDENT"), asyncHandler(getStudentSubmissionsController));
