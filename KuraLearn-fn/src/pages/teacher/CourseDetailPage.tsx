import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { pushToast } from "@/store/uiSlice";
import { Loader2 } from "lucide-react";
import {
  lmsService,
  type CourseRecord,
  type CourseUnit,
  type CourseLesson,
} from "@/services/lmsService";
import { ConfirmModal } from "@/components/ModernUi";
import { Button } from "@/components/common/Button";

// --- Sub-components ---
import { CourseHeader } from "./components/course/CourseHeader";
import { CourseTabs, CourseTab } from "./components/course/CourseTabs";
import { CourseContent } from "./components/course/CourseContent";
import { CourseAnalytics } from "./components/course/CourseAnalytics";
import { CourseDetails } from "./components/course/CourseDetails";
import { CourseDrawers, DrawerState } from "./components/course/CourseDrawers";

type ModalState =
  | { kind: "delete-unit"; unitId: string; title: string }
  | { kind: "delete-lesson"; lessonId: string; title: string }
  | { kind: "delete-assignment"; id: string; title: string }
  | { kind: "delete-quiz"; id: string; title: string }
  | null;

export function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [activeTab, setActiveTab] = useState<CourseTab>("content");

  const handleCloseDrawer = useCallback(() => setDrawer(null), []);
  const handleCloseModal = useCallback(() => setModal(null), []);

  const courseQuery = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => lmsService.get(courseId!),
    enabled: !!courseId,
  });

  const analyticsQuery = useQuery({
    queryKey: ["course-analytics", courseId],
    queryFn: () => lmsService.analytics(courseId!),
    enabled: !!courseId && activeTab === "analytics",
  });

  const course = courseQuery.data?.course as CourseRecord | undefined;
  const analytics = analyticsQuery.data?.analytics;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["course", courseId] });

  const mutations = {
    createUnit: useMutation({
      mutationFn: (input: { title: string; description?: string }) =>
        lmsService.createUnit(courseId!, input),
      onSuccess: () => {
        invalidate();
        setDrawer(null);
      },
    }),
    updateUnit: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
        lmsService.updateUnit(id, input as any),
      onSuccess: () => {
        invalidate();
        setDrawer(null);
      },
    }),
    deleteUnit: useMutation({
      mutationFn: (unitId: string) => lmsService.deleteUnit(unitId),
      onSuccess: () => {
        invalidate();
        setModal(null);
      },
    }),
    createLesson: useMutation({
      mutationFn: ({ unitId, input }: { unitId?: string; input: Record<string, unknown> }) =>
        lmsService.createCourseLesson(courseId!, { ...input, unitId } as any),
      onSuccess: () => {
        invalidate();
        setDrawer(null);
      },
    }),
    updateLesson: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
        lmsService.updateCourseLesson(id, input),
      onSuccess: () => {
        invalidate();
        setDrawer(null);
      },
    }),
    deleteLesson: useMutation({
      mutationFn: (lessonId: string) => lmsService.deleteCourseLesson(lessonId),
      onSuccess: () => {
        invalidate();
        setModal(null);
      },
    }),
    publishLesson: useMutation({
      mutationFn: (lessonId: string) => lmsService.publishCourseLesson(lessonId),
      onSuccess: invalidate,
    }),
    createAssignment: useMutation({
      mutationFn: (input: any) => lmsService.createAssignment(courseId!, input),
      onSuccess: () => {
        invalidate();
        setDrawer(null);
      },
    }),
    updateAssignment: useMutation({
      mutationFn: ({ id, input }: { id: string; input: any }) =>
        lmsService.updateAssignment(id, input),
      onSuccess: () => {
        invalidate();
        setDrawer(null);
      },
    }),
    deleteAssignment: useMutation({
      mutationFn: (id: string) => lmsService.deleteAssignment(id),
      onSuccess: () => {
        invalidate();
        setModal(null);
      },
    }),
    createQuiz: useMutation({
      mutationFn: (input: any) => lmsService.createCourseQuiz(courseId!, input),
      onSuccess: () => {
        invalidate();
        setDrawer(null);
      },
    }),
    updateQuiz: useMutation({
      mutationFn: ({ id, input }: { id: string; input: any }) =>
        lmsService.updateCourseQuiz(id, input),
      onSuccess: () => {
        invalidate();
        setDrawer(null);
      },
    }),
    deleteQuiz: useMutation({
      mutationFn: (id: string) => lmsService.deleteCourseQuiz(id),
      onSuccess: () => {
        invalidate();
        setModal(null);
      },
    }),
    assignCourse: useMutation({
      mutationFn: (input: { classId?: string; studentIds?: string[] }) =>
        lmsService.assignCourse(courseId!, input),
      onSuccess: (data) => {
        invalidate();
        setDrawer(null);
        dispatch(
          pushToast({
            tone: "success",
            message: `Successfully assigned to ${data.assignedCount} new students.`,
          }),
        );
      },
    }),
    reorderUnits: useMutation({
      mutationFn: (unitOrder: Array<{ unitId: string; order: number }>) =>
        lmsService.reorderUnits(courseId!, unitOrder),
      onSuccess: invalidate,
    }),
    reorderLessons: useMutation({
      mutationFn: (lessonOrder: Array<{ lessonId: string; order: number }>) =>
        lmsService.reorderLessons(courseId!, lessonOrder),
      onSuccess: invalidate,
    }),
  };

  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

  const generateCourseOutline = async () => {
    if (!course) return;
    setIsGeneratingOutline(true);
    try {
      const res = await lmsService.aiComprehensive({
        taskType: "course_outline",
        subjectName: course.subject?.name,
        gradeLevel: course.level?.name,
        teacherRequest: `Generate a full CBC-aligned course structure for "${course.title}". ${course.description || "Include units, lessons, and learning objectives."}`,
      });

      if (res?.sections?.length) {
        for (const section of res.sections) {
          const unitRes = await lmsService.createUnit(courseId!, {
            title: section.heading,
            description: section.content || undefined,
          });
          const lessons: string[] = Array.isArray(section.items) ? section.items : [];
          for (const lessonTitle of lessons.slice(0, 8)) {
            await lmsService.createCourseLesson(courseId!, {
              title:
                typeof lessonTitle === "string"
                  ? lessonTitle.replace(/^\d+[\.:]\s*/, "")
                  : String(lessonTitle),
              unitId: unitRes.unit.id,
            });
          }
        }
        invalidate();
      }
    } catch (err) {
      console.error("Outline generation failed", err);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  if (courseQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
        <Loader2 size={20} className="animate-spin" /> Loading course...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-bold text-slate-600">Course not found</p>
        <Button className="mt-4" onClick={() => navigate("/teacher/courses")}>
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CourseHeader
        course={course}
        isGeneratingOutline={isGeneratingOutline}
        onGenerateOutline={generateCourseOutline}
        onAddAssignment={() => setDrawer({ kind: "assignment-create", courseId: course.id })}
        onAddQuiz={() => setDrawer({ kind: "quiz-create", courseId: course.id })}
        onAddUnit={() => setDrawer({ kind: "unit-create", courseId: course.id })}
        onAssignCourse={() => setDrawer({ kind: "course-assign", courseId: course.id })}
        onAddLesson={() => setDrawer({ kind: "lesson-create", courseId: course.id })}
      />

      <CourseTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "content" && (
        <CourseContent
          course={course}
          onAddUnit={() => setDrawer({ kind: "unit-create", courseId: course.id })}
          onAddLesson={(unitId) =>
            setDrawer({ kind: "lesson-create", courseId: course.id, unitId })
          }
          onEditUnit={(unit) => setDrawer({ kind: "unit-edit", unit })}
          onDeleteUnit={(unit) =>
            setModal({ kind: "delete-unit", unitId: unit.id, title: unit.title })
          }
          onEditLesson={(lesson) => setDrawer({ kind: "lesson-edit", lesson })}
          onDeleteLesson={(lesson) =>
            setModal({ kind: "delete-lesson", lessonId: lesson.id, title: lesson.title })
          }
          onPublishLesson={(lesson) => mutations.publishLesson.mutate(lesson.id)}
          onReorderUnits={(unitIds) =>
            mutations.reorderUnits.mutate(unitIds.map((id, i) => ({ unitId: id, order: i + 1 })))
          }
          onReorderLessons={(lessonIds) =>
            mutations.reorderLessons.mutate(
              lessonIds.map((id, i) => ({ lessonId: id, order: i + 1 })),
            )
          }
          onEditAssignment={(assignment) => setDrawer({ kind: "assignment-edit", assignment })}
          onDeleteAssignment={(assignment) =>
            setModal({ kind: "delete-assignment", id: assignment.id, title: assignment.title })
          }
          onEditQuiz={(quiz) => setDrawer({ kind: "quiz-edit", quiz })}
          onDeleteQuiz={(quiz) => setModal({ kind: "delete-quiz", id: quiz.id, title: quiz.title })}
        />
      )}

      {activeTab === "analytics" && (
        <CourseAnalytics loading={analyticsQuery.isLoading} analytics={analytics} />
      )}

      {activeTab === "details" && <CourseDetails course={course} />}

      <CourseDrawers
        state={drawer}
        onClose={handleCloseDrawer}
        mutations={mutations}
        courseId={course.id}
      />

      <ConfirmModal
        open={!!modal}
        title={
          modal?.kind === "delete-unit"
            ? "Delete Unit"
            : modal?.kind === "delete-lesson"
              ? "Delete Lesson"
              : modal?.kind === "delete-assignment"
                ? "Delete Assignment"
                : "Delete Quiz"
        }
        message={`This will permanently delete "${modal?.title ?? ""}".`}
        confirmLabel="Delete"
        danger
        onCancel={handleCloseModal}
        onConfirm={() => {
          if (modal?.kind === "delete-unit") mutations.deleteUnit.mutate(modal.unitId);
          if (modal?.kind === "delete-lesson") mutations.deleteLesson.mutate(modal.lessonId);
          if (modal?.kind === "delete-assignment") mutations.deleteAssignment.mutate(modal.id);
          if (modal?.kind === "delete-quiz") mutations.deleteQuiz.mutate(modal.id);
        }}
      />
    </div>
  );
}
