import { useState } from "react";
import { RefreshCw, ChevronDown, ChevronUp, Award } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { useStudentMarks, useStudentReportCards } from "@/hooks/useStudentPortal";

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
      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${colors[grade] ?? "bg-slate-100 text-slate-600"}`}
    >
      {grade}
    </span>
  );
}

function MarksContent() {
  const { data, isLoading, error, refetch } = useStudentMarks();
  const { data: reportCardsData, isLoading: rLoading } = useStudentReportCards();
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  if (isLoading || rLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <RefreshCw size={48} className="mb-4 text-red-400" />
        <p className="text-lg font-bold text-slate-600">Failed to load marks</p>
        <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
          Retry
        </button>
      </div>
    );
  }

  const marks = data?.marks || {};
  const latestMarks = data?.latestMarks || [];
  const years = Object.keys(marks);

  const reportCards = reportCardsData?.reportCards || [];

  return (
    <div className="space-y-6">
      {latestMarks.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wide">
            Latest Marks
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latestMarks.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">{m.subjectName}</p>
                  <p className="text-[11px] font-bold text-slate-500">
                    {m.term} - {m.academicYear}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{m.percentage ?? "-"}%</p>
                  <GradeBadge grade={m.grade} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {reportCards.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wide">
            Report Cards
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reportCards.map((rc: any) => (
              <div
                key={rc.id}
                className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Award size={16} className="text-amber-700" />
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    {rc.academicYear}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-700">Term {rc.term}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs font-bold text-slate-500">Average</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      {rc.averagePercentage ?? "-"}%
                    </span>
                    <GradeBadge grade={rc.grade} />
                  </div>
                </div>
                {rc.pdfUrl && (
                  <a
                    href={rc.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {years.length > 0 ? (
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700 uppercase tracking-wide">
            All Marks
          </h2>
          <div className="space-y-4">
            {years.map((year) => (
              <div key={year} className="rounded-xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => setExpandedYear(expandedYear === year ? null : year)}
                  className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition-colors"
                >
                  <span className="text-sm font-bold text-slate-700">{year}</span>
                  {expandedYear === year ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedYear === year && (
                  <div className="divide-y divide-slate-50 px-4 py-2">
                    {Object.entries(marks[year]).map(([term, termMarks]) => (
                      <div key={term}>
                        <button
                          onClick={() =>
                            setExpandedTerm(
                              expandedTerm === `${year}:${term}` ? null : `${year}:${term}`,
                            )
                          }
                          className="flex w-full items-center justify-between py-2.5 text-left"
                        >
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            {term}
                          </span>
                          {expandedTerm === `${year}:${term}` ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                        {expandedTerm === `${year}:${term}` && (
                          <div className="grid gap-2 pb-3 sm:grid-cols-2">
                            {(Array.isArray(termMarks) ? termMarks : []).map((m: any) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                              >
                                <div>
                                  <p className="text-xs font-bold text-slate-800">
                                    {m.subjectName}
                                  </p>
                                  <p className="text-[10px] font-semibold text-slate-500">
                                    {m.type ?? "Assessment"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900">
                                    {m.percentage ?? m.score ?? "-"}
                                  </span>
                                  <GradeBadge grade={m.grade} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="py-12 text-center">
          <Award size={48} className="mx-auto text-slate-500 mb-3" />
          <p className="text-lg font-bold text-slate-600">No marks recorded yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Your grades will appear once teachers publish them.
          </p>
        </Card>
      )}
    </div>
  );
}

export function StudentMarksPage() {
  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="My Marks"
        subtitle="View your grades, marks, and report cards per term and academic year."
      />
      <MarksContent />
    </div>
  );
}
