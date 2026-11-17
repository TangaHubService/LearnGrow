import { Link } from "react-router-dom";
import {
  DashboardPanel,
  DashboardSkeleton,
  InlineErrorState,
  InlineEmptyState,
} from "../../teacherShared";
import { ModernTable } from "@/components/ModernUi";
import { useT } from "@/i18n/I18nContext";

export function LearnerSupportPanel({
  support,
  onOpenSupportDrawer,
}: {
  support: any;
  onOpenSupportDrawer: (row: any) => void;
}) {
  const t = useT();
  return (
    <DashboardPanel
      title={t("Learners Needing Support")}
      action={
        <Link to="/teacher/students" className="text-sm font-bold text-[#6d3eeb]">
          {t("View all")}
        </Link>
      }
    >
      {support.isLoading ? (
        <DashboardSkeleton />
      ) : support.error ? (
        <InlineErrorState
          message={(support.error as Error).message}
          onRetry={() => support.refetch()}
        />
      ) : support.data?.length ? (
        <ModernTable
          data={support.data.slice(0, 6)}
          columns={[
            { header: t("Learner"), accessor: "learnerName" },
            { header: t("Class"), accessor: "className" },
            { header: t("Issue"), accessor: "issue", className: "max-w-[150px] truncate" },
            {
              header: t("Action"),
              align: "right",
              accessor: (row: any) => (
                <button
                  onClick={() => onOpenSupportDrawer(row)}
                  className="h-8 rounded-lg border border-purple-200 px-3 text-[11px] font-bold text-[#6d3eeb] hover:bg-purple-50"
                >
                  {row.action}
                </button>
              ),
            },
          ]}
        />
      ) : (
        <InlineEmptyState message={t("No learners currently flagged for support.")} />
      )}
    </DashboardPanel>
  );
}
