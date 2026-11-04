import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  adminPlaceholderController,
  analyticsController,
  announcementsController,
  certificatesController,
  coursesForSubjectController,
  createGoalController,
  createMessageController,
  dashboardController,
  getMeStudentController,
  goalsController,
  lessonCompleteController,
  levelsController,
  lessonController,
  lessonProgressController,
  libraryController,
  libraryResourceController,
  messageThreadController,
  messagesController,
  mySubjectsController,
  notificationsController,
  parentDashboardController,
  practiceAttemptController,
  quizController,
  quizResultsController,
  quizSubmitController,
  readNotificationController,
  rewardsController,
  setupStudentProfileController,
  studentAttendanceController,
  studentMarksController,
  studentNationalExamsController,
  studentPathwayController,
  studentReportCardsController,
  studentTimetableController,
  subjectsForLevelController,
  updateGoalController,
  updateStudentProfileController
} from "./platform.controller.js";

export const platformRouter = Router();

platformRouter.get("/students/me", requireAuth, requireRole("STUDENT"), asyncHandler(getMeStudentController));
platformRouter.put("/students/me", requireAuth, requireRole("STUDENT"), asyncHandler(updateStudentProfileController));
platformRouter.post("/students/profile-setup", requireAuth, requireRole("STUDENT"), asyncHandler(setupStudentProfileController));

platformRouter.get("/students/me/dashboard", requireAuth, requireRole("STUDENT"), asyncHandler(dashboardController));
platformRouter.get("/students/me/announcements", requireAuth, requireRole("STUDENT"), asyncHandler(announcementsController));
platformRouter.get("/levels", requireAuth, asyncHandler(levelsController));
platformRouter.get("/levels/:levelId/subjects", requireAuth, asyncHandler(subjectsForLevelController));
platformRouter.get("/students/me/subjects", requireAuth, requireRole("STUDENT"), asyncHandler(mySubjectsController));
platformRouter.get("/subjects/:subjectId/courses", requireAuth, asyncHandler(coursesForSubjectController));

platformRouter.get("/lessons/:id", requireAuth, requireRole("STUDENT"), asyncHandler(lessonController));
platformRouter.post("/lessons/:id/progress", requireAuth, requireRole("STUDENT"), asyncHandler(lessonProgressController));
platformRouter.post("/lessons/:id/complete", requireAuth, requireRole("STUDENT"), asyncHandler(lessonCompleteController));

platformRouter.post("/practice/attempts", requireAuth, requireRole("STUDENT"), asyncHandler(practiceAttemptController));

platformRouter.get("/quizzes/:id", requireAuth, requireRole("STUDENT"), asyncHandler(quizController));
platformRouter.post("/quizzes/:id/submit", requireAuth, requireRole("STUDENT"), asyncHandler(quizSubmitController));
platformRouter.get("/quiz-attempts/:id/results", requireAuth, requireRole("STUDENT"), asyncHandler(quizResultsController));

platformRouter.get("/students/me/analytics", requireAuth, requireRole("STUDENT"), asyncHandler(analyticsController));
platformRouter.get("/students/me/rewards", requireAuth, requireRole("STUDENT"), asyncHandler(rewardsController));
platformRouter.get("/students/me/certificates", requireAuth, requireRole("STUDENT"), asyncHandler(certificatesController));

platformRouter.get("/library", requireAuth, asyncHandler(libraryController));
platformRouter.get("/library/:id", requireAuth, asyncHandler(libraryResourceController));

platformRouter.get("/students/me/goals", requireAuth, requireRole("STUDENT"), asyncHandler(goalsController));
platformRouter.post("/students/me/goals", requireAuth, requireRole("STUDENT"), asyncHandler(createGoalController));
platformRouter.put("/goals/:id", requireAuth, requireRole("STUDENT"), asyncHandler(updateGoalController));

platformRouter.get("/messages", requireAuth, asyncHandler(messagesController));
platformRouter.get("/messages/:threadId", requireAuth, asyncHandler(messageThreadController));
platformRouter.post("/messages", requireAuth, asyncHandler(createMessageController));

platformRouter.get("/notifications", requireAuth, asyncHandler(notificationsController));
platformRouter.put("/notifications/:id/read", requireAuth, asyncHandler(readNotificationController));

// Student Marks & Report Cards
platformRouter.get("/students/me/marks", requireAuth, requireRole("STUDENT"), asyncHandler(studentMarksController));
platformRouter.get("/students/me/report-cards", requireAuth, requireRole("STUDENT"), asyncHandler(studentReportCardsController));

// Student Timetable
platformRouter.get("/students/me/timetable", requireAuth, requireRole("STUDENT"), asyncHandler(studentTimetableController));

// Student National Exams
platformRouter.get("/students/me/national-exams", requireAuth, requireRole("STUDENT"), asyncHandler(studentNationalExamsController));

// Student Attendance Summary
platformRouter.get("/students/me/attendance", requireAuth, requireRole("STUDENT"), asyncHandler(studentAttendanceController));

// Student Academic Pathway
platformRouter.get("/students/me/pathway", requireAuth, requireRole("STUDENT"), asyncHandler(studentPathwayController));

platformRouter.get("/parents/me/dashboard", requireAuth, requireRole("PARENT"), asyncHandler(parentDashboardController));

platformRouter.get(
  "/admin/:resource(levels|subjects|courses|lessons|quizzes|library|users|schools|imports|audit-logs)",
  requireAuth,
  requireRole("ADMIN"),
  asyncHandler(adminPlaceholderController)
);
