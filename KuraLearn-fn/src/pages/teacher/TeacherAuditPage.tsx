import { useQuery } from "@tanstack/react-query";
import { lmsService } from "@/services/lmsService";
import { PageHeader } from "./teacherShared";
import { ModernTable } from "@/components/ModernUi";

export function TeacherAuditPage() {
  const { data } = useQuery({ queryKey: ["teacher-audit"], queryFn: lmsService.auditLogs });

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Login, create, edit, publish, assign, send and AI approval events."
      />
      <ModernTable
        data={data?.auditLogs ?? []}
        columns={[
          { header: "Action", accessor: "action" },
          { header: "Entity", accessor: "entityType" },
          { header: "Role", accessor: "role" },
          {
            header: "Time",
            accessor: (row: any) =>
              new Date(row.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
        ]}
      />
    </div>
  );
}
