import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle2,
  BookOpen,
  Loader2,
  Send,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Save,
  AlertCircle,
} from "lucide-react";
import {
  assessmentApi,
  Assessment,
  AssessmentSubmission,
  AssessmentQuestion,
} from "@/services/assessmentApi";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";

// ─── Status Badge ─────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  LATE: "bg-orange-100 text-orange-700",
  MARKED: "bg-violet-100 text-violet-700",
  RETURNED: "bg-emerald-100 text-emerald-700",
};

function SubBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[status] ?? "bg-gray-100"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

// ─── Assessment Player ────────────────────────────────────────────────
export function StudentAssessmentPlayer({
  assessment,
  submission,
  onBack,
}: {
  assessment: Assessment;
  submission: AssessmentSubmission | null;
  onBack: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(
    (submission?.answers as Record<string, any>) ?? {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const questions = assessment.questions || [];
  const currentQ = questions[currentIdx];

  // Timer logic
  useEffect(() => {
    if (assessment.durationMinutes && !submission?.submittedAt) {
      // Simplistic timer: in a real app, this should be synced with backend
      const totalSeconds = assessment.durationMinutes * 60;
      setTimeLeft(totalSeconds);
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [assessment.durationMinutes, submission?.submittedAt]);

  // Auto-save logic
  const submissionId = submission?.id;
  const submissionStatus = submission?.status;
  const handleSave = useCallback(async () => {
    if (!submissionId || submissionStatus === "SUBMITTED") return;
    setSaving(true);
    try {
      await assessmentApi.saveDraft(submissionId, answers);
    } catch (e) {
      console.error("Auto-save failed", e);
    } finally {
      setSaving(false);
    }
  }, [submissionId, submissionStatus, answers]);

  useEffect(() => {
    const interval = setInterval(handleSave, 30000);
    return () => clearInterval(interval);
  }, [handleSave]);

  const handleSubmit = async () => {
    if (!submission?.id) return;
    if (!window.confirm("Are you sure you want to submit your assessment?")) return;

    setSubmitting(true);
    try {
      await assessmentApi.submit(submission.id, { answers });
      onBack(); // Refresh list or show results
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiExplain = async () => {
    setAiLoading(true);
    try {
      const result = await assessmentApi.aiExplainSolution({
        assessmentTitle: assessment.title,
        studentAnswer: JSON.stringify(answers),
        subject: assessment.course.subject.name,
        gradeLevel: "Primary",
      });
      setAiExplanation(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="text-slate-300 mb-4" />
        <p className="text-lg font-bold text-slate-700">No questions found</p>
        <button onClick={onBack} className="mt-4 text-violet-600 font-semibold underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full bg-white border-b border-slate-200 lg:w-72 lg:border-b-0 lg:border-r lg:min-h-screen p-4">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} /> Quit Assessment
        </button>

        <div className="mb-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Questions</p>
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(idx)}
                className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                  currentIdx === idx
                    ? "border-violet-600 bg-violet-600 text-white shadow-md"
                    : answers[q.id]
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100 hidden lg:block">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Progress</span>
            <span>
              {Object.keys(answers).length} / {questions.length}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Main Player Area */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white px-6 border-b border-slate-200">
          <div>
            <h1 className="text-sm font-bold text-slate-900 line-clamp-1">{assessment.title}</h1>
            <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wide">
              {assessment.type}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${timeLeft < 300 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"}`}
              >
                <Clock size={16} />
                {formatTime(timeLeft)}
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving..." : "All changes saved"}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 transition-colors shadow-lg disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit
            </button>
          </div>
        </header>

        {/* Question Area */}
        <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {currentIdx + 1}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {currentQ.marks} MARK{currentQ.marks !== 1 ? "S" : ""}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 leading-relaxed">
                {currentQ.questionText}
              </h2>
            </div>

            {/* Answer Controls */}
            <div className="space-y-4">
              {currentQ.type === "MULTIPLE_CHOICE" && Array.isArray(currentQ.options) && (
                <div className="grid gap-3">
                  {(currentQ.options as string[]).map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-4 cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-slate-50 ${
                        answers[currentQ.id] === opt
                          ? "border-violet-500 bg-violet-50/50 shadow-sm"
                          : "border-slate-100 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQ.id}`}
                        value={opt}
                        checked={answers[currentQ.id] === opt}
                        onChange={() => setAnswers((p) => ({ ...p, [currentQ.id]: opt }))}
                        className="h-5 w-5 text-violet-600 border-slate-300 focus:ring-violet-500"
                      />
                      <span className="text-base font-medium text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQ.type === "TRUE_FALSE" && (
                <div className="flex gap-4">
                  {["True", "False"].map((opt) => (
                    <label
                      key={opt}
                      className={`flex-1 flex items-center justify-center gap-3 cursor-pointer rounded-xl border-2 p-6 transition-all hover:bg-slate-50 ${
                        answers[currentQ.id] === opt
                          ? "border-violet-500 bg-violet-50/50 shadow-sm"
                          : "border-slate-100 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQ.id}`}
                        value={opt}
                        checked={answers[currentQ.id] === opt}
                        onChange={() => setAnswers((p) => ({ ...p, [currentQ.id]: opt }))}
                        className="h-5 w-5 text-violet-600"
                      />
                      <span className="text-lg font-bold text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {(currentQ.type === "SHORT_ANSWER" || currentQ.type === "ESSAY") && (
                <textarea
                  value={answers[currentQ.id] ?? ""}
                  onChange={(e) => setAnswers((p) => ({ ...p, [currentQ.id]: e.target.value }))}
                  rows={currentQ.type === "ESSAY" ? 10 : 3}
                  placeholder="Type your answer here..."
                  className="w-full rounded-xl border-2 border-slate-100 bg-white p-5 text-base outline-none focus:border-violet-500 transition-all resize-none shadow-sm"
                />
              )}

              {/* MATCHING & ORDERING would need specific UI here */}
              {(currentQ.type === "MATCHING" || currentQ.type === "ORDERING") && (
                <div className="rounded-xl bg-amber-50 p-6 text-center border border-amber-100">
                  <p className="text-amber-800 font-medium">
                    This question type requires specialized interactive UI.
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    Currently available for text submission.
                  </p>
                  <textarea
                    value={answers[currentQ.id] ?? ""}
                    onChange={(e) => setAnswers((p) => ({ ...p, [currentQ.id]: e.target.value }))}
                    rows={4}
                    placeholder="Describe your matching/order here..."
                    className="mt-4 w-full rounded-lg border border-amber-200 p-3 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="mt-auto bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronLeft size={20} /> Previous
          </button>

          <span className="text-sm font-bold text-slate-500">
            {currentIdx + 1} of {questions.length}
          </span>

          <button
            onClick={() => {
              if (currentIdx === questions.length - 1) {
                handleSubmit();
              } else {
                setCurrentIdx((p) => Math.min(questions.length - 1, p + 1));
              }
            }}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-black shadow-lg shadow-slate-200 transition-all"
          >
            {currentIdx === questions.length - 1 ? "Finish & Submit" : "Next Question"}
            {currentIdx !== questions.length - 1 && <ChevronRight size={20} />}
          </button>
        </footer>
      </main>
    </div>
  );
}
