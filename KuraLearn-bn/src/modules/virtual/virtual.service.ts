import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import { getIO } from "../../services/socket.js";

interface CreateSessionInput {
  schoolId: string;
  teacherId: string;
  classId: string;
  subjectId?: string;
  lessonId?: string;
  title: string;
}

export async function createVirtualSession(input: CreateSessionInput) {
  const session = await prisma.teacherLessonDeliverySession.create({
    data: {
      schoolId: input.schoolId,
      teacherId: input.teacherId,
      classId: input.classId,
      lessonId: input.lessonId,
      status: "IN_PROGRESS",
      startedAt: new Date(),
      participation: {},
    },
  });

  const io = getIO();
  io?.to(`class:${input.classId}`).emit("virtual:session-started", {
    sessionId: session.id,
    title: input.title,
  });

  return session;
}

export async function endVirtualSession(sessionId: string) {
  const session = await prisma.teacherLessonDeliverySession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  const io = getIO();
  io?.to(`class:${session.classId}`).emit("virtual:session-ended", {
    sessionId,
  });

  return session;
}

export async function joinVirtualSession(sessionId: string, userId: string) {
  const session = await prisma.teacherLessonDeliverySession.findUnique({
    where: { id: sessionId },
  });
  if (!session) throw new AppError(404, "Session not found", "SESSION_NOT_FOUND");
  if (session.status !== "IN_PROGRESS") throw new AppError(400, "Session ended", "SESSION_ENDED");

  const participation = (session.participation as Record<string, any>) ?? {};
  participation[userId] = { joinedAt: new Date().toISOString() };

  await prisma.teacherLessonDeliverySession.update({
    where: { id: sessionId },
    data: { participation },
  });

  return { sessionId };
}
