import { useState, useMemo } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { pushToast } from "@/store/uiSlice";
import { Button } from "@/components/common/Button";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { CustomDropdown } from "@/components/ModernUi";
import { lmsService } from "@/services/lmsService";
import type { CourseLesson } from "@/services/lmsService";

interface LessonFormProps {
  lesson?: CourseLesson;
  onSubmit: (data: Record<string, unknown>) => void;
  isSubmitting: boolean;
}

export function LessonForm({ lesson, onSubmit, isSubmitting }: LessonFormProps) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    title: lesson?.title ?? "",
    description: lesson?.description ?? "",
    notes: lesson?.notes ?? "",
    videoUrl: lesson?.videoUrl ?? "",
    audioUrl: lesson?.audioUrl ?? "",
    homework: lesson?.homework ?? "",
    estimatedMinutes: lesson?.estimatedMinutes ?? 40,
    body: lesson?.body ?? "",
    linkedLessonPlanId: (lesson as any)?.linkedLessonPlanId ?? "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const { data: lessonPlansData } = useQuery({
    queryKey: ["teacher-lesson-plans-list"],
    queryFn: () => lmsService.lessonPlans({ pageSize: 100 }),
  });
  const lessonPlans = lessonPlansData?.items ?? [];

  const lessonPlanOptions = useMemo(() => {
    return lessonPlans.map((lp: any) => ({
      value: lp.id,
      label: lp.title,
      description: lp.subject?.name || lp.subjectName || "Subject",
    }));
  }, [lessonPlans]);

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const generateWithAi = async () => {
    if (!form.title) return;
    setIsGenerating(true);
    try {
      const res = await lmsService.aiComprehensive({
        taskType: "lesson_notes",
        topic: form.title,
        subjectId: (lesson as any)?.course?.subjectId || undefined,
        levelId: (lesson as any)?.course?.levelId || undefined,
        teacherRequest: `Create an engaging, student-friendly study guide and learning notes for the topic: "${form.title}". Use simple explanations, bold terms, relatable real-world analogies, and step-by-step examples.`,
        duration: Math.max(15, form.estimatedMinutes || 40),
      });
      if (res?.sections?.length) {
        const notesHtml = res.sections
          .map(
            (s: any) =>
              `<h3>${s.heading}</h3><p>${s.content}</p>${s.items?.length ? `<ul>${s.items.map((i: string) => `<li>${i}</li>`).join("")}</ul>` : ""}`,
          )
          .join("\n");
        set("notes", notesHtml);
        if (res.title && !form.description) set("description", res.title);
      }
    } catch (err) {
      console.error("AI generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          ...form,
          estimatedMinutes: Number(form.estimatedMinutes) || 10,
        });
      }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 mb-2">
        <div className="flex-1">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Link to internal Lesson Plan{" "}
            <span className="text-xs font-normal text-slate-500 normal-case">(optional)</span>
          </label>
          <CustomDropdown
            value={form.linkedLessonPlanId}
            onChange={(val) => {
              set("linkedLessonPlanId", val ?? "");
              if (val && !form.title) {
                const matched = lessonPlans.find((lp: any) => lp.id === val);
                if (matched) set("title", matched.title);
              }
            }}
            options={lessonPlanOptions}
            placeholder="Select a linked lesson plan"
            clearable={true}
          />
        </div>
        {form.linkedLessonPlanId && (
          <Button
            type="button"
            variant="secondary"
            className="h-11 px-4 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#6d3eeb] font-bold"
            disabled={isConverting}
            onClick={async () => {
              setIsConverting(true);
              try {
                const res = await lmsService.convertPlanToContent(form.linkedLessonPlanId);
                if (res?.studentContent) {
                  set("notes", res.studentContent);
                  if (res.title) set("title", res.title);
                  if (res.estimatedMinutes) set("estimatedMinutes", res.estimatedMinutes);
                  dispatch(
                    pushToast({
                      tone: "success",
                      message: "Successfully converted pedagogical plan into student notes!",
                    }),
                  );
                } else {
                  dispatch(
                    pushToast({
                      tone: "warning",
                      message: "No content generated. Please try again.",
                    }),
                  );
                }
              } catch (err) {
                console.error("AI conversion failed", err);
                dispatch(
                  pushToast({ tone: "error", message: "AI conversion failed. Please try again." }),
                );
              } finally {
                setIsConverting(false);
              }
            }}
          >
            {isConverting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span className="ml-2">AI Convert Plan</span>
          </Button>
        )}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-slate-700">Lesson Title *</label>
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            placeholder="e.g. Introduction to Fractions"
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-11 px-4"
          disabled={isGenerating || !form.title}
          onClick={generateWithAi}
        >
          {isGenerating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} className="text-[#6d3eeb]" />
          )}
          <span className="ml-2 hidden sm:inline">AI Draft</span>
        </Button>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="Brief description..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Lesson Notes / Content
        </label>
        <RichTextEditor
          value={form.notes}
          onChange={(val) => set("notes", val)}
          placeholder="Main lesson content that students will read..."
          minHeight="300px"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Video URL</label>
          <input
            value={form.videoUrl}
            onChange={(e) => set("videoUrl", e.target.value)}
            placeholder="https://youtube.com/..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={form.estimatedMinutes}
            onChange={(e) => set("estimatedMinutes", e.target.value)}
            min={1}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Homework</label>
        <RichTextEditor
          value={form.homework}
          onChange={(val) => set("homework", val)}
          placeholder="Assignment for students..."
          minHeight="200px"
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !form.title}>
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Saving...
          </>
        ) : lesson ? (
          "Update Lesson"
        ) : (
          "Add Lesson"
        )}
      </Button>
    </form>
  );
}
