import { useState, useMemo } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Assessment, AssessmentType } from "@/services/assessmentApi";
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

export function AssessmentForm({
  courses,
  classes = [],
  onSubmit,
  isSubmitting,
  aiLoading,
  onAiGenerate,
  assessment,
}: {
  courses: any[];
  classes?: any[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  aiLoading: boolean;
  onAiGenerate: (topic: string, type: string, courseId?: string) => Promise<any>;
  assessment?: Assessment | null;
}) {
  const [form, setForm] = useState({
    courseId: assessment?.courseId || "",
    subjectId: assessment?.subjectId || "",
    classId: assessment?.classId || "",
    title: assessment?.title || "",
    description: assessment?.description || "",
    type: (assessment?.type || "ASSIGNMENT") as AssessmentType,
    totalMarks: assessment?.totalMarks || 100,
    passMark: assessment?.passMark || 50,
    passingScore: assessment?.passingScore || 50,
    dueDate: assessment?.dueDate ? new Date(assessment.dueDate).toISOString().slice(0, 16) : "",
    startDate: assessment?.startDate
      ? new Date(assessment.startDate).toISOString().slice(0, 16)
      : "",
    durationMinutes: assessment?.durationMinutes?.toString() || "",
    instructions: assessment?.instructions || "",
    allowLateSubmission: assessment?.allowLateSubmission || false,
    attemptsAllowed: assessment?.attemptsAllowed || 1,
    randomizeQuestions: assessment?.randomizeQuestions || false,
    showResults: assessment?.showResults ?? true,
  });
  const [aiTopic, setAiTopic] = useState("");
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

  const classOptions = useMemo(() => {
    return [
      { value: "", label: "All Students in Course" },
      ...classes.map((c) => ({
        value: c.id,
        label: `${c.name}${c.levelName ? ` - ${c.levelName}` : ""}`,
      })),
    ];
  }, [classes]);

  const inputCls =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100";
  const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <form
      id="assessment-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      {/* AI Generate */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-violet-700">
          <Sparkles size={14} /> AI Generate
        </p>
        <div className="flex gap-2">
          <input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="Topic (e.g. Fractions, Photosynthesis)"
            className="h-9 flex-1 rounded-lg border border-violet-200 bg-white px-3 text-sm outline-none focus:border-violet-500"
          />
          <button
            type="button"
            disabled={!aiTopic || aiLoading}
            onClick={async () => {
              const result = await onAiGenerate(aiTopic, form.type, form.courseId);
              if (!result) return;
              setForm((p) => ({
                ...p,
                title: result.title ?? p.title,
                instructions: result.instructions ?? p.instructions,
                totalMarks: result.totalMarks ?? p.totalMarks,
                durationMinutes: result.estimatedDurationMinutes?.toString() ?? p.durationMinutes,
              }));
            }}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-violet-700"
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{" "}
            Generate
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <CustomDropdown
            label="Course *"
            value={form.courseId}
            onChange={(val) => {
              const cId = val ?? "";
              const course = courses.find((c) => c.id === cId);
              setForm((p) => ({
                ...p,
                courseId: cId,
                subjectId: course?.subjectId || p.subjectId,
              }));
            }}
            options={courseOptions}
            placeholder="Select course..."
            clearable={false}
          />
        </div>
        <div>
          <CustomDropdown
            label="Type *"
            value={form.type}
            onChange={(val) => set("type", val)}
            options={typeOptions}
            placeholder="Select type..."
            clearable={false}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <CustomDropdown
            label="Class (Target)"
            value={form.classId}
            onChange={(val) => set("classId", val ?? "")}
            options={classOptions}
            placeholder="All Students in Course"
            clearable={true}
          />
        </div>
        <div>
          <label className={labelCls}>Passing Score (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.passingScore}
            onChange={(e) => set("passingScore", +e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Title *</label>
        <input
          required
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Assessment title"
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Instructions</label>
        <textarea
          value={form.instructions}
          onChange={(e) => set("instructions", e.target.value)}
          rows={4}
          placeholder="Instructions for students..."
          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Total Marks</label>
          <input
            type="number"
            min={1}
            value={form.totalMarks}
            onChange={(e) => set("totalMarks", +e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Pass Mark</label>
          <input
            type="number"
            min={0}
            max={form.totalMarks}
            value={form.passMark}
            onChange={(e) => set("passMark", +e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Duration (min)</label>
          <input
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={(e) => set("durationMinutes", e.target.value)}
            placeholder="Optional"
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Scheduled Start</label>
          <input
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Due Date</label>
          <input
            type="datetime-local"
            value={form.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Attempts Allowed</label>
          <input
            type="number"
            min={1}
            value={form.attemptsAllowed}
            onChange={(e) => set("attemptsAllowed", +e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="space-y-2 pt-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.allowLateSubmission}
              onChange={(e) => set("allowLateSubmission", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-violet-600"
            />
            Allow late submissions
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.randomizeQuestions}
              onChange={(e) => set("randomizeQuestions", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-violet-600"
            />
            Randomize questions
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.showResults}
              onChange={(e) => set("showResults", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-violet-600"
            />
            Show results after marking
          </label>
        </div>
      </div>

      <Button
        type="submit"
        form="assessment-form"
        disabled={isSubmitting || !form.title || !form.courseId}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />{" "}
            {assessment ? "Updating..." : "Creating..."}
          </>
        ) : assessment ? (
          "Update Assessment"
        ) : (
          "Create Assessment"
        )}
      </Button>
    </form>
  );
}
