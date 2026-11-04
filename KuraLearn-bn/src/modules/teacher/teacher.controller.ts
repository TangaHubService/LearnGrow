import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import {
  classCreateSchema,
  classUpdateSchema,
  deliverySessionSchema,
  deliveryUpdateSchema,
  lessonCreateSchema,
  lessonUpdateSchema,
  listQuerySchema,
  messageCreateSchema,
  resourceCreateSchema,
  resourceUpdateSchema,
  studentCreateSchema,
  studentUpdateSchema,
  attendanceCreateSchema,
  marksCreateSchema,
  lessonPlanCreateSchema,
  lessonPlanUpdateSchema,
  classAttendanceQuerySchema
} from "./teacher.schemas.js";
import {
  archiveLesson,
  archiveTeacherClass,
  archiveResource,
  createLesson,
  createResource,
  createStudent,
  createTeacherClass,
  duplicateLesson,
  endDeliverySession,
  getAuditLogs,
  getCurrentTeacherDashboardProfile,
  getReports,
  getTeacherReferenceData,
  getTeacherClassDetails,
  getTeacherDashboard,
  getTeacherDashboardAssessments,
  getTeacherDashboardClasses,
  getTeacherDashboardClassAttendance,
  getTeacherDashboardLearnersNeedingSupport,
  getTeacherDashboardNotifications,
  getTeacherDashboardRecentAiOutputs,
  getTeacherDashboardSchedule,
  getTeacherDashboardStats,
  getTeacherNotifications,
  listAiOutputs,
  listLessons,
  listResources,
  listStudents,
  exportStudentsCsvData,
  exportStudentsPdfHtml,
  listTeacherClasses,
  listTeacherMessages,
  publishLesson,
  saveAiOutput,
  sendTeacherMessage,
  startDeliverySession,
  updateTeacherClass,
  updateDeliverySession,
  updateLesson,
  updateResource,
  updateStudent,
  submitAttendance,
  savePerformanceRecords,
  listLessonPlans,
  createLessonPlan,
  getLessonPlanDetails,
  updateLessonPlan,
  deleteLessonPlan,
  archiveLessonPlan,
  publishLessonPlan,
  duplicateLessonPlan
} from "./teacher.service.js";

const userId = (req: Request) => getAuthenticatedUser(req).sub;

export async function dashboardController(req: Request, res: Response) {
  const query = listQuerySchema.partial().parse(req.query);
  res.json({ dashboard: await getTeacherDashboard(userId(req), query) });
}

export async function dashboardProfileController(req: Request, res: Response) {
  res.json({ teacher: await getCurrentTeacherDashboardProfile(userId(req)) });
}

export async function dashboardStatsController(req: Request, res: Response) {
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  res.json({ stats: await getTeacherDashboardStats(userId(req), date) });
}

export async function dashboardScheduleController(req: Request, res: Response) {
  const date = typeof req.query.date === "string" ? req.query.date : undefined;
  res.json(await getTeacherDashboardSchedule(userId(req), date));
}

export async function dashboardClassesController(req: Request, res: Response) {
  res.json(await getTeacherDashboardClasses(userId(req)));
}

export async function dashboardClassAttendanceController(req: Request, res: Response) {
  res.json(await getTeacherDashboardClassAttendance(userId(req), classAttendanceQuerySchema.parse(req.query)));
}

export async function dashboardNotificationsController(req: Request, res: Response) {
  res.json(await getTeacherDashboardNotifications(userId(req)));
}

export async function dashboardAssessmentsController(req: Request, res: Response) {
  res.json(await getTeacherDashboardAssessments(userId(req)));
}

export async function dashboardLearnersNeedingSupportController(req: Request, res: Response) {
  res.json(await getTeacherDashboardLearnersNeedingSupport(userId(req)));
}

export async function dashboardRecentAiOutputsController(req: Request, res: Response) {
  res.json(await getTeacherDashboardRecentAiOutputs(userId(req)));
}

export async function referenceDataController(req: Request, res: Response) {
  res.json(await getTeacherReferenceData(userId(req)));
}

export async function listClassesController(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  res.json(await listTeacherClasses(userId(req), query));
}

export async function createClassController(req: Request, res: Response) {
  const payload = classCreateSchema.parse(req.body);
  res.status(201).json(await createTeacherClass(userId(req), payload));
}

export async function classDetailsController(req: Request, res: Response) {
  res.json(await getTeacherClassDetails(userId(req), String(req.params.id)));
}

export async function updateClassController(req: Request, res: Response) {
  const payload = classUpdateSchema.parse(req.body);
  res.json(await updateTeacherClass(userId(req), String(req.params.id), payload));
}

export async function archiveClassController(req: Request, res: Response) {
  res.json(await archiveTeacherClass(userId(req), String(req.params.id)));
}

export async function listStudentsController(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  res.json(await listStudents(userId(req), query));
}

export async function exportStudentsPdfController(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const html = await exportStudentsPdfHtml(userId(req), query);
  res.setHeader("Content-Type", "text/html");
  res.send(html);
}

export async function exportStudentsExcelController(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const csv = await exportStudentsCsvData(userId(req), query);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="learners_export.csv"');
  res.send(csv);
}

export async function createStudentController(req: Request, res: Response) {
  const payload = studentCreateSchema.parse(req.body);
  res.status(201).json({ student: await createStudent(userId(req), payload) });
}

export async function updateStudentController(req: Request, res: Response) {
  const payload = studentUpdateSchema.parse(req.body);
  res.json({ student: await updateStudent(userId(req), String(req.params.id), payload) });
}

export async function listLessonsController(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  res.json(await listLessons(userId(req), query));
}

export async function createLessonController(req: Request, res: Response) {
  const payload = lessonCreateSchema.parse(req.body);
  res.status(201).json({ lesson: await createLesson(userId(req), payload) });
}

export async function updateLessonController(req: Request, res: Response) {
  const payload = lessonUpdateSchema.parse(req.body);
  res.json({ lesson: await updateLesson(userId(req), String(req.params.id), payload) });
}

export async function publishLessonController(req: Request, res: Response) {
  res.json({ lesson: await publishLesson(userId(req), String(req.params.id)) });
}

export async function duplicateLessonController(req: Request, res: Response) {
  res.status(201).json({ lesson: await duplicateLesson(userId(req), String(req.params.id)) });
}

export async function archiveLessonController(req: Request, res: Response) {
  res.json({ lesson: await archiveLesson(userId(req), String(req.params.id)) });
}

export async function startDeliveryController(req: Request, res: Response) {
  const payload = deliverySessionSchema.parse(req.body);
  res.status(201).json({ session: await startDeliverySession(userId(req), payload) });
}

export async function updateDeliveryController(req: Request, res: Response) {
  const payload = deliveryUpdateSchema.parse(req.body);
  res.json({ session: await updateDeliverySession(userId(req), String(req.params.id), payload) });
}

export async function endDeliveryController(req: Request, res: Response) {
  res.json({ session: await endDeliverySession(userId(req), String(req.params.id), req.body?.summary) });
}



export async function reportsController(req: Request, res: Response) {
  const query = listQuerySchema.partial().parse(req.query);
  res.json({ reports: await getReports(userId(req), query) });
}

export async function messagesController(req: Request, res: Response) {
  res.json({ messages: await listTeacherMessages(userId(req)) });
}

export async function sendMessageController(req: Request, res: Response) {
  const payload = messageCreateSchema.parse(req.body);
  res.status(201).json({ message: await sendTeacherMessage(userId(req), payload) });
}

export async function resourcesController(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  res.json(await listResources(userId(req), query));
}

export async function createResourceController(req: Request, res: Response) {
  const payload = resourceCreateSchema.parse(req.body);
  res.status(201).json({ resource: await createResource(userId(req), payload) });
}

export async function updateResourceController(req: Request, res: Response) {
  const payload = resourceUpdateSchema.parse(req.body);
  res.json({ resource: await updateResource(userId(req), String(req.params.id), payload) });
}

export async function archiveResourceController(req: Request, res: Response) {
  res.json({ resource: await archiveResource(userId(req), String(req.params.id)) });
}

export async function notificationsController(req: Request, res: Response) {
  res.json({ notifications: await getTeacherNotifications(userId(req)) });
}

export async function auditLogsController(req: Request, res: Response) {
  res.json({ auditLogs: await getAuditLogs(userId(req)) });
}

export async function saveAiOutputController(req: Request, res: Response) {
  const currentUserId = userId(req);
  const payload = req.body;
  const aiOutput = await saveAiOutput(currentUserId, {
    taskType: payload.taskType,
    title: payload.title,
    subjectId: payload.subjectId,
    subjectName: payload.subjectName,
    classId: payload.classId,
    className: payload.className,
    levelId: payload.levelId,
    gradeLevel: payload.gradeLevel,
    topicId: payload.topicId,
    topicName: payload.topicName,
    subtopicId: payload.subtopicId,
    subtopicName: payload.subtopicName,
    output: payload.output,
    teacherRequest: payload.teacherRequest
  });
  res.json({ aiOutput });
}

export async function listAiOutputsController(req: Request, res: Response) {
  const currentUserId = userId(req);
  const { taskType, subjectId, classId } = req.query as { taskType?: string; subjectId?: string; classId?: string };
  const result = await listAiOutputs(currentUserId, { taskType, subjectId, classId });
  res.json(result);
}

export async function submitAttendanceController(req: Request, res: Response) {
  const payload = attendanceCreateSchema.parse(req.body);
  const result = await submitAttendance(userId(req), payload);
  res.json(result);
}

export async function saveMarksController(req: Request, res: Response) {
  const payload = marksCreateSchema.parse(req.body);
  const result = await savePerformanceRecords(userId(req), payload);
  res.json(result);
}

export async function listLessonPlansController(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  res.json(await listLessonPlans(userId(req), query));
}

export async function createLessonPlanController(req: Request, res: Response) {
  const payload = lessonPlanCreateSchema.parse(req.body);
  res.status(201).json({ lessonPlan: await createLessonPlan(userId(req), payload) });
}

export async function getLessonPlanDetailsController(req: Request, res: Response) {
  res.json({ lessonPlan: await getLessonPlanDetails(userId(req), String(req.params.id)) });
}

export async function updateLessonPlanController(req: Request, res: Response) {
  const payload = lessonPlanUpdateSchema.parse(req.body);
  res.json({ lessonPlan: await updateLessonPlan(userId(req), String(req.params.id), payload) });
}

export async function deleteLessonPlanController(req: Request, res: Response) {
  res.json(await deleteLessonPlan(userId(req), String(req.params.id)));
}

export async function publishLessonPlanController(req: Request, res: Response) {
  res.json({ lessonPlan: await publishLessonPlan(userId(req), String(req.params.id)) });
}

export async function duplicateLessonPlanController(req: Request, res: Response) {
  res.status(201).json({ lessonPlan: await duplicateLessonPlan(userId(req), String(req.params.id)) });
}

export async function archiveLessonPlanController(req: Request, res: Response) {
  res.json({ lessonPlan: await archiveLessonPlan(userId(req), String(req.params.id)) });
}
