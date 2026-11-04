import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, RefreshCcw } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { assessmentApi, Assessment } from "@/services/assessmentApi";
import { courseApi } from "@/services/courseApi";
import { AppDrawer, ConfirmModal } from "@/components/ModernUi";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { SearchInput } from "@/components/common/SearchInput";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { Pagination } from "@/components/common/Pagination";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/States";
import { ErrorState } from "@/components/common/States";

// --- Sub-components ---
import { AssessmentForm } from "./assessments/AssessmentForm";
import { AssessmentCard } from "./assessments/AssessmentCard";
import { AiAssessmentCreator } from "./assessments/AiAssessmentCreator";
import { useTeacherReferenceData } from "./teacherReference";

export function TeacherAssessmentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Drawers & Modals ---
  const [drawer, setDrawer] = useState(false);
  const [aiCreateDrawer, setAiCreateDrawer] = useState(false);
  const [editTarget, setEditTarget] = useState<Assessment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // --- URL Search Params mapping ---
  const activeSearch = searchParams.get("search") || "";
  const activeType = searchParams.get("type") || "";
  const activeStatus = searchParams.get("status") || "";
  const activeSubject = searchParams.get("subjectId") || "";
  const activeClass = searchParams.get("classId") || "";
  const activeTeacher = searchParams.get("teacherId") || "";
  const parsedPage = parseInt(searchParams.get("page") || "1", 10);
  const parsedLimit = parseInt(searchParams.get("limit") || "12", 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = [12, 24, 48].includes(parsedLimit) ? parsedLimit : 12;

  // --- Queries ---
  const coursesQ = useQuery({
    queryKey: ["teacher-courses-list"],
    queryFn: () => courseApi.mine(),
  });
  const referenceQ = useTeacherReferenceData();
  const courses = coursesQ.data?.courses ?? [];
  const reference = referenceQ.data;

  // Paginated query for the list
  const assessmentsQ = useQuery({
    queryKey: [
      "teacher-assessments",
      activeSearch,
      activeType,
      activeStatus,
      activeSubject,
      activeClass,
      activeTeacher,
      currentPage,
      limit,
    ],
    queryFn: () =>
      assessmentApi.list({
        search: activeSearch,
        type: activeType,
        status: activeStatus,
        subjectId: activeSubject,
        classId: activeClass,
        teacherId: activeTeacher,
        page: currentPage,
        limit,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Parallel query for dashboard stats
  const allAssessmentsQ = useQuery({
    queryKey: ["teacher-assessments-all"],
    queryFn: () => assessmentApi.list({ limit: 100 }),
  });

  const assessments: Assessment[] = assessmentsQ.data?.data?.assessments ?? [];
  const pagination = assessmentsQ.data?.data?.pagination;
  const allAssessments = allAssessmentsQ.data?.data?.assessments ?? [];

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: any) => assessmentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assessments-all"] });
      setDrawer(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => assessmentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assessments-all"] });
      setDrawer(false);
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assessmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assessments-all"] });
      setDeleteTarget(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => assessmentApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assessments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assessments-all"] });
    },
  });

  // --- Handlers ---
  const updateParams = useCallback(
    (newParams: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(newParams).forEach(([key, value]) => {
          if (value === null || value === "") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        });
        if (!("page" in newParams)) {
          next.set("page", "1");
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const handleAiGenerate = async (topic: string, type: string, courseId?: string) => {
    setAiLoading(true);
    try {
      const course = courses.find((item) => item.id === courseId);
      const result = await assessmentApi.aiGenerate({
        type,
        topic,
        subject: course?.subject?.name || "General",
        gradeLevel: course?.level?.name || "Primary",
        numberOfQuestions: 5,
        difficulty: "medium",
        alignCBC: true,
      });
      return result;
    } catch (e) {
      console.error(e);
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (data: any) => {
    const payload = {
      ...data,
      courseId: data.courseId || undefined,
      subjectId: data.subjectId || undefined,
      classId: data.classId || undefined,
      startDate: data.startDate || undefined,
      dueDate: data.dueDate || undefined,
      durationMinutes: data.durationMinutes ? +data.durationMinutes : undefined,
      attemptsAllowed: data.attemptsAllowed ? +data.attemptsAllowed : 1,
      totalMarks: data.totalMarks ? +data.totalMarks : 100,
      passMark: data.passMark ? +data.passMark : 50,
      passingScore: data.passingScore ? +data.passingScore : 50,
    };

    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // --- Render Mappers ---
  const subjectOptions = useMemo(
    () => (reference.subjects ?? []).map((s: any) => ({ value: s.id, label: s.name })),
    [reference.subjects],
  );
  const classOptions = useMemo(
    () =>
      (reference.classes ?? []).map((c: any) => ({
        value: c.id,
        label: c.levelName ? `${c.name} - ${c.levelName}` : c.name,
      })),
    [reference.classes],
  );
  const teacherOptions = useMemo(
    () => (reference.teachers ?? []).map((t: any) => ({ value: t.id, label: t.name })),
    [reference.teachers],
  );
  const typeOptions = [
    { value: "QUIZ", label: "Quiz" },
    { value: "TEST", label: "Test" },
    { value: "CAT", label: "CAT" },
    { value: "EXAM", label: "Exam" },
    { value: "ASSIGNMENT", label: "Assignment" },
    { value: "PRACTICE_ASSESSMENT", label: "Practice Assessment" },
    { value: "PROJECT", label: "Project" },
    { value: "PRACTICAL", label: "Practical" },
    { value: "ORAL", label: "Oral" },
    { value: "HOMEWORK", label: "Homework" },
  ];
  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "CLOSED", label: "Closed" },
    { value: "ARCHIVED", label: "Archived" },
  ];
  const pageSizeOptions = [
    { value: "12", label: "12 / page" },
    { value: "24", label: "24 / page" },
    { value: "48", label: "48 / page" },
  ];

  const hasActiveFilters =
    activeSearch || activeType || activeStatus || activeSubject || activeClass || activeTeacher;

  // --- Dashboard Stats ---
  const stats = {
    total: allAssessmentsQ.data?.data?.pagination?.total ?? allAssessments.length,
    published: allAssessments.filter((a) => a.visibility === "PUBLISHED").length,
    draft: allAssessments.filter((a) => a.visibility === "DRAFT").length,
    submissions: allAssessments.reduce(
      (s, a) => s + (a.submissionStats?.submitted ?? a._count.submissions),
      0,
    ),
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <PageHeader
        title="Assessments"
        subtitle="Create and manage all assessments — assignments, quizzes, exams, and more."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setAiCreateDrawer(true)}
              className="border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100"
            >
              <Sparkles size={16} /> Create with AI
            </Button>
            <Button onClick={() => setDrawer(true)}>
              <Plus size={16} /> New Assessment
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "text-slate-700", bg: "bg-slate-50" },
          { label: "Published", value: stats.published, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Drafts", value: stats.draft, color: "text-slate-500", bg: "bg-slate-50" },
          {
            label: "Submissions",
            value: stats.submissions,
            color: "text-violet-700",
            bg: "bg-violet-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl p-4 border border-slate-200 shadow-sm ${s.bg}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Toolbar */}
      <div className="space-y-3">
        <div className="max-w-2xl">
          <SearchInput
            value={activeSearch}
            placeholder="Search by title, subject, class, teacher, topic..."
            loading={assessmentsQ.isFetching}
            onChange={(val: string) => updateParams({ search: val ?? null })}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_130px_auto]">
          <FilterDropdown
            options={subjectOptions}
            value={activeSubject}
            onChange={(val) => updateParams({ subjectId: val ?? null })}
            placeholder="All Subjects"
            loading={referenceQ.isLoading}
          />
          <FilterDropdown
            options={classOptions}
            value={activeClass}
            onChange={(val) => updateParams({ classId: val ?? null })}
            placeholder="All Classes"
            loading={referenceQ.isLoading}
          />
          <FilterDropdown
            options={statusOptions}
            value={activeStatus}
            onChange={(val) => updateParams({ status: val ?? null })}
            placeholder="All Status"
          />
          <FilterDropdown
            options={typeOptions}
            value={activeType}
            onChange={(val) => updateParams({ type: val ?? null })}
            placeholder="All Types"
          />
          <FilterDropdown
            options={teacherOptions}
            value={activeTeacher}
            onChange={(val) => updateParams({ teacherId: val ?? null })}
            placeholder="All Teachers"
            loading={referenceQ.isLoading}
          />
          <FilterDropdown
            options={pageSizeOptions}
            value={String(limit)}
            onChange={(val) => updateParams({ limit: val ?? "12" })}
            placeholder="Page Size"
          />
          {hasActiveFilters && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearchParams(new URLSearchParams());
              }}
              className="flex-shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
            >
              <RefreshCcw size={14} className="mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      {assessmentsQ.isLoading ? (
        <LoadingState count={8} />
      ) : assessmentsQ.error ? (
        <ErrorState message={(assessmentsQ.error as Error).message} />
      ) : assessments.length > 0 ? (
        <div className="space-y-6">
          <div
            className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${assessmentsQ.isFetching ? "opacity-70" : ""}`}
          >
            {assessments.map((a) => (
              <AssessmentCard
                key={a.id}
                a={a}
                onEdit={() => {
                  setEditTarget(a);
                  setDrawer(true);
                }}
                onDelete={() => setDeleteTarget(a)}
                onPublish={() => publishMutation.mutate(a.id)}
                onView={() => navigate(`/teacher/assessments/${a.id}`)}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onChange={(p: number) => updateParams({ page: p.toString() })}
              onLimitChange={(lim) => updateParams({ limit: lim.toString(), page: "1" })}
              itemLabel="assessments"
              isLoading={assessmentsQ.isFetching}
            />
          )}
        </div>
      ) : (
        <EmptyState
          title="No assessments found"
          message={
            hasActiveFilters
              ? "Try adjusting your search query or filters to find what you're looking for."
              : "Get started by creating your first assessment."
          }
          action={
            <Button
              onClick={() =>
                hasActiveFilters ? setSearchParams(new URLSearchParams()) : setDrawer(true)
              }
            >
              {hasActiveFilters ? "Clear Filters" : "New Assessment"}
            </Button>
          }
        />
      )}

      {/* Drawers */}
      <AppDrawer
        open={drawer}
        onClose={() => {
          setDrawer(false);
          setEditTarget(null);
        }}
        title={editTarget ? "Edit Assessment" : "New Assessment"}
        subtitle="Define the assessment details and settings."
      >
        <AssessmentForm
          courses={courses}
          classes={reference.classes}
          assessment={editTarget}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          aiLoading={aiLoading}
          onAiGenerate={handleAiGenerate}
          onSubmit={handleSubmit}
        />
      </AppDrawer>

      <AppDrawer
        open={aiCreateDrawer}
        onClose={() => setAiCreateDrawer(false)}
        title="Create with AI"
        size="xl"
      >
        <AiAssessmentCreator
          courses={courses}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["teacher-assessments"] });
            queryClient.invalidateQueries({ queryKey: ["teacher-assessments-all"] });
            setAiCreateDrawer(false);
          }}
        />
      </AppDrawer>

      <ConfirmModal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget!.id)}
        title="Delete Assessment?"
        message="This will permanently delete the assessment and all student submissions. This action cannot be undone."
        confirmLabel="Delete Assessment"
        danger
      />
    </div>
  );
}
