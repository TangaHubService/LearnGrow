import {
  StudentCard,
  StudentIcon,
  StudentProgressBar,
  PrimaryLink,
  SecondaryLink,
} from "./StudentShared";

export function SubjectCard({ subject }: { subject: any }) {
  if (!subject) return null;
  const courseCount = subject.courses?.length || subject.courseCount || 0;
  const firstCourseId = subject.courses?.[0]?.id;

  return (
    <StudentCard>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700">
          <StudentIcon name={subject.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-slate-900">{subject.name}</h2>
          <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-500">
            {subject.description}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{courseCount} courses</span>
          <span>{subject.progress}%</span>
        </div>
        <StudentProgressBar
          value={subject.progress}
          color={subject.progress > 50 ? "#059669" : "#2563eb"}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <PrimaryLink to={`/subjects/${subject.id}`}>Continue</PrimaryLink>
        {firstCourseId && <SecondaryLink to={`/courses/${firstCourseId}/path`}>Path</SecondaryLink>}
      </div>
    </StudentCard>
  );
}
