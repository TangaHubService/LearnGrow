import { Router, type Request } from "express";
import { z } from "zod";
import { asyncHandler } from "../../http/async-handler.js";
import { resolveActorSchoolId, assertClassInSchool } from "../../middleware/access.js";
import { getAuthenticatedUser, requireAuth, requireRole } from "../../middleware/auth.js";
import {
  getCurriculumReference,
  getSyllabusCoverage,
  importSyllabus,
  listSyllabusUnits,
  syllabusImportSchema,
} from "./syllabus.service.js";

export const syllabusRouter = Router();

const staffRoles = ["TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"] as const;
const subjectQuery = z.object({ subjectId: z.string().uuid(), classId: z.string().uuid().optional() });

const userId = (req: Request) => getAuthenticatedUser(req).sub;

syllabusRouter.use(requireAuth);

/** Generic competences, cross-cutting issues and the national grading preset. */
syllabusRouter.get("/reference", (_req, res) => {
  res.json(getCurriculumReference());
});

syllabusRouter.get(
  "/units",
  requireRole(...staffRoles),
  asyncHandler(async (req, res) => {
    const { subjectId } = subjectQuery.parse(req.query);
    res.json(await listSyllabusUnits(subjectId));
  }),
);

syllabusRouter.get(
  "/coverage",
  requireRole(...staffRoles),
  asyncHandler(async (req, res) => {
    const { subjectId, classId } = subjectQuery.parse(req.query);
    const schoolId = await resolveActorSchoolId(userId(req));
    if (classId) await assertClassInSchool(classId, schoolId);
    res.json(await getSyllabusCoverage(schoolId, subjectId, classId));
  }),
);

/** The syllabus is national, so only platform admins can load or change it. */
syllabusRouter.post(
  "/import",
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const payload = syllabusImportSchema.parse(req.body);
    res.status(201).json(await importSyllabus(payload));
  }),
);
