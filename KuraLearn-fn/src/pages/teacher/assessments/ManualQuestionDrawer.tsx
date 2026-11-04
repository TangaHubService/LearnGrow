import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { AppDrawer, CustomDropdown } from "@/components/ModernUi";
import { Button } from "@/components/common/Button";
import { assessmentApi } from "@/services/assessmentApi";

const TYPE_OPTIONS = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "ESSAY", label: "Essay" },
  { value: "MATCHING", label: "Matching" },
  { value: "ORDERING", label: "Ordering" },
];

export function ManualQuestionDrawer({
  open,
  onClose,
  assessmentId,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  assessmentId: string;
  onAdded: () => void;
}) {
  const [q, setQ] = useState({
    questionText: "",
    type: "SHORT_ANSWER",
    marks: 1,
    options: "",
    correctAnswer: "",
    explanation: "",
    difficulty: "medium",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setQ((p) => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!q.questionText.trim()) return;
    setSaving(true);
    try {
      const opts =
        q.type === "MULTIPLE_CHOICE" || q.type === "MATCHING" || q.type === "ORDERING"
          ? q.options
              .split("\n")
              .map((o) => o.trim())
              .filter(Boolean)
          : [];

      await assessmentApi.addQuestions(assessmentId, [
        {
          questionText: q.questionText,
          type: q.type as any,
          options: opts.length ? opts : undefined,
          correctAnswer: q.correctAnswer || undefined,
          marks: q.marks,
          explanation: q.explanation || undefined,
        },
      ]);
      setQ({
        questionText: "",
        type: "SHORT_ANSWER",
        marks: 1,
        options: "",
        correctAnswer: "",
        explanation: "",
        difficulty: "medium",
      });
      onAdded();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 transition-all";

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Add Question Manually"
      subtitle="Create a new question for this assessment."
    >
      <div className="space-y-6">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Question Text *</label>
          <textarea
            value={q.questionText}
            onChange={(e) => set("questionText", e.target.value)}
            rows={3}
            placeholder="Type the question here..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-base outline-none focus:border-violet-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <CustomDropdown
              label="Type *"
              value={q.type}
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
              value={q.marks}
              onChange={(e) => set("marks", +e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        {(q.type === "MULTIPLE_CHOICE" || q.type === "MATCHING" || q.type === "ORDERING") && (
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Options (one per line) *
            </label>
            <textarea
              value={q.options}
              onChange={(e) => set("options", e.target.value)}
              rows={4}
              placeholder={"Option A\nOption B\nOption C"}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-violet-500"
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Correct Answer *</label>
          <input
            value={q.correctAnswer}
            onChange={(e) => set("correctAnswer", e.target.value)}
            placeholder="Expected answer"
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">
            Explanation (Optional)
          </label>
          <input
            value={q.explanation}
            onChange={(e) => set("explanation", e.target.value)}
            placeholder="Why is this the answer?"
            className={inputCls}
          />
        </div>
        <Button
          className="w-full h-12 text-base font-bold"
          onClick={handleAdd}
          disabled={saving || !q.questionText.trim()}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Create
          Question
        </Button>
      </div>
    </AppDrawer>
  );
}
