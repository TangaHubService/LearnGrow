import { Route } from "react-router-dom";
import CourseWizardPage from "@/pages/teacher/CourseWizardPage";
import { CourseDetailPage } from "@/pages/teacher/CourseDetailPage";
import { CreateLessonPage } from "@/pages/teacher/CreateLessonPage";
import TeacherAssessmentDetailPage from "@/pages/teacher/TeacherAssessmentDetailPage";
import { TeacherAssessmentsPage } from "@/pages/teacher/TeacherAssessmentsPage";
import { TeacherCoursesPage } from "@/pages/teacher/TeacherCoursesPage";
import {
  TeacherAiPage,
  TeacherAttendancePage,
  TeacherAuditPage,
  TeacherCalendarPage,
  TeacherClassesPage,
  TeacherDashboardPage,
  TeacherDeliveryPage,
  TeacherLessonsPage,
  TeacherMarksPage,
  TeacherMessagesPage,
  TeacherNotificationsPage,
  TeacherReportsPage,
  TeacherResourcesPage,
  TeacherSettingsPage,
  TeacherStudentsPage,
  TeacherTimetablePage,
} from "@/pages/teacher/TeacherJourney";
import TeacherMarksApprovalPage from "@/pages/teacher/TeacherMarksApprovalPage";
import TeacherMarksListPage from "@/pages/teacher/TeacherMarksListPage";

export const teacherRoutes = (
  <>
    <Route path="/teacher" element={<TeacherDashboardPage />} />
    <Route path="/teacher/classes" element={<TeacherClassesPage />} />
    <Route path="/teacher/learners" element={<TeacherStudentsPage />} />
    <Route path="/teacher/students" element={<TeacherStudentsPage />} />
    <Route path="/teacher/lesson-plans" element={<TeacherLessonsPage />} />
    <Route path="/teacher/lessons" element={<TeacherLessonsPage />} />
    <Route path="/teacher/lessons/new" element={<CreateLessonPage />} />
    <Route path="/teacher/lessons/:id/edit" element={<CreateLessonPage />} />
    <Route path="/teacher/delivery/:lessonId" element={<TeacherDeliveryPage />} />
    <Route path="/teacher/assessments" element={<TeacherAssessmentsPage />} />
    <Route path="/teacher/assessments/:id" element={<TeacherAssessmentDetailPage />} />
    <Route path="/teacher/quizzes" element={<TeacherAssessmentsPage />} />
    <Route path="/teacher/assignments" element={<TeacherAssessmentsPage />} />
    <Route path="/teacher/courses" element={<TeacherCoursesPage />} />
    <Route path="/teacher/courses/new" element={<CourseWizardPage />} />
    <Route path="/teacher/courses/:courseId" element={<CourseDetailPage />} />
    <Route path="/teacher/ai" element={<TeacherAiPage />} />
    <Route path="/teacher/reports" element={<TeacherReportsPage />} />
    <Route path="/teacher/messages" element={<TeacherMessagesPage />} />
    <Route path="/teacher/resources" element={<TeacherResourcesPage />} />
    <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
    <Route path="/teacher/marks" element={<TeacherMarksPage />} />
    <Route path="/teacher/marks/list" element={<TeacherMarksListPage />} />
    <Route path="/teacher/marks/approval" element={<TeacherMarksApprovalPage />} />
    <Route path="/teacher/timetable" element={<TeacherTimetablePage />} />
    <Route path="/teacher/calendar" element={<TeacherCalendarPage />} />
    <Route path="/teacher/notifications" element={<TeacherNotificationsPage />} />
    <Route path="/teacher/audit-logs" element={<TeacherAuditPage />} />
    <Route path="/teacher/settings" element={<TeacherSettingsPage />} />
  </>
);
