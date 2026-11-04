import { useState, useMemo } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { assessmentApi, AssessmentType } from "@/services/assessmentApi";
import { Button } from "@/components/common/Button";
import { TYPE_LABELS } from "./AssessmentBadges";
import { CustomDropdown } from "@/components/ModernUi";

const ASSESSMENT_TYPES: AssessmentType[] = [
  "QUIZ",
  "TEST",
  "CAT",
  "EXAM",
  "ASSIGNMENT",
  "PRACTICE_ASSESSMENT",
  "PROJECT",
  "PRACTICAL",
  "ORAL",
  "HOMEWORK",
];

export function AiAssessmentCreator({
  courses,
  onCreated,
}: {
  courses: any[];
  onCreated: () => void;
}) {
  const [step, setStep] = useState<"input" | "review">("input");
  const [form, setForm] = useState({
    courseId: "",
    topic: "",
    type: "QUIZ" as AssessmentType,
    gradeLevel: "Primary",
    numberOfQuestions: 5,
    difficulty: "medium" as const,
    alignCBC: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const courseOptions = useMemo(() => {
    return courses.map((c) => ({
      value: c.id,
      label: c.title,
      description: c.subject?.name || c.subjectName || undefined,
    }));
  }, [courses]);

  const typeOptions = useMemo(() => {
    return ASSESSMENT_TYPES.map((t) => ({
      value: t,
      label: TYPE_LABELS[t],
    }));
  }, []);

  const difficultyOptions = useMemo(() => {
    return [
      { value: "easy", label: "Easy" },
      { value: "medium", label: "Medium" },
      { value: "hard", label: "Hard" },
    ];
  }, []);

  const handleGenerate = async () => {
    if (!form.topic || !form.courseId) return;
    setLoading(true);
    try {
      const course = courses.find((c) => c.id === form.courseId);
      const result = await assessmentApi.aiGenerate({
        ...form,
        subject: course?.subject?.name || "General",
      });
      setGeneratedData(result);
      setSelectedIndices(new Set(result.questions.map((_: any, i: number) => i)));
      setStep("review");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedData || !form.courseId) return;
    setSaving(true);
    try {
      const { assessment } = await assessmentApi.create({
        courseId: form.courseId,
        title: generatedData.title,
        description: generatedData.instructions,
        type: form.type,
        totalMarks: generatedData.totalMarks,
        passMark: Math.ceil(generatedData.totalMarks * 0.5),
        instructions: generatedData.instructions,
      });

      const qs = generatedData.questions.filter((_: any, i: number) => selectedIndices.has(i));
      if (qs.length > 0) {
        await assessmentApi.addQuestions(assessment.id, qs);
      }

      onCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 transition-all";

  if (step === "review") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-violet-100 bg-violet-50/30 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2">{generatedData.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{generatedData.instructions}</p>
        </div>

        <div className="space-y-4">
          <h4 className="flex items-center justify-between text-sm font-bold uppercase tracking-wide text-slate-500">
            <span>Generated Questions ({selectedIndices.size})</span>
            <button
              onClick={() =>
                setSelectedIndices(new Set(generatedData.questions.map((_: any, i: number) => i)))
              }
              className="text-[10px] text-violet-600 hover:underline"
            >
              Select All
            </button>
          </h4>

          <div className="space-y-3">
            {generatedData.questions.map((q: any, i: number) => (
              <div
                key={i}
                onClick={() => {
                  const next = new Set(selectedIndices);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  setSelectedIndices(next);
                }}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${selectedIndices.has(i) ? "border-violet-500 bg-white shadow-md" : "border-slate-100 bg-slate-50/50 opacity-60"}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${selectedIndices.has(i) ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-500"}`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{q.questionText}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                        {q.type.replace("_", " ")}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {q.marks} Marks
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-4 border-t border-slate-100 mt-10">
          <Button variant="secondary" className="flex-1 h-14" onClick={() => setStep("input")}>
            Back
          </Button>
          <Button
            className="flex-[2] h-14 text-lg font-bold"
            onClick={handleSave}
            disabled={saving || selectedIndices.size === 0}
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />} Create
            Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div>
          <CustomDropdown
            label="Course *"
            value={form.courseId}
            onChange={(val) => set("courseId", val ?? "")}
            options={courseOptions}
            placeholder="Select a course..."
            clearable={false}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Topic / Prompt *</label>
          <textarea
            value={form.topic}
            onChange={(e) => set("topic", e.target.value)}
            placeholder="e.g. Introduction to Fractions for P4 students, focusing on common denominators"
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm outline-none focus:border-violet-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <CustomDropdown
              label="Assessment Type"
              value={form.type}
              onChange={(val) => set("type", val)}
              options={typeOptions}
              placeholder="Select Type"
              clearable={false}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">Grade Level</label>
            <input
              value={form.gradeLevel}
              onChange={(e) => set("gradeLevel", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              Number of Questions
            </label>
            <input
              type="number"
              value={form.numberOfQuestions}
              onChange={(e) => set("numberOfQuestions", +e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <CustomDropdown
              label="Difficulty"
              value={form.difficulty}
              onChange={(val) => set("difficulty", val)}
              options={difficultyOptions}
              placeholder="Select difficulty"
              clearable={false}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <input
            type="checkbox"
            checked={form.alignCBC}
            onChange={(e) => set("alignCBC", e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
          />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700">Align with Rwanda CBC</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
              Competence-Based Curriculum
            </p>
          </div>
        </label>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading || !form.topic || !form.courseId}
        className="h-14 w-full text-lg font-bold"
      >
        {loading ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
        Generate Assessment & Questions
      </Button>
    </div>
  );
}
