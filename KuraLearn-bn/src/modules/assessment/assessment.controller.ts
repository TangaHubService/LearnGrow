import type { Request, Response } from "express";
import * as svc from "./assessment.service.js";
import { AppError } from "../../http/errors.js";
import { listAssessmentsSchema } from "./assessment.schemas.js";

function userId(req: Request): string {
  const id = (req as any).user?.sub;
  if (!id) throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  return id;
}

function param(req: Request, key: string): string {
  const val = req.params[key];
  if (!val || Array.isArray(val)) throw new AppError(400, `Missing parameter: ${key}`, "MISSING_PARAM");
  return val;
}

// ─── Assessments ──────────────────────────────────────────────────────

export async function listAssessmentsController(req: Request, res: Response) {
  const query = listAssessmentsSchema.parse(req.query);
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  const { assessments, total } = await svc.listAssessments({ 
    ...query,
    page,
    limit,
  }, userId(req));

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  res.json({
    success: true,
    data: {
      assessments,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      }
    }
  });
}

export async function getAssessmentController(req: Request, res: Response) {
  const assessment = await svc.getAssessmentById(param(req, "id"), userId(req));
  res.json({ assessment });
}

export async function createAssessmentController(req: Request, res: Response) {
  const assessment = await svc.createAssessment(req.body, userId(req));
  res.status(201).json({ assessment });
}

export async function updateAssessmentController(req: Request, res: Response) {
  const assessment = await svc.updateAssessment(param(req, "id"), req.body, userId(req));
  res.json({ assessment });
}

export async function deleteAssessmentController(req: Request, res: Response) {
  await svc.deleteAssessment(param(req, "id"), userId(req));
  res.json({ success: true });
}

export async function publishAssessmentController(req: Request, res: Response) {
  const assessment = await svc.publishAssessment(param(req, "id"), userId(req));
  res.json({ assessment });
}

export async function closeAssessmentController(req: Request, res: Response) {
  const assessment = await svc.closeAssessment(param(req, "id"), userId(req));
  res.json({ assessment });
}

// ─── Questions ────────────────────────────────────────────────────────

export async function addQuestionsController(req: Request, res: Response) {
  const { questions } = req.body;
  if (!Array.isArray(questions)) throw new AppError(400, "'questions' must be an array", "INVALID_INPUT");
  const created = await svc.addQuestions(param(req, "id"), questions, userId(req));
  res.status(201).json({ questions: created });
}

export async function updateQuestionController(req: Request, res: Response) {
  const question = await svc.updateQuestion(param(req, "questionId"), req.body, userId(req));
  res.json({ question });
}

export async function deleteQuestionController(req: Request, res: Response) {
  await svc.deleteQuestion(param(req, "questionId"), userId(req));
  res.json({ success: true });
}

// ─── Submissions ──────────────────────────────────────────────────────

export async function startSubmissionController(req: Request, res: Response) {
  const submission = await svc.startSubmission(param(req, "id"), userId(req));
  res.status(201).json({ submission });
}

export async function saveDraftController(req: Request, res: Response) {
  const { answers } = req.body;
  const submission = await svc.saveDraftSubmission(param(req, "submissionId"), answers, userId(req));
  res.json({ submission });
}

export async function submitSubmissionController(req: Request, res: Response) {
  const { answers, uploadedFiles } = req.body;
  const submission = await svc.submitSubmission(param(req, "submissionId"), { answers, uploadedFiles }, userId(req));
  res.json({ submission });
}

export async function getSubmissionController(req: Request, res: Response) {
  const submission = await svc.getSubmissionById(param(req, "submissionId"), userId(req));
  res.json({ submission });
}

export async function getAssessmentSubmissionsController(req: Request, res: Response) {
  const submissions = await svc.getAssessmentSubmissions(param(req, "id"), userId(req));
  res.json({ submissions });
}

export async function markSubmissionController(req: Request, res: Response) {
  const submission = await svc.markSubmission(param(req, "submissionId"), req.body, userId(req));
  res.json({ submission });
}

export async function returnSubmissionController(req: Request, res: Response) {
  const submission = await svc.returnSubmission(param(req, "submissionId"), userId(req));
  res.json({ submission });
}

// ─── Student Views ────────────────────────────────────────────────────

export async function getStudentAssessmentsController(req: Request, res: Response) {
  const assessments = await svc.getStudentAssessments(userId(req));
  res.json({ assessments });
}

export async function getStudentSubmissionsController(req: Request, res: Response) {
  const submissions = await svc.getStudentSubmissions(userId(req));
  res.json({ submissions });
}

// ─── Analytics ────────────────────────────────────────────────────────

export async function getAssessmentAnalyticsController(req: Request, res: Response) {
  const analytics = await svc.getAssessmentAnalytics(param(req, "id"), userId(req));
  res.json({ analytics });
}
