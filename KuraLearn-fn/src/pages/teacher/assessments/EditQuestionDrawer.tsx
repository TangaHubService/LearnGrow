import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { AppDrawer, CustomDropdown } from "@/components/ModernUi";
import { Button } from "@/components/common/Button";
import { assessmentApi, AssessmentQuestion } from "@/services/assessmentApi";

const TYPE_OPTIONS = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "ESSAY", label: "Essay" },
  { value: "MATCHING", label: "Matching" },
  { value: "ORDERING", label: "Ordering" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function EditQuestionDrawer({
  open,
  onClose,
  q,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  q: AssessmentQuestion | null;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    questionText: "",
    type: "",
    marks: 1,
    options: "",
    correctAnswer: "",
    explanation: "",
    difficulty: "medium",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (q) {
      setForm({
        questionText: q.questionText,
        type: q.type,
        marks: q.marks,
        options: Array.isArray(q.options) ? q.options.join("\n") : "",
        correctAnswer:
          typeof q.correctAnswer === "string" ? q.correctAnswer : JSON.stringify(q.correctAnswer),
        explanation: q.explanation || "",
        difficulty: (q.difficulty as any) || "medium",
      });
    }
  }, [q]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleUpdate = async () => {
    if (!q || !form.questionText.trim()) return;
    setSaving(true);
    try {
      const opts =
        form.type === "MULTIPLE_CHOICE" || form.type === "MATCHING" || form.type === "ORDERING"
          ? form.options
              .split("\n")
              .map((o) => o.trim())
              .filter(Boolean)
          : [];

      await assessmentApi.updateQuestion(q.id, {
        questionText: form.questionText,
        type: form.type as any,
        options: opts.length ? opts : undefined,
        correctAnswer: form.correctAnswer || undefined,
        marks: form.marks,
        explanation: form.explanation || undefined,
      });
      onUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!q) return null;

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 transition-all";

  return (
    <AppDrawer open={open} onClose={onClose} title="Edit Question" size="xl">
      <div className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Question Text *</label>
          <textarea
            value={form.questionText}
            onChange={(e) => set("questionText", e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-base outline-none focus:border-violet-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <CustomDropdown
              label="Type *"
              value={form.type}
              onChange={(val) => set("type", val)}
              options={TYPE_OPTIONS}
              placeholder="Select type"
              clearable={false}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Marks *</label>
            <input
              type="number"
              min={1}
              value={form.marks}
              onChange={(e) => set("marks", +e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <CustomDropdown
              label="Difficulty"
              value={form.difficulty}
              onChange={(val) => set("difficulty", val)}
              options={DIFFICULTY_OPTIONS}
              placeholder="Select difficulty"
              clearable={false}
            />
          </div>
        </div>

        {(form.type === "MULTIPLE_CHOICE" ||
          form.type === "MATCHING" ||
          form.type === "ORDERING") && (
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Options (One per line) *
            </label>
            <textarea
              value={form.options}
              onChange={(e) => set("options", e.target.value)}
              rows={4}
              placeholder="Option 1\nOption 2..."
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-violet-500 transition-all"
            />
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Correct Answer *</label>
          <input
            value={form.correctAnswer}
            onChange={(e) => set("correctAnswer", e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Explanation</label>
          <textarea
            value={form.explanation}
            onChange={(e) => set("explanation", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-violet-500 transition-all"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="secondary" className="flex-1 h-12" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-[2] h-12 text-base font-bold"
            onClick={handleUpdate}
            disabled={saving || !form.questionText.trim()}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Update
            Question
          </Button>
        </div>
      </div>
    </AppDrawer>
  );
}
