import { CourseRecord } from "@/services/lmsService";
import { DetailSection, InfoGrid, DetailRow } from "@/components/ModernUi";

export function CourseDetails({ course }: { course: CourseRecord }) {
  return (
    <div className="space-y-4">
      <DetailSection title="Course Information">
        <InfoGrid>
          <DetailRow label="Title" value={course.title} />
          <DetailRow label="Subject" value={course.subject?.name} />
          <DetailRow label="Level" value={course.level?.name} />
          <DetailRow label="Status" value={course.status} type="status" />
          <DetailRow label="Language" value={course.language} />
          <DetailRow label="Academic Year" value={course.academicYear} />
          <DetailRow label="Term" value={course.term} />
          <DetailRow label="Created" value={course.createdAt} type="date" />
          <DetailRow label="Updated" value={course.updatedAt} type="date" />
        </InfoGrid>
      </DetailSection>
      {course.description && (
        <DetailSection title="Description">
          <p className="text-sm text-slate-700 leading-6">{course.description}</p>
        </DetailSection>
      )}
      {course.learningObjectives && (
        <DetailSection title="Learning Objectives">
          <p className="text-sm text-slate-700 leading-6 whitespace-pre-line">
            {course.learningObjectives}
          </p>
        </DetailSection>
      )}
      {course.teacher && (
        <DetailSection title="Teacher">
          <InfoGrid>
            <DetailRow label="Name" value={course.teacher.user.name} />
            <DetailRow label="Email" value={course.teacher.user.email} type="email" />
          </InfoGrid>
        </DetailSection>
      )}
    </div>
  );
}
