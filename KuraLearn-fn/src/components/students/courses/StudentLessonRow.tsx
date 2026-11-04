import { useNavigate } from "react-router-dom";
import { Circle, Lock, Clock, CheckCircle2 } from "lucide-react";
import { CourseLesson } from "@/services/courseApi";

interface StudentLessonRowProps {
  lesson: any; // Using any for extended properties
  onViewDetails: (l: any) => void;
}

export function StudentLessonRow({ lesson, onViewDetails }: StudentLessonRowProps) {
  const isCompleted = lesson.status === "COMPLETED";
  const isInProgress = lesson.status === "IN_PROGRESS";

  return (
    <div
      className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 transition-all duration-300 ${
        isCompleted
          ? "bg-emerald-50/20 hover:bg-emerald-50/50"
          : isInProgress
            ? "bg-slate-50 border border-slate-100 hover:bg-slate-100/50"
            : "hover:bg-slate-50/50"
      }`}
    >
      <div className="shrink-0">
        {isCompleted ? (
          <CheckCircle2 size={20} className="text-emerald-700" />
        ) : isInProgress ? (
          <div className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-500 bg-white">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        ) : (
          <Circle size={20} className="text-slate-500 hover:text-slate-400 transition-colors" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-bold tracking-tight ${
              isCompleted ? "text-slate-700 font-medium" : "text-slate-900"
            }`}
          >
            {lesson.title}
          </p>
          {isInProgress && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Resume
            </span>
          )}
        </div>
        {lesson.description ? (
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 leading-relaxed">
            {lesson.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
          <Clock size={12} /> {lesson.estimatedMinutes ?? 10} min
        </span>

        <button
          onClick={() => onViewDetails(lesson)}
          className={`rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 border ${
            isCompleted
              ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              : "bg-emerald-700 text-white border-transparent hover:bg-emerald-700"
          }`}
        >
          {isCompleted ? "Review" : isInProgress ? "Continue" : "Learn"}
        </button>
      </div>
    </div>
  );
}
