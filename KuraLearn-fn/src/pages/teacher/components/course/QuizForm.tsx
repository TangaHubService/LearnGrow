import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";
import { lmsService } from "@/services/lmsService";

interface QuizFormProps {
  quiz?: any;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function QuizForm({ quiz, onSubmit, isSubmitting }: QuizFormProps) {
  const [form, setForm] = useState({
    title: quiz?.title ?? "",
    description: quiz?.description ?? "",
    durationMinutes: quiz?.durationMinutes ?? 15,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const generateWithAi = async () => {
    if (!form.title) return;
    setIsGenerating(true);
    try {
      const res = await lmsService.aiComprehensive({
        taskType: "assessment_questions",
        topic: form.title,
        teacherRequest: `Generate ${5} assessment questions for the topic: "${form.title}". Include a mix of question types with answers.`,
        numberOfQuestions: 5,
        duration: form.durationMinutes || 15,
      });
      if (res?.sections?.length) {
        const desc = res.sections.map((s: any) => `${s.heading}: ${s.content}`).join("\n");
        setForm((prev) => ({ ...prev, description: desc }));
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
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-slate-700">Quiz Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
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
          <span className="ml-2 hidden sm:inline">AI Questions</span>
        </Button>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Duration (Minutes)</label>
        <input
          type="number"
          value={form.durationMinutes}
          onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
          className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#6d3eeb] focus:ring-4 focus:ring-purple-100"
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !form.title}>
        {isSubmitting ? "Saving..." : quiz ? "Update Quiz" : "Create Quiz"}
      </Button>
    </form>
  );
}
