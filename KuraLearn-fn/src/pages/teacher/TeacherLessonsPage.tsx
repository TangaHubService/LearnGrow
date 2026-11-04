import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Bot, CheckCircle2, Copy, Edit3, Eye, Plus, LayoutGrid, List } from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { invalidateTeacherDashboard } from "@/hooks/useTeacherDashboard";
import { closeModal, openDrawer, openModal, pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchToolbar,
  Skeleton,
  useListParams,
} from "./teacherShared";
import { TeacherGlobalUi } from "./TeacherGlobalUi";
import { StatusBadge } from "@/components/ModernUi";

export function TeacherLessonsPage() {
  const [params, setParams] = useListParams();
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { data: refData } = useQuery({
    queryKey: ["teacher-reference-data"],
    queryFn: () => lmsService.referenceData(),
  });
  const subjects = refData?.subjects ?? [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher-lesson-plans", params],
    queryFn: () => lmsService.lessonPlans(params),
  });

  const publish = useMutation({
    mutationFn: (id: string) => lmsService.publishLessonPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-lesson-plans"] });
      invalidateTeacherDashboard(queryClient);
      dispatch(pushToast({ tone: "success", message: "Lesson plan published" }));
      dispatch(closeModal());
    },
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => lmsService.duplicateLessonPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-lesson-plans"] });
      invalidateTeacherDashboard(queryClient);
      dispatch(pushToast({ tone: "success", message: "Lesson plan duplicated" }));
    },
  });

  const archive = useMutation({
    mutationFn: (id: string) => lmsService.archiveLessonPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-lesson-plans"] });
      invalidateTeacherDashboard(queryClient);
      dispatch(pushToast({ tone: "success", message: "Lesson plan archived" }));
      dispatch(closeModal());
    },
  });

  return (
    <div>
      <PageHeader
        title="Lesson Planning"
        subtitle="Create, draft, publish, duplicate, deliver and improve lessons with AI approval."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                dispatch(openDrawer({ kind: "ai-lesson", mode: "ai", title: "AI lesson plan" }))
              }
            >
              <Bot size={16} /> AI plan
            </Button>
            <Button
              onClick={() =>
                dispatch(
                  openDrawer({ kind: "lesson-form", mode: "create", title: "Create lesson" }),
                )
              }
            >
              <Plus size={16} /> Create lesson
            </Button>
          </>
        }
      />
      <SearchToolbar
        params={params}
        setParams={setParams}
        subjects={subjects}
        placeholder="Search lessons or topics"
      />
      {isLoading ? (
        <Skeleton />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : data?.items?.length ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {data?.items?.length ?? 0} Lesson Plans
            </span>
            <div className="flex items-center gap-1 rounded-lg border border-black p-0.5 bg-transparent">
              <button
                onClick={() => setViewMode("card")}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-all ${
                  viewMode === "card"
                    ? "bg-black text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid size={13} /> Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-black text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List size={13} /> Table
              </button>
            </div>
          </div>

          {viewMode === "card" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((lesson: any) => (
                <Card key={lesson.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold text-slate-900">{lesson.title}</h2>
                      <p className="text-xs font-semibold text-slate-500">
                        {lesson.subjectName} · {lesson.topic}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        {lesson.durationMinutes} min · {lesson.resourcesLinked?.length ?? 0}{" "}
                        resources
                      </p>
                    </div>
                    <StatusBadge value={lesson.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <button
                      aria-label="View details"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-100"
                      onClick={() =>
                        dispatch(
                          openDrawer({
                            kind: "lesson-details",
                            mode: "view",
                            title: lesson.title,
                            record: lesson,
                          }),
                        )
                      }
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      aria-label="Edit"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-100"
                      onClick={() =>
                        dispatch(
                          openDrawer({
                            kind: "lesson-form",
                            mode: "edit",
                            title: "Edit lesson",
                            record: lesson,
                          }),
                        )
                      }
                    >
                      <Edit3 size={14} />
                    </button>
                    {lesson.status !== "PUBLISHED" && (
                      <Button
                        variant="secondary"
                        className="h-8 text-[11px] px-2"
                        onClick={() =>
                          dispatch(
                            openModal({
                              kind: "publish-lesson",
                              title: "Publish lesson?",
                              description: "Published lessons become available for delivery.",
                              confirmLabel: "Publish",
                              record: lesson,
                            }),
                          )
                        }
                      >
                        <CheckCircle2 size={13} /> Publish
                      </Button>
                    )}
                    <button
                      aria-label="Duplicate"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-100"
                      onClick={() => duplicate.mutate(lesson.id)}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      aria-label="Archive"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-100"
                      onClick={() =>
                        dispatch(
                          openModal({
                            kind: "archive-lesson",
                            danger: true,
                            title: "Archive lesson?",
                            description:
                              "Archived lessons are hidden from active planning and delivery lists.",
                            confirmLabel: "Archive",
                            record: lesson,
                          }),
                        )
                      }
                    >
                      <Archive size={14} />
                    </button>
                    <Link
                      className="inline-flex h-8 items-center rounded-lg bg-[#6d3eeb] px-3 text-[11px] font-bold text-white hover:bg-[#5b31cb] transition-colors"
                      to={`/teacher/delivery/${lesson.id}`}
                    >
                      Teach
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div
              tabIndex={0}
              className="overflow-x-auto rounded-xl border border-black bg-transparent"
            >
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="p-4">Lesson Details</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Resources</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {data.items.map((lesson: any) => (
                    <tr key={lesson.id} className="hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{lesson.title}</div>
                        <div className="text-xs text-slate-500">{lesson.topic}</div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-600">
                        {lesson.subjectName}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-600">
                        {lesson.durationMinutes} min
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-600">
                        {lesson.resourcesLinked?.length ?? 0} linked
                      </td>
                      <td className="p-4">
                        <StatusBadge value={lesson.status} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            aria-label="View details"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-100"
                            onClick={() =>
                              dispatch(
                                openDrawer({
                                  kind: "lesson-details",
                                  mode: "view",
                                  title: lesson.title,
                                  record: lesson,
                                }),
                              )
                            }
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            aria-label="Edit"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-100"
                            onClick={() =>
                              dispatch(
                                openDrawer({
                                  kind: "lesson-form",
                                  mode: "edit",
                                  title: "Edit lesson",
                                  record: lesson,
                                }),
                              )
                            }
                          >
                            <Edit3 size={14} />
                          </button>
                          {lesson.status !== "PUBLISHED" && (
                            <Button
                              variant="secondary"
                              className="h-8 text-[11px] px-2"
                              onClick={() =>
                                dispatch(
                                  openModal({
                                    kind: "publish-lesson",
                                    title: "Publish lesson?",
                                    description: "Published lessons become available for delivery.",
                                    confirmLabel: "Publish",
                                    record: lesson,
                                  }),
                                )
                              }
                            >
                              <CheckCircle2 size={13} /> Publish
                            </Button>
                          )}
                          <button
                            aria-label="Duplicate"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-100"
                            onClick={() => duplicate.mutate(lesson.id)}
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            aria-label="Archive"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-purple-100"
                            onClick={() =>
                              dispatch(
                                openModal({
                                  kind: "archive-lesson",
                                  danger: true,
                                  title: "Archive lesson?",
                                  description:
                                    "Archived lessons are hidden from active planning and delivery lists.",
                                  confirmLabel: "Archive",
                                  record: lesson,
                                }),
                              )
                            }
                          >
                            <Archive size={14} />
                          </button>
                          <Link
                            className="inline-flex h-8 items-center rounded-lg bg-[#6d3eeb] px-3 text-[11px] font-bold text-white hover:bg-[#5b31cb] transition-colors"
                            to={`/teacher/delivery/${lesson.id}`}
                          >
                            Teach
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No lessons found"
          message="Create a lesson or ask AI to prepare a draft."
          action={
            <Button
              onClick={() =>
                dispatch(
                  openDrawer({ kind: "lesson-form", mode: "create", title: "Create lesson" }),
                )
              }
            >
              Create lesson
            </Button>
          }
        />
      )}
      <TeacherGlobalUi
        onConfirm={(modal: any) => {
          if (modal.kind === "publish-lesson") publish.mutate((modal.record as any).id);
          if (modal.kind === "archive-lesson") archive.mutate((modal.record as any).id);
        }}
      />
    </div>
  );
}
