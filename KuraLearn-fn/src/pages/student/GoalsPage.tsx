import { Flag, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ProgressBar } from "@/components/common/ProgressBar";
import { StudentCard } from "@/components/student/StudentShared";
import { useStudentDashboard } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";

export function GoalsPage() {
  const { data, isLoading, error, refetch } = useStudentDashboard();

  if (isLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Goals" subtitle="Loading..." />
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Goals" subtitle="Error" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">Failed to load goals</h3>
          <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const goals = data?.goals || [];

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="Goals"
        subtitle="Daily, weekly, subject, reading, quiz score and streak goals."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {goals.length > 0 ? (
          goals.map((goal: any) => (
            <StudentCard key={goal.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold">{goal.title}</p>
                  <p className="font-bold text-slate-500">
                    {goal.type} {goal.dueDate ? `- due ${goal.dueDate}` : ""}
                  </p>
                </div>
                <Flag className="text-emerald-700" />
              </div>
              <div className="mt-4">
                <ProgressBar
                  value={Math.min(100, (goal.current / goal.target) * 100)}
                  color="#059669"
                />
              </div>
              <p className="mt-2 text-sm font-bold text-slate-500">
                {goal.current}/{goal.target}
              </p>
            </StudentCard>
          ))
        ) : (
          <p className="col-span-full py-16 text-center text-slate-500 font-bold italic">
            No active goals found. Set some goals in your profile!
          </p>
        )}
      </div>
    </div>
  );
}
