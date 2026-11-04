import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { prisma } from "../../prisma/client.js";
import { createVirtualSession, endVirtualSession, joinVirtualSession } from "./virtual.service.js";

export async function startSessionController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const { classId, subjectId, lessonId, title } = req.body;

  const teacher = await prisma.teacher.findUnique({ where: { userId: user.sub } });
  if (!teacher) return res.status(403).json({ error: { code: "FORBIDDEN", message: "Teacher profile required" } });

  const session = await createVirtualSession({
    schoolId: req.tenantId!,
    teacherId: teacher.id,
    classId,
    subjectId,
    lessonId,
    title: title ?? "Virtual Lesson",
  });

  res.status(201).json({ session });
}

export async function endSessionController(req: Request, res: Response) {
  const session = await endVirtualSession(req.params.sessionId as string);
  res.json({ session });
}

export async function joinSessionController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const result = await joinVirtualSession(req.params.sessionId as string, user.sub);
  res.json(result);
}
