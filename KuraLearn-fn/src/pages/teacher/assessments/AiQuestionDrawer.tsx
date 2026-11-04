import { useState } from "react";
import { Check, Loader2, Sparkles, Trash2 } from "lucide-react";
import { AppDrawer, CustomDropdown } from "@/components/ModernUi";
import { Button } from "@/components/common/Button";
import { assessmentApi } from "@/services/assessmentApi";

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function AiQuestionDrawer({
  open,
  onClose,
  assessmentId,
  onAdded,
  lessonTitle,
  subjectName,
}: {
  open: boolean;
  onClose: () => void;
  assessmentId: string;
  onAdded: () => void;
  lessonTitle?: string;
  subjectName?: string;
}) {
  const [topic, setTopic] = useState("");
  const [num, setNum] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generating, setGenerating] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [approving, setApproving] = useState(false);

  const handleGenerate = async () => {
    if (!topic && !lessonTitle) return;
    setGenerating(true);
    try {
      const result = await assessmentApi.aiGenerate({
        type: "QUIZ",
        topic: topic || lessonTitle || "General",
        subject: subjectName || "General",
        gradeLevel: "Secondary",
        numberOfQuestions: num,
        difficulty,
        alignCBC: true,
      });
      if (result.questions) {
        setReviewQuestions(result.questions);
        setSelectedIndices(new Set(result.questions.map((_: any, i: number) => i)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    const toAdd = reviewQuestions.filter((_, i) => selectedIndices.has(i));
    if (toAdd.length === 0) return;
    setApproving(true);
    try {
      await assessmentApi.addQuestions(assessmentId, toAdd);
      onAdded();
      onClose();
      setReviewQuestions([]);
    } catch (e) {
      console.error(e);
    } finally {
      setApproving(false);
    }
  };

  const toggleSelect = (i: number) => {
    const next = new Set(selectedIndices);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelectedIndices(next);
  };

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="AI Question Generator"
      subtitle="Generate curriculum-aligned questions automatically."
      size="xl"
    >
      {reviewQuestions.length === 0 ? (
        <div className="space-y-6">
          <div className="rounded-2xl bg-violet-50 p-6 border border-violet-100">
            <label className="mb-2 block text-sm font-bold text-violet-700 uppercase tracking-wide">
              {lessonTitle
                ? `Generate questions based on: ${lessonTitle}`
                : "What should the questions be about?"}
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={4}
              placeholder={
                lessonTitle
                  ? `(Optional) Add specific focus for ${lessonTitle}...`
                  : "e.g. Fundamental concepts of algebra, photosynthesis process..."
              }
              className="w-full rounded-xl border-2 border-violet-200 bg-white p-4 text-base outline-none focus:border-violet-500 transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Number of Questions
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={num}
                onChange={(e) => setNum(+e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4"
              />
            </div>
            <div>
              <CustomDropdown
                label="Difficulty"
                value={difficulty}
                onChange={(val) => setDifficulty(val)}
                options={DIFFICULTY_OPTIONS}
                placeholder="Select difficulty"
                clearable={false}
              />
            </div>
          </div>

          <Button
            className="w-full h-14 text-lg font-bold"
            onClick={handleGenerate}
            disabled={generating || !topic}
          >
            {generating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
            Generate Questions
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-lg">Review Generated Questions</h3>
            <span className="text-sm font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
              {selectedIndices.size} selected
            </span>
          </div>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            {reviewQuestions.map((q: any, i: number) => (
              <div
                key={i}
                className={`group relative rounded-2xl border-2 p-5 transition-all ${selectedIndices.has(i) ? "border-violet-500 bg-white shadow-md" : "border-slate-100 bg-slate-50/50 opacity-60"}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    onClick={() => toggleSelect(i)}
                    className={`mt-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 transition-all ${selectedIndices.has(i) ? "border-violet-500 bg-violet-500 text-white" : "border-slate-300 bg-white"}`}
                  >
                    {selectedIndices.has(i) && <Check size={14} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                        {q.type.replace("_", " ")}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                          q.difficulty === "hard"
                            ? "text-red-600 bg-red-50"
                            : q.difficulty === "easy"
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-amber-700 bg-amber-50"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {q.marks} Marks
                      </span>
                    </div>

                    <p className="text-base font-bold text-slate-900 leading-snug">
                      {q.questionText}
                    </p>

                    {q.options && q.options.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: string, oi: number) => (
                          <div
                            key={oi}
                            className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg"
                          >
                            <span className="h-4 w-4 flex items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-4 border-t border-slate-50 pt-4 transition-opacity">
                      <button
                        onClick={() => {
                          const next = [...reviewQuestions];
                          next.splice(i, 1);
                          setReviewQuestions(next);
                          const nextSelected = new Set(selectedIndices);
                          nextSelected.delete(i);
                          setSelectedIndices(nextSelected);
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              className="flex-1 h-12"
              onClick={() => {
                setReviewQuestions([]);
                setSelectedIndices(new Set());
              }}
            >
              Start Over
            </Button>
            <Button
              className="flex-[2] h-12 text-lg font-bold"
              onClick={handleApprove}
              disabled={approving || selectedIndices.size === 0}
            >
              {approving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              Approve & Add {selectedIndices.size} Questions
            </Button>
          </div>
        </div>
      )}
    </AppDrawer>
  );
}
