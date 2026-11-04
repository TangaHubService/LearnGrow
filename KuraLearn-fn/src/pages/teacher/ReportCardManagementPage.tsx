import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  GraduationCap,
  Users,
  Search,
} from "lucide-react";
import { pushToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";
import { Button } from "@/components/common/Button";
import { CustomDropdown } from "@/components/common/CustomDropdown";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Card } from "@/components/common/Card";
import { marksWorkflowApi } from "@/services/marksWorkflowApi";

interface ReportCardFilters {
  academicYearId: string;
  termId: string;
  classId: string;
  studentId: string;
  status: string;
  page: number;
  pageSize: number;
}

interface ReportCard {
  id: string;
  studentId: string;
  student?: { user?: { name?: string }; registrationNumber?: string };
  classId: string;
  class?: { name?: string };
  academicYearId: string;
  academicYear?: { name?: string };
  termId: string;
  term?: { name?: string };
  status: "DRAFT" | "GENERATED" | "APPROVED" | "PUBLISHED";
  generatedAt?: string;
  approvedAt?: string;
  approvedBy?: { user?: { name?: string } };
  headteacherComments?: string;
  promotionRecommendation?: string;
  overallGrade?: string;
  overallAverage?: number;
  subjectCount?: number;
  pdfUrl?: string;
}

function getSmartDefaultFilters(contextData: any): Partial<ReportCardFilters> {
  if (!contextData) return { status: "", page: 1, pageSize: 12 };

  const latestAcademicYear = contextData.academicYears?.[0];
  const currentTerm = contextData.terms?.[0];

  return {
    academicYearId: latestAcademicYear?.id || "",
    termId: currentTerm?.id || "",
    status: "",
    classId: "",
    studentId: "",
    page: 1,
    pageSize: 12,
  };
}

export function ReportCardManagementPage() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ReportCardFilters>({
    academicYearId: "",
    termId: "",
    classId: "",
    studentId: "",
    status: "",
    page: 1,
    pageSize: 12,
  });
  const [initialized, setInitialized] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  const contextQuery = useQuery({
    queryKey: ["marks-context", "reports"],
    queryFn: () => marksWorkflowApi.context(),
  });

  useEffect(() => {
    if (contextQuery.data && !initialized) {
      const smartDefaults = getSmartDefaultFilters(contextQuery.data);
      setFilters((current) => ({ ...current, ...smartDefaults }));
      setInitialized(true);
    }
  }, [contextQuery.data, initialized]);

  const reportCardsQuery = useQuery({
    queryKey: ["report-cards", filters],
    queryFn: () => marksWorkflowApi.reportCards(filters),
    enabled: initialized,
  });

  useEffect(() => {
    if (initialized && reportCardsQuery.data?.pagination.total === 0 && !fallbackAttempted) {
      setFallbackAttempted(true);
      setFilters((current) => {
        const context = contextQuery.data;
        const availableTerms = context?.terms || [];
        const currentTermIndex = availableTerms.findIndex((t: any) => t.id === current.termId);
        const previousTerm =
          currentTermIndex > 0
            ? availableTerms[currentTermIndex - 1]
            : availableTerms[availableTerms.length - 1];

        if (previousTerm && previousTerm.id !== current.termId) {
          return { ...current, termId: previousTerm.id, page: 1 };
        }

        const availableYears = context?.academicYears || [];
        const currentYearIndex = availableYears.findIndex(
          (y: any) => y.id === current.academicYearId,
        );
        const previousYear =
          currentYearIndex > 0
            ? availableYears[currentYearIndex - 1]
            : availableYears[availableYears.length - 1];

        if (previousYear && previousYear.id !== current.academicYearId) {
          return { ...current, academicYearId: previousYear.id, page: 1 };
        }

        return current;
      });
    }
  }, [initialized, reportCardsQuery.data, fallbackAttempted, contextQuery.data]);

  const hasActiveFilters = Boolean(
    filters.classId ||
    filters.termId ||
    filters.status ||
    filters.academicYearId ||
    filters.studentId,
  );

  const availableSuggestions = useMemo(() => {
    if (!contextQuery.data) return [];
    const suggestions: { label: string; action: () => void }[] = [];
    if (contextQuery.data.classes?.length)
      suggestions.push({
        label: `All ${contextQuery.data.classes.length} classes`,
        action: () => setFilters((f) => ({ ...f, classId: "" })),
      });
    if (contextQuery.data.terms?.length > 1)
      suggestions.push({
        label: "All terms",
        action: () => setFilters((f) => ({ ...f, termId: "" })),
      });
    suggestions.push({
      label: "All statuses",
      action: () => setFilters((f) => ({ ...f, status: "" })),
    });
    return suggestions;
  }, [contextQuery.data]);

  const generateMutation = useMutation({
    mutationFn: ({ classId, termId }: { classId: string; termId: string }) =>
      marksWorkflowApi.generateReportCards({ classId, termId }),
    onSuccess: (data) => {
      dispatch(pushToast({ tone: "success", message: `Generated ${data.count} report cards` }));
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
    },
    onError: (error: any) =>
      dispatch(
        pushToast({ tone: "error", message: error?.message || "Failed to generate report cards" }),
      ),
  });

  const exportPdfMutation = useMutation({
    mutationFn: (id: string) => marksWorkflowApi.exportReportCardPdf(id),
    onSuccess: (data) => {
      if (data.pdfUrl) window.open(data.pdfUrl, "_blank");
      dispatch(pushToast({ tone: "success", message: "Report card exported" }));
    },
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "Failed to export" })),
  });

  const academicYearOptions = useMemo(
    () => [
      { value: "", label: "All academic years" },
      ...(contextQuery.data?.academicYears ?? []).map((item: any) => ({
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
  const studentOptions = useMemo(
    () => [
      { value: "", label: "All students" },
      ...(contextQuery.data?.students ?? []).map((item: any) => ({
        value: item.id,
        label: item.user?.name || item.id,
      })),
    ],
    [contextQuery.data],
  );
  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "DRAFT", label: "Draft" },
    { value: "GENERATED", label: "Generated" },
    { value: "APPROVED", label: "Approved" },
    { value: "PUBLISHED", label: "Published" },
  ];

  const set = (patch: Partial<ReportCardFilters>) =>
    setFilters((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));

  const resetAllFilters = () => {
    const smartDefaults = getSmartDefaultFilters(contextQuery.data);
    setFilters({
      academicYearId: smartDefaults.academicYearId || "",
      termId: smartDefaults.termId || "",
      classId: "",
      studentId: "",
      status: smartDefaults.status || "",
      page: 1,
      pageSize: 12,
    });
    setFallbackAttempted(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-slate-100 text-slate-700",
      GENERATED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-emerald-100 text-emerald-700",
      PUBLISHED: "bg-purple-100 text-purple-700",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[status] || "bg-slate-100 text-slate-700"}`}
      >
        {status}
      </span>
    );
  };

  const columns: DataTableColumn<ReportCard>[] = [
    {
      id: "student",
      header: "Student",
      sortable: true,
      sortValue: (row) => row.student?.user?.name || "",
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.student?.user?.name || "Unknown"}</p>
          <p className="text-xs font-semibold text-slate-500">
            {row.student?.registrationNumber || "-"}
          </p>
        </div>
      ),
    },
    { id: "class", header: "Class", cell: (row) => row.class?.name || "-", sortable: true },
    { id: "term", header: "Term", cell: (row) => row.term?.name || "-", sortable: true },
    {
      id: "average",
      header: "Average",
      sortable: true,
      sortValue: (row) => row.overallAverage ?? 0,
      cell: (row) =>
        row.overallAverage !== undefined ? (
          <span className="font-bold text-slate-900">{row.overallAverage.toFixed(1)}%</span>
        ) : (
          "-"
        ),
    },
    { id: "grade", header: "Grade", cell: (row) => row.overallGrade || "-" },
    { id: "status", header: "Status", cell: (row) => getStatusBadge(row.status) },
    {
      id: "generated",
      header: "Generated",
      sortable: true,
      sortValue: (row) => row.generatedAt || "",
      cell: (row) =>
        row.generatedAt
          ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
              new Date(row.generatedAt),
            )
          : "-",
    },
  ];

  const getEmptyStateMessage = () => {
    if (fallbackAttempted) {
      return {
        title: "No report cards available",
        message:
          "No report cards found for the selected academic year and term. Try selecting a different period.",
        showFallbackNotice: true,
      };
    }
    if (hasActiveFilters) {
      return {
        title: "No results match your filters",
        message: "Try adjusting your filters to see available report cards.",
        showFallbackNotice: false,
      };
    }
    return {
      title: "No report cards generated yet",
      message: "Report cards will appear here once they are generated from marks data.",
      showFallbackNotice: false,
    };
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Report Cards</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            View, generate, approve, and export student report cards for the Rwanda CBC system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              if (filters.classId && filters.termId) {
                generateMutation.mutate({ classId: filters.classId, termId: filters.termId });
              } else {
                dispatch(
                  pushToast({
                    tone: "warning",
                    message: "Select a class and term to generate report cards",
                  }),
                );
              }
            }}
            disabled={!filters.classId || !filters.termId || generateMutation.isPending}
          >
            <FileText size={16} />
            {generateMutation.isPending ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>

      {fallbackAttempted && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle size={18} className="text-amber-700" />
          <span className="text-sm font-medium text-amber-800">
            Showing previous term data as current term has no report cards.
          </span>
          <button
            onClick={() => {
              setFallbackAttempted(false);
              resetAllFilters();
            }}
            className="text-sm font-bold text-amber-700 underline hover:text-amber-900"
          >
            Reset to current term
          </button>
        </div>
      )}

      {contextQuery.isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 rounded bg-slate-100" />
            <div className="grid gap-4 md:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-100" />
              ))}
            </div>
            <div className="h-64 rounded-lg bg-slate-100" />
          </div>
        </div>
      ) : (
        <DataTable
          data={reportCardsQuery.data?.items ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          loading={reportCardsQuery.isLoading}
          onRowClick={(row) => setSelectedReportId(row.id)}
          emptyTitle={emptyState.title}
          emptyMessage={emptyState.message}
          toolbar={
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
                <CustomDropdown
                  value={filters.academicYearId}
                  options={academicYearOptions}
                  onChange={(academicYearId) => set({ academicYearId })}
                  placeholder="Academic Year"
                />
                <CustomDropdown
                  value={filters.termId}
                  options={termOptions}
                  onChange={(termId) => set({ termId })}
                  placeholder="Term"
                />
                <CustomDropdown
                  value={filters.classId}
                  options={classOptions}
                  onChange={(classId) => set({ classId })}
                  placeholder="Class"
                />
                <CustomDropdown
                  value={filters.status}
                  options={statusOptions}
                  onChange={(status) => set({ status })}
                  placeholder="Status"
                />
                <Button variant="secondary" onClick={resetAllFilters}>
                  <Filter size={16} /> Reset
                </Button>
              </div>
              {hasActiveFilters && reportCardsQuery.data?.pagination.total === 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <AlertCircle size={16} className="text-amber-700" />
                  <span className="text-sm font-medium text-amber-800">
                    No results for current filters.
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availableSuggestions.slice(0, 2).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={suggestion.action}
                        className="text-xs font-bold text-amber-700 underline hover:text-amber-900"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          }
          pagination={{
            page: reportCardsQuery.data?.pagination.page ?? filters.page,
            pageSize: reportCardsQuery.data?.pagination.pageSize ?? filters.pageSize,
            total: reportCardsQuery.data?.pagination.total ?? 0,
            totalPages: reportCardsQuery.data?.pagination.totalPages ?? 1,
            onPageChange: (page) => setFilters((current) => ({ ...current, page })),
            onPageSizeChange: (pageSize) =>
              setFilters((current) => ({ ...current, pageSize, page: 1 })),
          }}
          rowActions={(row) => (
            <div className="flex gap-1">
              <Button
                aria-label="View details"
                size="sm"
                variant="secondary"
                onClick={() => setSelectedReportId(row.id)}
              >
                <Eye size={15} />
              </Button>
              <Button
                aria-label="Download"
                size="sm"
                variant="secondary"
                onClick={() => exportPdfMutation.mutate(row.id)}
                disabled={exportPdfMutation.isPending}
              >
                <Download size={15} />
              </Button>
            </div>
          )}
        />
      )}

      {selectedReportId && (
        <ReportCardDetailDrawer
          reportId={selectedReportId}
          open={Boolean(selectedReportId)}
          onClose={() => setSelectedReportId("")}
        />
      )}
    </div>
  );
}

function ReportCardDetailDrawer({
  reportId,
  open,
  onClose,
}: {
  reportId: string;
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ["report-card-detail", reportId],
    queryFn: () => marksWorkflowApi.reportCard(reportId),
    enabled: open && Boolean(reportId),
  });

  const exportMutation = useMutation({
    mutationFn: () => marksWorkflowApi.exportReportCardPdf(reportId),
    onSuccess: (data) => {
      if (data.pdfUrl) window.open(data.pdfUrl, "_blank");
      dispatch(pushToast({ tone: "success", message: "Report card exported" }));
    },
  });

  const approveMutation = useMutation({
    mutationFn: (
      payload:
        | { headteacherComments?: string; promotionRecommendation?: string }
        | undefined = undefined,
    ) => marksWorkflowApi.approveReportCard(reportId, payload),
    onSuccess: () => {
      dispatch(pushToast({ tone: "success", message: "Report card approved" }));
      queryClient.invalidateQueries({ queryKey: ["report-card-detail", reportId] });
      queryClient.invalidateQueries({ queryKey: ["report-cards"] });
    },
    onError: (error: any) =>
      dispatch(pushToast({ tone: "error", message: error?.message || "Failed to approve" })),
  });

  if (!open) return null;

  const report = detailQuery.data;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? "" : "hidden"}`}>
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Report Card Details</h2>
            <p className="text-sm font-semibold text-slate-500">
              {report?.student?.user?.name} - {report?.class?.name}
            </p>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        {detailQuery.isLoading ? (
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="h-32 rounded bg-slate-100" />
          </div>
        ) : report ? (
          <div className="space-y-6 pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Term</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{report.term?.name}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Overall Average</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {report.overallAverage?.toFixed(1) ?? "-"}%
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Overall Grade</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {report.overallGrade ?? "-"}
                </p>
              </div>
            </div>

            {report.subjectCount !== undefined && (
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-500">Subjects: {report.subjectCount}</p>
              </div>
            )}

            {report.headteacherComments && (
              <div className="rounded-lg border border-slate-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase text-amber-700">Head Teacher Comments</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {report.headteacherComments}
                </p>
              </div>
            )}

            {report.promotionRecommendation && (
              <div className="rounded-lg border border-slate-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase text-emerald-700">
                  Promotion Recommendation
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {report.promotionRecommendation}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
              >
                <Download size={16} /> Export PDF
              </Button>
              {report.status !== "APPROVED" && report.status !== "PUBLISHED" && (
                <Button variant="secondary" onClick={() => approveMutation.mutate(undefined)}>
                  <CheckCircle size={16} /> Approve
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-slate-500">Report card not found</p>
        )}
      </div>
    </div>
  );
}

export default ReportCardManagementPage;
