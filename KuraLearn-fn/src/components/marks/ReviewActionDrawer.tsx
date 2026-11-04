import { useState } from "react";
import { CheckCircle2, RotateCcw, Unlock, XCircle } from "lucide-react";
import { AppDrawer } from "@/components/common/AppDrawer";
import { Button } from "@/components/common/Button";
import { ApprovalStatusBadge } from "./ApprovalStatusBadge";
import { ApprovalTimeline } from "./ApprovalTimeline";

export type ReviewAction = "approve" | "reject" | "requestCorrection" | "unlock";

export function ReviewActionDrawer({
  open,
  submission,
  loading,
  onClose,
  onAction,
}: {
  open: boolean;
  submission: any | null;
  loading?: boolean;
  onClose: () => void;
  onAction: (action: ReviewAction, comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const current = submission?.submission ?? submission;
  const records = submission?.records ?? [];

  const footer = (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      {current?.status === "APPROVED" ? (
        <Button variant="outline" disabled={loading} onClick={() => onAction("unlock", comment)}>
          <Unlock size={16} /> Unlock
        </Button>
      ) : (
        <>
          <Button variant="danger" disabled={loading} onClick={() => onAction("reject", comment)}>
            <XCircle size={16} /> Reject
          </Button>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => onAction("requestCorrection", comment)}
          >
            <RotateCcw size={16} /> Correction
          </Button>
          <Button
            disabled={loading || current?.status !== "SUBMITTED"}
            onClick={() => onAction("approve", comment)}
          >
            <CheckCircle2 size={16} /> Approve
          </Button>
        </>
      )}
    </div>
  );

  return (
    <AppDrawer
      open={open}
      title="Review marks submission"
      subtitle={
        current
          ? `${current.class?.name || "Class"} / ${current.subject?.name || "Subject"} / ${current.term?.name || "Term"}`
          : ""
      }
      onClose={onClose}
      size="xl"
      footer={footer}
    >
      {current ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Status</p>
              <div className="mt-2">
                <ApprovalStatusBadge status={current.status} locked={current.isLocked} />
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Completion</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {current.completion?.percentage ?? submission?.completion?.percentage ?? 0}%
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Teacher</p>
              <p className="mt-2 text-sm font-bold text-slate-900">
                {current.teacher?.user?.name || "Teacher"}
              </p>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Reviewer comment
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
              placeholder="Add feedback for the teacher or an approval note"
            />
          </label>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">Learner marks</h3>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {records.length} record{records.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200">
              {loading && !records.length ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-10 animate-pulse rounded-md bg-slate-100" />
                  ))}
                </div>
              ) : records.length ? (
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                        Learner
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">Code</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">
                        Score
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-500">
                        Percent
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                        Grade
                      </th>
                      <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {records.map((record: any) => {
                      const score = record.score ?? null;
                      const maxScore = record.maxScore ?? current?.maxScore ?? "-";
                      return (
                        <tr key={record.markId || record.studentId}>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {record.student?.user?.name || record.student?.name || "Learner"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">
                            {record.student?.studentCode || "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {score === null ? "-" : score} / {maxScore}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700">
                            {typeof record.percentage === "number" ? `${record.percentage}%` : "-"}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700">
                            {record.grade || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-600">
                            {record.teacherComments || record.missingReason || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-bold text-slate-800">No learner marks loaded</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Open a submitted batch to review individual scores.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Timeline</h3>
            <ApprovalTimeline events={current.events || submission?.submission?.events || []} />
          </section>
        </div>
      ) : null}
    </AppDrawer>
  );
}
