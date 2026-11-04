import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Filter, RotateCcw } from "lucide-react";
import { pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { Button } from "@/components/common/Button";
import { CustomDropdown } from "@/components/common/CustomDropdown";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { ApprovalStatusBadge } from "./ApprovalStatusBadge";
import { ReviewActionDrawer, type ReviewAction } from "./ReviewActionDrawer";
import { marksWorkflowApi, type MarkSubmission } from "@/services/marksWorkflowApi";

export function MarksApprovalDashboard({ title }: { title?: string }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    classId: "",
    subjectId: "",
    termId: "",
    status: "SUBMITTED",
    page: 1,
    pageSize: 12,
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviewId, setReviewId] = useState("");

  const contextQuery = useQuery({
    queryKey: ["marks-context", "approval"],
    queryFn: () => marksWorkflowApi.context(),
  });
  const submissionsQuery = useQuery({
    queryKey: ["mark-submissions", "approval", filters],
    queryFn: () => marksWorkflowApi.submissions(filters),
  });
  const detailQuery = useQuery({
    queryKey: ["mark-submission-detail", reviewId],
    queryFn: () => marksWorkflowApi.submission(reviewId),
    enabled: Boolean(reviewId),
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      comment,
    }: {
      id: string;
      action: ReviewAction;
      comment: string;
    }) => {
      if (action === "approve") return marksWorkflowApi.approve(id, comment);
      if (action === "reject") return marksWorkflowApi.reject(id, comment);
      if (action === "unlock") return marksWorkflowApi.unlock(id, comment);
      return marksWorkflowApi.requestCorrection(id, comment);
    },
    onSuccess: () => {
      dispatch(pushToast({ tone: "success", message: "Review action completed" }));
      setReviewId("");
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["mark-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["mark-submission-detail"] });
    },
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "Review action failed" })),
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

  const set = (patch: Partial<typeof filters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const columns: DataTableColumn<MarkSubmission>[] = [
    {
      id: "submission",
      header: "Submission",
      sortable: true,
      sortValue: (row) => `${row.class?.name} ${row.subject?.name} ${row.term?.name}`,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">
            {row.class?.name} / {row.subject?.name}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            {row.assessmentType} / {row.term?.name}
          </p>
        </div>
      ),
    },
    {
      id: "teacher",
      header: "Teacher",
      cell: (row) => row.teacher?.user?.name || "Teacher",
      sortable: true,
    },
    {
      id: "progress",
      header: "Progress",
      sortValue: (row) => row.completion?.percentage ?? 0,
      sortable: true,
      cell: (row) => (
        <div className="min-w-36">
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{ width: `${row.completion?.percentage ?? 0}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {row.completion?.missingMarks ?? 0} missing
          </p>
        </div>
      ),
    },
    {
      id: "submittedAt",
      header: "Submitted",
      cell: (row) =>
        row.submittedAt
          ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
              new Date(row.submittedAt),
            )
          : "-",
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <ApprovalStatusBadge status={row.status} locked={row.isLocked} />,
    },
  ];

  const bulkApprove = async () => {
    await Promise.all(
      selectedIds.map((id) => marksWorkflowApi.approve(id, "Bulk approved from dashboard")),
    );
    dispatch(
      pushToast({ tone: "success", message: `${selectedIds.length} submission(s) approved` }),
    );
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ["mark-submissions"] });
  };

  return (
    <div className="space-y-5">
      {title ? (
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Approve, reject, unlock, and request correction for batch marks submissions.
          </p>
        </div>
      ) : null}

      <DataTable
        data={submissionsQuery.data?.items ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={submissionsQuery.isLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onRowClick={(row) => setReviewId(row.id)}
        emptyTitle="No submissions in this view"
        emptyMessage="Adjust filters or wait for teachers to submit marks."
        toolbar={
          <div className="space-y-3">
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
                    status: "SUBMITTED",
                    page: 1,
                    pageSize: 12,
                  })
                }
              >
                <Filter size={16} /> Reset
              </Button>
            </div>
            {selectedIds.length ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="text-sm font-bold text-emerald-800">
                  {selectedIds.length} selected
                </span>
                <Button size="sm" onClick={bulkApprove} disabled={!selectedIds.length}>
                  <CheckCircle2 size={15} /> Bulk approve
                </Button>
              </div>
            ) : null}
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
          <Button size="sm" variant="secondary" onClick={() => setReviewId(row.id)}>
            <RotateCcw size={15} /> Review
          </Button>
        )}
      />

      <ReviewActionDrawer
        open={Boolean(reviewId)}
        submission={
          detailQuery.data ||
          submissionsQuery.data?.items.find((item) => item.id === reviewId) ||
          null
        }
        loading={actionMutation.isPending || detailQuery.isLoading}
        onClose={() => setReviewId("")}
        onAction={(action, comment) => actionMutation.mutate({ id: reviewId, action, comment })}
      />
    </div>
  );
}
