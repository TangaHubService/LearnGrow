import type { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { assertCanViewStudent, assertStaffCanViewClass, getActor, toReportStudent } from "../../middleware/access.js";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import * as marksService from "./marks.service.js";

const userId = (req: Request) => getAuthenticatedUser(req).sub;

const markRecordSchema = z.object({
  studentId: z.string().uuid(),
  score: z.coerce.number().min(0).nullable().optional(),
  missingReason: z.string().trim().optional().nullable(),
  teacherComments: z.string().trim().optional().nullable()
});

const saveMarksSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  termId: z.string().uuid(),
  assessmentType: z.string().min(1),
  assessmentKey: z.string().trim().optional(),
  maxScore: z.coerce.number().positive().default(100),
  records: z.array(markRecordSchema)
});

const updateMarkSchema = z.object({
  score: z.coerce.number().min(0).nullable().optional(),
  teacherComments: z.string().optional(),
  headteacherComments: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED"]).optional(),
  isLocked: z.boolean().optional(),
  reason: z.string().optional()
});

const approveMarksSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  termId: z.string().uuid(),
  assessmentType: z.string()
});

const commentSchema = z.object({
  comment: z.string().trim().optional()
});

const gradingScaleItemSchema = z.object({
  minPercentage: z.coerce.number().min(0).max(100),
  maxPercentage: z.coerce.number().min(0).max(100),
  grade: z.string().min(1),
  description: z.string().optional(),
  points: z.coerce.number().int().positive().optional(),
  remarks: z.string().optional()
});

const gradingScalesSchema = z.object({
  scales: z.array(gradingScaleItemSchema)
});

const importMarksSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  termId: z.string().uuid(),
  assessmentType: z.string(),
  assessmentKey: z.string().trim().optional(),
  maxScore: z.coerce.number().positive().default(100),
  records: z.array(z.object({
    studentCode: z.string(),
    score: z.coerce.number().min(0)
  }))
});

const listQuerySchema = z.object({
  schoolId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  termId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  status: z.string().optional(),
  assessmentType: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional()
});

const reportCardsQuerySchema = z.object({
  schoolId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  termId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional()
});

const generateReportsSchema = z.object({
  classId: z.string().uuid(),
  termId: z.string().uuid()
});

const approveReportSchema = z.object({
  headteacherComments: z.string().optional(),
  promotionRecommendation: z.string().optional()
});

const transcriptSchema = z.object({
  studentId: z.string().uuid()
});

const legacySchoolRoles = new Set<UserRole>([
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.HEAD_TEACHER,
  UserRole.DIRECTOR_OF_STUDIES
]);

const guardianViewRoles = new Set<UserRole>([
  UserRole.STUDENT,
  UserRole.PARENT
]);

async function resolveLegacySchoolId(currentUserId: string) {
  const userRecord = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: { teacher: true, student: true, staff: true }
  });
  if (!userRecord) throw new AppError(404, "User not found", "USER_NOT_FOUND");

  let schoolId = userRecord.teacher?.schoolId || userRecord.student?.schoolId || userRecord.staff?.schoolId;
  if (!schoolId && userRecord.role === UserRole.SUPER_ADMIN) {
    const firstSchool = await prisma.school.findFirst({ orderBy: { name: "asc" } });
    schoolId = firstSchool?.id;
  }
  if (!schoolId) throw new AppError(400, "User is not linked to any school context", "SCHOOL_CONTEXT_REQUIRED");
  return { schoolId, userRecord };
}

export async function getMarksContextController(req: Request, res: Response) {
  const currentUserId = userId(req);
  const query = z.object({
    schoolId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    termId: z.string().uuid().optional()
  }).parse(req.query);
  const context = await marksService.getMarksContext(currentUserId, query);
  res.json(context);
}

export async function listMarkSubmissionsController(req: Request, res: Response) {
  const submissions = await marksService.listMarkSubmissions(userId(req), listQuerySchema.parse(req.query));
  res.json(submissions);
}

export async function getMarkSubmissionController(req: Request, res: Response) {
  const detail = await marksService.getMarkSubmissionDetail(userId(req), String(req.params.id));
  res.json(detail);
}

export async function saveDraftSubmissionController(req: Request, res: Response) {
  const detail = await marksService.saveMarkSubmissionDraft(userId(req), saveMarksSchema.parse(req.body));
  res.status(201).json(detail);
}

export async function submitMarkSubmissionController(req: Request, res: Response) {
  const detail = await marksService.submitMarkSubmission(userId(req), String(req.params.id));
  res.json(detail);
}

export async function approveMarkSubmissionController(req: Request, res: Response) {
  const { comment } = commentSchema.parse(req.body);
  const detail = await marksService.approveMarkSubmission(userId(req), String(req.params.id), comment);
  res.json(detail);
}

export async function rejectMarkSubmissionController(req: Request, res: Response) {
  const { comment } = commentSchema.parse(req.body);
  const detail = await marksService.rejectMarkSubmission(userId(req), String(req.params.id), comment);
  res.json(detail);
}

export async function requestCorrectionController(req: Request, res: Response) {
  const { comment } = commentSchema.parse(req.body);
  const detail = await marksService.requestMarkSubmissionCorrection(userId(req), String(req.params.id), comment);
  res.json(detail);
}

export async function unlockMarkSubmissionController(req: Request, res: Response) {
  const { comment } = commentSchema.parse(req.body);
  const detail = await marksService.unlockMarkSubmission(userId(req), String(req.params.id), comment);
  res.json(detail);
}

export async function saveMarksController(req: Request, res: Response) {
  const payload = saveMarksSchema.parse(req.body);
  const result = await marksService.recordMarks(userId(req), {
    schoolId: "",
    ...payload,
    records: payload.records.map((record) => ({
      studentId: record.studentId,
      score: record.score ?? 0,
      teacherComments: record.teacherComments || undefined
    }))
  });
  res.status(201).json(result);
}

export async function getMarksController(req: Request, res: Response) {
  const currentUserId = userId(req);
  const actor = await getActor(currentUserId);
  const requestedStudentId = typeof req.query.studentId === "string" ? req.query.studentId : undefined;
  const isGuardian = guardianViewRoles.has(actor.role);

  // Students only get their own marks and parents a linked child's, and both only once approved.
  let studentId = requestedStudentId;
  let schoolId: string;
  if (actor.role === UserRole.STUDENT) {
    if (!actor.studentId || !actor.schoolId) throw new AppError(403, "You do not have access to these marks", "MARKS_FORBIDDEN");
    studentId = actor.studentId;
    schoolId = actor.schoolId;
  } else if (actor.role === UserRole.PARENT) {
    if (!requestedStudentId) throw new AppError(400, "studentId is required", "STUDENT_REQUIRED");
    await assertCanViewStudent(currentUserId, requestedStudentId);
    const child = await prisma.student.findUnique({ where: { id: requestedStudentId }, select: { schoolId: true } });
    if (!child?.schoolId) throw new AppError(403, "You do not have access to these marks", "MARKS_FORBIDDEN");
    schoolId = child.schoolId;
  } else {
    ({ schoolId } = await resolveLegacySchoolId(currentUserId));
  }

  const filters = {
    schoolId,
    classId: typeof req.query.classId === "string" ? req.query.classId : undefined,
    subjectId: typeof req.query.subjectId === "string" ? req.query.subjectId : undefined,
    termId: typeof req.query.termId === "string" ? req.query.termId : undefined,
    studentId,
    assessmentType: typeof req.query.assessmentType === "string" ? req.query.assessmentType : undefined,
    status: isGuardian ? "APPROVED" : typeof req.query.status === "string" ? req.query.status : undefined
  };

  const marks = await marksService.getMarks(filters);
  res.json({ items: marks });
}

export async function updateMarkController(req: Request, res: Response) {
  const updated = await marksService.updateSingleMark(userId(req), String(req.params.id), updateMarkSchema.parse(req.body));
  res.json(updated);
}

export async function approveMarksController(req: Request, res: Response) {
  const result = await marksService.approveClassMarks(userId(req), approveMarksSchema.parse(req.body));
  res.json(result);
}

export async function getStudentReportController(req: Request, res: Response) {
  const currentUserId = userId(req);
  const studentId = String(req.params.studentId);
  const termId = typeof req.query.termId === "string" ? req.query.termId : undefined;
  if (!termId) throw new AppError(400, "termId is required in query parameters", "TERM_REQUIRED");

  const actor = await assertCanViewStudent(currentUserId, studentId);
  const report = await marksService.getStudentReportCard(studentId, termId);
  if (guardianViewRoles.has(actor.role) && !["APPROVED", "LOCKED"].includes(report.summary.status)) {
    throw new AppError(403, "This report is not yet approved for student or parent viewing", "REPORT_NOT_APPROVED");
  }
  res.json({ ...report, student: toReportStudent(report.student) });
}

export async function getClassMarksheetController(req: Request, res: Response) {
  const classId = typeof req.query.classId === "string" ? req.query.classId : undefined;
  const termId = typeof req.query.termId === "string" ? req.query.termId : undefined;
  if (!classId || !termId) throw new AppError(400, "classId and termId are required in query parameters", "PARAMETERS_REQUIRED");

  await assertStaffCanViewClass(userId(req), classId);
  const sheet = await marksService.getClassMarksheet(classId, termId);
  res.json(sheet);
}

export async function listReportCardsController(req: Request, res: Response) {
  const result = await marksService.listReportCards(userId(req), reportCardsQuerySchema.parse(req.query));
  res.json({ ...result, items: result.items.map((item) => ({ ...item, student: toReportStudent(item.student) })) });
}

export async function generateReportCardsController(req: Request, res: Response) {
  const result = await marksService.generateReportCards(userId(req), generateReportsSchema.parse(req.body));
  res.status(201).json(result);
}

export async function getReportCardController(req: Request, res: Response) {
  const report = await marksService.getReportCardById(userId(req), String(req.params.id));
  res.json({ ...report, student: toReportStudent(report.student) });
}

export async function approveReportCardController(req: Request, res: Response) {
  const report = await marksService.approveReportCard(userId(req), String(req.params.id), approveReportSchema.parse(req.body));
  res.json(report);
}

export async function exportReportCardPdfController(req: Request, res: Response) {
  const result = await marksService.exportReportCardPdf(userId(req), String(req.params.id));
  res.json(result);
}

export async function exportClassPdfController(req: Request, res: Response) {
  const result = await marksService.exportClassReportPdf(userId(req), generateReportsSchema.parse(req.body));
  res.json(result);
}

export async function exportMarksheetPdfController(req: Request, res: Response) {
  const result = await marksService.exportClassMarksheetPdf(userId(req), generateReportsSchema.parse(req.body));
  res.json(result);
}

export async function exportTranscriptPdfController(req: Request, res: Response) {
  const payload = transcriptSchema.parse(req.body);
  await assertCanViewStudent(userId(req), payload.studentId);
  const result = await marksService.exportTranscriptPdf(userId(req), payload);
  res.json(result);
}

export async function getMarksAnalyticsController(req: Request, res: Response) {
  const query = z.object({
    schoolId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    termId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional()
  }).parse(req.query);
  const result = await marksService.getMarksAnalytics(userId(req), query);
  res.json(result);
}

export async function getAiMarksInsightsController(req: Request, res: Response) {
  const currentUserId = userId(req);
  const studentId = String(req.body.studentId || "");
  const termId = String(req.body.termId || "");
  if (!studentId || !termId) throw new AppError(400, "studentId and termId are required in body parameters", "PARAMETERS_REQUIRED");

  const insights = await marksService.getAiMarksInsights(currentUserId, studentId, termId);
  res.json(insights);
}

export async function getAiReportCardCommentController(req: Request, res: Response) {
  const currentUserId = userId(req);
  const studentId = String(req.body.studentId || "");
  const termId = String(req.body.termId || "");
  if (!studentId || !termId) throw new AppError(400, "studentId and termId are required in body parameters", "PARAMETERS_REQUIRED");

  const result = await marksService.getAiReportCardComment(currentUserId, studentId, termId);
  res.json(result);
}

export async function getGradingSettingsController(req: Request, res: Response) {
  const { schoolId } = await resolveLegacySchoolId(userId(req));
  const scales = await marksService.getGradingScales(schoolId);
  res.json({ scales });
}

export async function saveGradingSettingsController(req: Request, res: Response) {
  const payload = gradingScalesSchema.parse(req.body);
  const { schoolId, userRecord } = await resolveLegacySchoolId(userId(req));
  if (!legacySchoolRoles.has(userRecord.role)) {
    throw new AppError(403, "Only school reviewers can configure grading rules", "FORBIDDEN");
  }

  await marksService.saveGradingScales(schoolId, payload.scales);
  res.json({ success: true });
}

export async function importMarksExcelController(req: Request, res: Response) {
  const currentUserId = userId(req);
  const payload = importMarksSchema.parse(req.body);
  const { schoolId } = await resolveLegacySchoolId(currentUserId);

  const mappedRecords = [];
  for (const record of payload.records) {
    const student = await prisma.student.findFirst({
      where: { schoolId, studentCode: record.studentCode }
    });

    if (!student) {
      throw new AppError(400, `Student code ${record.studentCode} not found in this school`, "STUDENT_NOT_FOUND");
    }

    mappedRecords.push({ studentId: student.id, score: record.score });
  }

  const result = await marksService.saveMarkSubmissionDraft(currentUserId, {
    classId: payload.classId,
    subjectId: payload.subjectId,
    academicYearId: payload.academicYearId,
    termId: payload.termId,
    assessmentType: payload.assessmentType,
    assessmentKey: payload.assessmentKey,
    maxScore: payload.maxScore,
    records: mappedRecords
  });

  res.status(201).json(result);
}
