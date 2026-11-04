import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, List } from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { openDrawer } from "@/store/uiSlice";
import { useAppDispatch } from "@/store/appStore";

import { Button, ErrorState, PageHeader, Skeleton } from "./teacherShared";
import { TeacherGlobalUi } from "./TeacherGlobalUi";

// Subcomponents
import { LearnerSearchInput } from "./components/learners/LearnerSearchInput";
import { LearnerFilters } from "./components/learners/LearnerFilters";
import { LearnerTable } from "./components/learners/LearnerTable";
import { ExportButtons } from "./components/learners/ExportButtons";
import { Pagination } from "@/components/common/Pagination";

export function TeacherStudentsPage() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Synchronize state with URL parameters
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const search = searchParams.get("search") || "";
  const classId = searchParams.get("classId") || "";
  const stream = searchParams.get("stream") || "";
  const gender = searchParams.get("gender") || "";
  const status = searchParams.get("status") || "";
  const disability = searchParams.get("disability") || "";
  const academicYear = searchParams.get("academicYear") || "";

  const queryParams = {
    page,
    pageSize,
    search,
    classId,
    stream,
    gender,
    status,
    disability,
    academicYear,
  };

  const updateParam = (key: string, value: string | number) => {
    const current = new URLSearchParams(searchParams);
    if (value === "" || value === undefined) {
      current.delete(key);
    } else {
      current.set(key, String(value));
    }
    // Changing filters or page sizes resets page back to 1
    if (key !== "page") {
      current.set("page", "1");
    }
    setSearchParams(current);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Queries
  const { data: refData } = useQuery({
    queryKey: ["teacher-reference-data"],
    queryFn: () => lmsService.referenceData(),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher-students", queryParams],
    queryFn: () => lmsService.students(queryParams),
  });

  // Drawer handlers
  const handleViewDetails = (student: any) => {
    dispatch(
      openDrawer({
        kind: "student-details",
        mode: "view",
        title: student.user?.name || "Student Details",
        record: student,
      }),
    );
  };

  const handleEditStudent = (student: any) => {
    dispatch(
      openDrawer({
        kind: "student-form",
        mode: "edit",
        title: "Edit student",
        record: student,
      }),
    );
  };

  // Pagination parameters
  const items = data?.items || [];
  const meta = data?.meta || { page: 1, pageSize: 10, total: 0 };
  const totalItems = meta.total;
  const totalPages = Math.ceil(totalItems / meta.pageSize) || 1;

  const startIdx = totalItems === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const endIdx = Math.min(meta.page * meta.pageSize, totalItems);

  const classes = refData?.classes || [];
  const academicYears = refData?.academicYears || [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        subtitle="Manage and analyze student profiles, attendance, special needs, and family contacts."
        actions={
          <Button
            onClick={() =>
              dispatch(openDrawer({ kind: "student-form", mode: "create", title: "Add student" }))
            }
            className="rounded-xl shadow-md bg-purple-600 hover:bg-purple-700 font-bold gap-1 text-xs"
          >
            <Plus size={16} /> Add student
          </Button>
        }
      />

      {/* Toolbar: Search input and Export Options */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <LearnerSearchInput value={search} onChange={(val) => updateParam("search", val)} />
        </div>
        <div className="flex items-center gap-3 justify-end">
          <ExportButtons filters={queryParams} />
        </div>
      </div>

      {/* Advanced Filters Accordion/Panel */}
      <LearnerFilters
        classes={classes}
        academicYears={academicYears}
        filters={{ classId, stream, gender, status, disability, academicYear }}
        onChange={updateParam}
        onClear={clearAllFilters}
      />

      {/* Main Table Content Area */}
      {isLoading ? (
        <Skeleton />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-500 mb-3 shadow-inner">
            <List size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No learners found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-xs font-medium">
            Try adjusting your search query, clearing filters, or adding a new student.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <LearnerTable
            items={items}
            onViewDetails={handleViewDetails}
            onEdit={handleEditStudent}
            page={page}
            pageSize={pageSize}
          />

          {/* Footer Pagination & Selectable Items-Per-Page Controls */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalItems}
            limit={pageSize}
            onChange={(p) => updateParam("page", p)}
            onLimitChange={(lim) => updateParam("pageSize", lim)}
            itemLabel="learners"
            isLoading={isLoading}
          />
        </div>
      )}

      <TeacherGlobalUi />
    </div>
  );
}
