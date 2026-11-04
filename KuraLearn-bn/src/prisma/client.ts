import { PrismaClient } from "@prisma/client";

const TENANT_MODELS = [
  "Class", "Student", "Teacher", "Staff", "Course", "Lesson", "Quiz",
  "Assessment", "AttendanceRecord", "AttendanceAnalytics", "AttendanceAlert",
  "Mark", "MarkSubmission", "ReportCard", "ReportGenerationLog",
  "AcademicYear", "Term", "TimetablePeriod", "Room", "Period",
  "TeacherResource", "TeacherAiOutput", "TeacherWorkload",
  "SecondaryCombination", "StudentAcademicPathway", "LearnerSupportPlan",
  "NationalExamRegistration", "GradingScale", "Intervention",
  "PerformanceRecord", "StudentRiskScore", "TeacherLessonResource",
  "TeacherLessonDeliverySession", "TeacherClassAssignment",
  "SystemSetting",
] as const;

type TenantModel = (typeof TENANT_MODELS)[number];

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
});

export { TENANT_MODELS };
export type { TenantModel };
