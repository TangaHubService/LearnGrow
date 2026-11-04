import type { ListParams } from "@/services/lmsService";

export type UserRole =
  | "STUDENT"
  | "TEACHER"
  | "PARENT"
  | "SCHOOL_ADMIN"
  | "SUPER_ADMIN"
  | "AUDITOR";

export interface User {
  id: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  avatar?: string;
  profileImageUrl?: string;
  phone?: string;
  schoolId?: string;
  classId?: string;
  parentId?: string;
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  levelName?: string;
  subjectName: string;
  students: number;
  performance: number;
  status: string;
}

export interface Lesson {
  id: string;
  title: string;
  subjectName: string;
  topic: string;
  status: string;
  durationMinutes: number;
  objective?: string;
  resourcesLinked?: { name: string; url: string }[];
}

export interface Quiz {
  id: string;
  title: string;
  subjectName: string;
  topic: string;
  status: string;
  questions?: { length: number }[];
  durationMinutes: number;
  completionRate: number;
  averageScore: number;
}

export interface Student {
  id: string;
  userId?: string;
  user?: { id: string; name: string; email: string };
  name?: string;
  class?: { id: string; name: string; level?: { name: string } };
  status?: string;
  email?: string;
  classId?: string;
}

export interface TeacherStats {
  todaysLessons: number;
  completedLessons: number;
  myClasses: number;
  mySubjects: number;
  pendingLessonPlans: number;
  pendingAssessments: number;
}

export interface ScheduleItem {
  id: string;
  className: string;
  subjectName: string;
  topic: string;
  startTime: string;
  endTime: string;
  status: string;
  action: string;
  lessonPlanId?: string;
}

export interface Notification {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  readAt?: string;
}

export interface ClassOverview {
  id: string;
  className: string;
  subjectName: string;
  learnerCount: number;
  nextLesson?: { topic?: string; scheduledAt?: string };
  attendance?: { present: number; total: number };
}

export interface LearnerSupport {
  id: string;
  learnerName: string;
  className: string;
  issue: string;
  action: string;
}

export interface AssessmentSummary {
  averageScore: number;
  attendanceRate: number;
  atRiskStudents: number;
  quizAverage: number;
}

export interface ReportData {
  summary: AssessmentSummary;
  accessibleSummary: string;
  interventions: { id: string; title: string; recommendation: string }[];
  quizzes: { id: string; title: string; averageScore: number }[];
}

export interface Message {
  id: string;
  sender: { name: string };
  recipient: { name: string };
  body: string;
}

export interface Resource {
  id: string;
  title: string;
  type: string;
  subjectName?: string;
  topic?: string;
  tags?: string[];
}

export interface AiOutput {
  id: string;
  title: string;
  className?: string;
  subjectName?: string;
  type: string;
  date: string;
  teacherRequest?: string;
  output: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  role: string;
  createdAt: string;
}

export interface ReferenceData {
  levels: { id: string; name: string; category: string }[];
  classes: Class[];
  subjects: { id: string; name: string; levelName?: string; category?: string }[];
  students: Student[];
  teachers: User[];
  parents: { id: string; name: string; email: string }[];
  recipients: {
    id: string;
    name: string;
    email?: string;
    roleLabel: string;
    recipientId: string;
    className?: string;
    status?: string;
  }[];
  topics: {
    id: string;
    name: string;
    subjectName?: string;
    classId?: string;
    sourceTitle?: string;
  }[];
  subtopics: {
    id: string;
    name: string;
    topicName?: string;
    subjectName?: string;
    sourceTitle?: string;
  }[];
  academicYears: string[];
  terms: string[];
  school: unknown;
}

export interface TeacherDrawerState {
  kind?: string;
  title?: string;
  mode?: string;
  record?: unknown;
}

export interface TeacherModalState {
  kind?: string;
  title?: string;
  description?: string;
  danger?: boolean;
  confirmLabel?: string;
  record?: unknown;
}

export { ListParams };
