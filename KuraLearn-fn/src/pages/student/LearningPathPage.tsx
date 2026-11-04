import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, StudentEmptyState, PrimaryLink } from "@/components/student/StudentShared";
import { useCourseDetails } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw } from "lucide-react";

export function LearningPathPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data, isLoading, error, refetch } = useCourseDetails(courseId || "");

  if (isLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Learning path" subtitle="Loading..." />
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.course) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Learning path" subtitle="Error" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">Failed to load learning path</h3>
          <p className="mt-2 text-slate-500">{(error as any)?.message || "Course not found"}</p>
          <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const course = data.course;
  const lessons = course.lessons || [];
  const units = course.units || [];
  const quiz = course.quizzes?.[0];

  // Map units/lessons to steps
  const steps = [
    ...lessons.map((lesson: any, index: number) => ({
      label: lesson.title,
      to: `/lessons/${lesson.id}`,
      open: true,
      type: index === 0 ? "Introduction" : "Learn",
    })),
    ...(quiz
      ? [{ label: "Course Quiz", to: `/quizzes/${quiz.id}`, open: true, type: "Assessment" }]
      : []),
    { label: "Mastered", to: "/rewards", open: false, type: "Milestone" },
  ];

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title={`${course.title} path`}
        subtitle="Follow the steps in order. Review stays open after mastery."
      />
      <div className="grid gap-3">
        {steps.map((step, index) => (
          <StudentCard key={step.label}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-bold ${step.open ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="text-base font-bold text-slate-900">{step.label}</p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {step.type} • {step.open ? "Ready to learn" : "Locked step"}
                  </p>
                </div>
              </div>
              {step.open ? (
                <PrimaryLink to={step.to}>{index === 0 ? "Start" : "Open"}</PrimaryLink>
              ) : (
                <button className="h-10 rounded-lg bg-slate-100 px-4 text-sm font-bold text-slate-500">
                  Locked
                </button>
              )}
            </div>
          </StudentCard>
        ))}
      </div>
    </div>
  );
}
