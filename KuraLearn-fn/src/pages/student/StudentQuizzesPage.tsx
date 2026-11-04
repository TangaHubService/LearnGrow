import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Timer,
  Play,
  RotateCcw,
} from "lucide-react";
import { courseApi } from "@/services/courseApi";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { AppDrawer, StatusBadge } from "@/components/ModernUi";

const STARTED_QUIZZES_KEY = "kuralearn_started_quizzes";

function getStartedQuizzes(): Set<string> {
  try {
    const raw = localStorage.getItem(STARTED_QUIZZES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function addStartedQuiz(id: string) {
  const set = getStartedQuizzes();
  set.add(id);
  localStorage.setItem(STARTED_QUIZZES_KEY, JSON.stringify([...set]));
}

function removeStartedQuiz(id: string) {
  const set = getStartedQuizzes();
  set.delete(id);
  localStorage.setItem(STARTED_QUIZZES_KEY, JSON.stringify([...set]));
}

function QuizPlayer({
  quiz,
  onComplete,
  isSubmitting,
}: {
  quiz: any;
  onComplete: (answers: Record<string, string>) => void;
  isSubmitting: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : 0);

  useEffect(() => {
    if (!quiz.timeLimit) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz.timeLimit, answers, onComplete]);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIdx];

  const handleAnswer = (val: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentQuestion) return <div>No questions in this quiz.</div>;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
          <span>
            QUESTION {currentIdx + 1} OF {questions.length}
          </span>
          <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-[#6d3eeb] transition-all"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        {quiz.timeLimit && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold ${timeLeft < 60 ? "animate-pulse bg-red-50 text-red-600" : "bg-slate-100 text-slate-700"}`}
          >
            <Timer size={16} />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div className="flex-1">
        <h2 className="text-xl font-bold text-slate-900">{currentQuestion.questionText}</h2>

        <div className="mt-8 space-y-3">
          {currentQuestion.type === "MULTIPLE_CHOICE" &&
            currentQuestion.options.map((opt: string) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition ${
                  answers[currentQuestion.id] === opt
                    ? "border-[#6d3eeb] bg-purple-50 text-[#6d3eeb]"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div
                  className={`grid h-6 w-6 place-items-center rounded-full border-2 ${
                    answers[currentQuestion.id] === opt
                      ? "border-[#6d3eeb] bg-[#6d3eeb] text-white"
                      : "border-slate-300"
                  }`}
                >
                  {answers[currentQuestion.id] === opt && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm font-bold">{opt}</span>
              </button>
            ))}

          {currentQuestion.type === "TRUE_FALSE" &&
            ["True", "False"].map((opt: string) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition ${
                  answers[currentQuestion.id] === opt
                    ? "border-[#6d3eeb] bg-purple-50 text-[#6d3eeb]"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <span className="text-sm font-bold">{opt}</span>
              </button>
            ))}

          {currentQuestion.type === "SHORT_ANSWER" && (
            <input
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="h-14 w-full rounded-xl border-2 border-slate-100 px-4 font-bold outline-none focus:border-[#6d3eeb]"
            />
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between border-t border-slate-100 pt-6">
        <Button
          variant="secondary"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((prev) => prev - 1)}
        >
          <ArrowLeft size={16} /> Previous
        </Button>

        {currentIdx === questions.length - 1 ? (
          <Button
            onClick={() => onComplete(answers)}
            disabled={isSubmitting || !answers[currentQuestion.id]}
          >
            {isSubmitting ? "Submitting..." : "Finish Quiz"}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIdx((prev) => prev + 1)}
            disabled={!answers[currentQuestion.id]}
          >
            Next Question <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

function QuizStatusBadge({ status }: { status: "completed" | "started" | "not_started" }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        <CheckCircle2 size={12} />
        COMPLETED
      </span>
    );
  }
  if (status === "started") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
        <Play size={12} />
        IN PROGRESS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
      <HelpCircle size={12} />
      NOT STARTED
    </span>
  );
}

export function StudentQuizzesPage() {
  const queryClient = useQueryClient();
  const [player, setPlayer] = useState<any | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [startedIds, setStartedIds] = useState<Set<string>>(getStartedQuizzes);
  const [filter, setFilter] = useState<"all" | "not_started" | "started" | "completed">("all");

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["student-courses"],
    queryFn: () => courseApi.mine(),
  });

  const courses = coursesData?.courses ?? [];
  const quizzes = courses.flatMap((c) => (c as any).quizzes || []);

  const submitMutation = useMutation({
    mutationFn: ({ id, answers }: { id: string; answers: Record<string, string> }) =>
      courseApi.submitQuizAttempt(id, answers),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["student-courses"] });
      if (player) removeStartedQuiz(player.id);
      setStartedIds(getStartedQuizzes());
      setPlayer(null);
      setResult(data.attempt);
    },
  });

  const handleStartQuiz = useCallback((q: any) => {
    addStartedQuiz(q.id);
    setStartedIds(getStartedQuizzes());
    setPlayer(q);
  }, []);

  const quizStatus = (q: any): "completed" | "started" | "not_started" => {
    if (q.attempts?.[0]) return "completed";
    if (startedIds.has(q.id)) return "started";
    return "not_started";
  };

  const filteredQuizzes =
    filter === "all" ? quizzes : quizzes.filter((q: any) => quizStatus(q) === filter);

  const counts = {
    all: quizzes.length,
    not_started: quizzes.filter((q: any) => quizStatus(q) === "not_started").length,
    started: quizzes.filter((q: any) => quizStatus(q) === "started").length,
    completed: quizzes.filter((q: any) => quizStatus(q) === "completed").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#6d3eeb]" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Quizzes</h1>
        <p className="mt-1 font-bold text-slate-500">Test your knowledge and review your scores.</p>
      </div>

      {quizzes.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(["all", "not_started", "started", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                filter === f
                  ? "bg-[#6d3eeb] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f === "all"
                ? "All"
                : f === "not_started"
                  ? "Not started"
                  : f === "started"
                    ? "In progress"
                    : "Completed"}
              <span className="ml-1.5 opacity-70">({counts[f]})</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredQuizzes.length === 0 ? (
          <Card className="col-span-full py-16 text-center">
            <HelpCircle size={48} className="mx-auto text-slate-500" />
            <p className="mt-4 text-xl font-bold text-slate-600">
              {filter === "all"
                ? "No quizzes available"
                : filter === "completed"
                  ? "No completed quizzes yet"
                  : filter === "started"
                    ? "No quizzes in progress"
                    : "All quizzes have been started or completed"}
            </p>
            <p className="mt-1 text-slate-500">Complete your lessons to unlock assessments.</p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-4 text-sm font-bold text-[#6d3eeb] hover:underline"
              >
                View all quizzes
              </button>
            )}
          </Card>
        ) : (
          filteredQuizzes.map((q: any) => {
            const attempt = q.attempts?.[0];
            const status = quizStatus(q);

            return (
              <Card key={q.id} className="flex flex-col">
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-lg ${
                      status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : status === "started"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 size={20} />
                    ) : status === "started" ? (
                      <Play size={20} />
                    ) : (
                      <HelpCircle size={20} />
                    )}
                  </div>
                  <QuizStatusBadge status={status} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">{q.title}</h3>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {q.course?.title || "—"}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-500" />
                    {q.timeLimit || "No limit"} mins
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-slate-500" />
                    {q.questions?.length || 0} Questions
                  </span>
                </div>

                {attempt && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">Your Score</span>
                      <span
                        className={`text-lg font-bold ${attempt.score >= 70 ? "text-emerald-700" : "text-amber-700"}`}
                      >
                        {Math.round(attempt.score)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full transition-all ${attempt.score >= 70 ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${attempt.score}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Button
                    fullWidth
                    variant={status === "completed" ? "secondary" : "primary"}
                    onClick={() => handleStartQuiz(q)}
                  >
                    {status === "completed" ? (
                      <>
                        <RotateCcw size={14} /> Retake Quiz
                      </>
                    ) : status === "started" ? (
                      <>
                        <Play size={14} /> Continue Quiz
                      </>
                    ) : (
                      <>
                        <Play size={14} /> Start Quiz
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <AppDrawer
        open={!!player}
        title={player?.title}
        onClose={() => setPlayer(null)}
        width="max-w-2xl"
      >
        {player && (
          <QuizPlayer
            quiz={player}
            isSubmitting={submitMutation.isPending}
            onComplete={(answers) => submitMutation.mutate({ id: player.id, answers })}
          />
        )}
      </AppDrawer>

      <AppDrawer
        open={!!result}
        title="Quiz Completed!"
        onClose={() => setResult(null)}
        width="max-w-md"
      >
        <div className="py-8 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-50 text-emerald-700">
            <Trophy size={48} />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-slate-900">Well Done!</h2>
          <p className="mt-1 font-bold text-slate-500">You've completed the assessment.</p>

          <div className="mt-10 rounded-2xl bg-slate-50 p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Your Score</p>
            <p className="mt-2 text-5xl font-bold text-[#6d3eeb]">{Math.round(result?.score)}%</p>
            <div className="mt-6 flex justify-center gap-8 border-t border-slate-200 pt-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Accuracy</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {Math.round(result?.score)}%
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
                <p
                  className={`mt-1 text-lg font-bold ${result?.score >= 70 ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {result?.score >= 70 ? "Mastered" : "Keep Practicing"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Button fullWidth onClick={() => setResult(null)}>
              Back to Quizzes
            </Button>
          </div>
        </div>
      </AppDrawer>
    </div>
  );
}
