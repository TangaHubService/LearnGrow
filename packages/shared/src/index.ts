export type UserRole =
  | "STUDENT" | "PARENT" | "TEACHER"
  | "HEAD_TEACHER" | "DIRECTOR_OF_STUDIES"
  | "ADMIN" | "SUPER_ADMIN";

export type StaffRole =
  | "HEADTEACHER" | "SCHOOL_ADMIN" | "DIRECTOR_OF_STUDIES"
  | "TEACHER" | "ACCOUNTANT" | "DISCIPLINE_OFFICER"
  | "LIBRARIAN" | "ICT_OFFICER" | "RECEPTIONIST" | "SUPPORT_STAFF";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "PDF" | "MIXED";

export type AssessmentType =
  | "ASSIGNMENT" | "QUIZ" | "TEST" | "CAT" | "EXAM"
  | "PRACTICE_ASSESSMENT" | "PROJECT" | "PRACTICAL" | "ORAL" | "HOMEWORK";

export type LevelCategory =
  | "NURSERY" | "LOWER_PRIMARY" | "UPPER_PRIMARY"
  | "LOWER_SECONDARY" | "UPPER_SECONDARY" | "TVET" | "TTC";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  schoolId?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

export interface Student {
  id: string;
  userId: string;
  schoolId?: string;
  levelId: string;
  classId?: string;
  status: string;
  studentCode?: string;
  user: { name: string; email: string };
  level?: { name: string; category: string };
  class?: { name: string };
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  lessonId?: string;
  student?: { user: { name: string } };
}

export interface Mark {
  id: string;
  studentId: string;
  subjectId: string;
  score?: number;
  maxScore: number;
  percentage?: number;
  grade?: string;
  assessmentType: string;
  assessmentKey: string;
  status: string;
  isLocked: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  body: string;
  contentType: ContentType;
  order: number;
  estimatedMinutes: number;
  status: string;
}

export interface Course {
  id: string;
  subjectId: string;
  title: string;
  description?: string;
  levelId: string;
  order: number;
  status: string;
  subject?: { name: string };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  readAt?: string;
  createdAt: string;
}
