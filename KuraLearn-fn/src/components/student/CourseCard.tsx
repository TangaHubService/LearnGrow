import { StudentCard, StudentProgressBar, PrimaryLink, SecondaryLink } from "./StudentShared";
import { useT } from "@/i18n/I18nContext";

export function CourseCard({ course }: { course: any }) {
  const t = useT();
  if (!course) return null;
  const firstLessonId = course.lessons?.[0]?.id || course.firstLessonId;
  const quizId = course.quiz?.id || course.quizId;

  return (
    <StudentCard className={course.locked ? "opacity-75" : ""}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">{course.title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{course.description}</p>
        </div>
        <span
          className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${course.locked ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}
        >
          {course.locked ? t("Locked") : t("Open")}
        </span>
      </div>
      <div className="mt-4">
        <StudentProgressBar value={course.progress || 0} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <PrimaryLink to={`/courses/${course.id}/path`}>{t("Learning path")}</PrimaryLink>
        {firstLessonId && (
          <SecondaryLink to={`/lessons/${firstLessonId}`}>{t("Start lesson")}</SecondaryLink>
        )}
        {quizId && <SecondaryLink to={`/quizzes/${quizId}`}>{t("Quiz")}</SecondaryLink>}
      </div>
    </StudentCard>
  );
}
