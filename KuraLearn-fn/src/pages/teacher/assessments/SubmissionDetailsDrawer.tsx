import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle, Loader2, MessageSquare, Send, Sparkles, ThumbsUp } from "lucide-react";
import { AppDrawer } from "@/components/ModernUi";
import { Button } from "@/components/common/Button";
import { assessmentApi, AssessmentSubmission, Assessment } from "@/services/assessmentApi";

export function SubmissionDetailsDrawer({
  open,
  onClose,
  sub,
  assessment,
}: {
  open: boolean;
  onClose: () => void;
  sub: AssessmentSubmission | null;
  assessment: Assessment;
}) {
  const qc = useQueryClient();
  const [questionMarking, setQuestionMarking] = useState<
    Record<string, { marks: number; feedback?: string }>
  >({});
  const [overallFeedback, setOverallFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [returning, setReturning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (sub) {
      setQuestionMarking(sub.questionMarking || {});
      setOverallFeedback(sub.feedback || "");
    }
  }, [sub]);

  const handleMark = async () => {
    if (!sub) return;
    setSaving(true);
    try {
      const score = Object.values(questionMarking).reduce(
        (sum, item) => sum + (item.marks || 0),
        0,
      );
      await assessmentApi.markSubmission(sub.id, {
        score,
        feedback: overallFeedback,
        questionMarking,
      });
      qc.invalidateQueries({ queryKey: ["assessment-submissions", assessment.id] });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async () => {
    if (!sub) return;
    setReturning(true);
    try {
      await assessmentApi.returnSubmission(sub.id);
      qc.invalidateQueries({ queryKey: ["assessment-submissions", assessment.id] });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setReturning(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!sub) return;
    setAiLoading(true);
    try {
      const result = await assessmentApi.aiFeedbackSuggest({
        assessmentTitle: assessment.title,
        totalMarks: assessment.totalMarks,
        passMark: assessment.passMark,
        studentAnswer: JSON.stringify(sub.answers),
      });
      if (result.questionMarking) setQuestionMarking(result.questionMarking);
      if (result.overallFeedback) setOverallFeedback(result.overallFeedback);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  if (!sub) return null;

  return (
    <AppDrawer open={open} onClose={onClose} title="Submission Details" size="2xl">
      <div className="space-y-8">
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Student</p>
            <p className="text-xl font-bold text-slate-900">
              {sub.student?.user?.name || "Student"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Status</p>
            <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
              {sub.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <CheckCircle size={20} className="text-emerald-700" />
              Question-by-Question Marking
            </h3>
            <Button
              variant="secondary"
              className="h-9 px-3 text-[10px] font-bold uppercase tracking-wide text-violet-600 border-violet-100 hover:bg-violet-50"
              onClick={handleAiSuggest}
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              AI Suggest Marking
            </Button>
          </div>

          <div className="space-y-4">
            {(assessment.questions || []).map((q, i) => {
              const answer = sub.answers?.[q.id] || "No answer provided";
              const marking = questionMarking[q.id] || { marks: 0, feedback: "" };

              return (
                <div key={q.id} className="rounded-2xl border border-slate-100 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Question {i + 1} ({q.marks} Marks)
                      </p>
                      <p className="text-sm font-bold text-slate-800">{q.questionText}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                      Student Answer
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {typeof answer === "string" ? answer : JSON.stringify(answer)}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Marks
                      </label>
                      <input
                        type="number"
                        max={q.marks}
                        min={0}
                        value={marking.marks}
                        onChange={(e) =>
                          setQuestionMarking((prev) => ({
                            ...prev,
                            [q.id]: { ...marking, marks: Number(e.target.value) },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-bold outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Feedback
                      </label>
                      <input
                        placeholder="Specific feedback for this answer..."
                        value={marking.feedback}
                        onChange={(e) =>
                          setQuestionMarking((prev) => ({
                            ...prev,
                            [q.id]: { ...marking, feedback: e.target.value },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <MessageSquare size={20} className="text-violet-700" />
            Overall Feedback
          </h3>
          <textarea
            rows={4}
            value={overallFeedback}
            onChange={(e) => setOverallFeedback(e.target.value)}
            placeholder="Add overall comments for the student..."
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
          <Button
            className="flex-1 h-14 text-base font-bold"
            onClick={handleMark}
            disabled={saving}
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <ThumbsUp size={20} />}
            Save Marking
          </Button>
          <Button
            variant="secondary"
            className="flex-1 h-14 text-base font-bold text-emerald-700 border-emerald-100 hover:bg-emerald-50"
            onClick={handleReturn}
            disabled={returning}
          >
            {returning ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            Finalize & Return
          </Button>
        </div>
      </div>
    </AppDrawer>
  );
}
