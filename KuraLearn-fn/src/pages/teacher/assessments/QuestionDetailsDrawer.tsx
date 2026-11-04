import { AppDrawer } from "@/components/ModernUi";
import { AssessmentQuestion } from "@/services/assessmentApi";

export function QuestionDetailsDrawer({
  open,
  onClose,
  q,
}: {
  open: boolean;
  onClose: () => void;
  q: AssessmentQuestion | null;
}) {
  if (!q) return null;

  const detailItem = (label: string, value: any) => (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-bold text-slate-700">{value || "—"}</div>
    </div>
  );

  return (
    <AppDrawer open={open} onClose={onClose} title="Question Details" size="lg">
      <div className="space-y-6">
        <div className="rounded-2xl bg-slate-50 p-6">
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700 mb-2">
            Question
          </p>
          <p className="text-lg font-bold text-slate-900 leading-relaxed">{q.questionText}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-8">
          {detailItem("Type", q.type.replace("_", " "))}
          {detailItem("Marks", `${q.marks} Marks`)}
          {detailItem("Difficulty", q.difficulty || "Medium")}
          {detailItem("Topic", q.topicId || "General")}
        </div>

        {(q.type === "MULTIPLE_CHOICE" || q.type === "MATCHING" || q.type === "ORDERING") &&
          q.options && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                Options
              </p>
              <div className="grid gap-2">
                {(Array.isArray(q.options) ? q.options : []).map((opt: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px]">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          )}

        <div className="rounded-2xl bg-emerald-50 p-6 border border-emerald-100">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 mb-2">
            Correct Answer
          </p>
          <p className="text-base font-bold text-emerald-700">
            {typeof q.correctAnswer === "string"
              ? q.correctAnswer
              : JSON.stringify(q.correctAnswer)}
          </p>
        </div>

        {q.explanation && (
          <div className="rounded-2xl bg-blue-50 p-6 border border-blue-100">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 mb-2">
              Explanation
            </p>
            <p className="text-sm font-medium text-blue-800 italic leading-relaxed">
              "{q.explanation}"
            </p>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Created At
            </p>
            <p className="text-xs font-bold text-slate-500">
              {new Date(q.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </AppDrawer>
  );
}
