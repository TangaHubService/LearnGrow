import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  archiveLessonController,
  archiveClassController,
  archiveResourceController,
  auditLogsController,
  classDetailsController,
  createClassController,
  createLessonController,
  createResourceController,
  createStudentController,
  dashboardController,
  dashboardAssessmentsController,
  dashboardClassesController,
  dashboardClassAttendanceController,
  dashboardLearnersNeedingSupportController,
  dashboardNotificationsController,
  dashboardProfileController,
  dashboardRecentAiOutputsController,
  dashboardScheduleController,
  dashboardStatsController,
  duplicateLessonController,
  endDeliveryController,
  listAiOutputsController,
  listClassesController,
  listLessonsController,
  listStudentsController,
  exportStudentsPdfController,
  exportStudentsExcelController,
  messagesController,
  notificationsController,
  publishLessonController,
  referenceDataController,
  reportsController,
  resourcesController,
  saveAiOutputController,
  sendMessageController,
  startDeliveryController,
  updateResourceController,
  updateClassController,
  updateDeliveryController,
  updateLessonController,
  updateStudentController,
  submitAttendanceController,
  saveMarksController,
  listLessonPlansController,
  createLessonPlanController,
  getLessonPlanDetailsController,
  updateLessonPlanController,
  deleteLessonPlanController,
  publishLessonPlanController,
  duplicateLessonPlanController,
  archiveLessonPlanController
} from "./teacher.controller.js";

export const teacherRouter = Router();

teacherRouter.use(requireAuth, requireRole("TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"));

teacherRouter.get("/dashboard", asyncHandler(dashboardController));
teacherRouter.get("/dashboard/profile", asyncHandler(dashboardProfileController));
teacherRouter.get("/dashboard/stats", asyncHandler(dashboardStatsController));
teacherRouter.get("/dashboard/schedule", asyncHandler(dashboardScheduleController));
teacherRouter.get("/dashboard/classes", asyncHandler(dashboardClassesController));
teacherRouter.get("/dashboard/class-attendance", asyncHandler(dashboardClassAttendanceController));
teacherRouter.get("/dashboard/notifications", asyncHandler(dashboardNotificationsController));
teacherRouter.get("/dashboard/assessments", asyncHandler(dashboardAssessmentsController));
teacherRouter.get("/dashboard/learners-needing-support", asyncHandler(dashboardLearnersNeedingSupportController));
teacherRouter.get("/dashboard/recent-ai-outputs", asyncHandler(dashboardRecentAiOutputsController));
teacherRouter.get("/reference-data", asyncHandler(referenceDataController));

teacherRouter.get("/classes", asyncHandler(listClassesController));
teacherRouter.post("/classes", asyncHandler(createClassController));
teacherRouter.get("/classes/:id", asyncHandler(classDetailsController));
teacherRouter.put("/classes/:id", asyncHandler(updateClassController));
teacherRouter.post("/classes/:id/archive", asyncHandler(archiveClassController));

teacherRouter.get("/students", asyncHandler(listStudentsController));
teacherRouter.get("/students/export/pdf", asyncHandler(exportStudentsPdfController));
teacherRouter.get("/students/export/excel", asyncHandler(exportStudentsExcelController));
teacherRouter.post("/students", asyncHandler(createStudentController));
teacherRouter.put("/students/:id", asyncHandler(updateStudentController));

teacherRouter.get("/lessons", asyncHandler(listLessonsController));
teacherRouter.post("/lessons", asyncHandler(createLessonController));
teacherRouter.put("/lessons/:id", asyncHandler(updateLessonController));
teacherRouter.post("/lessons/:id/publish", asyncHandler(publishLessonController));
teacherRouter.post("/lessons/:id/duplicate", asyncHandler(duplicateLessonController));
teacherRouter.post("/lessons/:id/archive", asyncHandler(archiveLessonController));

teacherRouter.get("/lesson-plans", asyncHandler(listLessonPlansController));
teacherRouter.post("/lesson-plans", asyncHandler(createLessonPlanController));
teacherRouter.get("/lesson-plans/:id", asyncHandler(getLessonPlanDetailsController));
teacherRouter.put("/lesson-plans/:id", asyncHandler(updateLessonPlanController));
teacherRouter.delete("/lesson-plans/:id", asyncHandler(deleteLessonPlanController));
teacherRouter.post("/lesson-plans/:id/publish", asyncHandler(publishLessonPlanController));
teacherRouter.post("/lesson-plans/:id/duplicate", asyncHandler(duplicateLessonPlanController));
teacherRouter.post("/lesson-plans/:id/archive", asyncHandler(archiveLessonPlanController));
teacherRouter.post("/delivery-sessions", asyncHandler(startDeliveryController));
teacherRouter.put("/delivery-sessions/:id", asyncHandler(updateDeliveryController));
teacherRouter.post("/delivery-sessions/:id/end", asyncHandler(endDeliveryController));



teacherRouter.get("/reports", asyncHandler(reportsController));
teacherRouter.get("/messages", asyncHandler(messagesController));
teacherRouter.post("/messages", asyncHandler(sendMessageController));
teacherRouter.get("/resources", asyncHandler(resourcesController));
teacherRouter.post("/resources", asyncHandler(createResourceController));
teacherRouter.put("/resources/:id", asyncHandler(updateResourceController));
teacherRouter.post("/resources/:id/archive", asyncHandler(archiveResourceController));
teacherRouter.get("/notifications", asyncHandler(notificationsController));
teacherRouter.get("/audit-logs", asyncHandler(auditLogsController));
teacherRouter.post("/ai-outputs", asyncHandler(saveAiOutputController));
teacherRouter.get("/ai-outputs", asyncHandler(listAiOutputsController));

teacherRouter.post("/attendance", asyncHandler(submitAttendanceController));
teacherRouter.post("/marks", asyncHandler(saveMarksController));
