import {
  Activity,
  Award,
  BarChart3,
  Bell,
  BookOpen,
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
import { hasAnyRole, ROLE_GROUPS, type RoleHolder } from "@/lib/roles";

export type NavLink = {
  path: string;
  icon: any;
  label: string;
  children?: { path: string; label: string }[];
};
export type NavItem = { section: string } | NavLink;

const studentNav: NavItem[] = [
  { section: "Learning" },
  { path: "/", icon: Home, label: "Home" },
  { path: "/subjects", icon: BookOpen, label: "Subjects" },
  { path: "/student/courses", icon: Layers, label: "My Courses" },
  { path: "/student/assessments", icon: ClipboardList, label: "Assessments" },
  { path: "/student/assignments", icon: PenSquare, label: "Assignments" },
  { path: "/student/quizzes", icon: HelpCircle, label: "Quizzes" },
  { path: "/library", icon: Library, label: "Library" },
  { section: "Performance" },
  { path: "/student/marks", icon: Award, label: "My Marks" },
  { path: "/student/attendance", icon: ListChecks, label: "Attendance" },
  { path: "/student/timetable", icon: Clock, label: "Timetable" },
  { path: "/student/national-exams", icon: ScrollText, label: "National Exams" },
  { path: "/analytics", icon: BarChart3, label: "Progress" },
  { section: "Engagement" },
  { path: "/goals", icon: Flag, label: "Goals" },
  { path: "/rewards", icon: Gift, label: "Rewards" },
  { path: "/messages", icon: MessageSquare, label: "Messages" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
  { path: "/ai", icon: Bot, label: "AI Tutor" },
  { section: "Account" },
  { path: "/profile", icon: User, label: "Profile" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const parentNav = [
  { path: "/parent", icon: Home, label: "Home" },
  { path: "/parent/children", icon: Users, label: "Children" },
  { path: "/parent/reports", icon: FileSpreadsheet, label: "Reports" },
  { path: "/messages", icon: MessageSquare, label: "Messages" },
  { path: "/notifications", icon: Bell, label: "Notices" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const staffNav = [
  { path: "/teacher", icon: Home, label: "Dashboard" },
  { path: "/teacher/classes", icon: GraduationCap, label: "My Classes" },
  { path: "/teacher/lesson-plans", icon: BookOpen, label: "Lesson Plans" },
  { path: "/teacher/courses", icon: Layers, label: "Courses" },
  { path: "/teacher/assessments", icon: ClipboardCheck, label: "Assessments" },
  { path: "/teacher/attendance", icon: ListChecks, label: "Attendance" },
  { path: "/teacher/learners", icon: Users, label: "Learners" },
  {
    path: "/teacher/marks",
    icon: FileSpreadsheet,
    label: "Marks",
    children: [
      { path: "/teacher/marks", label: "Enter Marks" },
      { path: "/teacher/marks/list", label: "Marks List" },
      { path: "/teacher/marks/approval", label: "Approval" },
    ],
  },
  { path: "/teacher/ai", icon: Bot, label: "AI Assistant" },
  { path: "/teacher/messages", icon: MessageSquare, label: "Messages" },
  { path: "/teacher/resources", icon: FolderOpen, label: "Resources" },
  { path: "/teacher/timetable", icon: CalendarDays, label: "Timetable" },
  { path: "/teacher/calendar", icon: CalendarDays, label: "Calendar" },
  { path: "/teacher/reports", icon: BarChart3, label: "Reports" },
  { path: "/teacher/settings", icon: Settings, label: "Settings" },
];

const superAdminNav: NavItem[] = [
  { section: "Platform" },
  { path: "/super-admin", icon: Home, label: "Dashboard" },
  { path: "/super-admin/schools", icon: School, label: "Schools" },
  { path: "/super-admin/users", icon: Users, label: "Users" },
  { path: "/super-admin/activity", icon: Activity, label: "Activity" },
  { section: "Account" },
  { path: "/notifications", icon: Bell, label: "Notifications" },
  { path: "/super-admin/profile", icon: User, label: "Profile" },
];

const adminNav = [
  { path: "/school-admin", icon: Home, label: "Dashboard" },
  { path: "/admin/students", icon: Users, label: "Students" },
  { path: "/headteacher/staff", icon: GraduationCap, label: "Staff" },
  { path: "/headteacher/parents", icon: User, label: "Parents" },
  { path: "/school-admin#classes", icon: ClipboardCheck, label: "Classes" },
  { path: "/teacher/courses", icon: BookOpen, label: "Curriculum" },
  { path: "/teacher/timetable", icon: CalendarDays, label: "Timetable" },
  { path: "/teacher/calendar", icon: CalendarDays, label: "Calendar" },
  { path: "/school-admin#lessons", icon: CalendarDays, label: "Lesson Plans" },
  {
    path: "/teacher/marks",
    icon: FileSpreadsheet,
    label: "Marks",
    children: [
      { path: "/teacher/marks", label: "Enter Marks" },
      { path: "/teacher/marks/list", label: "Marks List" },
      { path: "/teacher/marks/approval", label: "Approval" },
    ],
  },
  { path: "/school-admin#attendance", icon: ListChecks, label: "Attendance" },
  { path: "/school-admin#ai", icon: Bot, label: "AI Insights" },
  { path: "/school-admin#library", icon: Library, label: "Resources" },
  { path: "/school-admin#communications", icon: MessageSquare, label: "Communications" },
  { path: "/school-admin#reports", icon: BarChart3, label: "Reports" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const headteacherNav = [
  { path: "/headteacher", icon: Home, label: "Dashboard" },
  { path: "/headteacher/staff", icon: Briefcase, label: "Staff" },
  { path: "/headteacher/students", icon: Users, label: "Students" },
  { path: "/headteacher/attendance", icon: ListChecks, label: "Attendance" },
  { path: "/headteacher/marks", icon: FileSpreadsheet, label: "Marks & Approval" },
  { path: "/headteacher/reports", icon: BarChart3, label: "Reports" },
  { path: "/headteacher/parents", icon: User, label: "Parents" },
  { path: "/headteacher/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/teacher/timetable", icon: CalendarDays, label: "Timetable" },
  { path: "/teacher/calendar", icon: CalendarDays, label: "Calendar" },
  { path: "/headteacher/ai", icon: Bot, label: "AI Insights" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

/** Sidebar links and styling for the signed-in user's workspace. The first matching role wins. */
export function workspaceFor(user: RoleHolder | null) {
  if (hasAnyRole(user, ROLE_GROUPS.superAdmin)) {
    return {
      items: superAdminNav,
      brandLine: "Super admin workspace",
      activeClass: "bg-purple-50 text-[#6d3eeb] font-bold",
    };
  }
  if (hasAnyRole(user, ROLE_GROUPS.headteacher)) {
    return {
      items: headteacherNav as NavItem[],
      brandLine: "Headteacher workspace",
      activeClass: "bg-indigo-50 text-indigo-700 font-bold",
    };
  }
  if (hasAnyRole(user, ROLE_GROUPS.schoolAdmin)) {
    return {
      items: adminNav as NavItem[],
      brandLine: "School admin workspace",
      activeClass: "bg-blue-50 text-blue-700 font-bold",
    };
  }
  if (hasAnyRole(user, ROLE_GROUPS.staff)) {
    return {
      items: staffNav as NavItem[],
      brandLine: "Teacher journey workspace",
      activeClass: "bg-purple-50 text-[#6d3eeb] font-bold",
    };
  }
  if (hasAnyRole(user, ROLE_GROUPS.parent)) {
    return {
      items: parentNav as NavItem[],
      brandLine: "Parent workspace",
      activeClass: "bg-cyan-50 text-cyan-700 font-bold",
    };
  }
  return {
    items: studentNav,
    brandLine: "Grow through learning",
    activeClass: "bg-emerald-50 text-emerald-700 font-bold",
  };
}
