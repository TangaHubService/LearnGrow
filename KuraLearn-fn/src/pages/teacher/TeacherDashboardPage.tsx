import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, RefreshCw } from "lucide-react";
import {
  DashboardHeaderPill,
  DashboardPageLayout,
  DashboardStatGrid,
} from "@/components/dashboard/DashboardLayout";
import { lmsService } from "@/services/lmsService";
import {
  invalidateTeacherDashboard,
  localDateKey,
  useCurrentTeacher,
  useLearnersNeedingSupport,
  useRecentAIOutputs,
  useTeacherAssessments,
  useTeacherClasses,
  useTeacherDashboardStats,
  useTeacherNotifications,
  useTeacherSchedule,
} from "@/hooks/useTeacherDashboard";
import { openDrawer, pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { DashboardStatCard, InlineErrorState, Skeleton } from "./teacherShared";
import { TeacherGlobalUi } from "./TeacherGlobalUi";

// --- Sub-components ---
import { SchedulePanel } from "./components/dashboard/SchedulePanel";
import { NotificationsPanel } from "./components/dashboard/NotificationsPanel";
import { ClassesOverviewPanel } from "./components/dashboard/ClassesOverviewPanel";
import { LearnerSupportPanel } from "./components/dashboard/LearnerSupportPanel";
import { AiQuickActions } from "./components/dashboard/AiQuickActions";
import { RecentAiOutputsPanel } from "./components/dashboard/RecentAiOutputsPanel";

export function TeacherDashboardPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const today = useMemo(() => localDateKey(), []);
  const readableToday = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const teacher = useCurrentTeacher();
  const stats = useTeacherDashboardStats(today);
  const schedule = useTeacherSchedule(today);
  const classes = useTeacherClasses();
  const notifications = useTeacherNotifications();
  const support = useLearnersNeedingSupport();
  const assessments = useTeacherAssessments();
  const aiOutputs = useRecentAIOutputs();

  const isRefreshing = [
    teacher,
    stats,
    schedule,
    classes,
    notifications,
    support,
    assessments,
    aiOutputs,
  ].some((q) => q.isFetching);

  const markTaught = useMutation({
    mutationFn: (id: string) => lmsService.updateLesson(id, { status: "COMPLETED" }),
    onSuccess: () => {
      invalidateTeacherDashboard(queryClient);
      queryClient.invalidateQueries({ queryKey: ["teacher-lessons"] });
      dispatch(pushToast({ tone: "success", message: "Lesson marked as taught" }));
    },
    onError: (e) =>
      dispatch(pushToast({ tone: "error", message: e instanceof Error ? e.message : "Error" })),
  });

  const openAi = (kind: string, title: string, record?: any) =>
    dispatch(openDrawer({ kind, title, mode: "ai", record }));

  const handleScheduleAction = (item: any) => {
    if (item.action === "Prepare with AI") return openAi("ai-lesson", "Prepare lesson plan", item);
    if (item.action === "Continue")
      return dispatch(
        openDrawer({
          kind: "lesson-form",
          mode: "edit",
          title: "Continue lesson plan",
          record: item,
        }),
      );
    if (item.action === "Mark as Taught") return markTaught.mutate(item.lessonPlanId);
    dispatch(openDrawer({ kind: "lesson-details", title: item.title, record: item }));
  };

  const statCards = stats.data
    ? [
        {
          label: "Today's Lessons",
          value: stats.data.todaysLessons,
          caption: `${stats.data.completedLessons} completed`,
          icon: CalendarDays,
          tone: "#6d3eeb",
        },
        {
          label: "My Classes",
          value: stats.data.myClasses,
          caption: "All assigned",
          icon: stats.data.Users || CalendarDays,
          tone: "#2563eb",
        },
        {
          label: "My Subjects",
          value: stats.data.mySubjects,
          caption: "All assigned",
          icon: stats.data.BookOpen || CalendarDays,
          tone: "#16a34a",
        },
        {
          label: "Pending Plans",
          value: stats.data.pendingLessonPlans,
          caption: "To be prepared",
          icon: stats.data.FileText || CalendarDays,
          tone: "#f59e0b",
        },
        {
          label: "Pending Grading",
          value: stats.data.pendingAssessments,
          caption: "To be marked",
          icon: stats.data.ClipboardCheck || CalendarDays,
          tone: "#e85d8f",
        },
      ]
    : [];

  return (
    <DashboardPageLayout
      title={`Welcome back, ${teacher.data?.name ?? "Teacher"}`}
      subtitle="Here's what's happening in your classes today."
      action={
        <div className="flex gap-2">
          <DashboardHeaderPill>
            <CalendarDays size={17} />
            {readableToday}
          </DashboardHeaderPill>
          <button
            onClick={() =>
              [
                teacher,
                stats,
                schedule,
                classes,
                notifications,
                support,
                assessments,
                aiOutputs,
              ].forEach((q) => q.refetch())
            }
            className="inline-flex h-11 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={17} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      }
    >
      {stats.isLoading ? (
        <Skeleton />
      ) : stats.error ? (
        <InlineErrorState
          message={(stats.error as Error).message}
          onRetry={() => stats.refetch()}
        />
      ) : (
        <DashboardStatGrid columns="five">
          {statCards.map((s) => (
            <DashboardStatCard key={s.label} {...s} />
          ))}
        </DashboardStatGrid>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <SchedulePanel
          schedule={schedule}
          onAction={handleScheduleAction}
          onPrepareWithAi={() => openAi("ai-lesson", "Prepare lesson plan")}
        />
        <NotificationsPanel
          notifications={notifications}
          onOpenDetails={(item) =>
            dispatch(openDrawer({ kind: "notification-details", title: item.title, record: item }))
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr] [&>*]:min-w-0">
        <ClassesOverviewPanel classes={classes} />
        <LearnerSupportPanel
          support={support}
          onOpenSupportDrawer={(row) =>
            dispatch(openDrawer({ kind: "learner-support", title: row.learnerName, record: row }))
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <AiQuickActions onOpenAi={openAi} />
        <RecentAiOutputsPanel
          aiOutputs={aiOutputs}
          onOpenOutput={(item) =>
            dispatch(openDrawer({ kind: "ai-output", title: item.title, record: item }))
          }
          onPrepareLesson={() => openAi("ai-lesson", "Prepare lesson plan")}
        />
      </div>

      <TeacherGlobalUi />
    </DashboardPageLayout>
  );
}
