import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import {
  activityQuerySchema,
  schoolsQuerySchema,
  subscriptionUpdateSchema,
  usersQuerySchema,
  userStatusUpdateSchema
} from "./super-admin.schemas.js";
import { getOverview, listActivity, listSchools, listUsers, updateSchoolSubscription, updateUserStatus } from "./super-admin.service.js";

export async function overviewController(_req: Request, res: Response) {
  res.json(await getOverview());
}

export async function schoolsController(req: Request, res: Response) {
  res.json(await listSchools(schoolsQuerySchema.parse(req.query)));
}

export async function usersController(req: Request, res: Response) {
  res.json(await listUsers(usersQuerySchema.parse(req.query)));
}

export async function activityController(req: Request, res: Response) {
  res.json(await listActivity(activityQuerySchema.parse(req.query)));
}

export async function subscriptionController(req: Request, res: Response) {
  const { status } = subscriptionUpdateSchema.parse(req.body);
  res.json(await updateSchoolSubscription(getAuthenticatedUser(req).sub, req.params.schoolId as string, status));
}

export async function userStatusController(req: Request, res: Response) {
  const { status } = userStatusUpdateSchema.parse(req.body);
  res.json(await updateUserStatus(getAuthenticatedUser(req).sub, req.params.userId as string, status));
}
