import { RefreshCw, FileCheck, Award, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { useStudentNationalExams } from "@/hooks/useStudentPortal";

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  const colors: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-700",
    B: "bg-blue-100 text-blue-700",
    C: "bg-amber-100 text-amber-700",
    D: "bg-orange-100 text-orange-700",
    E: "bg-red-100 text-red-700",
    F: "bg-red-200 text-red-800",
  };
  return (
    <span
      className={`rounded-lg px-2 py-0.5 text-xs font-bold ${colors[grade] ?? "bg-slate-100 text-slate-600"}`}
    >
      {grade}
    </span>
  );
}

const PASS_THRESHOLD = 40;

function isPass(score: number | null, grade: string | null): boolean {
  if (score != null) return score >= PASS_THRESHOLD;
  if (grade) return !["F", "E"].includes(grade);
  return false;
}

function ExamsContent() {
  const { data, isLoading, error, refetch } = useStudentNationalExams();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <RefreshCw size={48} className="mb-4 text-red-400" />
        <p className="text-lg font-bold text-slate-600">Failed to load exam data</p>
        <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
          Retry
        </button>
      </div>
    );
  }

  const registrations = data?.registrations || [];
  const results = data?.results || [];

  return (
    <div className="space-y-8">
      {registrations.length > 0 && (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ScrollText size={18} className="text-indigo-700" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              National Exam Registrations
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {registrations.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">{r.examLevel}</span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600">
                    {r.examYear || "—"}
                  </span>
                </div>
                {r.className && <p className="text-sm font-bold text-slate-700">{r.className}</p>}
                {r.candidateNumber && (
                  <p className="mt-2 rounded bg-slate-50 px-2 py-1 text-[11px] font-mono font-bold text-slate-500">
                    Candidate: {r.candidateNumber}
                  </p>
                )}
                <div className="mt-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      r.status === "REGISTERED"
                        ? "bg-emerald-50 text-emerald-700"
                        : r.status === "PENDING"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {results.length > 0 ? (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Award size={18} className="text-amber-700" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
              National Exam Results
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r: any) => {
              const passed = isPass(r.score, r.grade);
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {r.examLevel}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
                    >
                      {passed ? "PASS" : "FAIL"}
                    </span>
                  </div>
                  {r.subjectName && (
                    <p className="text-sm font-bold text-slate-700">{r.subjectName}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">{r.score ?? "-"}</span>
                      <GradeBadge grade={r.grade} />
                    </div>
                    {r.aggregatePoints != null && (
                      <span className="text-xs font-bold text-slate-500">
                        {r.aggregatePoints} pts
                      </span>
                    )}
                  </div>
                  {r.remarks && (
                    <p className="mt-2 text-[11px] font-medium text-slate-500">{r.remarks}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        registrations.length === 0 && (
          <Card className="py-12 text-center">
            <FileCheck size={48} className="mx-auto text-slate-500 mb-3" />
            <p className="text-lg font-bold text-slate-600">No national exam data</p>
            <p className="mt-1 text-sm text-slate-500">
              Your national exam registrations and results will appear here.
            </p>
          </Card>
        )
      )}
    </div>
  );
}

export function StudentExamsPage() {
  return (
    <div>
      <PageHeader
        brand="KuraLearn"
        title="National Exams"
        subtitle="Track your national exam registrations (P6, S3, S6) and view results."
      />
      <ExamsContent />
    </div>
  );
}
