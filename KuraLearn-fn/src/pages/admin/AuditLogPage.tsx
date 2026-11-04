import { useState, useEffect } from "react";
import { auditApi, type AuditLogEntry } from "../../services/auditApi";
import { ExportButton } from "../../components/common/ExportButton";
import { EmptyState } from "../../components/common/EmptyState";
import { Skeleton } from "../../components/common/Skeleton";

const ACTION_LABELS: Record<string, string> = {
  CREATE_STUDENT: "Created Student",
  UPDATE_STUDENT: "Updated Student",
  CREATE_CLASS: "Created Class",
  UPDATE_CLASS: "Updated Class",
  ARCHIVE_CLASS: "Archived Class",
  CREATE_COURSE: "Created Course",
  CREATE_LESSON: "Created Lesson",
  UPDATE_LESSON: "Updated Lesson",
  ARCHIVE_LESSON: "Archived Lesson",
  PUBLISH_LESSON: "Published Lesson",
  DUPLICATE_LESSON: "Duplicated Lesson",
  START_LESSON_DELIVERY: "Started Lesson",
  END_LESSON_DELIVERY: "Ended Lesson",
  SEND_MESSAGE: "Sent Message",
  CREATE_RESOURCE: "Created Resource",
  SAVE_AI_OUTPUT: "Saved AI Output",
  CREATE_LESSON_PLAN: "Created Lesson Plan",
  DELETE_LESSON_PLAN: "Deleted Lesson Plan",
  PUBLISH_LESSON_PLAN: "Published Lesson Plan",
  NOTIFICATION_SENT: "Sent Notification",
  LOGIN: "Login",
  EXPORT_CSV: "Exported CSV",
  EXPORT_EXCEL: "Exported Excel",
  EXPORT_PDF: "Exported PDF",
};

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page) };
    if (filterAction) params.action = filterAction;
    if (filterEntity) params.entityType = filterEntity;

    auditApi
      .getLogs(params)
      .then((data) => {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filterAction, filterEntity]);

  const actions = Object.keys(ACTION_LABELS);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-sm text-slate-500">Track all actions across the platform</p>
        </div>
        <ExportButton endpoint="/exports/audit/csv" filename="audit-log.csv" />
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABELS[a] ?? a}
            </option>
          ))}
        </select>

        <select
          value={filterEntity}
          onChange={(e) => {
            setFilterEntity(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All Entities</option>
          {[
            "Student",
            "Class",
            "Lesson",
            "Course",
            "LessonPlan",
            "Mark",
            "Attendance",
            "Resource",
            "Message",
            "Notification",
          ].map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit logs found"
          description="No actions have been logged matching your filters."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Entity</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.entityType}
                    {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.user?.name ?? "System"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
