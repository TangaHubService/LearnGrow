import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { asyncHandler } from "../../http/async-handler.js";
import {
  getMarksContextController,
  listMarkSubmissionsController,
  getMarkSubmissionController,
  saveDraftSubmissionController,
  submitMarkSubmissionController,
  approveMarkSubmissionController,
  rejectMarkSubmissionController,
  requestCorrectionController,
  unlockMarkSubmissionController,
  saveMarksController,
  getMarksController,
  updateMarkController,
  approveMarksController,
  getStudentReportController,
  getClassMarksheetController,
  listReportCardsController,
  generateReportCardsController,
  getReportCardController,
  approveReportCardController,
  exportReportCardPdfController,
  exportClassPdfController,
  exportMarksheetPdfController,
  exportTranscriptPdfController,
  getMarksAnalyticsController,
  getAiMarksInsightsController,
  getAiReportCardCommentController,
  getGradingSettingsController,
  saveGradingSettingsController,
  importMarksExcelController
} from "./marks.controller.js";

const router = Router();
const reviewerRoles = ["HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"] as const;
const teacherRoles = ["TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"] as const;

// Submission-first marks workflow
router.get("/marks/context", requireAuth, requireRole(...teacherRoles), asyncHandler(getMarksContextController));
router.get("/marks/submissions", requireAuth, requireRole(...teacherRoles), asyncHandler(listMarkSubmissionsController));
router.post("/marks/submissions/draft", requireAuth, requireRole(...teacherRoles), asyncHandler(saveDraftSubmissionController));
router.get("/marks/submissions/:id", requireAuth, requireRole(...teacherRoles), asyncHandler(getMarkSubmissionController));
router.post("/marks/submissions/:id/submit", requireAuth, requireRole(...teacherRoles), asyncHandler(submitMarkSubmissionController));
router.post("/marks/submissions/:id/approve", requireAuth, requireRole(...reviewerRoles), asyncHandler(approveMarkSubmissionController));
router.post("/marks/submissions/:id/reject", requireAuth, requireRole(...reviewerRoles), asyncHandler(rejectMarkSubmissionController));
router.post("/marks/submissions/:id/request-correction", requireAuth, requireRole(...reviewerRoles), asyncHandler(requestCorrectionController));
router.post("/marks/submissions/:id/unlock", requireAuth, requireRole(...reviewerRoles), asyncHandler(unlockMarkSubmissionController));
router.get("/marks/analytics", requireAuth, requireRole(...teacherRoles), asyncHandler(getMarksAnalyticsController));

// Legacy compatibility wrappers
router.post("/marks", requireAuth, requireRole(...teacherRoles), asyncHandler(saveMarksController));
router.get("/marks", requireAuth, asyncHandler(getMarksController));
router.post("/marks/approve", requireAuth, requireRole(...reviewerRoles), asyncHandler(approveMarksController));
router.post("/marks/import", requireAuth, requireRole(...teacherRoles), asyncHandler(importMarksExcelController));
router.put("/marks/:id", requireAuth, requireRole(...teacherRoles), asyncHandler(updateMarkController));

// Reports and marksheets
router.get("/reports/student/:studentId", requireAuth, asyncHandler(getStudentReportController));
router.get("/reports/class", requireAuth, requireRole(...teacherRoles), asyncHandler(getClassMarksheetController));
router.get("/reports/cards", requireAuth, asyncHandler(listReportCardsController));
router.post("/reports/cards/generate", requireAuth, requireRole(...reviewerRoles), asyncHandler(generateReportCardsController));
router.get("/reports/cards/:id", requireAuth, asyncHandler(getReportCardController));
router.post("/reports/cards/:id/approve", requireAuth, requireRole(...reviewerRoles), asyncHandler(approveReportCardController));
router.post("/reports/cards/:id/export-pdf", requireAuth, asyncHandler(exportReportCardPdfController));
router.post("/reports/class/export-pdf", requireAuth, requireRole(...reviewerRoles), asyncHandler(exportClassPdfController));
router.post("/reports/marksheet/export-pdf", requireAuth, requireRole(...reviewerRoles), asyncHandler(exportMarksheetPdfController));
router.post("/reports/transcript/export-pdf", requireAuth, requireRole(...reviewerRoles), asyncHandler(exportTranscriptPdfController));

// AI support
router.post("/ai/marks-insights", requireAuth, asyncHandler(getAiMarksInsightsController));
router.post("/ai/student-report-comment", requireAuth, asyncHandler(getAiReportCardCommentController));

// Grading Scale management
router.get("/grading-settings", requireAuth, asyncHandler(getGradingSettingsController));
router.post("/grading-settings", requireAuth, requireRole(...reviewerRoles), asyncHandler(saveGradingSettingsController));

export { router as marksRouter };
