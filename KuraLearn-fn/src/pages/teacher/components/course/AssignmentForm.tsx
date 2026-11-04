import { useState } from "react";
import { Button } from "@/components/common/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

interface AssignmentFormProps {
  assignment?: any;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function AssignmentForm({ assignment, onSubmit, isSubmitting }: AssignmentFormProps) {
  const [form, setForm] = useState({
    title: assignment?.title ?? "",
    instructions: assignment?.instructions ?? "",
    maxScore: assignment?.maxScore ?? 100,
    dueAt: assignment?.dueAt ? new Date(assignment.dueAt).toISOString().split("T")[0] : "",
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Assignment Title *</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Instructions</label>
        <RichTextEditor
          value={form.instructions}
          onChange={(val) => setForm({ ...form, instructions: val })}
          minHeight="200px"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Max Score</label>
          <input
            type="number"
            value={form.maxScore}
            onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Due Date</label>
          <input
            type="date"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting || !form.title}>
        {isSubmitting ? "Saving..." : assignment ? "Update Assignment" : "Create Assignment"}
      </Button>
    </form>
  );
}
