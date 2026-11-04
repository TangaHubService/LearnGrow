import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, StudentEmptyState } from "@/components/student/StudentShared";
import { useQuizDetails, useSubmitQuiz } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw, Timer } from "lucide-react";

export function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuizDetails(quizId || "");
  const submitMutation = useSubmitQuiz();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const quiz = data?.quiz || data;

  useEffect(() => {
    if (quiz?.timeLimit && timeLeft === null) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  }, [quiz, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (isLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Quiz" subtitle="Loading..." />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !quiz)
    return (
      <StudentEmptyState
        title="Quiz not found"
        message="Choose a quiz from a learning path."
        action={
          <button
            onClick={() => refetch()}
            className="mt-4 text-indigo-600 font-bold flex items-center gap-2"
          >
            <RefreshCw size={16} /> Retry
          </button>
        }
      />
    );

  const questions = quiz.questions || [];
  const question = questions[index];

  if (!question)
    return <StudentEmptyState title="No questions" message="This quiz has no questions." />;

  function submit() {
    submitMutation.mutate(
      {
        quizId: quiz.id,
        answers,
      },
      {
        onSuccess: (result) => {
          navigate(`/results/${result.attemptId || quiz.id}`);
        },
      },
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title={quiz.title}
        subtitle={`Question ${index + 1} of ${questions.length}.`}
        actions={
          timeLeft !== null && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${timeLeft < 60 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"}`}
            >
              <Timer size={18} />
              {formatTime(timeLeft)}
            </div>
          )
        }
      />
      <StudentCard>
        <p className="text-lg font-bold text-slate-900">{question.questionText}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {question.options.map((option: string) => (
            <button
              key={option}
              onClick={() => setAnswers({ ...answers, [question.id]: option })}
              className={`min-h-12 rounded-lg border px-4 text-left text-sm font-bold transition-all ${answers[question.id] === option ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            className="h-11 rounded-lg border border-slate-200 px-5 font-bold disabled:opacity-50"
          >
            Previous
          </button>
          {index < questions.length - 1 ? (
            <button
              onClick={() => setIndex(index + 1)}
              className="h-11 rounded-lg bg-sky-600 px-5 font-bold text-white"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitMutation.isPending}
              className="h-11 rounded-lg bg-emerald-700 px-5 font-bold text-white disabled:opacity-70 flex items-center gap-2"
            >
              {submitMutation.isPending && <RefreshCw size={18} className="animate-spin" />}
              {submitMutation.isPending ? "Submitting..." : "Submit quiz"}
            </button>
          )}
        </div>
      </StudentCard>
    </div>
  );
}
