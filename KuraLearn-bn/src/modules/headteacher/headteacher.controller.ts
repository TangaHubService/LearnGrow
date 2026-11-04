import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { prisma } from "../../prisma/client.js";
import { AppError } from "../../http/errors.js";
import * as service from "./headteacher.service.js";

const userId = (req: Request) => getAuthenticatedUser(req).sub;

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || "";
  return param || "";
}

async function getSchoolIdFromUser(userIdVal: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userIdVal },
    include: { teacher: true, staff: true }
  });
  if (user?.teacher?.schoolId) {
    return user.teacher.schoolId;
  }
  if (user?.staff?.schoolId) {
    return user.staff.schoolId;
  }
  if (user?.role !== "SUPER_ADMIN") {
    throw new AppError(
      400,
      "User is not linked to any school context",
      "SCHOOL_CONTEXT_REQUIRED"
    );
  }
  const school = await prisma.school.findFirst({ orderBy: { name: "asc" } });
  if (!school) throw new AppError(404, "No school found", "SCHOOL_NOT_FOUND");
  return school.id;
}

/** The school a request is limited to, or null for a super admin, who can look at any school. */
async function schoolScope(uid: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
  return user?.role === "SUPER_ADMIN" ? null : getSchoolIdFromUser(uid);
}

async function assertTeacherInScope(uid: string, teacherId: string) {
  const schoolId = await schoolScope(uid);
  if (schoolId && !(await prisma.teacher.findFirst({ where: { id: teacherId, schoolId }, select: { id: true } }))) {
    throw new AppError(404, "Teacher not found", "TEACHER_NOT_FOUND");
  }
}

async function assertClassInScope(uid: string, classId: string) {
  const schoolId = await schoolScope(uid);
  if (schoolId && !(await prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } }))) {
    throw new AppError(404, "Class not found", "CLASS_NOT_FOUND");
  }
}

async function assertMarkInScope(uid: string, markId: string) {
  const schoolId = await schoolScope(uid);
  if (schoolId && !(await prisma.mark.findFirst({ where: { id: markId, schoolId }, select: { id: true } }))) {
    throw new AppError(404, "Mark not found", "MARK_NOT_FOUND");
  }
}

async function assertReportInScope(uid: string, reportId: string) {
  const schoolId = await schoolScope(uid);
  if (schoolId && !(await prisma.reportCard.findFirst({ where: { id: reportId, class: { schoolId } }, select: { id: true } }))) {
    throw new AppError(404, "Report not found", "REPORT_NOT_FOUND");
  }
}

async function assertParentInScope(uid: string, parentId: string) {
  const schoolId = await schoolScope(uid);
  const linked = schoolId
    ? await prisma.parent.findFirst({ where: { id: parentId, students: { some: { student: { schoolId } } } }, select: { id: true } })
    : true;
  if (!linked) throw new AppError(404, "Parent not found", "PARENT_NOT_FOUND");
}

async function assertStudentInSchool(studentId: string, schoolId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    select: { id: true }
  });
  if (!student) throw new AppError(404, "Student not found", "STUDENT_NOT_FOUND");
}

export async function getDashboard(req: Request, res: Response) {
  const uid = userId(req);
  const data = await service.getDashboard(uid);
  res.json(data);
}

export async function getSchoolInfo(req: Request, res: Response) {
  const uid = userId(req);
  const data = await service.getSchoolInfo(uid);
  res.json(data);
}

export async function getTeachers(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const filters = {
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    classId: typeof req.query.classId === "string" ? req.query.classId : undefined,
    subjectId: typeof req.query.subjectId === "string" ? req.query.subjectId : undefined
  };
  const data = await service.getTeachers(schoolId, filters);
  res.json({ items: data });
}

export async function getTeacherDetail(req: Request, res: Response) {
  const id = getParam(req.params.id);
  await assertTeacherInScope(userId(req), id);
  const data = await service.getTeacherDetail(id);
  res.json(data);
}

export async function getTeacherWorkload(req: Request, res: Response) {
  const id = getParam(req.params.id);
  await assertTeacherInScope(userId(req), id);
  const data = await service.getTeacherWorkload(id);
  res.json(data);
}

export async function getStudents(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const filters = {
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    classId: typeof req.query.classId === "string" ? req.query.classId : undefined,
    gender: typeof req.query.gender === "string" ? req.query.gender : undefined,
    hasDisability: req.query.hasDisability === "true" ? true : req.query.hasDisability === "false" ? false : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined
  };
  const data = await service.getStudents(schoolId, filters);
  res.json({ items: data });
}

export async function getStudentDetail(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const id = getParam(req.params.id);
  await assertStudentInSchool(id, schoolId);
  const data = await service.getStudentDetail(id);
  res.json(data);
}

export async function getStudentRisk(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const id = getParam(req.params.id);
  await assertStudentInSchool(id, schoolId);
  const data = await service.getStudentRisk(id);
  res.json(data);
}

export async function getAttendanceOverview(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const data = await service.getAttendanceOverview(schoolId);
  res.json(data);
}

export async function getAttendanceTrends(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const period = (req.query.period as "week" | "month") || "week";
  const data = await service.getAttendanceTrends(schoolId, period);
  res.json(data);
}

export async function getClassAttendance(req: Request, res: Response) {
  const classId = getParam(req.params.classId);
  await assertClassInScope(userId(req), classId);
  const data = await service.getClassAttendance(classId);
  res.json(data);
}

export async function getTeacherAttendanceStatus(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const data = await service.getTeacherAttendanceStatus(schoolId);
  res.json(data);
}

export async function getPendingMarks(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const filters = {
    classId: typeof req.query.classId === "string" ? req.query.classId : undefined,
    subjectId: typeof req.query.subjectId === "string" ? req.query.subjectId : undefined,
    termId: typeof req.query.termId === "string" ? req.query.termId : undefined
  };
  const data = await service.getPendingMarks(schoolId, filters);
  res.json({ items: data });
}

export async function getApprovedMarks(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const filters = {
    classId: typeof req.query.classId === "string" ? req.query.classId : undefined,
    subjectId: typeof req.query.subjectId === "string" ? req.query.subjectId : undefined,
    termId: typeof req.query.termId === "string" ? req.query.termId : undefined
  };
  const data = await service.getApprovedMarks(schoolId, filters);
  res.json({ items: data });
}

export async function approveMark(req: Request, res: Response) {
  const uid = userId(req);
  const id = getParam(req.params.id);
  await assertMarkInScope(uid, id);
  const data = await service.approveMark(uid, id);
  res.json(data);
}

export async function rejectMark(req: Request, res: Response) {
  const uid = userId(req);
  const id = getParam(req.params.id);
  const { reason } = req.body;
  if (!reason) throw new AppError(400, "Reason is required", "REASON_REQUIRED");
  await assertMarkInScope(uid, id);
  const data = await service.rejectMark(uid, id, reason);
  res.json(data);
}

export async function lockMark(req: Request, res: Response) {
  const id = getParam(req.params.id);
  await assertMarkInScope(userId(req), id);
  const data = await service.lockMark(id);
  res.json(data);
}

export async function unlockMark(req: Request, res: Response) {
  const uid = userId(req);
  const id = getParam(req.params.id);
  const { reason } = req.body;
  if (!reason) throw new AppError(400, "Reason is required", "REASON_REQUIRED");
  await assertMarkInScope(uid, id);
  const data = await service.unlockMark(uid, id, reason);
  res.json(data);
}

export async function getMarkAuditLog(req: Request, res: Response) {
  const markId = getParam(req.params.markId);
  await assertMarkInScope(userId(req), markId);
  const data = await service.getMarkAuditLog(markId);
  res.json({ items: data });
}

export async function getReports(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const filters = {
    classId: typeof req.query.classId === "string" ? req.query.classId : undefined,
    termId: typeof req.query.termId === "string" ? req.query.termId : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined
  };
  const data = await service.getReports(schoolId, filters);
  res.json({ items: data });
}

export async function generateReport(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const { classId, termId } = req.body;
  if (!classId || !termId) throw new AppError(400, "classId and termId are required", "PARAMETERS_REQUIRED");
  await assertClassInScope(uid, classId);
  const data = await service.generateReport(uid, schoolId, classId, termId);
  res.json(data);
}

export async function getReportDetail(req: Request, res: Response) {
  const id = getParam(req.params.id);
  await assertReportInScope(userId(req), id);
  const data = await service.getReportDetail(id);
  res.json(data);
}

export async function updateHeadteacherComment(req: Request, res: Response) {
  const id = getParam(req.params.id);
  const { comment } = req.body;
  if (!comment) throw new AppError(400, "Comment is required", "COMMENT_REQUIRED");
  await assertReportInScope(userId(req), id);
  const data = await service.updateHeadteacherComment(id, comment);
  res.json(data);
}

export async function approveReport(req: Request, res: Response) {
  const uid = userId(req);
  const id = getParam(req.params.id);
  await assertReportInScope(uid, id);
  const data = await service.approveReport(id, uid);
  res.json(data);
}

export async function getPerformanceAnalytics(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const filters = {
    classId: typeof req.query.classId === "string" ? req.query.classId : undefined,
    subjectId: typeof req.query.subjectId === "string" ? req.query.subjectId : undefined,
    termId: typeof req.query.termId === "string" ? req.query.termId : undefined
  };
  const data = await service.getPerformanceAnalytics(schoolId, filters);
  res.json(data);
}

export async function getAttendanceAnalytics(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const data = await service.getAttendanceAnalytics(schoolId);
  res.json(data);
}

export async function getComparisonAnalytics(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const data = await service.getComparisonAnalytics(schoolId);
  res.json(data);
}

export async function getParents(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const filters = {
    search: typeof req.query.search === "string" ? req.query.search : undefined
  };
  const data = await service.getParents(schoolId, filters);
  res.json({ items: data });
}

export async function getParentChildren(req: Request, res: Response) {
  const id = getParam(req.params.id);
  await assertParentInScope(userId(req), id);
  const data = await service.getParentChildren(id);
  res.json({ items: data });
}

export async function getParentMessages(req: Request, res: Response) {
  const id = getParam(req.params.id);
  await assertParentInScope(userId(req), id);
  const data = await service.getParentMessages(id);
  res.json({ items: data });
}

export async function getParentEngagement(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const data = await service.getParentEngagement(schoolId);
  res.json(data);
}

export async function getAIInsights(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const data = await service.getAIInsights(schoolId);
  res.json(data);
}

export async function getAIActionPlan(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const data = await service.getAIActionPlan(schoolId);
  res.json(data);
}

export async function getAISchoolSummary(req: Request, res: Response) {
  const uid = userId(req);
  const schoolId = await getSchoolIdFromUser(uid);
  const data = await service.getAISchoolSummary(schoolId);
  res.json(data);
}
