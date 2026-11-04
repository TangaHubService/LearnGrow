import { type PlatformActivity, superAdminApi } from "@/services/superAdminApi";
import { formatDateTime, readable } from "./format";
import { PlatformTablePage } from "./PlatformTablePage";

export function SuperAdminActivityPage() {
  return (
    <PlatformTablePage<PlatformActivity>
      title="Activity"
      subtitle="Recorded actions from every school, newest first."
      panelTitle="Audit trail"
      queryKey="activity"
      fetchPage={superAdminApi.activity}
      searchPlaceholder="Search by action or record type"
      itemLabel="entries"
      emptyMessage="No activity matches this search."
      columns={[
        { header: "When", accessor: (row) => formatDateTime(row.createdAt) },
        { header: "Action", accessor: (row) => readable(row.action) },
        { header: "Record", accessor: (row) => readable(row.entityType) },
        {
          header: "By",
          accessor: (row) => (
            <div>
              <span className="block font-semibold text-slate-900">
                {row.actorName ?? "System"}
              </span>
              {row.role ? (
                <span className="text-xs text-slate-500">{readable(row.role)}</span>
              ) : null}
            </div>
          ),
        },
        { header: "School", accessor: (row) => row.schoolName ?? "Platform" },
      ]}
    />
  );
}
