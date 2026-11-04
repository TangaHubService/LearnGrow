import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit3,
  Trash2,
  Calendar,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
} from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { AppDrawer, ConfirmModal, StatusBadge, CustomDropdown } from "@/components/ModernUi";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

type AssignmentRecord = {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: string;
  points: number;
  status: string;
  course: { title: string };
  _count?: { submissions: number };
};

// ─── Assignment Form ────────────────────────────────────────────

function AssignmentForm({
  assignment,
  courses,
  onSubmit,
  isSubmitting,
}: {
  assignment?: AssignmentRecord;
  courses: any[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    courseId: assignment?.courseId ?? "",
    title: assignment?.title ?? "",
    description: assignment?.description ?? "",
    dueDate: assignment?.dueDate ? new Date(assignment.dueDate).toISOString().split("T")[0] : "",
    points: assignment?.points ?? 100,
  });

  const set = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      id="assignment-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-5"
    >
      {!assignment && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Course *</label>
          <CustomDropdown
            value={form.courseId}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
            onChange={(val) => set("courseId", val ?? "")}
            placeholder="Select course"
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Assignment Title *</label>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Mid-term Essay"
          required
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Instructions (Rich Text) *
        </label>
        <RichTextEditor
          value={form.description}
          onChange={(val) => set("description", val)}
          placeholder="Enter instructions for students..."
          minHeight="300px"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Due Date</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Points</label>
          <input
            type="number"
            value={form.points}
            onChange={(e) => set("points", parseInt(e.target.value))}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>
      </div>

      <Button
        type="submit"
        form="assignment-form"
        disabled={isSubmitting || !form.title || (!assignment && !form.courseId)}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Saving...
          </>
        ) : assignment ? (
          "Update Assignment"
        ) : (
          "Create Assignment"
        )}
      </Button>
    </form>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();
  const [drawer, setDrawer] = useState<{
    kind: "create" | "edit";
    assignment?: AssignmentRecord;
  } | null>(null);
  const [modal, setModal] = useState<AssignmentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const assignmentsQuery = useQuery({
    queryKey: ["course-assignments"],
    queryFn: () => lmsService.listAssignments(),
  });

  const coursesQuery = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: () => lmsService.mine(),
  });

  const assignments = assignmentsQuery.data?.assignments ?? [];

  const filteredAssignments = assignments.filter(
    (a: any) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.course?.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => lmsService.createAssignment(data.courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-assignments"] });
      setDrawer(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => lmsService.updateAssignment(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-assignments"] });
      setDrawer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lmsService.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-assignments"] });
      setModal(null);
    },
  });

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="Manage homework and projects for your classes."
        actions={
          <Button onClick={() => setDrawer({ kind: "create" })}>
            <Plus size={16} /> New Assignment
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-5">
        <label className="flex h-10 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
          <Search size={16} className="text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments or courses..."
            className="flex-1 bg-transparent text-sm font-normal outline-none placeholder:text-slate-400"
          />
        </label>
      </div>

      {assignmentsQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
          <Loader2 size={20} className="animate-spin" /> Loading assignments...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <Card className="py-16 text-center">
          <FileText size={40} className="mx-auto text-slate-500" />
          <p className="mt-3 text-lg font-bold text-slate-600">No assignments found</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first assignment to start tracking student work.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="flex flex-col">
              <div className="mb-3 flex items-start justify-between">
                <div className="rounded-lg bg-purple-50 p-2 text-[#6d3eeb]">
                  <FileText size={20} />
                </div>
                <StatusBadge value={assignment.status} />
              </div>

              <h3 className="text-base font-bold text-slate-950 line-clamp-1">
                {assignment.title}
              </h3>
              <p className="mt-1 text-xs font-semibold text-[#6d3eeb]">{assignment.course.title}</p>

              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-500" />
                  Due:{" "}
                  {assignment.dueDate
                    ? new Date(assignment.dueDate).toLocaleDateString()
                    : "No deadline"}
                </span>
                <span className="flex items-center gap-2">
                  <Users size={14} className="text-slate-500" />
                  {assignment._count?.submissions || 0} Submissions
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-slate-500" />
                  {assignment.points} Points Possible
                </span>
              </div>

              <div className="mt-auto flex items-center justify-end gap-2 pt-4">
                <button
                  aria-label="Edit"
                  onClick={() => setDrawer({ kind: "edit", assignment })}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  aria-label="Delete"
                  onClick={() => setModal(assignment)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Drawer */}
      <AppDrawer
        open={!!drawer}
        title={drawer?.kind === "edit" ? "Edit Assignment" : "New Assignment"}
        size="2xl"
        onClose={() => setDrawer(null)}
      >
        <AssignmentForm
          assignment={drawer?.assignment}
          courses={coursesQuery.data?.courses ?? []}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSubmit={(data) => {
            if (drawer?.kind === "edit") {
              updateMutation.mutate({ ...data, id: drawer.assignment?.id });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      </AppDrawer>

      {/* Delete Modal */}
      <ConfirmModal
        open={!!modal}
        title="Delete Assignment"
        message={`Are you sure you want to delete "${modal?.title}"? This will also delete all student submissions.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setModal(null)}
        onConfirm={() => modal && deleteMutation.mutate(modal.id)}
      />
    </div>
  );
}
