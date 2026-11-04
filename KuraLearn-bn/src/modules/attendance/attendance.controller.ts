import { Request, Response } from "express";
import * as attendanceService from "./attendance.service.js";
import { getStudentByUserId } from "../platform/platform.service.js";
import { assertCanViewStudent, assertClassInSchool, assertSchoolAccess } from "../../middleware/access.js";
import { AppError } from "../../http/errors.js";
import { prisma } from "../../prisma/client.js";

export async function markAttendanceController(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const { schoolId, classId, records } = req.body ?? {};
  await assertSchoolAccess(userId, schoolId);
  await assertClassInSchool(classId, schoolId);

  const studentIds = [...new Set<string>((Array.isArray(records) ? records : []).map((record: any) => record?.studentId))];
  const studentsInSchool = await prisma.student.count({ where: { id: { in: studentIds }, schoolId } });
  if (studentsInSchool !== studentIds.length) {
    throw new AppError(403, "Attendance can only be marked for students in this school", "STUDENT_FORBIDDEN");
  }

  const result = await attendanceService.markAttendance(userId, req.body);
  res.json({ success: true, data: result });
}

export async function getAnalyticsController(req: Request, res: Response) {
  const schoolId = req.query.schoolId as string;
  const filters = {
    classId: req.query.classId as string,
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string
  };
  await assertSchoolAccess((req as any).user.sub, schoolId);
  if (filters.classId) await assertClassInSchool(filters.classId, schoolId);
  const result = await attendanceService.getAnalytics(schoolId, filters);
  res.json({ success: true, data: result });
}

export async function getStudentRiskController(req: Request, res: Response) {
  const studentId = req.params.studentId as string;
  if (!studentId) {
    res.status(400).json({ error: "Missing studentId parameter" });
    return;
  }
  await assertCanViewStudent((req as any).user.sub, studentId);
  const result = await attendanceService.getStudentRisk(studentId);
  res.json({ success: true, data: result });
}

export async function calculateRiskAIController(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const studentId = req.params.studentId as string;
  if (!studentId) {
    res.status(400).json({ error: "Missing studentId parameter" });
    return;
  }
  await assertCanViewStudent(userId, studentId);
  const result = await attendanceService.calculateStudentRiskAI(userId, studentId);
  res.json({ success: true, data: result });
}

export async function getSmartSuggestionsController(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const role = (req as any).user.role || (req as any).user.roles?.[0];
  const context = {
    schoolId: req.query.schoolId as string,
    classId: req.query.classId as string,
    studentId: req.query.studentId as string
  };
  if (context.schoolId) {
    await assertSchoolAccess(userId, context.schoolId);
    if (context.classId) await assertClassInSchool(context.classId, context.schoolId);
  }
  if (context.studentId) await assertCanViewStudent(userId, context.studentId);
  const result = await attendanceService.generateSmartSuggestions(userId, role, context);
  res.json({ success: true, data: result });
}

export async function getAlertsController(req: Request, res: Response) {
  const schoolId = req.query.schoolId as string;
  const studentId = req.query.studentId as string | undefined;
  if (!schoolId) {
    res.status(400).json({ error: "Missing schoolId query parameter" });
    return;
  }
  await assertSchoolAccess((req as any).user.sub, schoolId);
  const result = await attendanceService.getAttendanceAlerts(schoolId, studentId);
  res.json({ success: true, data: result });
}

export async function updateSchoolAnalyticsController(req: Request, res: Response) {
  const schoolId = req.body.schoolId;
  await assertSchoolAccess((req as any).user.sub, schoolId);
  const result = await attendanceService.updateSchoolAttendanceAnalytics(schoolId);
  res.json({ success: true, data: result });
}
export async function getGridController(req: Request, res: Response) {
  const schoolId = req.query.schoolId as string;
  const classId = req.query.classId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const subjectId = req.query.subjectId as string | undefined;
  const search = req.query.search as string | undefined;
  const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const status = req.query.status as string | undefined;
  
  if (!schoolId || !classId || !startDate || !endDate) {
    res.status(400).json({ error: "Missing required query parameters: schoolId, classId, startDate, endDate" });
    return;
  }
  
  await assertSchoolAccess((req as any).user.sub, schoolId);
  await assertClassInSchool(classId, schoolId);
  const result = await attendanceService.getAttendanceGrid(schoolId, classId, startDate, endDate, subjectId, search, page, limit, status);
  res.json({ success: true, data: result });
}

export async function getSummaryController(req: Request, res: Response) {
  const schoolId = req.query.schoolId as string;
  const classId = req.query.classId as string | undefined;
  const subjectId = req.query.subjectId as string | undefined;
  const date = req.query.date as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const period = req.query.period as string | undefined;

  if (!schoolId || (!date && (!startDate || !endDate))) {
    res.status(400).json({ error: "Missing required query parameters: schoolId and date or startDate/endDate" });
    return;
  }

  await assertSchoolAccess((req as any).user.sub, schoolId);
  if (classId) await assertClassInSchool(classId, schoolId);
  const result = await attendanceService.getAttendanceSummary({
    schoolId,
    classId,
    subjectId,
    date,
    startDate,
    endDate,
    period
  });
  res.json({ success: true, data: result });
}

export async function exportAttendanceController(req: Request, res: Response) {
  const schoolId = req.query.schoolId as string;
  const classId = req.query.classId as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const subjectId = req.query.subjectId as string | undefined;
  const format = req.params.format; // pdf or excel

  if (!schoolId || !classId || !startDate || !endDate) {
    res.status(400).json({ error: "Missing required query parameters: schoolId, classId, startDate, endDate" });
    return;
  }

  await assertSchoolAccess((req as any).user.sub, schoolId);
  await assertClassInSchool(classId, schoolId);

  // Fetch data for export
  const { students, records } = await attendanceService.getAttendanceGrid(schoolId, classId, startDate, endDate, subjectId);

  if (format === "csv" || format === "excel") {
    // For now, let's generate a simple CSV
    let csv = "Student Name,Student Code,";
    // Get unique dates
    const dates = Array.from(new Set(records.map(r => r.date.toISOString().split("T")[0]))).sort();
    csv += dates.join(",") + "\n";

    students.forEach(student => {
      csv += `"${student.user.name}","${student.studentCode || ""}",`;
      const row = dates.map(date => {
        const record = records.find(r => r.studentId === student.id && r.date.toISOString().split("T")[0] === date);
        return record ? record.status : "-";
      });
      csv += row.join(",") + "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=attendance_${classId}_${startDate}.csv`);
    res.send(csv);
  } else {
    res.status(400).json({ error: "Invalid format. Supported: csv, excel" });
  }
}


export async function getStudentHistoryController(req: Request, res: Response) {
  const studentId = req.params.studentId as string;
  const filters = {
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string
  };
  await assertCanViewStudent((req as any).user.sub, studentId);
  const result = await attendanceService.getStudentHistory(studentId, filters);
  res.json({ success: true, data: result });
}

export async function getMyHistoryController(req: Request, res: Response) {
  const userId = (req as any).user.sub;
  const student = await getStudentByUserId(userId);
  const filters = {
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string
  };
  const result = await attendanceService.getStudentHistory(student.id, filters);
  res.json({ success: true, data: result });
}

export async function getAcademicPeriodsController(req: Request, res: Response) {
  const schoolId = req.query.schoolId as string;
  if (!schoolId) {
    res.status(400).json({ error: "Missing schoolId query parameter" });
    return;
  }
  await assertSchoolAccess((req as any).user.sub, schoolId, { allowGuardians: true });
  const result = await attendanceService.getAcademicPeriods(schoolId);
  res.json({ success: true, data: result });
}
