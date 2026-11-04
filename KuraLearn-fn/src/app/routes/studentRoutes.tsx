import { Route } from "react-router-dom";
import { StudentAssessmentsPage } from "@/pages/student/StudentAssessmentsPage";
import { StudentAssignmentsPage } from "@/pages/student/StudentAssignmentsPage";
import { StudentQuizzesPage } from "@/pages/student/StudentQuizzesPage";
import {
  AiAssistantPage,
  AnalyticsPage,
  CoursesPage,
  GoalsPage,
  LearningPathPage,
  LibraryPage,
  PracticePage,
  ProfileSetupPage,
  QuizPage,
  QuizResultsPage,
  ResourceDetailPage,
  RewardsPage,
  StudentAttendancePage,
  StudentExamsPage,
  StudentMarksPage,
  StudentTimetablePage,
  SubjectsPage,
} from "@/pages/student/StudentScreens";
import { StudentCoursesPage } from "@/pages/student/courses/StudentCoursesPage";
import { StudentCourseViewPage } from "@/pages/student/courses/StudentCourseViewPage";
import { StudentLessonViewPage } from "@/pages/student/courses/StudentLessonViewPage";

export const studentRoutes = (
  <>
    <Route path="/profile-setup" element={<ProfileSetupPage />} />
    <Route path="/subjects" element={<SubjectsPage />} />
    <Route path="/subjects/:subjectId" element={<CoursesPage />} />
    <Route path="/courses/:courseId/path" element={<LearningPathPage />} />
    <Route path="/lessons/:lessonId" element={<StudentLessonViewPage />} />
    <Route path="/practice/:lessonId" element={<PracticePage />} />
    <Route path="/quizzes/:quizId" element={<QuizPage />} />
    <Route path="/results/:quizId" element={<QuizResultsPage />} />
    <Route path="/analytics" element={<AnalyticsPage />} />
    <Route path="/rewards" element={<RewardsPage />} />
    <Route path="/library" element={<LibraryPage />} />
    <Route path="/library/:resourceId" element={<ResourceDetailPage />} />
    <Route path="/goals" element={<GoalsPage />} />
    <Route path="/ai" element={<AiAssistantPage />} />
    <Route path="/student/courses" element={<StudentCoursesPage />} />
    <Route path="/student/courses/:courseId" element={<StudentCourseViewPage />} />
    <Route path="/student/lessons/:lessonId" element={<StudentLessonViewPage />} />
    <Route path="/student/marks" element={<StudentMarksPage />} />
    <Route path="/student/timetable" element={<StudentTimetablePage />} />
    <Route path="/student/national-exams" element={<StudentExamsPage />} />
    <Route path="/student/attendance" element={<StudentAttendancePage />} />
    <Route path="/student/assessments" element={<StudentAssessmentsPage />} />
    <Route path="/student/assignments" element={<StudentAssignmentsPage />} />
    <Route path="/student/quizzes" element={<StudentQuizzesPage />} />
  </>
);
