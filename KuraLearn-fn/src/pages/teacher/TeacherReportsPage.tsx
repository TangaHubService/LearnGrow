import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, Sparkles } from "lucide-react";
import { TeacherGlobalUi } from "./TeacherGlobalUi";
import { PageHeader } from "./teacherShared";
import { Button } from "@/components/common/Button";
import { AppDrawer } from "@/components/common/AppDrawer";
import { CustomDropdown } from "@/components/common/CustomDropdown";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { AnalyticsMetricCard } from "@/components/marks/AnalyticsMetricCard";
import { marksWorkflowApi } from "@/services/marksWorkflowApi";

export function TeacherReportsPage() {
  const [filters, setFilters] = useState({ academicYearId: "", classId: "", termId: "" });
  const [studentId, setStudentId] = useState("");

  const contextQuery = useQuery({
    queryKey: ["marks-context", "teacher-reports"],
    queryFn: () => marksWorkflowApi.context(),
  });
  const marksheetQuery = useQuery({
    queryKey: ["teacher-class-marksheet", filters.classId, filters.termId],
    queryFn: () =>
      marksWorkflowApi.classMarksheet({ classId: filters.classId, termId: filters.termId }),
    enabled: Boolean(filters.classId && filters.termId),
  });
  const analyticsQuery = useQuery({
    queryKey: ["teacher-marks-analytics", filters.classId, filters.termId],
    queryFn: () => marksWorkflowApi.analytics({ classId: filters.classId, termId: filters.termId }),
    enabled: Boolean(filters.classId && filters.termId),
  });
  const aiQuery = useQuery({
    queryKey: ["teacher-report-ai", studentId, filters.termId],
    queryFn: () => marksWorkflowApi.aiInsights({ studentId, termId: filters.termId }),
    enabled: Boolean(studentId && filters.termId),
  });

  const academicYearOptions = useMemo(
    () => [
      { value: "", label: "Academic year" },
      ...(contextQuery.data?.academicYears ?? []).map((item: any) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [contextQuery.data],
  );
  const termOptions = useMemo(
    () => [
      { value: "", label: "Term" },
      ...(contextQuery.data?.terms ?? [])
        .filter(
          (item: any) => !filters.academicYearId || item.academicYearId === filters.academicYearId,
        )
        .map((item: any) => ({ value: item.id, label: item.name })),
    ],
    [contextQuery.data, filters.academicYearId],
  );
  const classOptions = useMemo(
    () => [
      { value: "", label: "Class" },
      ...(contextQuery.data?.classes ?? []).map((item: any) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [contextQuery.data],
  );

  const records = marksheetQuery.data?.records ?? [];
  const columns: DataTableColumn<any>[] = [
    {
      id: "name",
      header: "Learner",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.name}</p>
          <p className="text-xs font-semibold text-slate-500">{row.code || row.studentId}</p>
        </div>
      ),
    },
    {
      id: "average",
      header: "Average",
      sortable: true,
      sortValue: (row) => row.averagePercentage,
      cell: (row) => `${row.averagePercentage}%`,
    },
    { id: "grade", header: "Grade", cell: (row) => row.grade || "-" },
    {
      id: "rank",
      header: "Rank",
      sortable: true,
      sortValue: (row) => row.classRank ?? 9999,
      cell: (row) => row.classRank || "-",
    },
  ];

  const analytics = analyticsQuery.data;

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Reports & Analytics"
          subtitle="View approved class results and in-system AI learning insights without printing AI notes on official PDFs."
        />

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <CustomDropdown
            value={filters.academicYearId}
            options={academicYearOptions}
            onChange={(academicYearId) =>
              setFilters((current) => ({ ...current, academicYearId, termId: "" }))
            }
            clearable={false}
          />
          <CustomDropdown
            value={filters.termId}
            options={termOptions}
            onChange={(termId) => setFilters((current) => ({ ...current, termId }))}
            clearable={false}
          />
          <CustomDropdown
            value={filters.classId}
            options={classOptions}
            onChange={(classId) => setFilters((current) => ({ ...current, classId }))}
            clearable={false}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <AnalyticsMetricCard
            label="Class Average"
            value={`${marksheetQuery.data?.classAverage ?? 0}%`}
            helper="Approved marks only"
            tone="blue"
            icon={<BarChart3 size={18} />}
          />
          <AnalyticsMetricCard
            label="Pass Rate"
            value={`${analytics?.passRate ?? 0}%`}
            helper="Learners above threshold"
            tone="emerald"
          />
          <AnalyticsMetricCard
            label="Submissions"
            value={analytics?.submissionProgress?.total ?? 0}
            helper={`${analytics?.submissionProgress?.approved ?? 0} approved`}
            tone="purple"
          />
          <AnalyticsMetricCard
            label="At Risk"
            value={analytics?.weakLearners?.length ?? 0}
            helper="Needs remedial support"
            tone={(analytics?.weakLearners?.length ?? 0) ? "amber" : "slate"}
          />
        </div>

        {analytics?.deterministicInsights?.length ? (
          <section className="rounded-lg border border-purple-100 bg-purple-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#6d3eeb]">
              <Sparkles size={16} /> System insights
            </div>
            <ul className="space-y-1 text-sm font-semibold text-purple-900">
              {analytics.deterministicInsights.map((insight: string) => (
                <li key={insight}>{insight}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <DataTable
          data={records}
          columns={columns}
          getRowId={(row) => row.studentId}
          loading={marksheetQuery.isLoading}
          emptyTitle={
            filters.classId && filters.termId ? "No approved results" : "Choose a class and term"
          }
          emptyMessage={
            filters.classId && filters.termId
              ? "Approved locked submissions will appear here."
              : "Teacher analytics use approved marks only."
          }
          rowActions={(row) => (
            <Button size="sm" variant="secondary" onClick={() => setStudentId(row.studentId)}>
              <Eye size={15} /> Insights
            </Button>
          )}
        />

        <AppDrawer
          open={Boolean(studentId)}
          onClose={() => setStudentId("")}
          title="Learner AI insights"
          subtitle="Visible in the system only. These insights are omitted from official PDF report cards."
          size="lg"
        >
          {aiQuery.isLoading ? (
            <p className="text-sm font-semibold text-slate-500">
              Generating from approved marks and attendance...
            </p>
          ) : aiQuery.data ? (
            <div className="space-y-4">
              <Insight label="Performance summary" value={aiQuery.data.performanceSummary} />
              <Insight label="Weak areas" value={aiQuery.data.weakAreaDetection} />
              <Insight
                label="Attendance relationship"
                value={aiQuery.data.attendancePerformanceRelation}
              />
              {aiQuery.data.remedialActions?.length ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Recommendations</p>
                  <ul className="mt-2 space-y-1 text-sm font-semibold text-slate-700">
                    {aiQuery.data.remedialActions.map((item: string) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-500">No insights available yet.</p>
          )}
        </AppDrawer>
      </div>
      <TeacherGlobalUi />
    </>
  );
}

function Insight({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{value || "-"}</p>
    </div>
  );
}

export default TeacherReportsPage;
