import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle2,
  BookOpen,
  Loader2,
  Send,
  Sparkles,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { assessmentApi, Assessment, AssessmentSubmission } from "@/services/assessmentApi";
import { Card } from "@/components/common/Card";
import { StudentAssessmentPlayer } from "./StudentAssessmentPlayer";

// ─── Types ────────────────────────────────────────────────────────────

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

// ─── Assessment Session (take assessment) ─────────────────────────────

function AssessmentSession({
  assessment,
  submission,
  onBack,
}: {
  assessment: Assessment & { mySubmission: AssessmentSubmission | null };
  submission: AssessmentSubmission | null;
  onBack: () => void;
}) {
  const isStarted =
    submission?.status === "IN_PROGRESS" ||
    submission?.status === "SUBMITTED" ||
    submission?.status === "MARKED" ||
    submission?.status === "RETURNED";
  const isSubmitted = ["SUBMITTED", "LATE", "MARKED", "RETURNED"].includes(
    submission?.status || "",
  );

  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const startMutation = useMutation({
    mutationFn: () => assessmentApi.start(assessment.id),
    onSuccess: () => {
      // In a real app, this would refresh the parent query or state
    },
  });

  const handleAiExplain = async () => {
    setAiLoading(true);
    try {
      const result = await assessmentApi.aiExplainSolution({
        assessmentTitle: assessment.title,
        studentAnswer: JSON.stringify(submission?.answers),
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

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Assessments
        </button>
        <Card className="p-8">
          <div className="mb-2">
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
              {assessment.type}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{assessment.title}</h1>
          <p className="text-sm text-slate-500 mb-6">
            {assessment.course.title} • {assessment.course.subject.name}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Time Limit</p>
              <p className="text-lg font-bold text-slate-700">
                {assessment.durationMinutes ? `${assessment.durationMinutes} mins` : "Untimed"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Marks</p>
              <p className="text-lg font-bold text-slate-700">{assessment.totalMarks}</p>
            </div>
          </div>

          {assessment.instructions && (
            <div className="mb-8 rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText size={16} className="text-slate-500" /> Instructions
              </p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {assessment.instructions}
              </p>
            </div>
          )}

          <button
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-4 text-base font-bold text-white hover:bg-violet-700 transition-all shadow-lg"
          >
            {startMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Start Assessment"
            )}
          </button>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Assessments
        </button>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-slate-100 p-8 shadow-sm text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Assessment Submitted</h1>
            <p className="text-slate-500 mb-6">
              Your work has been securely transmitted for grading.
            </p>

            <div className="inline-flex flex-col items-center justify-center rounded-2xl bg-slate-50 px-10 py-6">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Your Score</p>
              {submission?.score !== null ? (
                <>
                  <p className="text-4xl font-bold text-violet-700 leading-none">
                    {submission?.score}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    out of {assessment.totalMarks}
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-slate-600 italic">Awaiting marking</p>
              )}
            </div>
          </div>

          {submission?.feedback && (
            <Card className="p-6">
              <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Send size={16} className="text-violet-700" /> Teacher's Feedback
              </p>
              <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-violet-200 pl-4 py-1">
                "{submission.feedback}"
              </p>
            </Card>
          )}

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleAiExplain}
              disabled={aiLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 py-4 text-sm font-bold text-violet-700 hover:bg-violet-100 transition-all disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Understand My Performance with AI (CBC-Aligned)
            </button>
          </div>

          {aiExplanation && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="p-6 space-y-5 border-amber-200 bg-amber-50/30">
                <div className="flex items-center gap-2 text-amber-700 font-bold text-sm uppercase tracking-wide">
                  <Sparkles size={18} /> Pedagogical Insights
                </div>

                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                  <p>{aiExplanation.explanation}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {aiExplanation.keyPoints?.length > 0 && (
                    <div className="rounded-xl bg-white p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">
                        Key Concepts Mastered
                      </p>
                      <ul className="space-y-2">
                        {aiExplanation.keyPoints.map((p: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs font-medium text-slate-600"
                          >
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiExplanation.studyTips?.length > 0 && (
                    <div className="rounded-xl bg-white p-4 border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">
                        Recommended Learning
                      </p>
                      <ul className="space-y-2">
                        {aiExplanation.studyTips.map((p: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs font-medium text-slate-600"
                          >
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <StudentAssessmentPlayer
      assessment={assessment}
      submission={submission ?? startMutation.data?.submission ?? null}
      onBack={onBack}
    />
  );
}

// ─── Student Assessments List ─────────────────────────────────────────

export function StudentAssessmentsPage() {
  const [active, setActive] = useState<
    (Assessment & { mySubmission: AssessmentSubmission | null }) | null
  >(null);

  const myQ = useQuery({
    queryKey: ["student-my-assessments"],
    queryFn: () => assessmentApi.myAssessments(),
  });
  const assessments = myQ.data?.assessments ?? [];

  const upcoming = assessments.filter(
    (a: Assessment & { mySubmission: AssessmentSubmission | null }) =>
      !a.mySubmission ||
      a.mySubmission.status === "NOT_STARTED" ||
      a.mySubmission.status === "IN_PROGRESS",
  );
  const submitted = assessments.filter(
    (a: Assessment & { mySubmission: AssessmentSubmission | null }) =>
      a.mySubmission && ["SUBMITTED", "LATE", "MARKED", "RETURNED"].includes(a.mySubmission.status),
  );

  if (active) {
    return (
      <AssessmentSession
        assessment={active}
        submission={active.mySubmission}
        onBack={() => setActive(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">My Assessments</h1>
        <p className="mt-1 text-sm text-slate-500">View and complete your assigned assessments.</p>
      </div>

      {myQ.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
          <Loader2 size={20} className="animate-spin" /> Loading...
        </div>
      ) : assessments.length === 0 ? (
        <Card className="py-16 text-center">
          <FileText size={40} className="mx-auto text-slate-500" />
          <p className="mt-3 text-base font-bold text-slate-600">No assessments assigned</p>
          <p className="mt-1 text-sm text-slate-500">
            Your teacher hasn't published any assessments yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-slate-600 uppercase tracking-wide">
                To Do ({upcoming.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setActive(a)}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        {a.type}
                      </span>
                      {a.mySubmission && <SubBadge status={a.mySubmission.status} />}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{a.title}</h3>
                    <p className="mt-0.5 text-xs text-violet-600 font-medium">{a.course.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        {a.totalMarks} marks
                      </span>
                      {a.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Due {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <button className="mt-3 w-full rounded-lg bg-violet-600 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition-colors">
                      {a.mySubmission?.status === "IN_PROGRESS" ? "Continue" : "Start"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {submitted.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-slate-600 uppercase tracking-wide">
                Submitted ({submitted.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {submitted.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setActive(a)}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                        {a.type}
                      </span>
                      {a.mySubmission && <SubBadge status={a.mySubmission.status} />}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{a.title}</h3>
                    <p className="mt-0.5 text-xs text-violet-600 font-medium">{a.course.title}</p>
                    {a.mySubmission?.score !== null && a.mySubmission?.score !== undefined && (
                      <p className="mt-2 text-lg font-bold text-violet-700">
                        {a.mySubmission.score} / {a.totalMarks}
                      </p>
                    )}
                    {(a.mySubmission?.status === "MARKED" ||
                      a.mySubmission?.status === "RETURNED") && (
                      <button className="mt-3 w-full rounded-lg border border-violet-200 bg-violet-50 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-colors">
                        View Feedback & AI Explanation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
