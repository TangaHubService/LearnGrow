import { Activity, Edit3, Eye, Trash2 } from "lucide-react";
import { AssessmentQuestion } from "@/services/assessmentApi";

export function QuestionRow({
  q,
  onView,
  onEdit,
  onDelete,
}: {
  q: AssessmentQuestion;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-violet-200 hover:shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-sm font-bold text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-600">
        {q.orderIndex + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{q.questionText}</p>
        <div className="mt-1 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <Activity size={10} /> {q.type.replace("_", " ")}
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-200" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-violet-700">
            {q.marks} Mark{q.marks !== 1 ? "s" : ""}
          </span>
          {q.difficulty && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-200" />
              <span
                className={`text-[10px] font-bold uppercase tracking-wide ${q.difficulty === "hard" ? "text-red-600" : q.difficulty === "medium" ? "text-amber-700" : "text-emerald-700"}`}
              >
                {q.difficulty}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 transition-opacity">
        <button
          onClick={onView}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-600"
          title="View Details"
        >
          <Eye size={14} />
        </button>
        <button
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-violet-50 hover:text-violet-600"
          title="Edit"
        >
          <Edit3 size={14} />
        </button>
        <button
          onClick={onDelete}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
