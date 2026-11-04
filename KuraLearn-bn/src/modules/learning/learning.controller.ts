import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { learningQuerySchema, updateProgressSchema, submitQuizSchema } from "./learning.schemas.js";
import {
  getLearningPaths,
  getLessonById,
  getQuizById,
  getStudentProgress,
  listLessons,
  listQuizzes,
  submitQuiz,
  updateLessonProgress
} from "./learning.service.js";

export async function listLessonsController(req: Request, res: Response) {
  const query = learningQuerySchema.parse(req.query);
  const lessons = await listLessons({ levelId: query.levelId });
  res.json({ lessons });
}

export async function listQuizzesController(req: Request, res: Response) {
  const query = learningQuerySchema.parse(req.query);
  const quizzes = await listQuizzes({ levelId: query.levelId });
  res.json({ quizzes });
}

export async function getLessonController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const lessonId = String(req.params.id);
  const result = await getLessonById(lessonId, user.sub);
  res.json(result);
}

export async function updateProgressController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const lessonId = String(req.params.id);
  const data = updateProgressSchema.parse(req.body);
  const result = await updateLessonProgress(lessonId, user.sub, data);
  res.json(result);
}

export async function getStudentProgressController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const result = await getStudentProgress(user.sub);
  res.json(result);
}

export async function getLearningPathsController(req: Request, res: Response) {
  const query = learningQuerySchema.parse(req.query);
  const paths = await getLearningPaths(query.levelId);
  res.json({ paths });
}

export async function getQuizController(req: Request, res: Response) {
  const quizId = String(req.params.id);
  const quiz = await getQuizById(quizId);
  res.json({ quiz });
}

export async function submitQuizController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const quizId = String(req.params.id);
  const data = submitQuizSchema.parse(req.body);
  const result = await submitQuiz(quizId, user.sub, data.answers, data.timeSpentSec ?? data.timeUsed);
  res.json(result);
}
