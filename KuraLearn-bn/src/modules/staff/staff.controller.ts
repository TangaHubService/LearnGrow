import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { AppError } from "../../http/errors.js";
import {
  createStaffSchema,
  updateStaffSchema,
  assignClassesSchema,
  staffListQuerySchema,
} from "./staff.schemas.js";
import * as service from "./staff.service.js";

function userId(req: Request) {
  return getAuthenticatedUser(req).sub;
}

function param(req: Request, key: string): string {
  const val = req.params[key] as string | undefined;
  if (!val) throw new AppError(400, `Missing param: ${key}`, "MISSING_PARAM");
  return val;
}

// ─── List staff ───────────────────────────────────────────────────────────────

export async function listStaff(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const query = staffListQuerySchema.parse(req.query);
  const result = await service.listStaff(schoolId, query);
  res.json(result);
}

// ─── Get staff analytics ──────────────────────────────────────────────────────

export async function getStaffAnalytics(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const data = await service.getStaffAnalytics(schoolId);
  res.json(data);
}

// ─── Get single staff ─────────────────────────────────────────────────────────

export async function getStaff(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const staffId = param(req, "id");
  const data = await service.getStaffById(staffId, schoolId);
  res.json(data);
}

// ─── Create staff ─────────────────────────────────────────────────────────────

export async function createStaff(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const input = createStaffSchema.parse(req.body);
  const data = await service.createStaff(uid, schoolId, input);
  res.status(201).json(data);
}

// ─── Update staff ─────────────────────────────────────────────────────────────

export async function updateStaff(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const staffId = param(req, "id");
  const input = updateStaffSchema.parse(req.body);
  const data = await service.updateStaff(staffId, schoolId, input);
  res.json(data);
}

// ─── Send invitation ──────────────────────────────────────────────────────────

export async function inviteStaff(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const staffId = param(req, "id");
  const data = await service.sendInvitation(staffId, schoolId, uid);
  res.json(data);
}

// ─── Resend invitation ────────────────────────────────────────────────────────

export async function resendInvite(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const staffId = param(req, "id");
  const data = await service.resendInvitation(staffId, schoolId, uid);
  res.json(data);
}

// ─── Assign classes/subjects ──────────────────────────────────────────────────

export async function assignClasses(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const staffId = param(req, "id");
  const input = assignClassesSchema.parse(req.body);
  const data = await service.upsertAssignments(staffId, schoolId, input);
  res.json(data);
}

// ─── Delete assignment ────────────────────────────────────────────────────────

export async function removeAssignment(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const staffId = param(req, "id");
  const assignmentId = param(req, "assignmentId");
  const data = await service.deleteAssignment(staffId, assignmentId, schoolId);
  res.json(data);
}

// ─── Update staff status ──────────────────────────────────────────────────────

export async function updateStatus(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await service.resolveSchoolId(uid);
  const staffId = param(req, "id");

  const { status } = req.body;
  if (!status || !["ACTIVE", "SUSPENDED", "PENDING"].includes(status)) {
    throw new AppError(400, "status must be one of: ACTIVE, SUSPENDED, PENDING", "INVALID_STATUS");
  }

  const data = await service.updateStaffStatus(staffId, schoolId, status);
  res.json(data);
}

// ─── Setup password (public) ──────────────────────────────────────────────────

export async function setupPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  if (!token || typeof token !== "string") {
    throw new AppError(400, "Token is required", "TOKEN_REQUIRED");
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    throw new AppError(400, "Password must be at least 8 characters", "WEAK_PASSWORD");
  }
  const data = await service.setupPassword(token, password);
  res.json(data);
}
