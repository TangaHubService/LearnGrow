import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { CourseUnit } from "@/services/lmsService";

interface UnitFormProps {
  unit?: CourseUnit;
  onSubmit: (data: { title: string; description?: string }) => void;
  isSubmitting: boolean;
}

export function UnitForm({ unit, onSubmit, isSubmitting }: UnitFormProps) {
  const [title, setTitle] = useState(unit?.title ?? "");
  const [description, setDescription] = useState(unit?.description ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, description: description || undefined });
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Unit Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Unit 1: Introduction"
          required
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What this unit covers..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !title}>
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Saving...
          </>
        ) : unit ? (
          "Update Unit"
        ) : (
          "Add Unit"
        )}
      </Button>
    </form>
  );
}
