import {
  Bell,
  BookOpen,
  Calendar,
  Calculator,
  ChartNoAxesColumnIncreasing,
  Gamepad2,
  Gift,
  Home,
  Library,
  LucideIcon,
  Medal,
  MessageCircle,
  Palette,
  Settings,
  Shapes,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const learnerProfile = {
  id: "student_demo_001",
  name: "Iradukunda",
  fullName: "Muhire Iradukunda",
  grade: "Primary 2",
  level: 8,
  badgeLabel: "Young Learner",
  stars: 2450,
  streakDays: 7,
  notifications: 3,
  xp: {
    current: 350,
    target: 500,
  },
};

export const studentNavigation: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "lessons", label: "My Lessons", icon: BookOpen },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "progress", label: "Progress", icon: ChartNoAxesColumnIncreasing },
  { id: "rewards", label: "Rewards", icon: Gift },
  { id: "library", label: "Library", icon: Library },
  { id: "parents", label: "Parents", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export const learningPath = {
  id: "path_lower_primary_foundations",
  title: "Your Learning Path",
  subtitle: "Complete activities, earn stars and unlock new levels.",
  currentStep: 4,
  milestone: "Complete 2 Math quests",
  progress: 0.66,
  steps: [
    { id: "letters", label: "Letters", status: "done" },
    { id: "numbers", label: "Numbers", status: "done" },
    { id: "shapes", label: "Shapes", status: "done" },
    { id: "quiz", label: "Quiz", status: "active" },
    { id: "mastered", label: "Mastered", status: "locked" },
  ],
};

export const dailyGoals = [
  {
    id: "read_15",
    label: "Read for 15 min",
    current: 15,
    target: 15,
    icon: BookOpen,
    color: "#22C55E",
  },
  {
    id: "math_quest",
    label: "Math Challenge",
    current: 3,
    target: 5,
    icon: Sparkles,
    color: "#2563EB",
  },
  {
    id: "spell_words",
    label: "Spell 5 new words",
    current: 5,
    target: 5,
    icon: Medal,
    color: "#22C55E",
  },
];

export const gameLessons = [
  {
    id: "lesson_phonics_fun",
    lessonId: "lesson_letters_001",
    title: "Phonics Fun",
    subtitle: "Letters & Sounds",
    subjectCode: "ENG",
    stars: 120,
    icon: BookOpen,
    visual: "ABC",
    bg: "from-blue-100 to-sky-200",
    accent: "text-blue-600",
  },
  {
    id: "lesson_number_land",
    lessonId: "lesson_numbers_001",
    title: "Number Land",
    subtitle: "Count & Learn",
    subjectCode: "MATH",
    stars: 150,
    icon: Calculator,
    visual: "123",
    bg: "from-green-100 to-lime-200",
    accent: "text-green-600",
  },
  {
    id: "lesson_word_builder",
    lessonId: "lesson_words_001",
    title: "Word Builder",
    subtitle: "Spell & Learn",
    subjectCode: "ENG",
    stars: 180,
    icon: Palette,
    visual: "DOG",
    bg: "from-purple-100 to-violet-200",
    accent: "text-violet-600",
  },
  {
    id: "lesson_shapes_adventure",
    lessonId: "lesson_shapes_001",
    title: "Shapes Adventure",
    subtitle: "Learn Shapes",
    subjectCode: "MATH",
    stars: 100,
    icon: Shapes,
    visual: "△□○",
    bg: "from-amber-100 to-yellow-200",
    accent: "text-amber-600",
  },
];

export const subjectProgress = [
  { id: "english", label: "English", progress: 0.8, color: "#22C55E" },
  { id: "math", label: "Math", progress: 0.7, color: "#2563EB" },
  { id: "kinyarwanda", label: "Kinyarwanda", progress: 0.65, color: "#8B5CF6" },
  { id: "knowledge", label: "General Knowledge", progress: 0.9, color: "#F97316" },
];

export const achievements = [
  { id: "reading_star", label: "Reading Star", icon: BookOpen, color: "bg-green-500" },
  { id: "math_genius", label: "Math Genius", icon: Calculator, color: "bg-blue-500" },
  { id: "helper", label: "Helper", icon: ShieldCheck, color: "bg-amber-500" },
  { id: "attendance", label: "Attendance", icon: Calendar, color: "bg-rose-500" },
  { id: "super_learner", label: "Super Learner", icon: Trophy, color: "bg-violet-500" },
];

export const activities = [
  {
    id: "story_time",
    title: "Story Time",
    time: "Today, 4:00 PM",
    icon: BookOpen,
    actionLabel: "Join",
  },
  {
    id: "math_quiz",
    title: "Math Quiz",
    time: "Tomorrow, 10:00 AM",
    icon: Calculator,
    actionLabel: "Join",
  },
  {
    id: "spelling_bee",
    title: "Spelling Bee",
    time: "Friday, 2:00 PM",
    icon: MessageCircle,
    actionLabel: "Join",
  },
];

export const statCards = [
  { id: "stars", label: "Stars", value: learnerProfile.stars.toLocaleString(), icon: Star },
  {
    id: "level",
    label: `Level ${learnerProfile.level}`,
    value: `${learnerProfile.xp.current}/${learnerProfile.xp.target} XP`,
    icon: ShieldCheck,
  },
  { id: "alerts", label: "Alerts", value: String(learnerProfile.notifications), icon: Bell },
];
