import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import {
  generateCSV,
  generateExcelXML,
  generatePDFHtml,
  logExport,
  exportAttendance,
  exportMarks,
  exportStudents,
} from "./export.service.js";

export async function exportAttendanceCSV(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const { classId, startDate, endDate } = req.query as any;
  const schoolId = req.tenantId!;

  const { columns, rows } = await exportAttendance(schoolId, classId, startDate, endDate);
  const csv = generateCSV(columns, rows);

  await logExport(schoolId, user.sub, "CSV", "Attendance", { classId, startDate, endDate });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="attendance-export-${Date.now()}.csv"`);
  res.send(csv);
}

export async function exportAttendanceExcel(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const { classId, startDate, endDate } = req.query as any;
  const schoolId = req.tenantId!;

  const { columns, rows } = await exportAttendance(schoolId, classId, startDate, endDate);
  const xml = generateExcelXML(columns, rows);

  await logExport(schoolId, user.sub, "EXCEL", "Attendance", { classId, startDate, endDate });

  res.setHeader("Content-Type", "application/vnd.ms-excel");
  res.setHeader("Content-Disposition", `attachment; filename="attendance-export-${Date.now()}.xls"`);
  res.send(xml);
}

export async function exportAttendancePDF(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const { classId, startDate, endDate } = req.query as any;
  const schoolId = req.tenantId!;

  const { columns, rows } = await exportAttendance(schoolId, classId, startDate, endDate);
  const html = generatePDFHtml("Attendance Report", columns, rows);

  await logExport(schoolId, user.sub, "PDF", "Attendance", { classId, startDate, endDate });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="attendance-export-${Date.now()}.pdf"`);
  res.send(html);
}

export async function exportMarksCSV(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const { classId, subjectId, termId } = req.query as any;
  const schoolId = req.tenantId!;

  const { columns, rows } = await exportMarks(schoolId, classId, subjectId, termId);
  const csv = generateCSV(columns, rows);

  await logExport(schoolId, user.sub, "CSV", "Marks", { classId, subjectId, termId });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="marks-export-${Date.now()}.csv"`);
  res.send(csv);
}

export async function exportMarksExcel(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const { classId, subjectId, termId } = req.query as any;
  const schoolId = req.tenantId!;

  const { columns, rows } = await exportMarks(schoolId, classId, subjectId, termId);
  const xml = generateExcelXML(columns, rows);

  await logExport(schoolId, user.sub, "EXCEL", "Marks", { classId, subjectId, termId });

  res.setHeader("Content-Type", "application/vnd.ms-excel");
  res.setHeader("Content-Disposition", `attachment; filename="marks-export-${Date.now()}.xls"`);
  res.send(xml);
}

export async function exportStudentsCSV(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const { classId } = req.query as any;
  const schoolId = req.tenantId!;

  const { columns, rows } = await exportStudents(schoolId, classId);
  const csv = generateCSV(columns, rows);

  await logExport(schoolId, user.sub, "CSV", "Students", { classId });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="students-export-${Date.now()}.csv"`);
  res.send(csv);
}
