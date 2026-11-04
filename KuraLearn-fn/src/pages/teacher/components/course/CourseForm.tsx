import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CourseRecord } from "@/services/lmsService";
import { CustomDropdown } from "@/components/ModernUi";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/common/Button";

export function CourseForm({
  course,
  referenceData,
  onSubmit,
  isSubmitting,
}: {
  course?: CourseRecord;
  referenceData: any;
  onSubmit: (data: Record<string, string>) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    title: course?.title ?? "",
    description: course?.description ?? "",
    subjectId: course?.subjectId ?? "",
    levelId: course?.levelId ?? "",
    language: course?.language ?? "en",
    academicYear: course?.academicYear ?? "",
    term: course?.term ?? "",
    learningObjectives: course?.learningObjectives ?? "",
    status: course?.status ?? "DRAFT",
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const levels = referenceData?.levels ?? [];
  const subjects = referenceData?.subjects ?? [];
  const filteredSubjects = form.levelId
    ? subjects.filter((s: any) => {
        const level = levels.find((l: any) => l.id === form.levelId);
        return level ? s.category === level.category || s.levelName === level.name : true;
      })
    : subjects;

  return (
    <form
      id="course-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-5"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Course Title *</label>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Mathematics Starter Path"
          required
          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Level / Grade *</label>
          <CustomDropdown
            value={form.levelId}
            options={levels.map((l: any) => ({
              value: l.id,
              label: l.name,
              description: l.category,
            }))}
            onChange={(val) => set("levelId", val ?? "")}
            placeholder="Select level"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Subject *</label>
          <CustomDropdown
            value={form.subjectId}
            options={filteredSubjects.map((s: any) => ({
              value: s.id,
              label: s.name,
              description: s.levelName ?? s.category,
            }))}
            onChange={(val) => set("subjectId", val ?? "")}
            placeholder="Select subject"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
        <RichTextEditor
          value={form.description}
          onChange={(val) => set("description", val)}
          placeholder="Brief description of the course..."
          minHeight="200px"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Learning Objectives</label>
        <RichTextEditor
          value={form.learningObjectives}
          onChange={(val) => set("learningObjectives", val)}
          placeholder="What students will learn..."
          minHeight="200px"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Language</label>
          <CustomDropdown
            value={form.language}
            options={[
              { value: "en", label: "English" },
              { value: "rw", label: "Kinyarwanda" },
              { value: "fr", label: "French" },
            ]}
            onChange={(val) => set("language", val ?? "en")}
            clearable={false}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Academic Year</label>
          <input
            value={form.academicYear}
            onChange={(e) => set("academicYear", e.target.value)}
            placeholder="e.g. 2026"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Term</label>
          <CustomDropdown
            value={form.term}
            options={[
              { value: "TERM_1", label: "Term 1" },
              { value: "TERM_2", label: "Term 2" },
              { value: "TERM_3", label: "Term 3" },
            ]}
            onChange={(val) => set("term", val ?? "")}
            placeholder="Select term"
          />
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          form="course-form"
          disabled={isSubmitting || !form.title || !form.subjectId || !form.levelId}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving...
            </>
          ) : course ? (
            "Update Course"
          ) : (
            "Create Course"
          )}
        </Button>
      </div>
    </form>
  );
}
