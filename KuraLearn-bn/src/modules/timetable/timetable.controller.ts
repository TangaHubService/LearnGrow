import type { Request, Response } from "express";
import { resolveActorSchoolId } from "../../middleware/access.js";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import * as service from "./timetable.service.js";
import {
  createTimetableEntrySchema,
  updateTimetableEntrySchema,
  generateTimetableSchema,
  createRoomSchema,
  updateRoomSchema,
  createPeriodSchema,
  updatePeriodSchema,
  createTeacherWorkloadSchema,
  updateTeacherWorkloadSchema,
  listQuerySchema
} from "./timetable.schemas.js";

const userId = (req: Request) => getAuthenticatedUser(req).sub;

function getSchoolId(userId: string): Promise<string> {
  return resolveActorSchoolId(userId);
}

// ── Timetable Entries ──

export async function createEntryController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const payload = createTimetableEntrySchema.parse(req.body);
  const entry = await service.createTimetableEntry(schoolId, payload, userId(req));
  res.status(201).json({ entry });
}

export async function updateEntryController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const payload = updateTimetableEntrySchema.parse(req.body);
  const id = String(req.params.id);
  const entry = await service.updateTimetableEntry(id, schoolId, payload, userId(req));
  res.json({ entry });
}

export async function deleteEntryController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const id = String(req.params.id);
  const result = await service.deleteTimetableEntry(id, schoolId);
  res.json(result);
}

export async function getEntryController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const id = String(req.params.id);
  const entry = await service.getTimetableEntry(id, schoolId);
  res.json({ entry });
}

export async function listEntriesController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const query = listQuerySchema.parse(req.query);
  const result = await service.listTimetableEntries(schoolId, query);
  res.json(result);
}

// ── Timetable Grid ──

export async function getGridController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const classId = req.query.classId as string | undefined;
  const teacherId = req.query.teacherId as string | undefined;
  const roomId = req.query.roomId as string | undefined;
  const termId = req.query.termId as string | undefined;
  const shift = req.query.shift as string | undefined;
  if (!termId) {
    res.status(400).json({ error: "termId is required" });
    return;
  }
  const grid = await service.getTimetableGrid(schoolId, {
    classId,
    teacherId,
    roomId,
    termId,
    shift
  });
  res.json(grid);
}

// ── Auto-Generation ──

export async function generateController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const payload = generateTimetableSchema.parse({ ...req.body, schoolId });
  const result = await service.autoGenerateTimetable({
    schoolId: payload.schoolId,
    academicYearId: payload.academicYearId,
    termId: payload.termId,
    shift: payload.shift,
    classIds: payload.classIds,
    respectWorkload: payload.respectWorkload,
    preferDoublePeriods: payload.preferDoublePeriods,
    clearExisting: true
  });
  res.json(result);
}

// ── Conflict Check ──

export async function checkConflictsController(req: Request, res: Response) {
  const { classId, teacherId, room, roomId, dayOfWeek, startTime, endTime, termId } = req.body;
  const result = await service.checkSchedulingConflicts({
    classId,
    teacherId: teacherId ?? null,
    room: room ?? null,
    roomId: roomId ?? null,
    dayOfWeek,
    startTime,
    endTime,
    termId: termId ?? null
  });
  res.json(result);
}

// ── Rooms ──

export async function createRoomController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const payload = createRoomSchema.parse(req.body);
  const room = await service.createRoom(schoolId, payload);
  res.status(201).json({ room });
}

export async function updateRoomController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const payload = updateRoomSchema.parse(req.body);
  const id = String(req.params.id);
  const room = await service.updateRoom(id, schoolId, payload);
  res.json({ room });
}

export async function deleteRoomController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const id = String(req.params.id);
  const result = await service.deleteRoom(id, schoolId);
  res.json(result);
}

export async function listRoomsController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const type = req.query.type as string | undefined;
  const rooms = await service.listRooms(schoolId, type);
  res.json({ items: rooms });
}

// ── Periods ──

export async function createPeriodController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const payload = createPeriodSchema.parse(req.body);
  const period = await service.createPeriod(schoolId, payload);
  res.status(201).json({ period });
}

export async function updatePeriodController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const payload = updatePeriodSchema.parse(req.body);
  const id = String(req.params.id);
  const period = await service.updatePeriod(id, schoolId, payload);
  res.json({ period });
}

export async function listPeriodsController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const shift = req.query.shift as string | undefined;
  const periods = await service.listPeriods(schoolId, shift);
  res.json({ items: periods });
}

// ── Teacher Workload ──

export async function setWorkloadController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const payload = createTeacherWorkloadSchema.parse(req.body);
  const workload = await service.setTeacherWorkload(schoolId, payload);
  res.json({ workload });
}

export async function checkWorkloadController(req: Request, res: Response) {
  const schoolId = await getSchoolId(userId(req));
  const { teacherId, termId, academicYearId, dayOfWeek } = req.query as Record<string, string | undefined>;
  if (!teacherId) {
    res.status(400).json({ error: "teacherId is required" });
    return;
  }
  const result = await service.checkTeacherWorkload({
    teacherId,
    termId: termId ?? null,
    academicYearId: academicYearId ?? null,
    dayOfWeek: dayOfWeek as any,
    schoolId
  });
  res.json(result);
}
