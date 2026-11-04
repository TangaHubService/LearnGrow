import { AlertTriangle } from "lucide-react";

export function MissingMarksPanel({ records }: { records: any[] }) {
  const missing = records.filter(
    (record) => record.score === null || record.score === undefined || record.score === "",
  );
  if (!missing.length) return null;

  return (
    <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100">
          <AlertTriangle size={18} />
        </div>
        <div>
          <p className="text-sm font-bold">
            {missing.length} missing mark{missing.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-800">
            Submission is blocked until every active learner has a valid score within the maximum
            marks.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {missing.slice(0, 8).map((record) => (
              <span
                key={record.studentId}
                className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold shadow-sm"
              >
                {record.student?.user?.name || record.student?.name || record.studentId}
              </span>
            ))}
            {missing.length > 8 ? (
              <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold shadow-sm">
                +{missing.length - 8} more
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
