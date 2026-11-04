import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentPortalService } from "@/services/studentPortalService";
import { courseApi } from "@/services/courseApi";
import { lmsService } from "@/services/lmsService";

export const useStudentDashboard = () => {
  return useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: studentPortalService.getDashboard,
  });
};

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ["student", "profile"],
    queryFn: studentPortalService.getProfile,
    retry: false,
  });
};

export const useStudentSubjects = () => {
  return useQuery({
    queryKey: ["student", "subjects"],
    queryFn: studentPortalService.getSubjects,
  });
};

export const useCourseDetails = (courseId: string) => {
  return useQuery({
    queryKey: ["student", "course", courseId],
    queryFn: () => studentPortalService.getCourseDetails(courseId),
    enabled: !!courseId,
  });
};

export const useMyCourses = (filters?: any) => {
  return useQuery({
    queryKey: ["student", "my-courses", filters],
    queryFn: () => studentPortalService.getMyCourses(filters),
  });
};

export const useSubjectCourses = (subjectId: string) => {
  return useQuery({
    queryKey: ["student", "subject-courses", subjectId],
    queryFn: () => studentPortalService.getSubjectCourses(subjectId),
    enabled: !!subjectId,
  });
};

export const useLessonDetails = (lessonId: string) => {
  return useQuery({
    queryKey: ["student", "lesson", lessonId],
    queryFn: () => studentPortalService.getLessonDetails(lessonId),
    enabled: !!lessonId,
  });
};

export const useStudentAttendance = (filters?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ["student", "attendance", filters],
    queryFn: () => studentPortalService.getAttendance(filters),
  });
};

export const useStudentAnnouncements = () => {
  return useQuery({
    queryKey: ["student", "announcements"],
    queryFn: studentPortalService.getAnnouncements,
  });
};

export const useStudentNotifications = () => {
  return useQuery({
    queryKey: ["student", "notifications"],
    queryFn: studentPortalService.getNotifications,
  });
};

export const useStudentAnalytics = () => {
  return useQuery({
    queryKey: ["student", "analytics"],
    queryFn: studentPortalService.getAnalytics,
  });
};

export const useLibraryResources = (params?: any) => {
  return useQuery({
    queryKey: ["student", "library", params],
    queryFn: () => lmsService.resources.list(params),
  });
};

export const useStudentRewards = () => {
  return useQuery({
    queryKey: ["student", "rewards"],
    queryFn: studentPortalService.getRewards,
  });
};

export const useStudentMessages = () => {
  return useQuery({
    queryKey: ["student", "messages"],
    queryFn: studentPortalService.getMessages,
  });
};

export const useStudentGoals = () => {
  return useQuery({
    queryKey: ["student", "goals"],
    queryFn: studentPortalService.getGoals,
  });
};

export const useStudentAssessments = () => {
  return useQuery({
    queryKey: ["student", "assessments"],
    queryFn: studentPortalService.getAssessments,
  });
};

export const useQuizDetails = (quizId: string) => {
  return useQuery({
    queryKey: ["student", "quiz", quizId],
    queryFn: () => studentPortalService.getQuiz(quizId),
    enabled: !!quizId,
  });
};

export const useQuizResults = (attemptId: string) => {
  return useQuery({
    queryKey: ["student", "quiz-results", attemptId],
    queryFn: () => studentPortalService.getQuizResults(attemptId),
    enabled: !!attemptId,
  });
};

export const useLibraryResource = (resourceId: string) => {
  return useQuery({
    queryKey: ["student", "library-resource", resourceId],
    queryFn: () => lmsService.resources.get(resourceId),
    enabled: !!resourceId,
  });
};

export const useMessageThread = (threadId: string) => {
  return useQuery({
    queryKey: ["student", "message-thread", threadId],
    queryFn: () => studentPortalService.getMessageThread(threadId),
    enabled: !!threadId,
  });
};

// Mutations
export const useCompleteLesson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => studentPortalService.completeLesson(lessonId),
    onSuccess: (_, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["student", "lesson", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["student", "course"] });
    },
  });
};

export const useStartCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => studentPortalService.startCourse(courseId),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["student", "course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });
};

export const useUpdateLessonProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: any }) =>
      studentPortalService.updateLessonProgress(lessonId, data),
    onSuccess: (_, { lessonId }) => {
      queryClient.invalidateQueries({ queryKey: ["student", "lesson", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentPortalService.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "goals"] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });
};

export const useLevels = () => {
  return useQuery({
    queryKey: ["levels"],
    queryFn: studentPortalService.getLevels,
    select: (data) => data.levels,
  });
};

export const useSaveStudentProfile = (isNewProfile: boolean) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: isNewProfile
      ? studentPortalService.createProfile
      : studentPortalService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
  });
};

export const useUpdateStudentProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentPortalService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "profile"] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });
};

export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: any }) =>
      studentPortalService.submitQuiz(quizId, answers),
    onSuccess: (_, { quizId }) => {
      queryClient.invalidateQueries({ queryKey: ["student", "quiz-results", quizId] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });
};

// New hooks for Rwanda education features
export const useStudentMarks = () => {
  return useQuery({
    queryKey: ["student", "marks"],
    queryFn: studentPortalService.getMarks,
  });
};

export const useStudentReportCards = () => {
  return useQuery({
    queryKey: ["student", "report-cards"],
    queryFn: studentPortalService.getReportCards,
  });
};

export const useStudentTimetable = () => {
  return useQuery({
    queryKey: ["student", "timetable"],
    queryFn: studentPortalService.getTimetable,
  });
};

export const useStudentNationalExams = () => {
  return useQuery({
    queryKey: ["student", "national-exams"],
    queryFn: studentPortalService.getNationalExams,
  });
};

export const useStudentAttendanceSummary = () => {
  return useQuery({
    queryKey: ["student", "attendance-summary"],
    queryFn: studentPortalService.getAttendanceSummary,
  });
};

export const useStudentPathway = () => {
  return useQuery({
    queryKey: ["student", "pathway"],
    queryFn: studentPortalService.getPathway,
  });
};
