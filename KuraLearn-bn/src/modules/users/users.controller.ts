import type { Request, Response } from "express";
import { resolveActorSchoolId } from "../../middleware/access.js";
import { AppError } from "../../http/errors.js";
import { getCurrentUser, listStudents } from "./users.service.js";

export async function getCurrentUserController(req: Request, res: Response) {
  if (!req.user?.sub) {
    throw new AppError(401, "Authentication is required", "AUTH_REQUIRED");
  }

  const user = await getCurrentUser(req.user.sub);
  res.json({ user });
}

export async function listStudentsController(req: Request, res: Response) {
  const students = await listStudents(await resolveActorSchoolId(req.user!.sub));
  res.json({ students });
}
