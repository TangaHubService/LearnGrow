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
import { useT } from "@/i18n/I18nContext";

export function SchedulePanel({
  schedule,
  onAction,
  onPrepareWithAi,
}: {
  schedule: any;
  onAction: (item: any) => void;
  onPrepareWithAi: () => void;
}) {
  const t = useT();
  return (
    <DashboardPanel
      title={t("Today's Teaching Schedule")}
      action={
        <Link to="/teacher/timetable" className="text-sm font-bold text-[#6d3eeb]">
          {t("View full timetable")}
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
              header: t("Time"),
              accessor: (row: any) => (
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={14} /> {row.startTime} - {row.endTime}
                </span>
              ),
            },
            { header: t("Class"), accessor: "className" },
            { header: t("Subject"), accessor: "subjectName" },
            { header: t("Topic"), accessor: "topic" },
            {
              header: t("Status"),
              accessor: (row: any) => <DashboardStatusBadge status={row.status} />,
            },
            {
              header: t("Action"),
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
          message={t("No lessons scheduled for today.")}
          action={
            <Button variant="secondary" onClick={onPrepareWithAi}>
              {t("Prepare Lesson Plan")}
            </Button>
          }
        />
      )}
    </DashboardPanel>
  );
}
