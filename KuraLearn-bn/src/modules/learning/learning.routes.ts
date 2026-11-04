import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  getLearningPathsController,
  getLessonController,
  getQuizController,
  getStudentProgressController,
  listLessonsController,
  listQuizzesController,
  submitQuizController,
  updateProgressController
} from "./learning.controller.js";

export const learningRouter = Router();

learningRouter.get("/lessons", requireAuth, asyncHandler(listLessonsController));
learningRouter.get("/lessons/:id", requireAuth, asyncHandler(getLessonController));
learningRouter.patch("/lessons/:id/progress", requireAuth, asyncHandler(updateProgressController));
learningRouter.post("/lessons/:id/progress", requireAuth, asyncHandler(updateProgressController));

learningRouter.get("/paths", requireAuth, asyncHandler(getLearningPathsController));

learningRouter.get("/quizzes", requireAuth, asyncHandler(listQuizzesController));
learningRouter.get("/quizzes/:id", requireAuth, asyncHandler(getQuizController));
learningRouter.post("/quizzes/:id/submit", requireAuth, asyncHandler(submitQuizController));

learningRouter.get("/progress", requireAuth, asyncHandler(getStudentProgressController));
