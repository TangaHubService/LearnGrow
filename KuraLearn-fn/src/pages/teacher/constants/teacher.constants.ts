export const purple = "#6d3eeb";

export const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ARCHIVED", label: "Archived" },
];

export const sortOptions = [
  { value: "desc", label: "Newest" },
  { value: "asc", label: "Oldest" },
];

export const languageOptions = [
  { value: "en", label: "English" },
  { value: "rw", label: "Kinyarwanda" },
  { value: "fr", label: "French" },
];

export const resourceTypeOptions = [
  "PDF",
  "WORD",
  "POWERPOINT",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "LINK",
  "OTHER",
].map((type) => ({ value: type, label: type.replace("_", " ") }));

export const messageCategoryOptions = [
  { value: "GENERAL", label: "General" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
  { value: "REMINDER", label: "Reminder" },
  { value: "PERFORMANCE_NOTE", label: "Performance Note" },
  { value: "HOMEWORK", label: "Homework" },
  { value: "EMERGENCY", label: "Emergency" },
];

export const quickActions = [
  { label: "Prepare Lesson Plan", kind: "ai-lesson", icon: "GraduationCap", tone: "#6d3eeb" },
  { label: "Generate Assessment", kind: "ai-quiz", icon: "ClipboardCheck", tone: "#2563eb" },
  { label: "Create Homework", kind: "ai-homework", icon: "BookOpen", tone: "#16a34a" },
  { label: "Create Activity", kind: "ai-activity", icon: "FileText", tone: "#f97316" },
  { label: "Analyze Performance", kind: "ai-report", icon: "BarChart3", tone: "#e85d8f" },
  { label: "Write Parent Message", kind: "ai-message", icon: "MessageSquare", tone: "#0ea5e9" },
];

export const statCardConfig = [
  {
    label: "Today's Lessons",
    captionKey: "completedLessons",
    icon: "CalendarDays",
    tone: "#6d3eeb",
  },
  { label: "My Classes", caption: "All assigned", icon: "Users", tone: "#2563eb" },
  { label: "My Subjects", caption: "All assigned", icon: "BookOpen", tone: "#16a34a" },
  { label: "Pending Lesson Plans", caption: "To be prepared", icon: "FileText", tone: "#f59e0b" },
  {
    label: "Pending Assessments",
    caption: "To be created or marked",
    icon: "ClipboardCheck",
    tone: "#e85d8f",
  },
];

export const aiPromptTemplates = {
  "ai-lesson": "Prepare a classroom-ready lesson plan.",
  "ai-quiz": "Generate assessment questions.",
  "ai-homework": "Create homework aligned to today's learning.",
  "ai-activity": "Create an engaging classroom activity.",
  "ai-message": "Draft a parent communication message.",
  "ai-report": "Analyze learner performance and recommend interventions.",
  "ai-delivery": "Prepare teaching notes and delivery guidance.",
  "ai-approval": "Give teacher decision-support guidance.",
  "ai-assistant": "Prepare a classroom resource.",
};

export const settingsItems = [
  "Profile and account",
  "Notification preferences",
  "Dark mode",
  "AI controls",
  "School term filters",
  "Offline sync readiness",
];
