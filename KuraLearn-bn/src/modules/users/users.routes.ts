import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { asyncHandler } from "../../http/async-handler.js";
import { getCurrentUserController, listStudentsController } from "./users.controller.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, asyncHandler(getCurrentUserController));

usersRouter.get(
  "/students",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  asyncHandler(listStudentsController)
);
