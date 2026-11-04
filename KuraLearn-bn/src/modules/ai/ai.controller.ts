import type { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import {
  chatSchema,
  explainLessonSchema,
  hintSchema,
  practiceSchema,
  remedialSchema,
  generateAssessmentSchema,
  teacherAiComprehensiveSchema,
  teacherAnalyzePerformanceSchema,
  teacherInterventionSchema,
  teacherLessonObjectivesSchema,
  teacherLessonPlanSchema,
  teacherParentMessageDraftSchema,
  teacherQuizGenerateSchema,
  teacherReportSummarySchema,
  teacherStudentRiskSchema,
  teacherTranslateOrSimplifySchema,
  translateSchema
} from "./ai.schemas.js";
import {
  analyzeTeacherPerformance,
  chatWithTutor,
  explainLesson,
  generateHint,
  generatePracticeQuestions,
  generateTeacherLessonObjectives,
  generateTeacherLessonPlan,
  generateTeacherParentMessageDraft,
  generateTeacherQuiz,
  getConversation,
  getTeacherConversation,
  listConversations,
  listTeacherConversations,
  recommendRemedial,
  recommendTeacherInterventions,
  summarizeTeacherReport,
  translateOrSimplifyTeacherContent,
  predictTeacherStudentRisk,
  translateLearningContent,
  teacherComprehensiveAi,
  generateAssessment,
  suggestSubmissionFeedback,
  explainSubmissionSolution,
  convertPlanToContent,
} from "./ai.service.js";

export async function chatController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = chatSchema.parse(req.body);
  res.json(await chatWithTutor(user.sub, payload));
}

export async function hintController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = hintSchema.parse(req.body);
  res.json(await generateHint(user.sub, payload));
}

export async function explainLessonController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = explainLessonSchema.parse(req.body);
  res.json(await explainLesson(user.sub, payload.lessonId, payload.language));
}

export async function translateController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = translateSchema.parse(req.body);
  res.json(await translateLearningContent(user.sub, payload));
}

export async function recommendRemedialController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = remedialSchema.parse(req.body);
  res.json(await recommendRemedial(user.sub, payload));
}

export async function generatePracticeController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = practiceSchema.parse(req.body);
  res.json(await generatePracticeQuestions(user.sub, payload));
}

export async function conversationsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const isStudent = user.roles.includes(UserRole.STUDENT);
  if (isStudent) {
    res.json({ conversations: await listConversations(user.sub) });
  } else {
    res.json({ conversations: await listTeacherConversations(user.sub) });
  }
}

export async function conversationController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const isStudent = user.roles.includes(UserRole.STUDENT);
  if (isStudent) {
    res.json({ conversation: await getConversation(user.sub, String(req.params.id)) });
  } else {
    res.json(await getTeacherConversation(user.sub, String(req.params.id)));
  }
}

export async function teacherLessonObjectivesController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherLessonObjectivesSchema.parse(req.body);
  res.json(await generateTeacherLessonObjectives(user.sub, payload));
}

export async function teacherLessonPlanController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherLessonPlanSchema.parse(req.body);
  res.json(await generateTeacherLessonPlan(user.sub, payload));
}

export async function teacherQuizGenerateController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherQuizGenerateSchema.parse(req.body);
  res.json(await generateTeacherQuiz(user.sub, payload));
}

export async function teacherAnalyzePerformanceController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherAnalyzePerformanceSchema.parse(req.body);
  res.json(await analyzeTeacherPerformance(user.sub, payload));
}

export async function teacherStudentRiskController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherStudentRiskSchema.parse(req.body);
  res.json(await predictTeacherStudentRisk(user.sub, payload));
}

export async function teacherInterventionsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherInterventionSchema.parse(req.body);
  res.json(await recommendTeacherInterventions(user.sub, payload));
}

export async function teacherReportSummaryController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherReportSummarySchema.parse(req.body);
  res.json(await summarizeTeacherReport(user.sub, payload));
}

export async function teacherParentMessageDraftController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherParentMessageDraftSchema.parse(req.body);
  res.json(await generateTeacherParentMessageDraft(user.sub, payload));
}

export async function teacherTranslateOrSimplifyController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherTranslateOrSimplifySchema.parse(req.body);
  res.json(await translateOrSimplifyTeacherContent(user.sub, payload));
}

export async function teacherComprehensiveAiController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = teacherAiComprehensiveSchema.parse(req.body);
  res.json(await teacherComprehensiveAi(user.sub, payload));
}

export async function generateAssessmentController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = generateAssessmentSchema.parse(req.body);
  res.json(await generateAssessment(user.sub, payload));
}

export async function suggestFeedbackController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json(await suggestSubmissionFeedback(user.sub, req.body));
}

export async function explainSolutionController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json(await explainSubmissionSolution(user.sub, req.body));
}

export async function convertPlanToContentController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json(await convertPlanToContent(user.sub, req.body));
}
