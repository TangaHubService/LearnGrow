-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "syllabusUnitId" TEXT;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "syllabusUnitId" TEXT;

-- AlterTable
ALTER TABLE "LessonPlan" ADD COLUMN     "content" TEXT,
ADD COLUMN     "syllabusUnitId" TEXT,
ADD COLUMN     "topic" TEXT;

-- CreateTable
CREATE TABLE "SyllabusUnit" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "keyUnitCompetence" TEXT NOT NULL,
    "knowledge" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attitudes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "content" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "genericCompetences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "crossCuttingIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggestedPeriods" INTEGER,
    "term" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'SAMPLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyllabusUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyllabusUnit_subjectId_number_key" ON "SyllabusUnit"("subjectId", "number");

-- CreateIndex
CREATE INDEX "LessonPlan_syllabusUnitId_idx" ON "LessonPlan"("syllabusUnitId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_syllabusUnitId_fkey" FOREIGN KEY ("syllabusUnitId") REFERENCES "SyllabusUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_syllabusUnitId_fkey" FOREIGN KEY ("syllabusUnitId") REFERENCES "SyllabusUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyllabusUnit" ADD CONSTRAINT "SyllabusUnit_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_syllabusUnitId_fkey" FOREIGN KEY ("syllabusUnitId") REFERENCES "SyllabusUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
