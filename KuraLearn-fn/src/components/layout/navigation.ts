import {
  Activity,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  BookOpenCheck,
  Bot,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileSpreadsheet,
  Flag,
  FolderOpen,
  Gift,
  GraduationCap,
  HelpCircle,
  Home,
  Layers,
  Library,
  ListChecks,
  MessageSquare,
  PenSquare,
  School,
  ScrollText,
  Settings,
  User,
  Users,
} from "lucide-react";
import { msg } from "@/i18n";
import { hasAnyRole, ROLE_GROUPS, type RoleHolder } from "@/lib/roles";

export type NavLink = {
  path: string;
  icon: any;
  label: string;
  children?: { path: string; label: string }[];
};
export type NavItem = { section: string } | NavLink;

const studentNav: NavItem[] = [
  { section: msg("Learning") },
  { path: "/", icon: Home, label: msg("Home") },
  { path: "/subjects", icon: BookOpen, label: msg("Subjects") },
  { path: "/student/courses", icon: Layers, label: msg("My Courses") },
  { path: "/student/assessments", icon: ClipboardList, label: msg("Assessments") },
  { path: "/student/assignments", icon: PenSquare, label: msg("Assignments") },
  { path: "/student/quizzes", icon: HelpCircle, label: msg("Quizzes") },
  { path: "/library", icon: Library, label: msg("Library") },
  { section: msg("Performance") },
  { path: "/student/marks", icon: Award, label: msg("My Marks") },
  { path: "/student/attendance", icon: ListChecks, label: msg("Attendance") },
  { path: "/student/timetable", icon: Clock, label: msg("Timetable") },
  { path: "/student/national-exams", icon: ScrollText, label: msg("National Exams") },
  { path: "/analytics", icon: BarChart3, label: msg("Progress") },
  { section: msg("Engagement") },
  { path: "/goals", icon: Flag, label: msg("Goals") },
  { path: "/rewards", icon: Gift, label: msg("Rewards") },
  { path: "/messages", icon: MessageSquare, label: msg("Messages") },
  { path: "/notifications", icon: Bell, label: msg("Notifications") },
  { path: "/ai", icon: Bot, label: msg("AI Tutor") },
  { section: msg("Account") },
  { path: "/profile", icon: User, label: msg("Profile") },
  { path: "/settings", icon: Settings, label: msg("Settings") },
];

const parentNav = [
  { path: "/parent", icon: Home, label: msg("Home") },
  { path: "/parent/children", icon: Users, label: msg("Children") },
  { path: "/parent/reports", icon: FileSpreadsheet, label: msg("Reports") },
  { path: "/messages", icon: MessageSquare, label: msg("Messages") },
  { path: "/notifications", icon: Bell, label: msg("Notices") },
  { path: "/settings", icon: Settings, label: msg("Settings") },
];

const staffNav = [
  { path: "/teacher", icon: Home, label: msg("Dashboard") },
  { path: "/teacher/classes", icon: GraduationCap, label: msg("My Classes") },
  { path: "/teacher/lesson-plans", icon: BookOpen, label: msg("Lesson Plans") },
  { path: "/teacher/syllabus", icon: BookOpenCheck, label: msg("Syllabus") },
  { path: "/teacher/courses", icon: Layers, label: msg("Courses") },
  { path: "/teacher/assessments", icon: ClipboardCheck, label: msg("Assessments") },
  { path: "/teacher/attendance", icon: ListChecks, label: msg("Attendance") },
  { path: "/teacher/learners", icon: Users, label: msg("Learners") },
  {
    path: "/teacher/marks",
    icon: FileSpreadsheet,
    label: msg("Marks"),
    children: [
      { path: "/teacher/marks", label: msg("Enter Marks") },
      { path: "/teacher/marks/list", label: msg("Marks List") },
      { path: "/teacher/marks/approval", label: msg("Approval") },
    ],
  },
  { path: "/teacher/ai", icon: Bot, label: msg("AI Assistant") },
  { path: "/teacher/messages", icon: MessageSquare, label: msg("Messages") },
  { path: "/teacher/resources", icon: FolderOpen, label: msg("Resources") },
  { path: "/teacher/timetable", icon: CalendarDays, label: msg("Timetable") },
  { path: "/teacher/calendar", icon: CalendarDays, label: msg("Calendar") },
  { path: "/teacher/reports", icon: BarChart3, label: msg("Reports") },
  { path: "/teacher/settings", icon: Settings, label: msg("Settings") },
];

const superAdminNav: NavItem[] = [
  { section: msg("Platform") },
  { path: "/super-admin", icon: Home, label: msg("Dashboard") },
  { path: "/super-admin/schools", icon: School, label: msg("Schools") },
  { path: "/super-admin/users", icon: Users, label: msg("Users") },
  { path: "/super-admin/activity", icon: Activity, label: msg("Activity") },
  { section: msg("Account") },
  { path: "/notifications", icon: Bell, label: msg("Notifications") },
  { path: "/super-admin/profile", icon: User, label: msg("Profile") },
];

const adminNav = [
  { path: "/school-admin", icon: Home, label: msg("Dashboard") },
  { path: "/admin/students", icon: Users, label: msg("Students") },
  { path: "/headteacher/staff", icon: GraduationCap, label: msg("Staff") },
  { path: "/headteacher/parents", icon: User, label: msg("Parents") },
  { path: "/school-admin#classes", icon: ClipboardCheck, label: msg("Classes") },
  { path: "/teacher/courses", icon: BookOpen, label: msg("Curriculum") },
  { path: "/teacher/timetable", icon: CalendarDays, label: msg("Timetable") },
  { path: "/teacher/calendar", icon: CalendarDays, label: msg("Calendar") },
  { path: "/school-admin#lessons", icon: CalendarDays, label: msg("Lesson Plans") },
  {
    path: "/teacher/marks",
    icon: FileSpreadsheet,
    label: msg("Marks"),
    children: [
      { path: "/teacher/marks", label: msg("Enter Marks") },
      { path: "/teacher/marks/list", label: msg("Marks List") },
      { path: "/teacher/marks/approval", label: msg("Approval") },
    ],
  },
  { path: "/school-admin#attendance", icon: ListChecks, label: msg("Attendance") },
  { path: "/school-admin#ai", icon: Bot, label: msg("AI Insights") },
  { path: "/school-admin#library", icon: Library, label: msg("Resources") },
  { path: "/school-admin#communications", icon: MessageSquare, label: msg("Communications") },
  { path: "/school-admin#reports", icon: BarChart3, label: msg("Reports") },
  { path: "/settings", icon: Settings, label: msg("Settings") },
];

const headteacherNav = [
  { path: "/headteacher", icon: Home, label: msg("Dashboard") },
  { path: "/headteacher/staff", icon: Briefcase, label: msg("Staff") },
  { path: "/headteacher/students", icon: Users, label: msg("Students") },
  { path: "/headteacher/attendance", icon: ListChecks, label: msg("Attendance") },
  { path: "/headteacher/marks", icon: FileSpreadsheet, label: msg("Marks & Approval") },
  { path: "/headteacher/reports", icon: BarChart3, label: msg("Reports") },
  { path: "/headteacher/parents", icon: User, label: msg("Parents") },
  { path: "/headteacher/analytics", icon: BarChart3, label: msg("Analytics") },
  { path: "/teacher/timetable", icon: CalendarDays, label: msg("Timetable") },
  { path: "/teacher/calendar", icon: CalendarDays, label: msg("Calendar") },
  { path: "/headteacher/ai", icon: Bot, label: msg("AI Insights") },
  { path: "/settings", icon: Settings, label: msg("Settings") },
];

/** Sidebar links and styling for the signed-in user's workspace. The first matching role wins. */
export function workspaceFor(user: RoleHolder | null) {
  if (hasAnyRole(user, ROLE_GROUPS.superAdmin)) {
    return {
      items: superAdminNav,
      brandLine: msg("Super admin workspace"),
      activeClass: "bg-purple-50 text-[#6d3eeb] font-bold",
    };
  }
  if (hasAnyRole(user, ROLE_GROUPS.headteacher)) {
    return {
      items: headteacherNav as NavItem[],
      brandLine: msg("Headteacher workspace"),
      activeClass: "bg-indigo-50 text-indigo-700 font-bold",
    };
  }
  if (hasAnyRole(user, ROLE_GROUPS.schoolAdmin)) {
    return {
      items: adminNav as NavItem[],
      brandLine: msg("School admin workspace"),
      activeClass: "bg-blue-50 text-blue-700 font-bold",
    };
  }
  if (hasAnyRole(user, ROLE_GROUPS.staff)) {
    return {
      items: staffNav as NavItem[],
      brandLine: msg("Teacher journey workspace"),
      activeClass: "bg-purple-50 text-[#6d3eeb] font-bold",
    };
  }
  if (hasAnyRole(user, ROLE_GROUPS.parent)) {
    return {
      items: parentNav as NavItem[],
      brandLine: msg("Parent workspace"),
      activeClass: "bg-cyan-50 text-cyan-700 font-bold",
    };
  }
  return {
    items: studentNav,
    brandLine: msg("Grow through learning"),
    activeClass: "bg-emerald-50 text-emerald-700 font-bold",
  };
}

/** Readable role names, translated where they are shown. */
export const ROLE_LABELS: Record<string, string> = {
  STUDENT: msg("Student"),
  PARENT: msg("Parent"),
  TEACHER: msg("Teacher"),
  HEAD_TEACHER: msg("Head teacher"),
  DIRECTOR_OF_STUDIES: msg("Director of studies"),
  ADMIN: msg("School admin"),
  SUPER_ADMIN: msg("Super admin"),
};
