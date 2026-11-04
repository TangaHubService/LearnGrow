import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { CourseUnit, CourseLesson } from "@/services/courseApi";
import { Card } from "@/components/common/Card";
import { StudentLessonRow } from "./StudentLessonRow";

interface StudentUnitCardProps {
  unit: any; // Using any for extended properties
  index: number;
  onViewDetails: (l: any) => void;
}

export function StudentUnitCard({ unit, index, onViewDetails }: StudentUnitCardProps) {
  const [expanded, setExpanded] = useState(index === 0);
  const lessons = unit.lessons || [];
  const completedLessons = lessons.filter((l: any) => l.status === "COMPLETED").length;
  const isFullyCompleted = lessons.length > 0 && completedLessons === lessons.length;

  return (
    <Card
      className={`overflow-hidden p-0 shadow-sm transition-all duration-300 ${expanded ? "ring-2 ring-emerald-500/10" : ""}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-6 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-lg transition-all ${
            isFullyCompleted ? "bg-emerald-700 text-white shadow-lg" : "bg-slate-100 text-slate-500"
          }`}
        >
          {isFullyCompleted ? <CheckCircle2 size={24} /> : index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{unit.title}</h3>
            {isFullyCompleted && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 border border-emerald-100">
                Completed
              </span>
            )}
          </div>
          {unit.description ? (
            <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed line-clamp-1">
              {unit.description}
            </p>
          ) : (
            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              {lessons.length} Learning Sessions
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 pr-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              {completedLessons}/{lessons.length}
            </span>
            {expanded ? (
              <ChevronDown size={20} className="text-slate-500" />
            ) : (
              <ChevronRight size={20} className="text-slate-500" />
            )}
          </div>
          <div className="h-1 w-20 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{
                width: `${lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-slate-50 bg-slate-50/20 px-2 pb-3 pt-1">
          {lessons.length === 0 ? (
            <p className="py-8 text-center text-xs font-bold text-slate-500 italic">
              No lessons have been added to this unit yet.
            </p>
          ) : (
            <div className="space-y-1">
              {lessons.map((lesson: any) => (
                <StudentLessonRow key={lesson.id} lesson={lesson} onViewDetails={onViewDetails} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
