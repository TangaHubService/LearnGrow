import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import {
  goalCreateSchema,
  goalUpdateSchema,
  libraryQuerySchema,
  messageCreateSchema,
  practiceAttemptSchema,
  profileSetupSchema,
  profileUpdateSchema,
  progressSchema,
  quizSubmitSchema
} from "./platform.schemas.js";
import {
  listLevels,
  completeLesson,
  createGoal,
  createMessage,
  getAnnouncements,
  getAdminPlaceholder,
  getCoursesForSubject,
  getGoals,
  getLibraryResource,
  getLesson,
  getMessageThread,
  getMySubjects,
  getParentDashboard,
  getQuiz,
  getQuizAttemptResults,
  getStudentAnalytics,
  getStudentAttendanceSummary,
  getStudentCertificates,
  getStudentDashboard,
  getStudentMarks,
  getStudentNationalExams,
  getStudentPathway,
  getStudentProfile,
  getStudentReportCards,
  getStudentRewards,
  getStudentTimetable,
  getSubjectsForLevel,
  listLibraryResources,
  listMessages,
  listNotifications,
  markNotificationRead,
  recordPracticeAttempt,
  setupStudentProfile,
  submitQuiz,
  updateGoal,
  updateLessonProgress,
  updateStudentProfile
} from "./platform.service.js";

export async function getMeStudentController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ student: await getStudentProfile(user.sub) });
}

export async function setupStudentProfileController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = profileSetupSchema.parse(req.body);
  res.status(201).json({ student: await setupStudentProfile(user.sub, payload) });
}

export async function updateStudentProfileController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = profileUpdateSchema.parse(req.body);
  res.json({ student: await updateStudentProfile(user.sub, payload) });
}

export async function dashboardController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ dashboard: await getStudentDashboard(user.sub) });
}

export async function announcementsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ announcements: await getAnnouncements(user.sub) });
}

export async function subjectsForLevelController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ subjects: await getSubjectsForLevel(String(req.params.levelId), user.sub) });
}

export async function mySubjectsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ subjects: await getMySubjects(user.sub) });
}

export async function coursesForSubjectController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json(await getCoursesForSubject(String(req.params.subjectId), user.sub));
}

export async function lessonController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json(await getLesson(String(req.params.id), user.sub));
}

export async function lessonProgressController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = progressSchema.parse(req.body);
  res.json({ progress: await updateLessonProgress(String(req.params.id), user.sub, payload) });
}

export async function lessonCompleteController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ progress: await completeLesson(String(req.params.id), user.sub, String(req.body?.deviceType ?? "web")) });
}

export async function practiceAttemptController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = practiceAttemptSchema.parse(req.body);
  res.status(201).json({ attempt: await recordPracticeAttempt(user.sub, payload) });
}

export async function quizController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ quiz: await getQuiz(String(req.params.id), user.sub) });
}

export async function quizSubmitController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = quizSubmitSchema.parse(req.body);
  res.status(201).json(await submitQuiz(String(req.params.id), user.sub, payload));
}

export async function quizResultsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ results: await getQuizAttemptResults(String(req.params.id), user.sub) });
}

export async function analyticsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ analytics: await getStudentAnalytics(user.sub) });
}

export async function rewardsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ rewards: await getStudentRewards(user.sub) });
}

export async function certificatesController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ certificates: await getStudentCertificates(user.sub) });
}

export async function libraryController(req: Request, res: Response) {
  const query = libraryQuerySchema.parse(req.query);
  res.json({ resources: await listLibraryResources(query) });
}

export async function libraryResourceController(req: Request, res: Response) {
  res.json({ resource: await getLibraryResource(String(req.params.id)) });
}

export async function goalsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ goals: await getGoals(user.sub) });
}

export async function createGoalController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = goalCreateSchema.parse(req.body);
  res.status(201).json({ goal: await createGoal(user.sub, payload) });
}

export async function updateGoalController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = goalUpdateSchema.parse(req.body);
  res.json({ goal: await updateGoal(String(req.params.id), user.sub, payload) });
}

export async function messagesController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ threads: await listMessages(user.sub) });
}

export async function messageThreadController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ messages: await getMessageThread(user.sub, String(req.params.threadId)) });
}

export async function createMessageController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const payload = messageCreateSchema.parse(req.body);
  res.status(201).json({ message: await createMessage(user.sub, payload) });
}

export async function notificationsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ notifications: await listNotifications(user.sub) });
}

export async function parentDashboardController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ dashboard: await getParentDashboard(user.sub) });
}

export async function readNotificationController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ notification: await markNotificationRead(user.sub, String(req.params.id)) });
}

export async function studentMarksController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ marks: await getStudentMarks(user.sub) });
}

export async function studentReportCardsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ reportCards: await getStudentReportCards(user.sub) });
}

export async function studentTimetableController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ timetable: await getStudentTimetable(user.sub) });
}

export async function studentNationalExamsController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json(await getStudentNationalExams(user.sub));
}

export async function studentAttendanceController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ attendance: await getStudentAttendanceSummary(user.sub) });
}

export async function studentPathwayController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  res.json({ pathway: await getStudentPathway(user.sub) });
}

export async function adminPlaceholderController(req: Request, res: Response) {
  res.json(await getAdminPlaceholder(String(req.params.resource)));
}

export async function levelsController(_req: Request, res: Response) {
  res.json({ levels: await listLevels() });
}
