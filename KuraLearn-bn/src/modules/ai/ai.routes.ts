import rateLimit from "express-rate-limit";
import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  chatController,
  conversationController,
  conversationsController,
  explainLessonController,
  generatePracticeController,
  hintController,
  recommendRemedialController,
  teacherAnalyzePerformanceController,
  teacherComprehensiveAiController,
  teacherInterventionsController,
  teacherLessonObjectivesController,
  teacherLessonPlanController,
  teacherParentMessageDraftController,
  teacherQuizGenerateController,
  teacherReportSummaryController,
  teacherStudentRiskController,
  teacherTranslateOrSimplifyController,
  translateController,
  generateAssessmentController,
  suggestFeedbackController,
  explainSolutionController,
  convertPlanToContentController,
} from "./ai.controller.js";

export const aiRouter = Router();

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

aiRouter.use(requireAuth, aiRateLimit);

aiRouter.post("/chat", requireRole("STUDENT"), asyncHandler(chatController));
aiRouter.post("/hint", requireRole("STUDENT"), asyncHandler(hintController));
aiRouter.post("/explain-lesson", requireRole("STUDENT"), asyncHandler(explainLessonController));
aiRouter.post("/translate", requireRole("STUDENT"), asyncHandler(translateController));
aiRouter.post("/recommend-remedial", requireRole("STUDENT"), asyncHandler(recommendRemedialController));
aiRouter.post("/generate-practice", requireRole("STUDENT"), asyncHandler(generatePracticeController));
aiRouter.get("/conversations", requireRole("STUDENT", "TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"), asyncHandler(conversationsController));
aiRouter.get("/conversations/:id", requireRole("STUDENT", "TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"), asyncHandler(conversationController));

const teacherAccess = requireRole("TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN");

aiRouter.post("/lesson-objectives", teacherAccess, asyncHandler(teacherLessonObjectivesController));
aiRouter.post("/lesson-plan", teacherAccess, asyncHandler(teacherLessonPlanController));
aiRouter.post("/quiz-generate", teacherAccess, asyncHandler(teacherQuizGenerateController));
aiRouter.post("/analyze-performance", teacherAccess, asyncHandler(teacherAnalyzePerformanceController));
aiRouter.post("/student-risk", teacherAccess, asyncHandler(teacherStudentRiskController));
aiRouter.post("/intervention-recommendations", teacherAccess, asyncHandler(teacherInterventionsController));
aiRouter.post("/report-summary", teacherAccess, asyncHandler(teacherReportSummaryController));
aiRouter.post("/parent-message-draft", teacherAccess, asyncHandler(teacherParentMessageDraftController));
aiRouter.post("/translate-or-simplify", teacherAccess, asyncHandler(teacherTranslateOrSimplifyController));
aiRouter.post("/comprehensive", teacherAccess, asyncHandler(teacherComprehensiveAiController));

// ── Assessment AI ────────────────────────────────────────────────
aiRouter.post("/assessments/generate", teacherAccess, asyncHandler(generateAssessmentController));
aiRouter.post("/submissions/feedback-suggest", teacherAccess, asyncHandler(suggestFeedbackController));
aiRouter.post("/submissions/explain-after-submit", requireRole("STUDENT"), asyncHandler(explainSolutionController));
aiRouter.post("/convert-plan-to-content", teacherAccess, asyncHandler(convertPlanToContentController));
