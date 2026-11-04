export type Language = "en" | "rw" | "fr";

export type Level = {
  id: string;
  name: "LKG" | "UKG" | "P1" | "P2" | "P3" | "P4" | "P5" | "P6";
  category: "Nursery" | "Lower Primary" | "Upper Primary";
  ageRange: string;
};

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  topic?: string;
  learningObjectives?: string;
  genericCompetencies?: string[];
  crossCuttingIssues?: string[];
  contentType: "text" | "image" | "video" | "audio" | "pdf" | "mixed";
  body: string;
  mediaUrl?: string;
  estimatedMinutes: number;
  progress: number;
  completed: boolean;
};

export type QuizQuestion = {
  id: string;
  questionText: string;
  type: "multiple_choice" | "true_false" | "image_choice" | "short_answer";
  options: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
};

export type Quiz = {
  id: string;
  courseId: string;
  title: string;
  passMark: number;
  attemptsAllowed: number;
  timeLimit: number;
  questions: QuizQuestion[];
};

export type Course = {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  progress: number;
  locked: boolean;
  lessons: Lesson[];
  quiz: Quiz;
};

export type Subject = {
  id: string;
  levelId: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  courses: Course[];
};

export type Goal = {
  id: string;
  type: string;
  title: string;
  target: number;
  progress: number;
  dueDate: string;
  status: "active" | "completed";
};

export type Badge = {
  id: string;
  name: string;
  icon: string;
  criteria: string;
  rewardPoints: number;
  earnedAt?: string;
};

export type LibraryResource = {
  id: string;
  title: string;
  type: "ebook" | "video" | "worksheet" | "story" | "audio" | "pdf";
  levelId: string;
  subjectId?: string;
  language: Language;
  description: string;
  downloadable: boolean;
};

export type MessageThread = {
  threadId: string;
  title: string;
  from: string;
  unread: boolean;
  messages: Array<{ id: string; from: string; body: string; createdAt: string; read: boolean }>;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export type StudentDashboard = {
  student: {
    id: string;
    name: string;
    levelId: string;
    level: string;
    className: string;
    schoolName: string;
    avatar: string;
    language: Language;
    interests: string[];
  };
  stats: {
    stars: number;
    badges: number;
    completedLessons: number;
    streakDays: number;
  };
  goals: Goal[];
  continueLearning: {
    lessonId: string;
    courseId: string;
    subjectId: string;
    title: string;
    subjectName: string;
  };
  subjects: Subject[];
  recentBadges: Badge[];
};
