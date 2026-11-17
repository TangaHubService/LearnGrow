import { ContentStatus } from "@prisma/client";
import { z } from "zod";
import { CROSS_CUTTING_ISSUES, GENERIC_COMPETENCES, SYLLABUS_SOURCES } from "../../config/curriculum.js";
import { RWANDA_NESA_GRADING_SCALE, RWANDA_PASS_MARK } from "../../config/grading.js";
import { AppError } from "../../http/errors.js";
import { prisma } from "../../prisma/client.js";

const competence = z.enum(GENERIC_COMPETENCES);
const crossCutting = z.enum(CROSS_CUTTING_ISSUES);

export const syllabusUnitInputSchema = z.object({
  number: z.coerce.number().int().min(1),
  title: z.string().trim().min(1).max(200),
  keyUnitCompetence: z.string().trim().min(1),
  knowledge: z.array(z.string().trim().min(1)).default([]),
  skills: z.array(z.string().trim().min(1)).default([]),
  attitudes: z.array(z.string().trim().min(1)).default([]),
  content: z.array(z.string().trim().min(1)).default([]),
  genericCompetences: z.array(competence).default([]),
  crossCuttingIssues: z.array(crossCutting).default([]),
  suggestedPeriods: z.coerce.number().int().min(1).optional().nullable(),
  term: z.coerce.number().int().min(1).max(3).optional().nullable(),
});

export const syllabusImportSchema = z.object({
  source: z.enum(SYLLABUS_SOURCES).default("REB"),
  /** Replace a subject's existing units instead of adding to / updating them. */
  replace: z.boolean().default(false),
  subjects: z
    .array(
      z.object({
        /** Either a subject id, or a level name + subject name (e.g. "P3" + "Mathematics"). */
        subjectId: z.string().uuid().optional(),
        level: z.string().trim().optional(),
        subject: z.string().trim().optional(),
        units: z.array(syllabusUnitInputSchema).min(1),
      }),
    )
    .min(1),
});

export function getCurriculumReference() {
  return {
    genericCompetences: GENERIC_COMPETENCES,
    crossCuttingIssues: CROSS_CUTTING_ISSUES,
    gradingScale: RWANDA_NESA_GRADING_SCALE,
    passMark: RWANDA_PASS_MARK,
  };
}

export async function listSyllabusUnits(subjectId: string) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true, name: true, level: { select: { name: true } } },
  });
  if (!subject) throw new AppError(404, "Subject not found", "SUBJECT_NOT_FOUND");
  const units = await prisma.syllabusUnit.findMany({ where: { subjectId }, orderBy: { number: "asc" } });
  return { subject: { id: subject.id, name: subject.name, levelName: subject.level.name }, units };
}

/**
 * How much of a subject's syllabus a school has planned, taught and assessed.
 * A unit counts as covered once it has at least one lesson plan that is not archived.
 */
export async function getSyllabusCoverage(schoolId: string, subjectId: string, classId?: string) {
  const { subject, units } = await listSyllabusUnits(subjectId);
  const unitIds = units.map((u) => u.id);
  const classFilter = classId ? { classId } : {};

  const [plans, lessons, assessments] = await Promise.all([
    prisma.lessonPlan.groupBy({
      by: ["syllabusUnitId"],
      where: {
        syllabusUnitId: { in: unitIds },
        status: { not: ContentStatus.ARCHIVED },
        class: { schoolId },
        ...classFilter,
      },
      _count: { _all: true },
    }),
    prisma.lesson.groupBy({
      by: ["syllabusUnitId"],
      where: { syllabusUnitId: { in: unitIds }, schoolId, status: ContentStatus.PUBLISHED, ...classFilter },
      _count: { _all: true },
    }),
    prisma.assessment.groupBy({
      by: ["syllabusUnitId"],
      where: { syllabusUnitId: { in: unitIds }, schoolId, ...classFilter },
      _count: { _all: true },
    }),
  ]);

  const count = (rows: Array<{ syllabusUnitId: string | null; _count: { _all: number } }>, id: string) =>
    rows.find((row) => row.syllabusUnitId === id)?._count._all ?? 0;

  const items = units.map((unit) => {
    const lessonPlanCount = count(plans, unit.id);
    return {
      ...unit,
      lessonPlanCount,
      publishedLessonCount: count(lessons, unit.id),
      assessmentCount: count(assessments, unit.id),
      covered: lessonPlanCount > 0,
    };
  });
  const coveredUnits = items.filter((u) => u.covered).length;

  return {
    subject,
    units: items,
    summary: {
      totalUnits: items.length,
      coveredUnits,
      coveragePercent: items.length ? Math.round((coveredUnits / items.length) * 100) : 0,
      isSample: units.some((u) => u.source === "SAMPLE"),
    },
  };
}

async function resolveSubjectId(entry: { subjectId?: string; level?: string; subject?: string }) {
  if (entry.subjectId) {
    const found = await prisma.subject.findUnique({ where: { id: entry.subjectId }, select: { id: true } });
    if (found) return found.id;
    throw new AppError(404, `Subject ${entry.subjectId} not found`, "SUBJECT_NOT_FOUND");
  }
  if (!entry.level || !entry.subject) {
    throw new AppError(400, "Each subject needs a subjectId, or a level and subject name", "SUBJECT_REQUIRED");
  }
  const found = await prisma.subject.findFirst({
    where: {
      name: { equals: entry.subject, mode: "insensitive" },
      level: { name: { equals: entry.level, mode: "insensitive" } },
    },
    select: { id: true },
  });
  if (!found) throw new AppError(404, `No ${entry.subject} subject found for ${entry.level}`, "SUBJECT_NOT_FOUND");
  return found.id;
}

/** Load or update national syllabus units. Units are matched by subject and unit number. */
export async function importSyllabus(input: z.infer<typeof syllabusImportSchema>) {
  const resolved = await Promise.all(
    input.subjects.map(async (entry) => ({ subjectId: await resolveSubjectId(entry), units: entry.units })),
  );

  let created = 0;
  let updated = 0;
  await prisma.$transaction(async (tx) => {
    for (const { subjectId, units } of resolved) {
      if (input.replace) {
        await tx.syllabusUnit.deleteMany({ where: { subjectId, number: { notIn: units.map((u) => u.number) } } });
      }
      for (const unit of units) {
        const data = { ...unit, source: input.source };
        const existing = await tx.syllabusUnit.findUnique({
          where: { subjectId_number: { subjectId, number: unit.number } },
          select: { id: true },
        });
        if (existing) {
          await tx.syllabusUnit.update({ where: { id: existing.id }, data });
          updated += 1;
        } else {
          await tx.syllabusUnit.create({ data: { ...data, subjectId } });
          created += 1;
        }
      }
    }
  });

  return { subjects: resolved.length, created, updated };
}
