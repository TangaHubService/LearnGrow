import { keepPreviousData, useQuery, type QueryClient } from "@tanstack/react-query";
import { teacherApi } from "@/services/teacherApi";

export const teacherDashboardKeys = {
  all: ["teacher-dashboard"] as const,
  profile: () => [...teacherDashboardKeys.all, "profile"] as const,
  stats: (date?: string) => [...teacherDashboardKeys.all, "stats", date ?? "today"] as const,
  schedule: (date?: string) => [...teacherDashboardKeys.all, "schedule", date ?? "today"] as const,
  classes: () => [...teacherDashboardKeys.all, "classes"] as const,
  classAttendance: (from: string, to: string) =>
    [...teacherDashboardKeys.all, "class-attendance", from, to] as const,
  notifications: () => [...teacherDashboardKeys.all, "notifications"] as const,
  assessments: () => [...teacherDashboardKeys.all, "assessments"] as const,
  learnersNeedingSupport: () => [...teacherDashboardKeys.all, "learners-needing-support"] as const,
  recentAiOutputs: () => [...teacherDashboardKeys.all, "recent-ai-outputs"] as const,
};

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function invalidateTeacherDashboard(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: teacherDashboardKeys.all });
  queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
}

export function useCurrentTeacher() {
  return useQuery({
    queryKey: teacherDashboardKeys.profile(),
    queryFn: teacherApi.dashboardProfile,
    select: (data) => data.teacher,
  });
}

export function useTeacherDashboardStats(date: string) {
  return useQuery({
    queryKey: teacherDashboardKeys.stats(date),
    queryFn: () => teacherApi.dashboardStats(date),
    select: (data) => data.stats,
  });
}

export function useTeacherSchedule(date: string) {
  return useQuery({
    queryKey: teacherDashboardKeys.schedule(date),
    queryFn: () => teacherApi.dashboardSchedule(date),
    select: (data) => data.items,
  });
}

export function useTeacherClasses() {
  return useQuery({
    queryKey: teacherDashboardKeys.classes(),
    queryFn: teacherApi.dashboardClasses,
    select: (data) => data.items,
  });
}

export function useTeacherClassAttendance(range: { from: string; to: string } | null) {
  return useQuery({
    queryKey: teacherDashboardKeys.classAttendance(range?.from ?? "", range?.to ?? ""),
    queryFn: () => teacherApi.dashboardClassAttendance(range!),
    enabled: range !== null,
    select: (data) => data.items,
    // Keep the current chart on screen while a new date range loads.
    placeholderData: keepPreviousData,
  });
}

export function useTeacherNotifications() {
  return useQuery({
    queryKey: teacherDashboardKeys.notifications(),
    queryFn: teacherApi.dashboardNotifications,
    select: (data) => data.items,
  });
}

export function useTeacherAssessments() {
  return useQuery({
    queryKey: teacherDashboardKeys.assessments(),
    queryFn: teacherApi.dashboardAssessments,
    select: (data) => data.items,
  });
}

export function useLearnersNeedingSupport() {
  return useQuery({
    queryKey: teacherDashboardKeys.learnersNeedingSupport(),
    queryFn: teacherApi.dashboardLearnersNeedingSupport,
    select: (data) => data.items,
  });
}

export function useRecentAIOutputs() {
  return useQuery({
    queryKey: teacherDashboardKeys.recentAiOutputs(),
    queryFn: teacherApi.dashboardRecentAiOutputs,
    select: (data) => data.items,
  });
}
