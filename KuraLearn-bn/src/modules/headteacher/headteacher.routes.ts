import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as controller from "./headteacher.controller.js";
import { staffRouter } from "../staff/staff.routes.js";

export const headteacherRouter = Router();

headteacherRouter.use(requireAuth, requireRole("HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"));

// Mount staff management sub-router
headteacherRouter.use("/staff", staffRouter);


headteacherRouter.get("/dashboard", asyncHandler(controller.getDashboard));
headteacherRouter.get("/school-info", asyncHandler(controller.getSchoolInfo));

headteacherRouter.get("/teachers", asyncHandler(controller.getTeachers));
headteacherRouter.get("/teachers/:id", asyncHandler(controller.getTeacherDetail));
headteacherRouter.get("/teachers/:id/workload", asyncHandler(controller.getTeacherWorkload));

headteacherRouter.get("/students", asyncHandler(controller.getStudents));
headteacherRouter.get("/students/:id", asyncHandler(controller.getStudentDetail));
headteacherRouter.get("/students/:id/risk", asyncHandler(controller.getStudentRisk));

headteacherRouter.get("/attendance", asyncHandler(controller.getAttendanceOverview));
headteacherRouter.get("/attendance/trends", asyncHandler(controller.getAttendanceTrends));
headteacherRouter.get("/attendance/class/:classId", asyncHandler(controller.getClassAttendance));
headteacherRouter.get("/attendance/submission-status", asyncHandler(controller.getTeacherAttendanceStatus));

headteacherRouter.get("/marks/pending", asyncHandler(controller.getPendingMarks));
headteacherRouter.get("/marks/approved", asyncHandler(controller.getApprovedMarks));
headteacherRouter.post("/marks/:id/approve", asyncHandler(controller.approveMark));
headteacherRouter.post("/marks/:id/reject", asyncHandler(controller.rejectMark));
headteacherRouter.post("/marks/:id/lock", asyncHandler(controller.lockMark));
headteacherRouter.post("/marks/:id/unlock", asyncHandler(controller.unlockMark));
headteacherRouter.get("/marks/audit/:markId", asyncHandler(controller.getMarkAuditLog));

headteacherRouter.get("/reports", asyncHandler(controller.getReports));
headteacherRouter.post("/reports/generate", asyncHandler(controller.generateReport));
headteacherRouter.get("/reports/:id", asyncHandler(controller.getReportDetail));
headteacherRouter.put("/reports/:id/comments", asyncHandler(controller.updateHeadteacherComment));
headteacherRouter.post("/reports/:id/approve", asyncHandler(controller.approveReport));

headteacherRouter.get("/analytics/performance", asyncHandler(controller.getPerformanceAnalytics));
headteacherRouter.get("/analytics/attendance", asyncHandler(controller.getAttendanceAnalytics));
headteacherRouter.get("/analytics/comparison", asyncHandler(controller.getComparisonAnalytics));

headteacherRouter.get("/parents", asyncHandler(controller.getParents));
headteacherRouter.get("/parents/:id/children", asyncHandler(controller.getParentChildren));
headteacherRouter.get("/parents/:id/messages", asyncHandler(controller.getParentMessages));
headteacherRouter.get("/parent-engagement", asyncHandler(controller.getParentEngagement));

headteacherRouter.post("/ai/insights", asyncHandler(controller.getAIInsights));
headteacherRouter.post("/ai/action-plan", asyncHandler(controller.getAIActionPlan));
headteacherRouter.post("/ai/summary", asyncHandler(controller.getAISchoolSummary));