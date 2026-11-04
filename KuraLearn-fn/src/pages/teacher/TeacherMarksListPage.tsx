import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Filter, FileSpreadsheet } from "lucide-react";
import { TeacherGlobalUi } from "./TeacherGlobalUi";
import { Button, PageHeader } from "./teacherShared";
import { CustomDropdown } from "@/components/common/CustomDropdown";
import { AppDrawer } from "@/components/common/AppDrawer";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { ApprovalStatusBadge } from "@/components/marks/ApprovalStatusBadge";
import { ApprovalTimeline } from "@/components/marks/ApprovalTimeline";
import { MissingMarksPanel } from "@/components/marks/MissingMarksPanel";
import { marksWorkflowApi, type MarkSubmission } from "@/services/marksWorkflowApi";

export function TeacherMarksListPage() {
  const [filters, setFilters] = useState({
    classId: "",
    subjectId: "",
    termId: "",
    status: "",
    page: 1,
    pageSize: 12,
  });
  const [selectedId, setSelectedId] = useState("");

  const contextQuery = useQuery({
    queryKey: ["marks-context", "list"],
    queryFn: () => marksWorkflowApi.context(),
  });
  const submissionsQuery = useQuery({
    queryKey: ["mark-submissions", "teacher-list", filters],
    queryFn: () => marksWorkflowApi.submissions(filters),
  });
  const detailQuery = useQuery({
    queryKey: ["mark-submission-detail", selectedId],
    queryFn: () => marksWorkflowApi.submission(selectedId),
    enabled: Boolean(selectedId),
  });

  const classOptions = useMemo(
    () => [
      { value: "", label: "All classes" },
      ...(contextQuery.data?.classes ?? []).map((item: any) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [contextQuery.data],
  );
  const subjectOptions = useMemo(
    () => [
      { value: "", label: "All subjects" },
      ...(contextQuery.data?.subjects ?? []).map((item: any) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [contextQuery.data],
  );
  const termOptions = useMemo(
    () => [
      { value: "", label: "All terms" },
      ...(contextQuery.data?.terms ?? []).map((item: any) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [contextQuery.data],
  );
  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "CORRECTION_REQUESTED", label: "Correction requested" },
    { value: "REJECTED", label: "Rejected" },
    { value: "APPROVED", label: "Approved" },
  ];

  const columns: DataTableColumn<MarkSubmission>[] = [
    {
      id: "assessment",
      header: "Assessment",
      sortable: true,
      sortValue: (row) => `${row.class?.name} ${row.subject?.name} ${row.assessmentType}`,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.assessmentType}</p>
          <p className="text-xs font-semibold text-slate-500">
            {row.class?.name} / {row.subject?.name}
          </p>
        </div>
      ),
    },
    { id: "term", header: "Term", sortable: true, cell: (row) => row.term?.name || "-" },
    {
      id: "completion",
      header: "Completion",
      sortValue: (row) => row.completion?.percentage ?? 0,
      sortable: true,
      cell: (row) => (
        <div className="min-w-36">
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-[#6d3eeb]"
              style={{ width: `${row.completion?.percentage ?? 0}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {row.completion?.recordedMarks ?? 0}/{row.completion?.totalStudents ?? 0} recorded
          </p>
        </div>
      ),
    },
    { id: "teacher", header: "Teacher", cell: (row) => row.teacher?.user?.name || "Me" },
    {
      id: "status",
      header: "Status",
      cell: (row) => <ApprovalStatusBadge status={row.status} locked={row.isLocked} />,
    },
  ];

  const set = (patch: Partial<typeof filters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Marks Submissions"
          subtitle="Track draft, submitted, correction, and approved marks batches from one clean list."
        />

        <DataTable
          data={submissionsQuery.data?.items ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          loading={submissionsQuery.isLoading}
          emptyTitle="No marks submissions"
          emptyMessage="Save a marks draft to create your first batch submission."
          onRowClick={(row) => setSelectedId(row.id)}
          toolbar={
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <CustomDropdown
                value={filters.classId}
                options={classOptions}
                onChange={(classId) => set({ classId })}
                placeholder="Class"
              />
              <CustomDropdown
                value={filters.subjectId}
                options={subjectOptions}
                onChange={(subjectId) => set({ subjectId })}
                placeholder="Subject"
              />
              <CustomDropdown
                value={filters.termId}
                options={termOptions}
                onChange={(termId) => set({ termId })}
                placeholder="Term"
              />
              <CustomDropdown
                value={filters.status}
                options={statusOptions}
                onChange={(status) => set({ status })}
                placeholder="Status"
              />
              <Button
                variant="secondary"
                onClick={() =>
                  setFilters({
                    classId: "",
                    subjectId: "",
                    termId: "",
                    status: "",
                    page: 1,
                    pageSize: 12,
                  })
                }
              >
                <Filter size={16} /> Reset
              </Button>
            </div>
          }
          pagination={{
            page: submissionsQuery.data?.pagination.page ?? filters.page,
            pageSize: submissionsQuery.data?.pagination.pageSize ?? filters.pageSize,
            total: submissionsQuery.data?.pagination.total ?? 0,
            totalPages: submissionsQuery.data?.pagination.totalPages ?? 1,
            onPageChange: (page) => setFilters((current) => ({ ...current, page })),
            onPageSizeChange: (pageSize) =>
              setFilters((current) => ({ ...current, pageSize, page: 1 })),
          }}
          rowActions={(row) => (
            <Button size="sm" variant="secondary" onClick={() => setSelectedId(row.id)}>
              <Eye size={15} /> Review
            </Button>
          )}
        />

        <AppDrawer
          open={Boolean(selectedId)}
          onClose={() => setSelectedId("")}
          title="Submission details"
          subtitle={
            detailQuery.data?.submission
              ? `${detailQuery.data.submission.class?.name} / ${detailQuery.data.submission.subject?.name}`
              : ""
          }
          size="xl"
        >
          {detailQuery.data ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Status</p>
                  <div className="mt-2">
                    <ApprovalStatusBadge
                      status={detailQuery.data.submission.status}
                      locked={detailQuery.data.submission.isLocked}
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Completion</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {detailQuery.data.completion.percentage}%
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Maximum marks</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {detailQuery.data.submission.maxScore}
                  </p>
                </div>
              </div>

              <MissingMarksPanel records={detailQuery.data.records} />

              <DataTable
                data={detailQuery.data.records}
                getRowId={(row) => row.studentId}
                columns={[
                  {
                    id: "student",
                    header: "Learner",
                    cell: (row) => row.student?.user?.name || row.studentId,
                    sortable: true,
                  },
                  {
                    id: "score",
                    header: "Score",
                    cell: (row) => row.score ?? "-",
                    sortable: true,
                    sortValue: (row) => row.score ?? -1,
                  },
                  { id: "grade", header: "Grade", cell: (row) => row.grade || "-" },
                  { id: "comment", header: "Comment", cell: (row) => row.teacherComments || "-" },
                ]}
                emptyTitle="No rows"
              />

              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <FileSpreadsheet size={16} /> Timeline
                </h3>
                <ApprovalTimeline events={detailQuery.data.submission.events} />
              </section>
            </div>
          ) : null}
        </AppDrawer>
      </div>
      <TeacherGlobalUi />
    </>
  );
}

export default TeacherMarksListPage;
