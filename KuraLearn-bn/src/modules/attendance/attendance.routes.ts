import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  markAttendanceController,
  getAnalyticsController,
  getStudentRiskController,
  calculateRiskAIController,
  getSmartSuggestionsController,
  getAlertsController,
  updateSchoolAnalyticsController,

  getGridController,
  getSummaryController,
  exportAttendanceController,
  getStudentHistoryController,
  getMyHistoryController,
  getAcademicPeriodsController
} from "./attendance.controller.js";

export const attendanceRouter = Router();

const staffRoles = ["TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"] as const;

attendanceRouter.use(requireAuth);

attendanceRouter.post("/mark", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN"), asyncHandler(markAttendanceController));
attendanceRouter.get("/analytics", requireRole(...staffRoles), asyncHandler(getAnalyticsController));
attendanceRouter.get("/student/:studentId/risk", asyncHandler(getStudentRiskController));
attendanceRouter.post("/student/:studentId/risk/calculate", requireRole("TEACHER", "HEAD_TEACHER", "ADMIN"), asyncHandler(calculateRiskAIController));
attendanceRouter.get("/suggestions", requireRole(...staffRoles), asyncHandler(getSmartSuggestionsController));
attendanceRouter.get("/alerts", requireRole(...staffRoles), asyncHandler(getAlertsController));
attendanceRouter.get("/grid", requireRole(...staffRoles), asyncHandler(getGridController));
attendanceRouter.get("/summary", requireRole(...staffRoles), asyncHandler(getSummaryController));
attendanceRouter.get("/export/:format", requireRole(...staffRoles), asyncHandler(exportAttendanceController));
attendanceRouter.get("/history/me", requireRole("STUDENT"), asyncHandler(getMyHistoryController));
attendanceRouter.get("/student/:studentId/history", asyncHandler(getStudentHistoryController));
attendanceRouter.get("/periods", asyncHandler(getAcademicPeriodsController));
attendanceRouter.post("/analytics/update", requireRole("HEAD_TEACHER", "ADMIN"), asyncHandler(updateSchoolAnalyticsController));

