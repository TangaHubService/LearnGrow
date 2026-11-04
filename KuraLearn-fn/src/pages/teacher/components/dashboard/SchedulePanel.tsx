import { Link } from "react-router-dom";
import { Clock, Eye, CheckCircle2, Bot } from "lucide-react";
import {
  DashboardPanel,
  DashboardSkeleton,
  InlineErrorState,
  InlineEmptyState,
  Button,
  DashboardStatusBadge,
} from "../../teacherShared";
import { ModernTable } from "@/components/ModernUi";

export function SchedulePanel({
  schedule,
  onAction,
  onPrepareWithAi,
}: {
  schedule: any;
  onAction: (item: any) => void;
  onPrepareWithAi: () => void;
}) {
  return (
    <DashboardPanel
      title="Today's Teaching Schedule"
      action={
        <Link to="/teacher/timetable" className="text-sm font-bold text-[#6d3eeb]">
          View full timetable
        </Link>
      }
    >
      {schedule.isLoading ? (
        <DashboardSkeleton />
      ) : schedule.error ? (
        <InlineErrorState
          message={(schedule.error as Error).message}
          onRetry={() => schedule.refetch()}
        />
      ) : schedule.data?.length ? (
        <ModernTable
          data={schedule.data}
          columns={[
            {
              header: "Time",
              accessor: (row: any) => (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={14} /> {row.startTime} - {row.endTime}
                </span>
              ),
            },
            { header: "Class", accessor: "className" },
            { header: "Subject", accessor: "subjectName" },
            { header: "Topic", accessor: "topic" },
            {
              header: "Status",
              accessor: (row: any) => <DashboardStatusBadge status={row.status} />,
            },
            {
              header: "Action",
              align: "right",
              accessor: (row: any) => (
                <button
                  onClick={() => onAction(row)}
                  className="inline-flex h-8 items-center gap-2 rounded-lg border border-purple-200 px-2.5 text-[11px] font-bold text-[#6d3eeb] hover:bg-purple-50"
                >
                  {row.action === "View" ? (
                    <Eye size={13} />
                  ) : row.action === "Mark as Taught" ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <Bot size={13} />
                  )}
                  {row.action}
                </button>
              ),
            },
          ]}
        />
      ) : (
        <InlineEmptyState
          message="No lessons scheduled for today."
          action={
            <Button variant="secondary" onClick={onPrepareWithAi}>
              Prepare Lesson Plan
            </Button>
          }
        />
      )}
    </DashboardPanel>
  );
}
