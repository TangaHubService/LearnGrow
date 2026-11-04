import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Download, Eye, FileText, Filter, Sparkles } from "lucide-react";
import { pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { AppDrawer } from "@/components/common/AppDrawer";
import { Button } from "@/components/common/Button";
import { CustomDropdown } from "@/components/common/CustomDropdown";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { ApprovalStatusBadge } from "@/components/marks/ApprovalStatusBadge";
import { AnalyticsMetricCard } from "@/components/marks/AnalyticsMetricCard";
import { marksWorkflowApi } from "@/services/marksWorkflowApi";

function resolveReportPdfUrl(pdfUrl: string) {
  if (!pdfUrl) return "";
  if (/^https?:\/\//i.test(pdfUrl)) return pdfUrl;
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
  return new URL(pdfUrl, apiUrl).toString();
}

function openReportPdf(pdfUrl: string) {
  const resolved = resolveReportPdfUrl(pdfUrl);
  if (resolved) window.open(resolved, "_blank");
}

function downloadReportPdf(pdfUrl: string, fileName: string) {
  const resolved = resolveReportPdfUrl(pdfUrl);
  if (!resolved) return;
  const link = document.createElement("a");
  link.href = resolved;
  link.download = fileName;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function MarksReportsPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    classId: "",
    termId: "",
    status: "",
    page: 1,
    pageSize: 12,
  });
  const [selectedReportId, setSelectedReportId] = useState("");
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [headteacherComments, setHeadteacherComments] = useState("");

  const contextQuery = useQuery({
    queryKey: ["marks-context", "reports"],
    queryFn: () => marksWorkflowApi.context(),
  });
  const reportsQuery = useQuery({
    queryKey: ["report-cards", filters],
    queryFn: () => marksWorkflowApi.reportCards(filters),
    enabled: Boolean(filters.classId && filters.termId),
  });
  const marksheetQuery = useQuery({
    queryKey: ["class-marksheet", filters.classId, filters.termId],
    queryFn: () =>
      marksWorkflowApi.classMarksheet({ classId: filters.classId, termId: filters.termId }),
    enabled: Boolean(filters.classId && filters.termId),
  });
  const detailQuery = useQuery({
    queryKey: ["report-card", selectedReportId],
    queryFn: () => marksWorkflowApi.reportCard(selectedReportId),
    enabled: Boolean(selectedReportId),
  });
  const aiQuery = useQuery({
    queryKey: ["report-ai-insights", detailQuery.data?.studentId, detailQuery.data?.termId],
    queryFn: () =>
      marksWorkflowApi.aiInsights({
        studentId: detailQuery.data.studentId,
        termId: detailQuery.data.termId,
      }),
    enabled: Boolean(detailQuery.data?.studentId && detailQuery.data?.termId),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      marksWorkflowApi.generateReportCards({ classId: filters.classId, termId: filters.termId }),
    onSuccess: (result) => {
      dispatch(
        pushToast({
          tone: "success",
          message: `${result.count} report card(s) generated from approved marks`,
        }),
      );
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      queryClient.invalidateQueries({ queryKey: ["class-marksheet"] });
    },
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "Report generation failed" })),
  });

  const approveMutation = useMutation({
    mutationFn: () => marksWorkflowApi.approveReportCard(selectedReportId, { headteacherComments }),
    onSuccess: () => {
      dispatch(pushToast({ tone: "success", message: "Report card approved" }));
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      queryClient.invalidateQueries({ queryKey: ["report-card", selectedReportId] });
    },
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "Report approval failed" })),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      const ids = [...selectedReportIds];
      await Promise.all(ids.map((id) => marksWorkflowApi.approveReportCard(id)));
      return ids.length;
    },
    onSuccess: (count) => {
      dispatch(pushToast({ tone: "success", message: `${count} report card(s) approved` }));
      setSelectedReportIds([]);
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
      queryClient.invalidateQueries({ queryKey: ["report-card"] });
    },
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "Bulk approval failed" })),
  });

  const exportMutation = useMutation({
    mutationFn: (id: string) => marksWorkflowApi.exportReportCardPdf(id),
    onSuccess: (result) => {
      dispatch(
        pushToast({
          tone: "success",
          message: "PDF generated. AI insights are kept in-system only.",
        }),
      );
      openReportPdf(result.pdfUrl);
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
    },
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "PDF export failed" })),
  });

  const bulkExportMutation = useMutation({
    mutationFn: () =>
      marksWorkflowApi.exportClassPdf({ classId: filters.classId, termId: filters.termId }),
    onSuccess: (result) => {
      downloadReportPdf(result.pdfUrl, "report-cards.pdf");
      dispatch(
        pushToast({
          tone: "success",
          message: `${result.count ?? "Class"} report cards generated in one PDF`,
        }),
      );
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
    },
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "Bulk PDF export failed" })),
  });

  const exportMarksheetMutation = useMutation({
    mutationFn: () =>
      marksWorkflowApi.exportMarksheetPdf({ classId: filters.classId, termId: filters.termId }),
    onSuccess: (result) => openReportPdf(result.pdfUrl),
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "Marksheet export failed" })),
  });

  const classOptions = useMemo(
    () => [
      { value: "", label: "Select class" },
      ...(contextQuery.data?.classes ?? []).map((item: any) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [contextQuery.data],
  );
  const termOptions = useMemo(
    () => [
      { value: "", label: "Select term" },
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
    { value: "APPROVED", label: "Approved" },
    { value: "LOCKED", label: "Locked" },
  ];

  const reports = reportsQuery.data?.items ?? [];
  const generatedCount = reports.length;
  const approvedCount = reports.filter(
    (item: any) => item.status === "APPROVED" || item.status === "LOCKED",
  ).length;
  const classAverage = marksheetQuery.data?.classAverage ?? 0;

  const columns: DataTableColumn<any>[] = [
    {
      id: "student",
      header: "Student",
      sortable: true,
      sortValue: (row) => row.student?.user?.name || "",
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.student?.user?.name || "Student"}</p>
          <p className="text-xs font-semibold text-slate-500">
            {row.student?.studentCode || row.studentId}
          </p>
        </div>
      ),
    },
    {
      id: "average",
      header: "Average",
      sortable: true,
      sortValue: (row) => row.averagePercentage ?? 0,
      cell: (row) => `${row.averagePercentage ?? 0}%`,
    },
    { id: "grade", header: "Grade", cell: (row) => row.grade || "-" },
    {
      id: "rank",
      header: "Rank",
      sortable: true,
      sortValue: (row) => row.classRank ?? 9999,
      cell: (row) => row.classRank || "-",
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <ApprovalStatusBadge status={row.status} locked={row.status === "LOCKED"} />,
    },
    { id: "pdf", header: "PDF", cell: (row) => (row.pdfUrl ? "Generated" : "Not exported") },
  ];

  const selectedCount = selectedReportIds.length;
  const bulkBusy = bulkApproveMutation.isPending || bulkExportMutation.isPending;

  const set = (patch: Partial<typeof filters>) => {
    setSelectedReportIds([]);
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Report Cards</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Generate official reports only from approved locked marks. AI insights stay visible here
            and are not printed on PDFs.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <Button
            variant="secondary"
            onClick={() => exportMarksheetMutation.mutate()}
            disabled={!filters.classId || !filters.termId || exportMarksheetMutation.isPending}
          >
            <Download size={16} /> Marksheet PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => bulkApproveMutation.mutate()}
            disabled={!selectedCount || bulkBusy}
          >
            <CheckCircle2 size={16} /> Bulk Approve{selectedCount ? ` (${selectedCount})` : ""}
          </Button>
          <Button
            variant="secondary"
            onClick={() => bulkExportMutation.mutate()}
            disabled={!filters.classId || !filters.termId || bulkBusy}
          >
            <Download size={16} /> Bulk Download
          </Button>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!filters.classId || !filters.termId || generateMutation.isPending}
          >
            <FileText size={16} /> Generate Reports
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <AnalyticsMetricCard
          label="Generated"
          value={generatedCount}
          helper="Report cards in current filter"
          tone="purple"
          icon={<FileText size={18} />}
        />
        <AnalyticsMetricCard
          label="Approved"
          value={approvedCount}
          helper="Visible to students and parents"
          tone="emerald"
        />
        <AnalyticsMetricCard
          label="Class Average"
          value={`${classAverage}%`}
          helper="Computed from approved marks"
          tone="blue"
          icon={<BarChart3 size={18} />}
        />
      </div>

      <DataTable
        data={reports}
        columns={columns}
        getRowId={(row) => row.id}
        loading={reportsQuery.isLoading}
        selectedIds={selectedReportIds}
        onSelectionChange={setSelectedReportIds}
        emptyTitle={
          filters.classId && filters.termId
            ? "No report cards generated"
            : "Choose a class and term"
        }
        emptyMessage={
          filters.classId && filters.termId
            ? "Generate reports after approving marks submissions."
            : "Reports need a class and term context."
        }
        toolbar={
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <CustomDropdown
                value={filters.classId}
                options={classOptions}
                onChange={(classId) => set({ classId })}
                placeholder="Class"
                clearable={false}
              />
              <CustomDropdown
                value={filters.termId}
                options={termOptions}
                onChange={(termId) => set({ termId })}
                placeholder="Term"
                clearable={false}
              />
              <CustomDropdown
                value={filters.status}
                options={statusOptions}
                onChange={(status) => set({ status })}
                placeholder="Status"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedReportIds([]);
                  setFilters({ classId: "", termId: "", status: "", page: 1, pageSize: 12 });
                }}
              >
                <Filter size={16} /> Reset
              </Button>
            </div>
            {selectedCount ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
                <span className="text-sm font-bold text-purple-900">
                  {selectedCount} report card{selectedCount === 1 ? "" : "s"} selected
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => bulkApproveMutation.mutate()}
                    disabled={bulkBusy}
                  >
                    <CheckCircle2 size={15} /> Approve selected
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => bulkExportMutation.mutate()}
                    disabled={!filters.classId || !filters.termId || bulkBusy}
                  >
                    <Download size={15} /> Download class PDF
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        }
        pagination={{
          page: reportsQuery.data?.pagination.page ?? filters.page,
          pageSize: reportsQuery.data?.pagination.pageSize ?? filters.pageSize,
          total: reportsQuery.data?.pagination.total ?? 0,
          totalPages: reportsQuery.data?.pagination.totalPages ?? 1,
          onPageChange: (page) => setFilters((current) => ({ ...current, page })),
          onPageSizeChange: (pageSize) =>
            setFilters((current) => ({ ...current, pageSize, page: 1 })),
        }}
        onRowClick={(row) => {
          setSelectedReportId(row.id);
          setHeadteacherComments(row.headteacherComments || "");
        }}
        rowActions={(row) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedReportId(row.id);
                setHeadteacherComments(row.headteacherComments || "");
              }}
            >
              <Eye size={15} /> Preview
            </Button>
            <Button
              size="sm"
              onClick={() => exportMutation.mutate(row.id)}
              disabled={exportMutation.isPending}
            >
              <Download size={15} /> PDF
            </Button>
          </div>
        )}
      />

      <AppDrawer
        open={Boolean(selectedReportId)}
        onClose={() => setSelectedReportId("")}
        title="Report preview"
        subtitle="System preview with AI insights. Official PDF export excludes AI insights."
        size="2xl"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setSelectedReportId("")}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => selectedReportId && exportMutation.mutate(selectedReportId)}
              disabled={!selectedReportId || exportMutation.isPending}
            >
              <Download size={16} /> Export PDF
            </Button>
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={!selectedReportId || approveMutation.isPending}
            >
              Approve Report
            </Button>
          </div>
        }
      >
        {detailQuery.data ? (
          <div className="space-y-5">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-start">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {detailQuery.data.class?.school?.name || "School"}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-950">
                    {detailQuery.data.student?.user?.name}
                  </h2>
                  <p className="text-sm font-semibold text-slate-500">
                    {detailQuery.data.class?.name} / {detailQuery.data.academicYear?.name} /{" "}
                    {detailQuery.data.term?.name}
                  </p>
                </div>
                <ApprovalStatusBadge status={detailQuery.data.status} />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Total</p>
                  <p className="mt-1 text-xl font-bold">{detailQuery.data.totalMarks ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Average</p>
                  <p className="mt-1 text-xl font-bold">
                    {detailQuery.data.averagePercentage ?? 0}%
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Grade</p>
                  <p className="mt-1 text-xl font-bold">{detailQuery.data.grade || "-"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Rank</p>
                  <p className="mt-1 text-xl font-bold">{detailQuery.data.classRank || "-"}</p>
                </div>
              </div>

              <table className="mt-5 w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                    <th className="border border-slate-200 px-3 py-2">Subject</th>
                    <th className="border border-slate-200 px-3 py-2">Score</th>
                    <th className="border border-slate-200 px-3 py-2">Average</th>
                    <th className="border border-slate-200 px-3 py-2">Grade</th>
                    <th className="border border-slate-200 px-3 py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {((detailQuery.data.reportData as any)?.subjects ?? []).map((subject: any) => (
                    <tr key={subject.subjectId}>
                      <td className="border border-slate-200 px-3 py-2 font-bold">
                        {subject.subjectName}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">
                        {subject.totalScore}/{subject.totalMaxScore}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">{subject.percentage}%</td>
                      <td className="border border-slate-200 px-3 py-2">{subject.grade}</td>
                      <td className="border border-slate-200 px-3 py-2">{subject.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="rounded-lg border border-purple-100 bg-purple-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#6d3eeb]">
                <Sparkles size={16} /> AI insights for system users only
              </div>
              {aiQuery.isLoading ? (
                <p className="text-sm font-semibold text-purple-700">
                  Generating real-data insights...
                </p>
              ) : aiQuery.data ? (
                <div className="space-y-2 text-sm font-semibold text-purple-900">
                  <p>{aiQuery.data.performanceSummary}</p>
                  <p>{aiQuery.data.weakAreaDetection}</p>
                  <p>{aiQuery.data.attendancePerformanceRelation}</p>
                </div>
              ) : (
                <p className="text-sm font-semibold text-purple-700">
                  AI insights will appear after report data is available.
                </p>
              )}
            </section>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Headteacher comments
              </span>
              <textarea
                value={headteacherComments}
                onChange={(event) => setHeadteacherComments(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
              />
            </label>
          </div>
        ) : null}
      </AppDrawer>
    </div>
  );
}
