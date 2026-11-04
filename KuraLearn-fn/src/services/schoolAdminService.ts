import { apiRequest } from "@/lib/api";

export type TrendDirection = "up" | "down" | "flat";
export type Tone =
  | "blue"
  | "orange"
  | "indigo"
  | "rose"
  | "green"
  | "red"
  | "purple"
  | "violet"
  | "sky"
  | "amber";

export type AdminMetric = {
  id: string;
  label: string;
  value: string;
  icon: string;
  tone: Tone;
  trend: {
    direction: TrendDirection;
    label: string;
    tone: "good" | "bad" | "neutral";
  };
};

export type EnrollmentPoint = {
  month: string;
  students: number;
};

export type AttendanceSegment = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

export type TopClass = {
  rank: number;
  name: string;
  average: number;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: Tone;
};

export type AssessmentMetric = {
  label: string;
  value: string;
  suffix: string;
  tone: Tone;
};

export type QuickAction = {
  id: string;
  label: string;
  icon: string;
  tone: Tone;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  date: string;
  tone: Tone;
};

export type CalendarItem = {
  id: string;
  day: string;
  month: string;
  title: string;
  detail: string;
  tone: Tone;
};

export type TaskItem = {
  id: string;
  title: string;
  badge: string;
  tone: Tone;
};

export type SchoolAdminDashboardData = {
  source: "api";
  school: {
    id: string;
    name: string;
    division: string;
    academicYear: string;
    currentTerm: string;
    todayLabel: string;
    dateLabel: string;
  };
  metrics: AdminMetric[];
  enrollmentTrend: EnrollmentPoint[];
  attendance: {
    rate: number;
    segments: AttendanceSegment[];
  };
  curriculum: {
    completionPercent: number;
    subjects: number;
    courses: number;
    lessons: number;
    completedLessons: number;
    teacherResources: number;
    libraryResources: number;
  };
  topClasses: TopClass[];
  activities: ActivityItem[];
  assessments: AssessmentMetric[];
  quickActions: QuickAction[];
  announcements: AnnouncementItem[];
  calendar: CalendarItem[];
  tasks: TaskItem[];
};

export const schoolAdminApi = {
  dashboard: () => apiRequest<SchoolAdminDashboardData>("/admin/dashboard"),
};
