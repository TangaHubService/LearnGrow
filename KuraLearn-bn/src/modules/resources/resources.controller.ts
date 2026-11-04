import type { Request, Response } from "express";
import { z } from "zod";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { AppError } from "../../http/errors.js";
import {
  listResources,
  getResourceDetails,
  uploadResource,
  updateResource,
  deleteResource,
  getFolders,
} from "./resources.service.js";

const userId = (req: Request) => getAuthenticatedUser(req).sub;

// Input Validation Schemas
const listQuerySchema = z.object({
  search: z.string().optional(),
  classId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  lessonId: z.string().uuid().optional(),
  type: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});

const updateBodySchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  classId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  courseId: z.string().uuid().optional().nullable(),
  lessonId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  sharedScope: z.string().optional(),
  status: z.string().optional(),
});

// Controllers
export async function getResourcesHandler(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const result = await listResources(userId(req), query);
  res.json(result);
}

export async function getResourceDetailsHandler(req: Request, res: Response) {
  const id = String(req.params.id);
  const result = await getResourceDetails(userId(req), id);
  res.json(result);
}

export async function uploadResourceHandler(req: Request, res: Response) {
  const file = req.file;
  if (!file) {
    throw new AppError(400, "No file attachment was provided.", "FILE_REQUIRED");
  }

  // Parse title and tags robustly from multipart form fields
  const title = req.body.title || file.originalname.split(".")[0];
  const type = req.body.type || "OTHER";

  let tags: string[] = [];
  if (req.body.tags) {
    if (typeof req.body.tags === "string") {
      try {
        const parsed = JSON.parse(req.body.tags);
        if (Array.isArray(parsed)) {
          tags = parsed.map(String);
        } else {
          tags = req.body.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
        }
      } catch {
        tags = req.body.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }
    } else if (Array.isArray(req.body.tags)) {
      tags = req.body.tags.map(String);
    }
  }

  const result = await uploadResource(userId(req), file, {
    title,
    description: req.body.description,
    type,
    classId: req.body.classId || undefined,
    subjectId: req.body.subjectId || undefined,
    courseId: req.body.courseId || undefined,
    lessonId: req.body.lessonId || undefined,
    tags,
    sharedScope: req.body.sharedScope,
  });

  res.status(201).json(result);
}

export async function updateResourceHandler(req: Request, res: Response) {
  const id = String(req.params.id);
  const payload = updateBodySchema.parse(req.body);
  
  // Map explicit nulls to undefined to avoid Type issues in service
  const cleanedPayload: any = { ...payload };
  if (cleanedPayload.classId === null) cleanedPayload.classId = undefined;
  if (cleanedPayload.subjectId === null) cleanedPayload.subjectId = undefined;
  if (cleanedPayload.courseId === null) cleanedPayload.courseId = undefined;
  if (cleanedPayload.lessonId === null) cleanedPayload.lessonId = undefined;

  const result = await updateResource(userId(req), id, cleanedPayload);
  res.json(result);
}

export async function deleteResourceHandler(req: Request, res: Response) {
  const id = String(req.params.id);
  const result = await deleteResource(userId(req), id);
  res.json(result);
}

export async function getFoldersHandler(req: Request, res: Response) {
  const result = await getFolders(userId(req));
  res.json(result);
}
