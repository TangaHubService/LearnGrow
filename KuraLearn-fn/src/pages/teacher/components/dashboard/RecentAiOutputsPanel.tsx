import { Link } from "react-router-dom";
import {
  DashboardPanel,
  DashboardSkeleton,
  InlineErrorState,
  InlineEmptyState,
  DashboardStatusBadge,
  displayDate,
  Button,
} from "../../teacherShared";

export function RecentAiOutputsPanel({
  aiOutputs,
  onOpenOutput,
  onPrepareLesson,
}: {
  aiOutputs: any;
  onOpenOutput: (item: any) => void;
  onPrepareLesson: () => void;
}) {
  return (
    <DashboardPanel
      title="Recent AI Outputs"
      action={
        <Link to="/teacher/ai" className="text-sm font-bold text-[#6d3eeb]">
          View all
        </Link>
      }
    >
      {aiOutputs.isLoading ? (
        <DashboardSkeleton />
      ) : aiOutputs.error ? (
        <InlineErrorState
          message={(aiOutputs.error as Error).message}
          onRetry={() => aiOutputs.refetch()}
        />
      ) : aiOutputs.data?.length ? (
        <div className="space-y-2">
          {aiOutputs.data.slice(0, 5).map((item: any) => (
            <button
              key={item.id}
              onClick={() => onOpenOutput(item)}
              className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
            >
              <span className="min-w-0">
                <span className="block truncate font-bold text-slate-900">{item.title}</span>
                <span className="block text-xs font-bold text-slate-500">
                  {item.className || item.subjectName || "AI output"}
                </span>
              </span>
              <DashboardStatusBadge status={item.type} />
              <span className="text-xs font-bold text-slate-500">{displayDate(item.date)}</span>
            </button>
          ))}
        </div>
      ) : (
        <InlineEmptyState
          message="No AI outputs created yet."
          action={
            <Button variant="secondary" onClick={onPrepareLesson}>
              Generate your first lesson plan
            </Button>
          }
        />
      )}
    </DashboardPanel>
  );
}
