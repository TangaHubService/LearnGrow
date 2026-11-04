import { useNavigate } from "react-router-dom";
import { BookOpen, Loader2 } from "lucide-react";
import { type CourseRecord } from "@/services/courseApi";
import { Card } from "@/components/common/Card";
import { useMyCourses } from "@/hooks/useStudentPortal";

export function StudentCoursesPage() {
  const navigate = useNavigate();

  const coursesQuery = useMyCourses();

  const courses = (coursesQuery.data?.courses ?? []) as any[];

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">My Learning</p>
        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">My Courses</h1>
        <p className="mt-1 text-sm text-slate-500">
          Continue where you left off or explore new courses.
        </p>
      </div>

      {coursesQuery.isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
          <Loader2 size={20} className="animate-spin" /> Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <Card className="py-16 text-center">
          <BookOpen size={48} className="mx-auto text-slate-500" />
          <p className="mt-3 text-lg font-bold text-slate-600">No courses yet</p>
          <p className="mt-1 text-sm text-slate-500">
            You haven't been enrolled in any courses yet. Check back soon!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((enrollment: any) => {
            const course: CourseRecord = enrollment.course ?? enrollment;
            const progress = enrollment.progressPercent ?? 0;
            const totalLessons = course._count?.lessons ?? course.lessons?.length ?? 0;

            return (
              <Card
                key={course.id}
                onClick={() => navigate(`/student/courses/${course.id}`)}
                className="group p-0 overflow-hidden"
              >
                <div className="flex h-24 items-end bg-emerald-500 p-4">
                  <BookOpen size={18} className="text-white/80" />
                  <span className="ml-2 text-xs font-bold text-white/90">
                    {course.subject?.name}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-slate-950 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {course.level?.name} · {totalLessons} lessons
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-700">{progress}% complete</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
