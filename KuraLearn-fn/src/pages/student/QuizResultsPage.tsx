import { useParams } from "react-router-dom";
import { BarChart3, CheckCircle2, Star, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import {
  StudentCard,
  StudentEmptyState,
  PrimaryLink,
  SecondaryLink,
  StudentStat,
} from "@/components/student/StudentShared";
import { useQuizResults } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";

export function QuizResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { data, isLoading, error, refetch } = useQuizResults(attemptId || "");

  if (isLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Quiz results" subtitle="Loading results..." />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="mt-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data)
    return (
      <StudentEmptyState
        title="Results not found"
        message="The quiz result could not be retrieved."
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

  const attempt = data.attempt || data;
  const quiz = attempt.quiz || {};
  const score = Math.round(attempt.score || 0);

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="Quiz results"
        subtitle={`${quiz.title || "Quiz"} - score ${score}%`}
        actions={
          <PrimaryLink to={`/ai?attemptId=${attempt.id}&mode=remedial`}>
            AI remedial recommendation
          </PrimaryLink>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StudentStat label="Score" value={`${score}%`} icon={BarChart3} tone="#2563eb" />
        <StudentStat
          label="Stars"
          value={Math.max(1, Math.round(score / 20))}
          icon={Star}
          tone="#f59e0b"
        />
        <StudentStat
          label="Correct"
          value={`${attempt.correctCount || 0}/${quiz.questions?.length || 0}`}
          icon={CheckCircle2}
          tone="#059669"
        />
      </div>
      <div className="mt-5 grid gap-4">
        {quiz.questions?.map((question: any) => {
          const userAnswer = attempt.answers?.[question.id];
          const isCorrect = userAnswer === question.correctAnswer;
          return (
            <StudentCard
              key={question.id}
              className={isCorrect ? "border-emerald-200" : "border-amber-200"}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{question.questionText}</p>
                  <div className="mt-4 space-y-2">
                    <p
                      className={`text-sm font-bold ${isCorrect ? "text-emerald-700" : "text-amber-700"}`}
                    >
                      Your answer: {userAnswer || "No answer"}
                    </p>
                    <p className="text-sm font-bold text-slate-600">
                      Correct answer: {question.correctAnswer}
                    </p>
                  </div>
                </div>
                <div
                  className={`p-2 rounded-full ${isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                >
                  {isCorrect ? <CheckCircle2 size={20} /> : <BarChart3 size={20} />}
                </div>
              </div>
              {question.explanation && (
                <div className="mt-4 p-3 rounded-lg bg-slate-50 text-xs font-bold text-slate-500 italic">
                  {question.explanation}
                </div>
              )}
            </StudentCard>
          );
        })}
      </div>
      <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-slate-100">
        <PrimaryLink to={`/quizzes/${quiz.id}`}>Retry quiz</PrimaryLink>
        {quiz.courseId && (
          <SecondaryLink to={`/courses/${quiz.courseId}/path`}>Back to learning path</SecondaryLink>
        )}
        <SecondaryLink to="/subjects">Explore other subjects</SecondaryLink>
      </div>
    </div>
  );
}
