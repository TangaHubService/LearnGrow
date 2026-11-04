import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, Layers } from "lucide-react";
import { lmsService } from "@/services/lmsService";
import { Button, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "./teacherShared";
import { StatusBadge } from "@/components/ModernUi";

export function TeacherQuizzesPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["course-quizzes"],
    queryFn: () => lmsService.listQuizzes(),
  });

  const quizzes = data?.quizzes ?? [];

  return (
    <div>
      <PageHeader
        title="Quiz and Assessment"
        subtitle="Manage all assessments across your courses."
        actions={
          <Button onClick={() => navigate("/teacher/courses")}>
            <Layers size={16} /> Go to Courses
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : quizzes.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {quizzes.map((quiz: any) => (
            <Card key={quiz.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{quiz.title}</h2>
                  <p className="font-bold text-slate-500">
                    {quiz.course?.subject?.name} · {quiz.course?.title}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    {quiz.questions?.length ?? 0} questions · {quiz.timeLimit ?? 0} min
                  </p>
                </div>
                <StatusBadge value="ACTIVE" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold text-slate-500">Attempts</p>
                  <p className="text-sm font-bold">{quiz._count?.attempts ?? 0}</p>
                </div>
                <div className="flex flex-wrap col-span-2 justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/teacher/courses/${quiz.courseId}`)}
                  >
                    <Eye size={15} /> View in Course
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No quizzes found"
          message="Create quizzes within your courses to see them here."
          action={<Button onClick={() => navigate("/teacher/courses")}>View Courses</Button>}
        />
      )}
    </div>
  );
}
