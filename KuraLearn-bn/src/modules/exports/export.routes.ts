import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/permissions.js";
import { requireTenant } from "../../middleware/tenant.js";
import {
  exportAttendanceCSV,
  exportAttendanceExcel,
  exportAttendancePDF,
  exportMarksCSV,
  exportMarksExcel,
  exportStudentsCSV,
} from "./export.controller.js";

export const exportRouter = Router();

exportRouter.use(requireAuth, requireTenant);

exportRouter.get("/attendance/csv", requirePermission("export:csv"), asyncHandler(exportAttendanceCSV));
exportRouter.get("/attendance/excel", requirePermission("export:excel"), asyncHandler(exportAttendanceExcel));
exportRouter.get("/attendance/pdf", requirePermission("export:pdf"), asyncHandler(exportAttendancePDF));

exportRouter.get("/marks/csv", requirePermission("export:csv"), asyncHandler(exportMarksCSV));
exportRouter.get("/marks/excel", requirePermission("export:excel"), asyncHandler(exportMarksExcel));

exportRouter.get("/students/csv", requirePermission("export:csv"), asyncHandler(exportStudentsCSV));
