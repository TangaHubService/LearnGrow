import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, CheckCircle2, Circle, Plus } from "lucide-react";
import { CustomDropdown } from "@/components/ModernUi";
import { syllabusApi } from "@/services/syllabusApi";
import { PageHeader, ProgressBar, Skeleton } from "./teacherShared";
import { useTeacherReferenceData } from "./teacherReference";
import { useT } from "@/i18n/I18nContext";

/** Shows each national syllabus unit for a class and subject, and whether it has been planned, taught and assessed. */
export function TeacherSyllabusPage() {
  const t = useT();
  const reference = useTeacherReferenceData();
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const classOptions = useMemo(() => {
    const assigned = new Set((reference.data.assignments || []).map((a: any) => a.classId));
    return reference.data.classes
      .filter((cls: any) => assigned.size === 0 || assigned.has(cls.id))
      .map((cls: any) => ({ value: cls.id, label: cls.name, description: cls.levelName }));
  }, [reference.data.classes, reference.data.assignments]);

  const subjectOptions = useMemo(() => {
    if (!classId) return [];
    const cls = reference.data.classes.find((c: any) => c.id === classId);
    const assignedNames = new Set(
      (reference.data.assignments || [])
        .filter((a: any) => a.classId === classId)
        .map((a: any) => (a.subjectName || "").toLowerCase()),
    );
    return reference.data.subjects
      .filter((s: any) => !cls?.levelName || !s.levelName || s.levelName === cls.levelName)
      .filter(
        (s: any) => assignedNames.size === 0 || assignedNames.has((s.name || "").toLowerCase()),
      )
      .map((s: any) => ({ value: s.id, label: s.name }));
  }, [classId, reference.data.classes, reference.data.subjects, reference.data.assignments]);

  useEffect(() => {
    if (!classId && classOptions.length) setClassId(classOptions[0].value);
  }, [classId, classOptions]);

  useEffect(() => {
    if (classId && !subjectOptions.some((option: any) => option.value === subjectId)) {
      setSubjectId(subjectOptions[0]?.value ?? "");
    }
  }, [classId, subjectId, subjectOptions]);

  const coverage = useQuery({
    queryKey: ["syllabus-coverage", subjectId, classId],
    queryFn: () => syllabusApi.coverage(subjectId, classId),
    enabled: Boolean(subjectId),
  });

  const data = coverage.data;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t("Syllabus coverage")}
        subtitle={t(
          "Track each unit of the national competence-based syllabus: planned, taught and assessed.",
        )}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <CustomDropdown
          label={t("Class")}
          value={classId}
          options={classOptions}
          loading={reference.isLoading}
          placeholder={t("Select a class")}
          onChange={(value) => setClassId(value || "")}
        />
        <CustomDropdown
          label={t("Subject")}
          value={subjectId}
          options={subjectOptions}
          disabled={!classId}
          placeholder={classId ? t("Select a subject") : t("Select a class first")}
          onChange={(value) => setSubjectId(value || "")}
        />
      </div>

      {coverage.isLoading ? (
        <Skeleton />
      ) : coverage.isError ? (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
          {t("Could not load the syllabus. Try again in a moment.")}
        </p>
      ) : !data ? null : data.units.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <BookOpenCheck className="mx-auto mb-3 text-slate-400" aria-hidden />
          <p className="font-bold text-slate-800">
            {t("No syllabus loaded for {subject} yet", { subject: data.subject.name })}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t("A platform admin can load the official REB units for this subject.")}
          </p>
        </div>
      ) : (
        <>
          <section
            aria-label={t("Coverage summary")}
            className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {data.subject.levelName} {data.subject.name}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-slate-900">
                  {data.summary.coveragePercent}%
                  <span className="ml-2 text-sm font-semibold text-slate-500">
                    {t("{covered} of {total} units planned", {
                      covered: data.summary.coveredUnits,
                      total: data.summary.totalUnits,
                    })}
                  </span>
                </p>
              </div>
              {data.summary.isSample && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                  {t("Sample syllabus")}
                </span>
              )}
            </div>
            <div className="mt-4">
              <ProgressBar value={data.summary.coveragePercent} color="#059669" />
            </div>
          </section>

          <ol className="space-y-3">
            {data.units.map((unit) => (
              <li
                key={unit.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    {unit.covered ? (
                      <CheckCircle2
                        className="mt-0.5 shrink-0 text-emerald-600"
                        aria-label={t("Planned")}
                      />
                    ) : (
                      <Circle
                        className="mt-0.5 shrink-0 text-slate-300"
                        aria-label={t("Not planned yet")}
                      />
                    )}
                    <div>
                      <h2 className="font-bold text-slate-900">
                        {t("Unit")} {unit.number}: {unit.title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {unit.keyUnitCompetence}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {unit.term && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            {t("Term")} {unit.term}
                          </span>
                        )}
                        {unit.genericCompetences.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700"
                          >
                            {item}
                          </span>
                        ))}
                        {unit.crossCuttingIssues.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <dl className="grid shrink-0 grid-cols-3 gap-2 text-center sm:w-64">
                    {[
                      ["Plans", unit.lessonPlanCount],
                      ["Lessons", unit.publishedLessonCount],
                      ["Tests", unit.assessmentCount],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-slate-50 px-2 py-2">
                        <dt className="text-[10px] font-bold uppercase text-slate-500">{label}</dt>
                        <dd className="text-lg font-extrabold text-slate-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {!unit.covered && (
                  <Link
                    to="/teacher/lessons/new"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#6d3eeb] hover:underline"
                  >
                    <Plus size={14} aria-hidden /> {t("Plan a lesson for this unit")}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
