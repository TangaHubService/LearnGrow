-- Clean up duplicate teacher entries first
DELETE FROM "TimetablePeriod" tp1 USING (
  SELECT MIN(id) as id, "teacherId", "dayOfWeek", "startTime", "termId"
  FROM "TimetablePeriod"
  WHERE "teacherId" IS NOT NULL
  GROUP BY "teacherId", "dayOfWeek", "startTime", "termId"
  HAVING COUNT(*) > 1
) tp2
WHERE tp1."teacherId" = tp2."teacherId"
  AND tp1."dayOfWeek" = tp2."dayOfWeek"
  AND tp1."startTime" = tp2."startTime"
  AND tp1."termId" IS NOT DISTINCT FROM tp2."termId"
  AND tp1.id != tp2.id;

-- Create unique index for teacher conflict prevention
CREATE UNIQUE INDEX "TimetablePeriod_teacherId_dayOfWeek_startTime_termId_key"
  ON "TimetablePeriod"("teacherId", "dayOfWeek", "startTime", "termId");
