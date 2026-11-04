import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { SecondaryLink, StudentEmptyState } from "@/components/student/StudentShared";
import { CourseCard } from "@/components/student/CourseCard";
import { useSubjectCourses } from "@/hooks/useStudentPortal";
import { Skeleton } from "@/components/common/Skeleton";
import { RefreshCw } from "lucide-react";

export function CoursesPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { data, isLoading, error, refetch } = useSubjectCourses(subjectId || "");

  if (isLoading) {
    return (
      <div>
        <PageHeader brand="KuraLean Learning" title="Courses" subtitle="Loading..." />
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <StudentEmptyState
        title="Subject not found"
        message="Go back to subjects and choose another card."
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
  }

  // data is expected to be a list of courses or a subject object containing courses
  const courses = Array.isArray(data) ? data : data.courses || [];
  const subjectName = data.name || "Courses";

  return (
    <div>
      <PageHeader
        brand="KuraLean Learning"
        title={subjectName}
        subtitle={data.description || "Explore courses in this subject."}
        actions={<SecondaryLink to="/subjects">All subjects</SecondaryLink>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {courses.length > 0 ? (
          courses.map((course: any) => <CourseCard key={course.id} course={course} />)
        ) : (
          <div className="col-span-full">
            <StudentEmptyState
              title="No courses yet"
              message="There are no courses assigned to this subject yet."
            />
          </div>
        )}
      </div>
    </div>
  );
}
