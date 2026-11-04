import { Loader2, Sparkles } from "lucide-react";
import { CustomDropdown } from "@/components/ModernUi";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

export function LessonFormBody({
  formData,
  setFormData,
  errors,
  reference,
  classOptions,
  subjectOptions,
  handleClassChange,
  handleSubjectChange,
  handleContentChange,
  handleAiGenerate,
  isAiGenerating,
  editorMinHeight = "500px",
}: {
  formData: any;
  setFormData: any;
  errors: any;
  reference: any;
  classOptions: any[];
  subjectOptions: any[];
  handleClassChange: (v: string | undefined) => void;
  handleSubjectChange: (v: string | undefined) => void;
  handleContentChange: (html: string) => void;
  handleAiGenerate: () => void;
  isAiGenerating: boolean;
  editorMinHeight?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Lesson Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Introduction to photosynthesis"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>

        <div>
          <CustomDropdown
            label="Class"
            value={formData.classId}
            options={classOptions}
            loading={reference.isLoading}
            placeholder="Select a class"
            emptyMessage="No classes available"
            onChange={handleClassChange}
            error={errors.classId}
          />
        </div>

        <div>
          <CustomDropdown
            label="Subject"
            value={formData.subjectId}
            options={subjectOptions}
            disabled={!formData.classId}
            placeholder={formData.classId ? "Select a subject" : "Select a class first"}
            emptyMessage="No subjects found for this class"
            onChange={handleSubjectChange}
            error={errors.subjectId}
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <label className="block text-sm font-bold uppercase tracking-wide text-slate-500">
            Lesson Content <span className="text-red-600">*</span>
          </label>
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={isAiGenerating || !formData.classId || !formData.subjectId}
            className="group flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-xs font-bold text-[#6d3eeb] ring-1 ring-purple-100 transition hover:bg-[#6d3eeb] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAiGenerating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} className="transition-transform group-hover:scale-125" />
            )}
            {isAiGenerating ? "Generating..." : "Generate with AI"}
          </button>
        </div>

        <RichTextEditor
          value={formData.lessonContentHtml}
          onChange={handleContentChange}
          error={errors.lessonContentHtml}
          minHeight={editorMinHeight}
        />
      </div>
    </div>
  );
}
