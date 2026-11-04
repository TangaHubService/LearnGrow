import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SubjectCard } from "@/components/student/SubjectCard";
import { StudentIcon, StudentProgressBar, PrimaryLink } from "@/components/student/StudentShared";
import { useStudentSubjects } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw } from "lucide-react";

export function SubjectsPage() {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const { data, isLoading, error, refetch } = useStudentSubjects();

  if (isLoading) {
    return (
      <div>
        <PageHeader
          brand="KuraLean Learning"
          title="Subjects"
          subtitle="Loading your subjects..."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Subjects" subtitle="Failed to load subjects" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-red-50 p-4 text-red-600">
            <RefreshCw size={48} className="animate-spin-slow" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Failed to load subjects</h3>
          <p className="mt-2 max-w-xs text-slate-500">
            {(error as any)?.message || "Please check your connection and try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white transition-all hover:bg-indigo-700 active:scale-95"
          >
            <RefreshCw size={18} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const subjects = data?.subjects || data || [];

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="Subjects"
        subtitle="Subjects are matched to the learner level. Switch between card view and table view."
        actions={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`h-9 rounded-md px-3 text-sm font-bold ${viewMode === "cards" ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`h-9 rounded-md px-3 text-sm font-bold ${viewMode === "table" ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Table
            </button>
          </div>
        }
      />
      {viewMode === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject: any) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      ) : (
        <div tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-4">Subject</th>
                <th>Description</th>
                <th>Courses</th>
                <th>Progress</th>
                <th className="pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((subject: any) => (
                <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-sky-50 text-sky-700">
                        <StudentIcon name={subject.icon} />
                      </span>
                      <span className="font-bold text-slate-900">{subject.name}</span>
                    </div>
                  </td>
                  <td className="max-w-md py-4 text-sm font-medium text-slate-600">
                    {subject.description}
                  </td>
                  <td className="font-bold text-slate-700">
                    {subject.courses?.length || subject.courseCount || 0}
                  </td>
                  <td className="min-w-48 pr-6">
                    <div className="mb-1 text-[11px] font-bold text-slate-500">
                      {subject.progress}%
                    </div>
                    <StudentProgressBar
                      value={subject.progress}
                      color={subject.progress > 50 ? "#059669" : "#2563eb"}
                    />
                  </td>
                  <td className="pr-4 text-right">
                    <PrimaryLink to={`/subjects/${subject.id}`}>Open</PrimaryLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
