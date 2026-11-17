import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export type SyllabusUnit = {
  id: string;
  subjectId: string;
  number: number;
  title: string;
  keyUnitCompetence: string;
  knowledge: string[];
  skills: string[];
  attitudes: string[];
  content: string[];
  genericCompetences: string[];
  crossCuttingIssues: string[];
  suggestedPeriods?: number | null;
  term?: number | null;
  source: "SAMPLE" | "REB" | "SCHOOL";
};

export type CoverageUnit = SyllabusUnit & {
  lessonPlanCount: number;
  publishedLessonCount: number;
  assessmentCount: number;
  covered: boolean;
};

export type CurriculumReference = {
  genericCompetences: string[];
  crossCuttingIssues: string[];
  passMark: number;
};

export const syllabusApi = {
  reference: () => apiRequest<CurriculumReference>("/syllabus/reference"),
  units: (subjectId: string) =>
    apiRequest<{ subject: { id: string; name: string; levelName: string }; units: SyllabusUnit[] }>(
      `/syllabus/units?subjectId=${encodeURIComponent(subjectId)}`,
    ),
  coverage: (subjectId: string, classId?: string) =>
    apiRequest<{
      subject: { id: string; name: string; levelName: string };
      units: CoverageUnit[];
      summary: {
        totalUnits: number;
        coveredUnits: number;
        coveragePercent: number;
        isSample: boolean;
      };
    }>(
      `/syllabus/coverage?subjectId=${encodeURIComponent(subjectId)}${
        classId ? `&classId=${encodeURIComponent(classId)}` : ""
      }`,
    ),
};

/** Reference lists rarely change, so cache them for the session. */
export function useCurriculumReference() {
  return useQuery({
    queryKey: ["curriculum-reference"],
    queryFn: syllabusApi.reference,
    staleTime: Infinity,
  });
}

const UUID = /^[0-9a-f-]{36}$/i;

export function useSyllabusUnits(subjectId?: string) {
  return useQuery({
    queryKey: ["syllabus-units", subjectId],
    queryFn: () => syllabusApi.units(subjectId as string),
    enabled: Boolean(subjectId && UUID.test(subjectId)),
    staleTime: 5 * 60 * 1000,
  });
}
