import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReadableDetails } from "@/components/ModernUi";
import { lmsService } from "@/services/lmsService";

export function RecordDetails({ record }: { record: any }) {
  const reference = useTeacherReferenceData();
  const enrichedRecord = useMemo(
    () => resolveReadableReferences(record, reference.data),
    [record, reference.data],
  );
  return <ReadableDetails record={enrichedRecord ?? {}} title="Basic Information" />;
}

export function useTeacherReferenceData() {
  const queryClient = useQueryClient();
  const cachedClasses = queryClient
    .getQueriesData<{ items?: any[] }>({ queryKey: ["teacher-classes"] })
    .flatMap(([, data]) => data?.items ?? []);
  const cachedStudents = queryClient
    .getQueriesData<{ items?: any[] }>({ queryKey: ["teacher-students"] })
    .flatMap(([, data]) => data?.items ?? []);
  const cachedLessons = queryClient
    .getQueriesData<{ items?: any[] }>({ queryKey: ["teacher-lessons"] })
    .flatMap(([, data]) => data?.items ?? []);
  const cachedQuizzes = queryClient
    .getQueriesData<{ items?: any[] }>({ queryKey: ["teacher-quizzes"] })
    .flatMap(([, data]) => data?.items ?? []);
  const cachedResources = queryClient
    .getQueriesData<{ items?: any[] }>({ queryKey: ["teacher-resources"] })
    .flatMap(([, data]) => data?.items ?? []);
  const query = useQuery({
    queryKey: ["teacher-reference-data"],
    queryFn: lmsService.referenceData,
    staleTime: 5 * 60 * 1000,
  });
  const reference = query.data ?? {};
  const classes = reference.classes?.length
    ? reference.classes
    : cachedClasses.map((item: any) => ({
        id: item.id,
        name: item.name,
        levelName: item.level,
        subjectName: item.subjectName,
        students: item.students,
      }));
  const students = reference.students?.length
    ? reference.students
    : cachedStudents.map((item: any) => ({
        id: item.id,
        userId: item.user?.id,
        name: item.user?.name,
        email: item.user?.email,
        classId: item.class?.id,
        className: item.class?.name,
        levelName: item.class?.level?.name,
        status: item.status,
      }));
  const subjects = reference.subjects?.length
    ? reference.subjects
    : uniqueBy(
        classes
          .filter((item: any) => item.subjectName)
          .map((item: any) => ({
            id: item.subjectName,
            name: item.subjectName,
            levelName: item.levelName,
          })),
        (item: any) => item.name,
      );
  const topics = reference.topics?.length
    ? reference.topics
    : uniqueBy(
        [...cachedLessons, ...cachedQuizzes, ...cachedResources]
          .filter((item: any) => item.topic)
          .map((item: any) => ({
            id: item.topic,
            name: item.topic,
            subjectName: item.subjectName,
            classId: item.classId,
            sourceTitle: item.title,
          })),
        (item: any) => `${item.subjectName ?? ""}:${item.name}`.toLowerCase(),
      );
  const subtopics = reference.subtopics?.length
    ? reference.subtopics
    : uniqueBy(
        cachedResources.flatMap((resource: any) =>
          (resource.tags ?? []).map((tag: string) => ({
            id: tag,
            name: tag,
            topicName: resource.topic,
            subjectName: resource.subjectName,
            sourceTitle: resource.title,
          })),
        ),
        (item: any) =>
          `${item.subjectName ?? ""}:${item.topicName ?? ""}:${item.name}`.toLowerCase(),
      );
  const recipients = [
    ...(reference.parents ?? []).map((item: any) => ({
      ...item,
      roleLabel: "Parent",
      recipientId: item.id,
    })),
    ...(reference.teachers ?? []).map((item: any) => ({
      ...item,
      roleLabel: "Teacher",
      recipientId: item.userId,
    })),
    ...students.map((item: any) => ({ ...item, roleLabel: "Student", recipientId: item.userId })),
  ].filter((item: any) => item.recipientId);
  return {
    ...query,
    data: {
      levels: reference.levels ?? [],
      classes,
      subjects,
      students,
      teachers: reference.teachers ?? [],
      parents: reference.parents ?? [],
      recipients,
      topics,
      subtopics,
      academicYears: reference.academicYears ?? [],
      terms: reference.terms ?? [],
      school: reference.school ?? null,
      assignments: reference.assignments ?? [],
    },
  };
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveReadableReferences(
  record: any,
  reference: ReturnType<typeof useTeacherReferenceData>["data"],
): any {
  if (!record || typeof record !== "object" || Array.isArray(record)) return record;
  const classRecord = record.classId
    ? reference.classes.find((item: any) => item.id === record.classId)
    : undefined;
  const studentRecord = record.studentId
    ? reference.students.find(
        (item: any) => item.id === record.studentId || item.userId === record.studentId,
      )
    : undefined;
  const teacherRecord = record.teacherId
    ? reference.teachers.find(
        (item: any) => item.id === record.teacherId || item.userId === record.teacherId,
      )
    : undefined;
  const recipientRecord = record.recipientId
    ? reference.recipients.find(
        (item: any) => item.recipientId === record.recipientId || item.id === record.recipientId,
      )
    : undefined;
  return {
    ...record,
    ...(classRecord && !record.className
      ? {
          className: `${classRecord.name}${classRecord.levelName ? ` - ${classRecord.levelName}` : ""}`,
        }
      : {}),
    ...(studentRecord && !record.studentName ? { studentName: studentRecord.name } : {}),
    ...(teacherRecord && !record.teacherName ? { teacherName: teacherRecord.name } : {}),
    ...(recipientRecord && !record.recipientName ? { recipientName: recipientRecord.name } : {}),
  };
}
