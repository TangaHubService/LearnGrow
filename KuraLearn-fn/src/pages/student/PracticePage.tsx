import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch } from "@/store/appStore";
import { pushToast } from "@/store/uiSlice";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentCard, PrimaryLink, SecondaryLink } from "@/components/student/StudentShared";
import { useLessonDetails } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw } from "lucide-react";

export function PracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const dispatch = useAppDispatch();
  const { data, isLoading, error, refetch } = useLessonDetails(lessonId || "");
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);

  if (isLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Practice activity" subtitle="Loading..." />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !data?.lesson) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Practice activity" subtitle="Error" />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw size={48} className="mb-4 text-red-600" />
          <h3 className="text-xl font-bold">Failed to load practice activity</h3>
          <button onClick={() => refetch()} className="mt-4 text-indigo-600 font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const lesson = data.lesson;

  // Fallback question if not provided by backend practice endpoint
  const question = lesson.practiceQuestion || {
    questionText: `What is the main concept of ${lesson.title}?`,
    options: ["Option A", "Option B", "Option C"],
    correctAnswer: "Option A",
    hint: "Think about the lesson title.",
    explanation:
      "This is a placeholder practice question. Real practice questions will be loaded from the assessment module.",
  };

  const isCorrect = selected === question.correctAnswer;

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title="Practice activity"
        subtitle={lesson.title}
        actions={<SecondaryLink to={`/lessons/${lesson.id}`}>Back to lesson</SecondaryLink>}
      />
      <StudentCard>
        <p className="text-lg font-bold text-slate-900">{question.questionText}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {question.options.map((option: string) => (
            <button
              key={option}
              onClick={() => setSelected(option)}
              className={`min-h-12 rounded-lg border px-4 text-sm font-bold transition-all ${selected === option ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => setChecked(true)}
            disabled={!selected}
            className="h-11 rounded-lg bg-emerald-700 px-5 font-bold text-white disabled:opacity-50"
          >
            Check answer
          </button>
          <button
            onClick={() => dispatch(pushToast({ tone: "info", message: `Hint: ${question.hint}` }))}
            className="h-11 rounded-lg border border-slate-200 px-5 font-bold text-slate-700"
          >
            Hint
          </button>
          <button
            onClick={() => {
              setSelected("");
              setChecked(false);
            }}
            className="h-11 rounded-lg border border-slate-200 px-5 font-bold text-slate-700"
          >
            Retry
          </button>
          <PrimaryLink to={`/ai?lessonId=${lesson.id}&mode=explain`}>AI explain</PrimaryLink>
        </div>
        {checked ? (
          <div
            className={`mt-5 rounded-lg p-4 font-bold animate-in fade-in slide-in-from-top-2 ${isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
          >
            {isCorrect ? "Correct! " : "Good try! "}
            {question.explanation}
          </div>
        ) : null}
      </StudentCard>
    </div>
  );
}
