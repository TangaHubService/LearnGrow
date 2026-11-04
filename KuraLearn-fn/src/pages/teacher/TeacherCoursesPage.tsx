import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { pushToast } from "@/store/uiSlice";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { lmsService, type CourseRecord } from "@/services/lmsService";
import { AppDrawer, ConfirmModal } from "@/components/ModernUi";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { AssignCourseForm } from "./components/course/AssignCourseForm";

// --- Custom Reusable Components ---
import { SearchInput } from "@/components/common/SearchInput";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { Pagination } from "@/components/common/Pagination";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/States";

// --- Sub-components ---
import { CourseForm } from "./components/course/CourseForm";
import { CourseCard } from "./components/course/CourseCard";

type DrawerState =
  | { kind: "create" | "edit"; course?: CourseRecord }
  | { kind: "course-assign"; courseId: string }
  | null;
type ModalState = {
  kind: "delete" | "publish" | "unpublish" | "archive" | "duplicate";
  course: CourseRecord;
} | null;

export function TeacherCoursesPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [modal, setModal] = useState<ModalState>(null);

  // Search parameters for filters & pagination
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParam = searchParams.get("search") || "";
  const subjectParam = searchParams.get("subjectId") || "";
  const statusParam = searchParams.get("status") || "";
  const classParam = searchParams.get("classId") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const handleCloseDrawer = useCallback(() => setDrawer(null), []);
  const handleCloseModal = useCallback(() => setModal(null), []);

  const updateParams = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(newParams).forEach(([key, val]) => {
          if (val === undefined || val === "" || val === 0) {
            next.delete(key);
          } else {
            next.set(key, String(val));
          }
        });
        return next;
      });
    },
    [setSearchParams],
  );

  // Queries
  const coursesQuery = useQuery({
    queryKey: ["teacher-courses", searchParam, subjectParam, statusParam, classParam, pageParam],
    queryFn: () =>
      lmsService.list({
        search: searchParam || undefined,
        subjectId: subjectParam || undefined,
        status: statusParam || undefined,
        classId: classParam || undefined,
        page: pageParam,
        limit: 9,
      }),
  });

  const allCoursesQuery = useQuery({
    queryKey: ["teacher-courses-all"],
    queryFn: () => lmsService.list({ limit: 1000 }),
  });

  const refDataQuery = useQuery({
    queryKey: ["teacher-reference-data"],
    queryFn: () => lmsService.referenceData(),
  });

  const courses = coursesQuery.data?.data?.courses ?? [];
  const pagination = coursesQuery.data?.data?.pagination;
  const allCourses = allCoursesQuery.data?.data?.courses ?? [];
  const referenceData = refDataQuery.data;

  // Map reference data to options
  const subjectOptions = useMemo(() => {
    return (refDataQuery.data?.subjects ?? []).map((s: any) => ({
      value: s.id,
      label: s.name,
      description: s.levelName,
    }));
  }, [refDataQuery.data?.subjects]);

  const classOptions = useMemo(() => {
    return (refDataQuery.data?.classes ?? []).map((c: any) => ({
      value: c.id,
      label: c.name,
      description: c.levelName,
    }));
  }, [refDataQuery.data?.classes]);

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: any) => lmsService.createCourse(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses-all"] });
      setDrawer(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => lmsService.updateCourse(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses-all"] });
      setDrawer(null);
    },
  });

  const assignCourseMutation = useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: any }) =>
      lmsService.assignCourse(courseId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses-all"] });
      setDrawer(null);
      dispatch(
        pushToast({ tone: "success", message: `Assigned to ${data.assignedCount} new students.` }),
      );
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ kind, courseId }: { kind: string; courseId: string }) => {
      if (kind === "delete") return lmsService.deleteCourse(courseId);
      if (kind === "publish") return lmsService.publishCourse(courseId);
      if (kind === "unpublish") return lmsService.unpublishCourse(courseId);
      if (kind === "archive") return lmsService.archiveCourse(courseId);
      if (kind === "duplicate") return lmsService.duplicateCourse(courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-courses-all"] });
      setModal(null);
    },
  });

  const modalConfig: Record<string, any> = {
    delete: {
      title: "Delete Course",
      message: "Permanently delete this course?",
      label: "Delete",
      danger: true,
    },
    publish: {
      title: "Publish Course",
      message: "Make course visible to students?",
      label: "Publish",
      danger: false,
    },
    unpublish: {
      title: "Unpublish Course",
      message: "Hide from students?",
      label: "Unpublish",
      danger: false,
    },
    archive: {
      title: "Archive Course",
      message: "Hide from active lists?",
      label: "Archive",
      danger: false,
    },
    duplicate: {
      title: "Duplicate Course",
      message: "Create a copy of this course?",
      label: "Duplicate",
      danger: false,
    },
  };

  const stats = useMemo(
    () => ({
      total: allCourses.length,
      published: allCourses.filter((c) => c.status === "PUBLISHED").length,
      draft: allCourses.filter((c) => c.status === "DRAFT").length,
      totalLessons: allCourses.reduce(
        (sum, c) => sum + (c._count?.lessons ?? c.lessons?.length ?? 0),
        0,
      ),
      totalEnrollments: allCourses.reduce(
        (sum, c) => sum + (c._count?.enrollments ?? c.enrollments?.length ?? 0),
        0,
      ),
    }),
    [allCourses],
  );

  return (
    <div>
      <PageHeader
        title="My Courses"
        subtitle="Create, manage and publish courses for your students."
        actions={
          <Button onClick={() => navigate("/teacher/courses/new")}>
            <Plus size={18} className="mr-2" /> Create Course
          </Button>
        }
      />

      {/* Stats Section */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          {
            label: "Total Courses",
            value: stats.total,
            color: "text-[#6d3eeb]",
            loading: allCoursesQuery.isLoading,
          },
          {
            label: "Published",
            value: stats.published,
            color: "text-emerald-700",
            loading: allCoursesQuery.isLoading,
          },
          {
            label: "Drafts",
            value: stats.draft,
            color: "text-amber-700",
            loading: allCoursesQuery.isLoading,
          },
          {
            label: "Total Lessons",
            value: stats.totalLessons,
            color: "text-sky-600",
            loading: allCoursesQuery.isLoading,
          },
          {
            label: "Enrollments",
            value: stats.totalEnrollments,
            color: "text-pink-600",
            loading: allCoursesQuery.isLoading,
          },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            {s.loading ? (
              <div className="flex h-8 items-center justify-center">
                <Loader2 size={16} className="animate-spin text-slate-500" />
              </div>
            ) : (
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            )}
            <p className="mt-1 text-xs font-semibold text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters Section */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          value={searchParam}
          onChange={(val) => updateParams({ search: val, page: 1 })}
          placeholder="Search by title, description, subject, teacher..."
          loading={coursesQuery.isFetching}
          className="flex-1"
        />

        <div className="flex flex-wrap items-center gap-3">
          <FilterDropdown
            placeholder="All subjects"
            value={subjectParam || undefined}
            options={subjectOptions}
            onChange={(val) => updateParams({ subjectId: val, page: 1 })}
            loading={refDataQuery.isLoading}
            className="w-48"
          />

          <FilterDropdown
            placeholder="All classes"
            value={classParam || undefined}
            options={classOptions}
            onChange={(val) => updateParams({ classId: val, page: 1 })}
            loading={refDataQuery.isLoading}
            className="w-48"
          />

          <FilterDropdown
            placeholder="All statuses"
            value={statusParam || undefined}
            options={statusOptions}
            onChange={(val) => updateParams({ status: val, page: 1 })}
            className="w-40"
          />

          {(searchParam || subjectParam || statusParam || classParam) && (
            <Button
              variant="secondary"
              onClick={() =>
                updateParams({ search: "", subjectId: "", status: "", classId: "", page: 1 })
              }
              className="h-11"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Courses List / Loading / Empty States */}
      {coursesQuery.isLoading ? (
        <LoadingState count={9} />
      ) : courses.length === 0 ? (
        <EmptyState
          title={
            searchParam || subjectParam || statusParam || classParam
              ? "No matches found"
              : "No courses yet"
          }
          message={
            searchParam || subjectParam || statusParam || classParam
              ? "Try adjusting your search query or reset filters to explore available courses."
              : "Start by creating your first course plan to share lessons, assessments, and quizzes with students."
          }
          action={
            searchParam || subjectParam || statusParam || classParam ? (
              <Button
                onClick={() =>
                  updateParams({ search: "", subjectId: "", status: "", classId: "", page: 1 })
                }
              >
                Reset Filters
              </Button>
            ) : (
              <Button onClick={() => setDrawer({ kind: "create" })}>
                <Plus size={16} className="mr-1" /> Create Course
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                onEdit={() => setDrawer({ kind: "edit", course: c })}
                onView={() => navigate(`/teacher/courses/${c.id}`)}
                onAssign={() => setDrawer({ kind: "course-assign", courseId: c.id })}
                onAction={(kind) => setModal({ kind, course: c })}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && (
            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onChange={(p) => updateParams({ page: p })}
              itemLabel="courses"
              isLoading={coursesQuery.isFetching}
            />
          )}
        </div>
      )}

      {/* Drawers and Modals */}
      <AppDrawer
        open={drawer?.kind === "create" || drawer?.kind === "edit"}
        title={drawer?.kind === "edit" ? "Edit Course" : "New Course"}
        size="2xl"
        onClose={handleCloseDrawer}
      >
        {(drawer?.kind === "create" || drawer?.kind === "edit") && (
          <CourseForm
            course={drawer.course}
            referenceData={referenceData}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onSubmit={(data) => {
              if (drawer.kind === "edit" && drawer.course)
                updateMutation.mutate({ id: drawer.course.id, input: data });
              else createMutation.mutate(data);
            }}
          />
        )}
      </AppDrawer>

      <AppDrawer
        open={drawer?.kind === "course-assign"}
        title="Assign Course"
        size="md"
        onClose={handleCloseDrawer}
      >
        {drawer?.kind === "course-assign" && (
          <AssignCourseForm
            courseId={drawer.courseId}
            isSubmitting={assignCourseMutation.isPending}
            onSubmit={(data) =>
              assignCourseMutation.mutate({ courseId: drawer.courseId, input: data })
            }
            onCancel={handleCloseDrawer}
          />
        )}
      </AppDrawer>

      {modal && (
        <ConfirmModal
          open
          title={modalConfig[modal.kind].title}
          message={modalConfig[modal.kind].message}
          confirmLabel={modalConfig[modal.kind].label}
          danger={modalConfig[modal.kind].danger}
          onCancel={handleCloseModal}
          onConfirm={() => actionMutation.mutate({ kind: modal.kind, courseId: modal.course.id })}
        />
      )}
    </div>
  );
}
