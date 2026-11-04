import bcrypt from "bcryptjs";
import {
  ActivityType,
  AIInsightType,
  AIMessageRole,
  AIMessageSourceType,
  AssessmentSubmissionStatus,
  AssessmentType,
  AssessmentVisibility,
  AttendanceStatus,
  CombinationSubjectRole,
  ContentStatus,
  ContentType,
  EducationPathway,
  EmploymentStatus,
  ExamRegistrationStatus,
  Gender,
  GoalStatus,
  GoalType,
  InvitationStatus,
  LearnerRiskLevel,
  LevelCategory,
  LibraryResourceType,
  MarkSubmissionStatus,
  NationalExamLevel,
  NotificationType,
  PrismaClient,
  PromotionStatus,
  QuestionType,
  QuizAttemptStatus,
  RecordStatus,
  RoomType,
  SchoolType,
  StaffRole,
  SubjectCategory,
  StudentStatus,
  SubscriptionStatus,
  SupportPlanStatus,
  TeacherResourceType,
  TimetableDay,
  TransferStatus,
  UserRole,
  UserStatus
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const SCHOOL_NAME = "Kura Learn School";
const DEFAULT_PASSWORD = "Password123!";
const ACADEMIC_YEAR_NAME = "2025/2026";
const ACTIVE_TERM_NAME = "Term 3";
const STUDENTS_PER_CLASS = 10;
const FEMALE_STUDENTS_PER_CLASS = 4;
const DISABILITY_INDEXES = new Set([0, 3, 6]);
const SEED_NOW = new Date("2026-05-21T08:00:00.000Z");

type ClassSeed = {
  id: string;
  name: string;
  levelId: string;
  levelName: string;
  levelOrder: number;
  schoolId: string;
};

type SubjectSeed = {
  id: string;
  levelId: string;
  levelName: string;
  name: string;
  icon: string;
};

type TeacherSeed = {
  id: string;
  userId: string;
  staffId: string;
  name: string;
  email: string;
};

type StudentSeed = {
  id: string;
  userId: string;
  classId: string;
  levelId: string;
  levelName: string;
  name: string;
  email: string;
  gender: Gender;
  hasDisability: boolean;
  disabilityType: string | null;
  studentCode: string;
  pathway: EducationPathway;
  combinationId: string | null;
  globalIndex: number;
  classIndex: number;
};

type CourseSeed = {
  id: string;
  classId: string;
  levelName: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherUserId: string;
  firstLessonId: string;
  firstUnitId: string;
  assignmentId: string;
  quizId: string;
  assessmentId: string;
};

const levelBlueprints = [
  { name: "P1", category: LevelCategory.LOWER_PRIMARY, ageRange: "7", order: 1 },
  { name: "P2", category: LevelCategory.LOWER_PRIMARY, ageRange: "8", order: 2 },
  { name: "P3", category: LevelCategory.LOWER_PRIMARY, ageRange: "9", order: 3 },
  { name: "P4", category: LevelCategory.UPPER_PRIMARY, ageRange: "10", order: 4 },
  { name: "P5", category: LevelCategory.UPPER_PRIMARY, ageRange: "11", order: 5 },
  { name: "P6", category: LevelCategory.UPPER_PRIMARY, ageRange: "12", order: 6 },
  { name: "S1", category: LevelCategory.LOWER_SECONDARY, ageRange: "13", order: 7 },
  { name: "S2", category: LevelCategory.LOWER_SECONDARY, ageRange: "14", order: 8 },
  { name: "S3", category: LevelCategory.LOWER_SECONDARY, ageRange: "15", order: 9 },
  { name: "S4", category: LevelCategory.UPPER_SECONDARY, ageRange: "16", order: 10 },
  { name: "S5", category: LevelCategory.UPPER_SECONDARY, ageRange: "17", order: 11 },
  { name: "S6", category: LevelCategory.UPPER_SECONDARY, ageRange: "18", order: 12 }
];

const rwandaPrimarySubjects = [
  {
    name: "Kinyarwanda",
    icon: "languages",
    description: "Reading, writing, speaking, listening, and Rwandan cultural expression."
  },
  {
    name: "English",
    icon: "book-open",
    description: "Reading comprehension, grammar, writing, speaking, and classroom communication."
  },
  {
    name: "French",
    icon: "languages",
    description: "Basic French listening, speaking, reading, and writing."
  },
  {
    name: "Mathematics",
    icon: "calculator",
    description: "Numbers, operations, geometry, measurement, data, and problem solving."
  },
  {
    name: "Social and Religious Studies",
    icon: "globe-2",
    description: "Community life, values, history, geography, citizenship, and religious literacy."
  },
  {
    name: "Science and Elementary Technology",
    icon: "flask-conical",
    description: "Living things, materials, energy, health, environment, and simple technology."
  },
  {
    name: "Creative Arts",
    icon: "palette",
    description: "Music, dance, drama, fine art, crafts, creativity, and expression."
  },
  {
    name: "Physical Education and Sports",
    icon: "activity",
    description: "Movement, games, fitness, teamwork, safety, and healthy habits."
  }
];

const rwandaLowerSecondarySubjects = [
  { name: "Kinyarwanda", icon: "languages", description: "Advanced reading, writing, speaking, and cultural literacy.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 4 },
  { name: "English", icon: "book-open", description: "Communication, grammar, reading, and composition.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 4 },
  { name: "French", icon: "languages", description: "French communication, reading, grammar, and writing.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 3 },
  { name: "Mathematics", icon: "calculator", description: "Algebra, geometry, statistics, and problem solving.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 5 },
  { name: "Biology", icon: "leaf", description: "Living things, body systems, health, and environment.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 3 },
  { name: "Chemistry", icon: "flask-conical", description: "Matter, substances, reactions, and laboratory safety.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 3 },
  { name: "Physics", icon: "atom", description: "Forces, energy, electricity, light, and measurement.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 3 },
  { name: "Geography", icon: "map", description: "Physical and human geography with Rwanda and global examples.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 3 },
  { name: "History and Citizenship", icon: "landmark", description: "Rwanda history, citizenship, governance, and social responsibility.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 3 },
  { name: "Entrepreneurship", icon: "briefcase", description: "Saving, enterprise, project planning, and work readiness.", category: SubjectCategory.CORE, isNationalExamSubject: true, periodsPerWeek: 2 },
  { name: "ICT", icon: "monitor", description: "Digital literacy, safe technology use, and productivity tools.", category: SubjectCategory.CORE, isNationalExamSubject: false, periodsPerWeek: 2 },
  { name: "Physical Education and Sports", icon: "activity", description: "Fitness, teamwork, games, and personal wellbeing.", category: SubjectCategory.CO_CURRICULAR, isNationalExamSubject: false, periodsPerWeek: 2 }
];

const rwandaUpperSecondarySubjects = [
  { name: "General Paper and Communication Skills", icon: "messages-square", description: "Communication, research, critical thinking, and civic awareness.", category: SubjectCategory.GENERAL, isNationalExamSubject: true, periodsPerWeek: 3 },
  { name: "Entrepreneurship", icon: "briefcase", description: "Business planning, financial literacy, innovation, and employment readiness.", category: SubjectCategory.GENERAL, isNationalExamSubject: true, periodsPerWeek: 2 },
  { name: "ICT", icon: "monitor", description: "Digital productivity, data handling, and technology fluency.", category: SubjectCategory.GENERAL, isNationalExamSubject: false, periodsPerWeek: 2 },
  { name: "Mathematics", icon: "calculator", description: "Advanced algebra, calculus foundations, statistics, and modelling.", category: SubjectCategory.PRINCIPAL, isNationalExamSubject: true, periodsPerWeek: 6 },
  { name: "Physics", icon: "atom", description: "Mechanics, waves, electricity, and scientific investigation.", category: SubjectCategory.PRINCIPAL, isNationalExamSubject: true, periodsPerWeek: 6 },
  { name: "Chemistry", icon: "flask-conical", description: "Chemical bonding, reactions, organic chemistry, and lab practice.", category: SubjectCategory.PRINCIPAL, isNationalExamSubject: true, periodsPerWeek: 6 },
  { name: "Biology", icon: "leaf", description: "Cell biology, genetics, ecology, human health, and practical science.", category: SubjectCategory.PRINCIPAL, isNationalExamSubject: true, periodsPerWeek: 6 },
  { name: "Geography", icon: "map", description: "Physical, human, and economic geography with fieldwork.", category: SubjectCategory.PRINCIPAL, isNationalExamSubject: true, periodsPerWeek: 6 },
  { name: "History", icon: "landmark", description: "Rwandan, African, and world history with source analysis.", category: SubjectCategory.PRINCIPAL, isNationalExamSubject: true, periodsPerWeek: 6 },
  { name: "Economics", icon: "trending-up", description: "Markets, production, development, and national economic choices.", category: SubjectCategory.PRINCIPAL, isNationalExamSubject: true, periodsPerWeek: 6 },
  { name: "Literature in English", icon: "book-open", description: "Drama, prose, poetry, interpretation, and essay writing.", category: SubjectCategory.PRINCIPAL, isNationalExamSubject: true, periodsPerWeek: 5 },
  { name: "Computer Science", icon: "code", description: "Computational thinking, programming, systems, and data.", category: SubjectCategory.PRINCIPAL, isNationalExamSubject: true, periodsPerWeek: 5 },
  { name: "French", icon: "languages", description: "Advanced French communication and writing.", category: SubjectCategory.SUBSIDIARY, isNationalExamSubject: true, periodsPerWeek: 3 },
  { name: "Kinyarwanda", icon: "languages", description: "Advanced Kinyarwanda communication and cultural expression.", category: SubjectCategory.SUBSIDIARY, isNationalExamSubject: true, periodsPerWeek: 3 }
];

function subjectsForLevel(category: LevelCategory) {
  if (category === LevelCategory.LOWER_SECONDARY) return rwandaLowerSecondarySubjects;
  if (category === LevelCategory.UPPER_SECONDARY) return rwandaUpperSecondarySubjects;
  return rwandaPrimarySubjects.map((subject) => ({
    ...subject,
    category: subject.name === "Physical Education and Sports" ? SubjectCategory.CO_CURRICULAR : SubjectCategory.CORE,
    isNationalExamSubject: subject.name !== "Physical Education and Sports",
    periodsPerWeek: subject.name === "Mathematics" ? 5 : subject.name === "Physical Education and Sports" ? 2 : 4
  }));
}

const femaleFirstNames = [
  "Aline", "Beata", "Claudine", "Diane", "Esperance", "Fiona", "Gisele", "Honorine",
  "Irene", "Josiane", "Keza", "Liliane", "Marie", "Nadia", "Olive", "Queen",
  "Rosine", "Sandrine", "Tatiana", "Umutoni", "Winnie", "Yvette", "Zita", "Divine"
];

const maleFirstNames = [
  "Alain", "Bertrand", "Cedric", "Dieudonne", "Eric", "Fabrice", "Gilbert", "Herve",
  "Innocent", "Jean", "Kevin", "Lambert", "Moses", "Noel", "Olivier", "Patrick",
  "Rene", "Samuel", "Thierry", "Valens", "Wilson", "Xavier", "Yves", "Zacharie"
];

const lastNames = [
  "Habimana", "Mugisha", "Nkurunziza", "Ishimwe", "Mutoni", "Uwase", "Gatera", "Kwizera",
  "Ineza", "Iradukunda", "Manzi", "Rugamba", "Nsengiyumva", "Niyomugabo", "Hakizimana",
  "Uwineza", "Murenzi", "Bizimana", "Dushime", "Kamanzi", "Mucyo", "Mbabazi", "Kalisa",
  "Rutayisire", "Nshuti", "Tuyisenge", "Umuhoza", "Ingabire", "Ganza", "Shema"
];

const teacherNames = [
  "Jeannette Mukamana",
  "Emmanuel Ndayisaba",
  "Chantal Uwimana",
  "Eric Nsabimana",
  "Beatrice Ingabire",
  "Patrick Niyonzima",
  "Diane Uwamahoro",
  "Jean Claude Habineza",
  "Sandrine Nyirahabimana",
  "Theoneste Mugisha"
];

const disabilityTypes = [
  "Visual impairment",
  "Hearing impairment",
  "Physical disability",
  "Speech and language difficulty",
  "Learning difficulty",
  "Autism spectrum support"
];

const occupations = [
  "Farmer",
  "Market trader",
  "Motorcycle taxi driver",
  "Nurse",
  "Tailor",
  "Shopkeeper",
  "Civil servant",
  "Construction worker"
];

const gradingScale = [
  { minPercentage: 80, maxPercentage: 100, grade: "A", description: "Excellent", points: 1, remarks: "Outstanding performance" },
  { minPercentage: 70, maxPercentage: 79.99, grade: "B", description: "Very Good", points: 2, remarks: "Very strong understanding" },
  { minPercentage: 60, maxPercentage: 69.99, grade: "C", description: "Good", points: 3, remarks: "Good conceptual grasp" },
  { minPercentage: 50, maxPercentage: 59.99, grade: "D", description: "Satisfactory", points: 4, remarks: "Meets basic requirements" },
  { minPercentage: 40, maxPercentage: 49.99, grade: "E", description: "Adequate", points: 5, remarks: "Requires improvement" },
  { minPercentage: 0, maxPercentage: 39.99, grade: "F", description: "Fail", points: 6, remarks: "Significant support needed" }
];

function isoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(date: Date, days: number, hour = 0, minute = 0) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  next.setUTCHours(hour, minute, 0, 0);
  return next;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function subjectKey(classId: string, subjectId: string) {
  return `${classId}:${subjectId}`;
}

function nameFor(index: number, gender: Gender) {
  const firstNames = gender === Gender.FEMALE ? femaleFirstNames : maleFirstNames;
  const first = firstNames[index % firstNames.length];
  const last = lastNames[Math.floor(index / 2) % lastNames.length];
  return `${first} ${last}`;
}

function getGradeFromPercentage(percentage: number) {
  const found = gradingScale.find((scale) => percentage >= scale.minPercentage && percentage <= scale.maxPercentage);
  return found?.grade ?? "F";
}

function getRemarks(percentage: number) {
  const found = gradingScale.find((scale) => percentage >= scale.minPercentage && percentage <= scale.maxPercentage);
  return found?.remarks ?? "Significant support needed";
}

function scoreFor(student: StudentSeed, subjectIndex: number, classOrder: number) {
  return Math.min(98, 45 + ((student.globalIndex * 11 + subjectIndex * 7 + classOrder * 5) % 53));
}

function performanceLevel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "On track";
  if (score >= 50) return "Needs practice";
  return "Needs targeted support";
}

function birthDateFor(levelOrder: number, localIndex: number) {
  const age = 6 + levelOrder;
  const birthYear = 2026 - age;
  const month = localIndex % 12;
  const day = 1 + ((localIndex * 3) % 27);
  return new Date(Date.UTC(birthYear, month, day));
}

function pathwayForLevel(levelName: string) {
  if (levelName.startsWith("S4") || levelName.startsWith("S5") || levelName.startsWith("S6")) {
    return EducationPathway.ADVANCED_LEVEL;
  }
  if (levelName.startsWith("S")) return EducationPathway.ORDINARY_LEVEL;
  return EducationPathway.PRIMARY;
}

function quizQuestionsFor(subjectName: string) {
  if (subjectName === "Mathematics") {
    return [
      {
        questionText: "What is the value of 4,200 + 350?",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["4,450", "4,550", "4,650", "4,750"],
        answer: "4,550",
        explanation: "4,200 plus 350 equals 4,550.",
        points: 2
      },
      {
        questionText: "True or False: 1/2 is the same as 2/4.",
        type: QuestionType.TRUE_FALSE,
        options: ["True", "False"],
        answer: "True",
        explanation: "Two quarters make one half.",
        points: 1
      },
      {
        questionText: "Which shape has four equal sides?",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["Triangle", "Square", "Circle", "Rectangle with unequal sides"],
        answer: "Square",
        explanation: "A square has four equal sides.",
        points: 2
      }
    ];
  }

  if (subjectName === "Kinyarwanda") {
    return [
      {
        questionText: "Ni iki gisobanura ijambo 'ubufatanye'?",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["Gukorera hamwe", "Kwirengagiza abandi", "Kuryama", "Guhagarara"],
        answer: "Gukorera hamwe",
        explanation: "Ubufatanye ni ugukorera hamwe.",
        points: 2
      },
      {
        questionText: "True or False: 'Muraho' ni indamukanyo.",
        type: QuestionType.TRUE_FALSE,
        options: ["True", "False"],
        answer: "True",
        explanation: "'Muraho' ikoreshwa mu gusuhuza.",
        points: 1
      }
    ];
  }

  if (subjectName === "English") {
    return [
      {
        questionText: "Choose the correct sentence.",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["She are reading.", "She is reading.", "She am reading.", "She be reading."],
        answer: "She is reading.",
        explanation: "The correct verb with 'she' is 'is'.",
        points: 2
      },
      {
        questionText: "True or False: The plural of child is children.",
        type: QuestionType.TRUE_FALSE,
        options: ["True", "False"],
        answer: "True",
        explanation: "Children is the correct irregular plural.",
        points: 1
      }
    ];
  }

  return [
    {
      questionText: `Which practice helps learners build competence in ${subjectName}?`,
      type: QuestionType.MULTIPLE_CHOICE,
      options: ["Practice and discussion", "Skipping activities", "Guessing without reading", "Avoiding group work"],
      answer: "Practice and discussion",
      explanation: "Competence grows through active practice, reflection, and feedback.",
      points: 2
    },
    {
      questionText: `True or False: ${subjectName} lessons can include inclusive group activities.`,
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      answer: "True",
      explanation: "Inclusive group work helps learners support and learn from one another.",
      points: 1
    }
  ];
}

function assessmentQuestionsFor(subjectName: string) {
  if (subjectName === "Mathematics") {
    return [
      {
        questionText: "A school garden has 36 bean plants. Learners plant 18 more. How many bean plants are there now?",
        type: QuestionType.SHORT_ANSWER,
        options: null,
        correctAnswer: "54",
        marks: 15,
        explanation: "36 + 18 = 54."
      },
      {
        questionText: "Which fraction shows one out of four equal parts?",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["1/2", "1/3", "1/4", "4/1"],
        correctAnswer: "1/4",
        marks: 15,
        explanation: "One part out of four equal parts is one quarter."
      },
      {
        questionText: "True or False: A litre is used to measure capacity.",
        type: QuestionType.TRUE_FALSE,
        options: ["True", "False"],
        correctAnswer: "True",
        marks: 20,
        explanation: "Litres are used to measure capacity."
      }
    ];
  }

  if (subjectName === "English") {
    return [
      {
        questionText: "Write three sentences about how your class keeps the school clean.",
        type: QuestionType.ESSAY,
        options: null,
        correctAnswer: null,
        marks: 25,
        explanation: "Answers should use clear sentences and relevant vocabulary."
      },
      {
        questionText: "Choose the adjective: The clean classroom is ready.",
        type: QuestionType.MULTIPLE_CHOICE,
        options: ["clean", "classroom", "ready", "is"],
        correctAnswer: "clean",
        marks: 10,
        explanation: "Clean describes the classroom."
      },
      {
        questionText: "Complete: We ___ learning together.",
        type: QuestionType.SHORT_ANSWER,
        options: null,
        correctAnswer: "are",
        marks: 15,
        explanation: "The sentence uses the present continuous tense."
      }
    ];
  }

  return [
    {
      questionText: `Describe one way ${subjectName} helps your family or community.`,
      type: QuestionType.ESSAY,
      options: null,
      correctAnswer: null,
      marks: 25,
      explanation: "A good answer connects classroom learning to everyday life."
    },
    {
      questionText: `True or False: Learners can show competence in ${subjectName} through practical activities.`,
      type: QuestionType.TRUE_FALSE,
      options: ["True", "False"],
      correctAnswer: "True",
      marks: 25,
      explanation: "Practical activities are part of competence-based learning."
    }
  ];
}

function unitBlueprints(subjectName: string, levelName: string) {
  const common = {
    genericCompetencies: ["Critical thinking", "Communication", "Cooperation"],
    crossCuttingIssues: ["Inclusive education", "Gender education"]
  };

  if (subjectName === "Mathematics") {
    return [
      {
        title: `${levelName} Unit 1: Numbers and Operations`,
        description: "Reading, comparing, adding, and subtracting numbers in daily contexts.",
        keyCompetence: "Use number operations to solve everyday problems.",
        ...common
      },
      {
        title: `${levelName} Unit 2: Measurement and Fractions`,
        description: "Using length, mass, capacity, time, and simple fractions.",
        keyCompetence: "Measure and represent simple parts of a whole.",
        ...common
      }
    ];
  }

  if (subjectName === "Science and Elementary Technology") {
    return [
      {
        title: `${levelName} Unit 1: Health and Environment`,
        description: "Cleanliness, nutrition, plants, animals, and care for the environment.",
        keyCompetence: "Explain healthy habits and care for living things.",
        ...common
      },
      {
        title: `${levelName} Unit 2: Materials and Simple Tools`,
        description: "Observing materials, simple machines, and safe tool use.",
        keyCompetence: "Use simple observations to solve practical problems safely.",
        ...common
      }
    ];
  }

  return [
    {
      title: `${levelName} Unit 1: Foundations of ${subjectName}`,
      description: `Core vocabulary, concepts, and classroom routines in ${subjectName}.`,
      keyCompetence: `Communicate and apply foundational ideas in ${subjectName}.`,
      ...common
    },
    {
      title: `${levelName} Unit 2: Applying ${subjectName}`,
      description: `Practical activities and community examples for ${subjectName}.`,
      keyCompetence: `Apply ${subjectName} learning to school and home situations.`,
      ...common
    }
  ];
}

async function clearData() {
  console.log("Clearing existing seed data...");

  await prisma.markAuditLog.deleteMany();
  await prisma.markSubmissionEvent.deleteMany();
  await prisma.reportGenerationLog.deleteMany();
  await prisma.reportComment.deleteMany();
  await prisma.reportCard.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.markSubmission.deleteMany();
  await prisma.nationalExamResult.deleteMany();
  await prisma.nationalExamRegistration.deleteMany();
  await prisma.submissionFeedback.deleteMany();
  await prisma.assessmentSubmission.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendanceAlert.deleteMany();
  await prisma.attendanceAnalytics.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.learnerSupportPlan.deleteMany();
  await prisma.studentRiskScore.deleteMany();
  await prisma.intervention.deleteMany();
  await prisma.performanceRecord.deleteMany();
  await prisma.teacherAiOutput.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.aIUsageLog.deleteMany();
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.studentBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.teacherLessonDeliverySession.deleteMany();
  await prisma.teacherLessonResource.deleteMany();
  await prisma.teacherResource.deleteMany();
  await prisma.timetablePeriod.deleteMany();
  await prisma.teacherWorkload.deleteMany();
  await prisma.period.deleteMany();
  await prisma.room.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.lessonPlan.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.libraryResource.deleteMany();
  await prisma.staffAssignment.deleteMany();
  await prisma.teacherClassAssignment.deleteMany();
  await prisma.studentAcademicPathway.deleteMany();
  await prisma.studentPromotion.deleteMany();
  await prisma.studentTransfer.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.combinationSubject.deleteMany();
  await prisma.secondaryCombination.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.term.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.gradingScale.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.level.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.school.deleteMany();
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run development seed data in production.");
  }

  console.log(`Seeding ${SCHOOL_NAME} with Rwanda primary and secondary test data...`);
  await clearData();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const superAdminUser = await prisma.user.create({
    data: {
      name: "KuraLearn Platform Admin",
      email: "super@kuralearn.demo",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  const school = await prisma.school.create({
    data: {
      name: SCHOOL_NAME,
      district: "Gasabo",
      province: "Kigali",
      sector: "Kimironko",
      cell: "Kibagabaga",
      village: "Karuruma",
      phone: "+250788100100",
      email: "info@kuralearn.school",
      type: SchoolType.PUBLIC,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      reportBranding: {
        motto: "Learn, grow, and serve Rwanda",
        colors: { primary: "#14532d", secondary: "#facc15" }
      }
    }
  });

  const headteacherUser = await prisma.user.create({
    data: {
      name: "Head Teacher Claudine Mukeshimana",
      email: "head.kura@example.com",
      passwordHash,
      role: UserRole.HEAD_TEACHER,
      status: UserStatus.ACTIVE
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "School Admin Jean Bosco Nshimiyimana",
      email: "admin.kura@example.com",
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  const dosUser = await prisma.user.create({
    data: {
      name: "Director of Studies Aline Nyirahabimana",
      email: "dos.kura@example.com",
      passwordHash,
      role: UserRole.DIRECTOR_OF_STUDIES,
      status: UserStatus.ACTIVE
    }
  });

  const headteacherStaff = await prisma.staff.create({
    data: {
      userId: headteacherUser.id,
      schoolId: school.id,
      staffRole: StaffRole.HEADTEACHER,
      phone: "+250788100101",
      gender: Gender.FEMALE,
      employmentStatus: EmploymentStatus.PERMANENT,
      invitationStatus: InvitationStatus.ACCEPTED,
      invitedById: superAdminUser.id
    }
  });

  await prisma.staff.createMany({
    data: [
      {
        userId: adminUser.id,
        schoolId: school.id,
        staffRole: StaffRole.SCHOOL_ADMIN,
        phone: "+250788100102",
        gender: Gender.MALE,
        employmentStatus: EmploymentStatus.PERMANENT,
        invitationStatus: InvitationStatus.ACCEPTED,
        invitedById: superAdminUser.id
      },
      {
        userId: dosUser.id,
        schoolId: school.id,
        staffRole: StaffRole.DIRECTOR_OF_STUDIES,
        phone: "+250788100103",
        gender: Gender.FEMALE,
        employmentStatus: EmploymentStatus.PERMANENT,
        invitationStatus: InvitationStatus.ACCEPTED,
        invitedById: superAdminUser.id
      }
    ]
  });

  const supportStaff = [
    { role: StaffRole.ACCOUNTANT, title: "Accountant", name: "Accountant Samuel Rukundo", email: "accountant.kura@example.com", gender: Gender.MALE },
    { role: StaffRole.LIBRARIAN, title: "Librarian", name: "Librarian Vestine Uwamahoro", email: "librarian.kura@example.com", gender: Gender.FEMALE },
    { role: StaffRole.ICT_OFFICER, title: "ICT Officer", name: "ICT Officer Patrick Hakizimana", email: "ict.kura@example.com", gender: Gender.MALE }
  ];

  for (const member of supportStaff) {
    const user = await prisma.user.create({
      data: {
        name: member.name,
        email: member.email,
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      }
    });

    await prisma.staff.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        staffRole: member.role,
        phone: `+25078810${110 + supportStaff.indexOf(member)}`,
        gender: member.gender,
        employmentStatus: EmploymentStatus.PERMANENT,
        invitationStatus: InvitationStatus.ACCEPTED,
        invitedById: adminUser.id
      }
    });
  }

  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: school.id,
      name: ACADEMIC_YEAR_NAME,
      startDate: isoDate("2025-09-01"),
      endDate: isoDate("2026-07-15"),
      status: RecordStatus.ACTIVE,
      createdById: adminUser.id,
      updatedById: adminUser.id
    }
  });

  await prisma.term.createMany({
    data: [
      {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: "Term 1",
        startDate: isoDate("2025-09-01"),
        endDate: isoDate("2025-12-15"),
        status: RecordStatus.COMPLETED,
        createdById: adminUser.id,
        updatedById: adminUser.id
      },
      {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: "Term 2",
        startDate: isoDate("2026-01-05"),
        endDate: isoDate("2026-04-10"),
        status: RecordStatus.COMPLETED,
        createdById: adminUser.id,
        updatedById: adminUser.id
      },
      {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: ACTIVE_TERM_NAME,
        startDate: isoDate("2026-04-20"),
        endDate: isoDate("2026-07-15"),
        status: RecordStatus.ACTIVE,
        createdById: adminUser.id,
        updatedById: adminUser.id
      }
    ]
  });

  const activeTerm = await prisma.term.findFirstOrThrow({
    where: { academicYearId: academicYear.id, name: ACTIVE_TERM_NAME }
  });

  await prisma.gradingScale.createMany({
    data: gradingScale.map((scale) => ({ ...scale, schoolId: school.id }))
  });

  const classes: ClassSeed[] = [];
  const subjectsByLevelName = new Map<string, SubjectSeed[]>();

  for (const levelSeed of levelBlueprints) {
    const level = await prisma.level.create({ data: levelSeed });
    const classRecord = await prisma.class.create({
      data: {
        schoolId: school.id,
        levelId: level.id,
        name: level.name
      }
    });

    classes.push({
      id: classRecord.id,
      name: classRecord.name,
      levelId: level.id,
      levelName: level.name,
      levelOrder: level.order,
      schoolId: school.id
    });

    const levelSubjects: SubjectSeed[] = [];
    for (const [index, subject] of subjectsForLevel(level.category).entries()) {
      const createdSubject = await prisma.subject.create({
        data: {
          levelId: level.id,
          name: subject.name,
          icon: subject.icon,
          description: subject.description,
          order: index + 1,
          category: subject.category,
          isNationalExamSubject: subject.isNationalExamSubject,
          periodsPerWeek: subject.periodsPerWeek,
          rebCode: `${level.name}-${slug(subject.name).toUpperCase()}`
        }
      });
      levelSubjects.push({
        id: createdSubject.id,
        levelId: level.id,
        levelName: level.name,
        name: createdSubject.name,
        icon: createdSubject.icon
      });
    }
    subjectsByLevelName.set(level.name, levelSubjects);
  }

  const teachers: TeacherSeed[] = [];
  for (const [index, teacherName] of teacherNames.entries()) {
    const user = await prisma.user.create({
      data: {
        name: teacherName,
        email: `teacher${index + 1}.kura@example.com`,
        passwordHash,
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE
      }
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        schoolId: school.id
      }
    });

    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        schoolId: school.id,
        staffRole: StaffRole.TEACHER,
        phone: `+25078820${String(index + 1).padStart(2, "0")}`,
        gender: index % 2 === 0 ? Gender.FEMALE : Gender.MALE,
        employmentStatus: EmploymentStatus.PERMANENT,
        invitationStatus: InvitationStatus.ACCEPTED,
        invitedById: adminUser.id
      }
    });

    teachers.push({
      id: teacher.id,
      userId: user.id,
      staffId: staff.id,
      name: user.name,
      email: user.email
    });
  }

  const combinationBlueprints = [
    {
      code: "PCM",
      name: "Physics, Chemistry, Mathematics",
      description: "STEM pathway for engineering, technology, and physical sciences.",
      subjects: ["Physics", "Chemistry", "Mathematics"]
    },
    {
      code: "PCB",
      name: "Physics, Chemistry, Biology",
      description: "Science pathway for health, agriculture, and laboratory sciences.",
      subjects: ["Physics", "Chemistry", "Biology"]
    },
    {
      code: "MCB",
      name: "Mathematics, Chemistry, Biology",
      description: "Science pathway for learners combining quantitative and life-science strengths.",
      subjects: ["Mathematics", "Chemistry", "Biology"]
    },
    {
      code: "MEG",
      name: "Mathematics, Economics, Geography",
      description: "Social science pathway for planning, finance, and development studies.",
      subjects: ["Mathematics", "Economics", "Geography"]
    },
    {
      code: "HEG",
      name: "History, Economics, Geography",
      description: "Humanities pathway for governance, law, development, and social research.",
      subjects: ["History", "Economics", "Geography"]
    }
  ];

  const combinationsByCode = new Map<string, { id: string; code: string; name: string }>();
  const upperLevels = levelBlueprints.filter((level) => level.category === LevelCategory.UPPER_SECONDARY);

  for (const combinationSeed of combinationBlueprints) {
    const combination = await prisma.secondaryCombination.create({
      data: {
        schoolId: school.id,
        code: combinationSeed.code,
        name: combinationSeed.name,
        pathway: EducationPathway.ADVANCED_LEVEL,
        description: combinationSeed.description,
        status: RecordStatus.ACTIVE
      }
    });
    combinationsByCode.set(combination.code, combination);

    for (const level of upperLevels) {
      const levelSubjects = subjectsByLevelName.get(level.name) ?? [];
      const combinationSubjects = levelSubjects.filter((subject) =>
        combinationSeed.subjects.includes(subject.name) ||
        ["General Paper and Communication Skills", "Entrepreneurship", "ICT"].includes(subject.name)
      );

      for (const subject of combinationSubjects) {
        await prisma.combinationSubject.create({
          data: {
            combinationId: combination.id,
            subjectId: subject.id,
            role: combinationSeed.subjects.includes(subject.name)
              ? CombinationSubjectRole.PRINCIPAL
              : CombinationSubjectRole.GENERAL,
            periodsPerWeek: combinationSeed.subjects.includes(subject.name) ? 6 : 2,
            nationalExamWeight: combinationSeed.subjects.includes(subject.name) ? 1 : 0.5
          }
        });
      }
    }
  }

  const assignmentByClassSubject = new Map<string, TeacherSeed>();
  let assignmentCounter = 0;
  for (const classRecord of classes) {
    const subjects = subjectsByLevelName.get(classRecord.levelName) ?? [];
    for (const subject of subjects) {
      const teacher = teachers[assignmentCounter % teachers.length];
      assignmentCounter++;
      assignmentByClassSubject.set(subjectKey(classRecord.id, subject.id), teacher);

      await prisma.teacherClassAssignment.create({
        data: {
          schoolId: school.id,
          teacherId: teacher.id,
          classId: classRecord.id,
          subjectName: subject.name,
          academicYearId: academicYear.id,
          termId: activeTerm.id,
          performance: 68 + ((assignmentCounter * 3) % 23),
          status: RecordStatus.ACTIVE,
          createdById: adminUser.id,
          updatedById: adminUser.id
        }
      });

      await prisma.staffAssignment.create({
        data: {
          staffId: teacher.staffId,
          classId: classRecord.id,
          subjectId: subject.id,
          subjectName: subject.name,
          status: RecordStatus.ACTIVE
        }
      });
    }
  }

  // Seed rooms
  const roomTypes = ["CLASSROOM", "LABORATORY", "COMPUTER_LAB"] as const;
  const rooms = [];
  for (let i = 1; i <= 20; i++) {
    const type = roomTypes[i % 3];
    const room = await prisma.room.create({
      data: {
        schoolId: school.id,
        name: `${type === "CLASSROOM" ? "Room" : type === "LABORATORY" ? "Lab" : "ICT Lab"} ${String(i).padStart(2, "0")}`,
        type,
        capacity: 30 + (i % 10) * 5,
        building: i <= 10 ? "Main" : "Science",
        status: RecordStatus.ACTIVE
      }
    });
    rooms.push(room);
  }

  // Seed period definitions
  const periodSlots = [
    { name: "Period 1", startTime: "07:30", endTime: "08:10", slotIndex: 0 },
    { name: "Period 2", startTime: "08:15", endTime: "08:55", slotIndex: 1 },
    { name: "Period 3", startTime: "09:10", endTime: "09:50", slotIndex: 2 },
    { name: "Period 4", startTime: "09:55", endTime: "10:35", slotIndex: 3 },
    { name: "Period 5", startTime: "10:50", endTime: "11:30", slotIndex: 4 },
    { name: "Period 6", startTime: "11:35", endTime: "12:15", slotIndex: 5 }
  ];
  const seededPeriods = [];
  for (const slot of periodSlots) {
    const period = await prisma.period.create({
      data: {
        schoolId: school.id,
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotIndex: slot.slotIndex,
        shift: "MORNING",
        status: RecordStatus.ACTIVE
      }
    });
    seededPeriods.push(period);
  }

  // Seed teacher workload defaults
  for (const teacher of teachers) {
    await prisma.teacherWorkload.create({
      data: {
        teacherId: teacher.id,
        schoolId: school.id,
        academicYearId: academicYear.id,
        termId: activeTerm.id,
        maxPeriodsPerDay: 8,
        maxPeriodsPerWeek: 40,
        maxConsecutivePeriods: 3,
        status: RecordStatus.ACTIVE
      }
    });
  }

  const timetableDays = [
    TimetableDay.MONDAY,
    TimetableDay.TUESDAY,
    TimetableDay.WEDNESDAY,
    TimetableDay.THURSDAY,
    TimetableDay.FRIDAY
  ];

  // A teacher can only be in one class per slot (enforced by a unique index), so when the assigned
  // teacher is busy, use any free teacher, or leave the period without a teacher if none is free.
  const busyTeacherSlots = new Set<string>();

  for (const classRecord of classes) {
    const subjects = subjectsByLevelName.get(classRecord.levelName) ?? [];
    for (const [dayIndex, dayOfWeek] of timetableDays.entries()) {
      for (const [periodIndex, slot] of periodSlots.entries()) {
        const subject = subjects[(dayIndex + periodIndex) % subjects.length];
        const room = rooms[(dayIndex + periodIndex) % rooms.length];
        const periodDef = seededPeriods[periodIndex % seededPeriods.length];
        const slotKey = (teacherId: string) => `${teacherId}:${dayOfWeek}:${periodDef.startTime}`;
        const assignedTeacher = assignmentByClassSubject.get(subjectKey(classRecord.id, subject.id)) ?? teachers[0];
        const teacher = !busyTeacherSlots.has(slotKey(assignedTeacher.id))
          ? assignedTeacher
          : teachers.find((candidate) => !busyTeacherSlots.has(slotKey(candidate.id)));
        if (teacher) busyTeacherSlots.add(slotKey(teacher.id));
        await prisma.timetablePeriod.create({
          data: {
            schoolId: school.id,
            classId: classRecord.id,
            subjectId: subject.id,
            teacherId: teacher?.id ?? null,
            roomId: room.id,
            periodId: periodDef.id,
            academicYearId: academicYear.id,
            termId: activeTerm.id,
            dayOfWeek,
            startTime: periodDef.startTime,
            endTime: periodDef.endTime,
            room: room.name,
            shift: "MORNING",
            status: RecordStatus.ACTIVE
          }
        });
      }
    }
  }

  const parents = [];
  for (let index = 0; index < 60; index++) {
    const gender = index % 2 === 0 ? Gender.FEMALE : Gender.MALE;
    const name = nameFor(index + 30, gender);
    const user = await prisma.user.create({
      data: {
        name,
        email: `parent${index + 1}@example.com`,
        passwordHash,
        role: UserRole.PARENT,
        status: UserStatus.ACTIVE
      }
    });

    const parent = await prisma.parent.create({
      data: {
        userId: user.id,
        phone: `+250789${String(100000 + index).padStart(6, "0")}`,
        relationship: gender === Gender.FEMALE ? "Mother" : "Father",
        notificationPreference: index % 3 === 0 ? "sms" : "email",
        occupation: occupations[index % occupations.length],
        nationalId: `11980${String(index + 1).padStart(11, "0")}`.slice(0, 16),
        province: "Kigali",
        district: "Gasabo",
        sector: "Kimironko",
        cell: "Kibagabaga",
        village: "Karuruma"
      }
    });
    parents.push({ ...parent, userId: user.id, email: user.email, name: user.name });
  }

  const students: StudentSeed[] = [];
  const studentsByClassId = new Map<string, StudentSeed[]>();
  let globalStudentIndex = 0;

  for (const classRecord of classes) {
    const classStudents: StudentSeed[] = [];

    for (let localIndex = 0; localIndex < STUDENTS_PER_CLASS; localIndex++) {
      const gender = localIndex < FEMALE_STUDENTS_PER_CLASS ? Gender.FEMALE : Gender.MALE;
      const hasDisability = DISABILITY_INDEXES.has(localIndex);
      const disabilityType = hasDisability
        ? disabilityTypes[(classRecord.levelOrder + localIndex) % disabilityTypes.length]
        : null;
      const studentCode = `KLS-${classRecord.name}-${String(localIndex + 1).padStart(3, "0")}`;
      const pathway = pathwayForLevel(classRecord.levelName);
      const combinationCodes = [...combinationsByCode.keys()];
      const combination = pathway === EducationPathway.ADVANCED_LEVEL
        ? combinationsByCode.get(combinationCodes[localIndex % combinationCodes.length] ?? "PCM")
        : null;
      const name = nameFor(globalStudentIndex, gender);
      const user = await prisma.user.create({
        data: {
          name,
          email: `student.${classRecord.name.toLowerCase()}.${localIndex + 1}.kura@example.com`,
          passwordHash,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE
        }
      });

      const student = await prisma.student.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          levelId: classRecord.levelId,
          classId: classRecord.id,
          studentCode,
          gender,
          dateOfBirth: birthDateFor(classRecord.levelOrder, localIndex),
          admissionDate: isoDate("2025-09-01"),
          nationality: "Rwandan",
          province: "Kigali",
          district: "Gasabo",
          sector: "Kimironko",
          cell: "Kibagabaga",
          village: "Karuruma",
          boardingStatus: "DAY",
          language: classRecord.levelOrder <= 3 ? "rw-en" : "en-rw",
          stream: classRecord.name,
          status: StudentStatus.ACTIVE,
          pathway,
          hasDisability,
          disabilityType,
          specialSupportNeeds: hasDisability ? "Individual support plan and accessible learning materials" : null,
          inclusiveEducationNotes: hasDisability
            ? `Provide ${disabilityType?.toLowerCase()} accommodations during lessons and assessments.`
            : null,
          medicalNotes: hasDisability && disabilityType === "Physical disability" ? "Allow flexible movement and seating." : null,
          nationalId: `119${String(2010000000000 + globalStudentIndex).padStart(13, "0")}`.slice(0, 16),
          previousSchool: localIndex % 9 === 0 ? "Home-based early learning" : null,
          interests: [
            (subjectsByLevelName.get(classRecord.levelName) ?? [])[localIndex % (subjectsByLevelName.get(classRecord.levelName)?.length || 1)]?.name ?? "reading",
            localIndex % 2 === 0 ? "group work" : "reading",
            localIndex % 3 === 0 ? "football" : "storytelling"
          ],
          combinationId: combination?.id ?? null
        }
      });

      await prisma.studentAcademicPathway.create({
        data: {
          studentId: student.id,
          schoolId: school.id,
          levelId: classRecord.levelId,
          classId: classRecord.id,
          pathway,
          combinationId: combination?.id ?? null,
          startDate: isoDate("2025-09-01"),
          status: RecordStatus.ACTIVE,
          notes: combination ? `A-Level combination ${combination.code}` : `${classRecord.levelName} pathway`
        }
      });

      const parent = parents[Math.floor(globalStudentIndex / 2) % parents.length];
      await prisma.studentParent.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          relationship: parent.relationship ?? "Guardian",
          canViewReports: true,
          isEmergencyContact: globalStudentIndex % 3 === 0
        }
      });

      const studentProfile = {
        id: student.id,
        userId: user.id,
        classId: classRecord.id,
        levelId: classRecord.levelId,
        levelName: classRecord.levelName,
        name: user.name,
        email: user.email,
        gender,
        hasDisability,
        disabilityType,
        studentCode,
        pathway,
        combinationId: combination?.id ?? null,
        globalIndex: globalStudentIndex,
        classIndex: localIndex
      };
      students.push(studentProfile);
      classStudents.push(studentProfile);
      globalStudentIndex++;
    }

    studentsByClassId.set(classRecord.id, classStudents);
  }

  await prisma.learnerSupportPlan.createMany({
    data: students.filter((student) => student.hasDisability).map((student, index) => ({
      studentId: student.id,
      schoolId: school.id,
      coordinatorId: teachers[index % teachers.length].id,
      title: `${student.name} inclusive learning plan`,
      disabilityType: student.disabilityType,
      accommodations: student.disabilityType === "Visual impairment"
        ? ["Large print materials", "Front-row seating", "Oral explanation of visual content"]
        : student.disabilityType === "Hearing impairment"
          ? ["Face the learner when speaking", "Written instructions", "Peer note buddy"]
          : ["Flexible response mode", "Extra guided practice", "Accessible seating"],
      classroomStrategies: ["Peer support", "Short check-ins", "Concrete examples before abstract work"],
      examAccommodations: ["Extra time where approved", "Accessible print format", "Quiet seating"],
      notes: "Reviewed by class teacher and parent; update after next assessment cycle.",
      reviewDate: addDays(SEED_NOW, 30),
      status: index % 5 === 0 ? SupportPlanStatus.REVIEW_DUE : SupportPlanStatus.ACTIVE,
      createdById: adminUser.id,
      updatedById: teachers[index % teachers.length].userId
    }))
  });

  const badges = [];
  for (const badge of [
    { name: "Attendance Champion", criteria: "Maintain strong attendance for two weeks", icon: "calendar-check", rewardPoints: 20 },
    { name: "Reading Builder", criteria: "Complete reading practice", icon: "book-open", rewardPoints: 15 },
    { name: "Math Practice Star", criteria: "Complete Mathematics practice", icon: "calculator", rewardPoints: 15 },
    { name: "Community Helper", criteria: "Complete a Social and Religious Studies activity", icon: "hand-heart", rewardPoints: 10 }
  ]) {
    badges.push(await prisma.badge.create({ data: badge }));
  }

  await prisma.goal.createMany({
    data: students.map((student) => ({
      studentId: student.id,
      type: student.globalIndex % 2 === 0 ? GoalType.WEEKLY : GoalType.READING,
      target: student.globalIndex % 2 === 0 ? 5 : 3,
      progress: 1 + (student.globalIndex % 4),
      dueDate: addDays(SEED_NOW, 7),
      status: GoalStatus.ACTIVE
    }))
  });

  await prisma.studentBadge.createMany({
    data: students.slice(0, 48).map((student, index) => ({
      studentId: student.id,
      badgeId: badges[index % badges.length].id,
      sourceActivity: index % 2 === 0 ? "lesson-progress" : "attendance"
    }))
  });

  const courses: CourseSeed[] = [];
  const firstLessonByClassId = new Map<string, string>();

  for (const classRecord of classes) {
    const levelSubjects = subjectsByLevelName.get(classRecord.levelName) ?? [];
    const classStudents = studentsByClassId.get(classRecord.id) ?? [];

    for (const [subjectIndex, subject] of levelSubjects.entries()) {
      const teacher = assignmentByClassSubject.get(subjectKey(classRecord.id, subject.id)) ?? teachers[0];
      const course = await prisma.course.create({
        data: {
          schoolId: school.id,
          teacherId: teacher.id,
          subjectId: subject.id,
          levelId: classRecord.levelId,
          title: `${classRecord.name} ${subject.name} - ${ACTIVE_TERM_NAME}`,
          description: `${ACTIVE_TERM_NAME} learning path for ${classRecord.name} ${subject.name} at ${SCHOOL_NAME}.`,
          order: subjectIndex + 1,
          academicYear: ACADEMIC_YEAR_NAME,
          term: ACTIVE_TERM_NAME,
          language: subject.name === "Kinyarwanda" ? "rw" : subject.name === "French" ? "fr" : "en",
          learningObjectives: `Build ${subject.name} competencies through practice, discussion, feedback, and inclusive activities.`,
          coverImage: `/demo/courses/${classRecord.name.toLowerCase()}-${slug(subject.name)}.png`,
          status: ContentStatus.PUBLISHED
        }
      });

      const units = [];
      for (const [unitIndex, unit] of unitBlueprints(subject.name, classRecord.name).entries()) {
        units.push(await prisma.unit.create({
          data: {
            courseId: course.id,
            title: unit.title,
            description: unit.description,
            keyCompetence: unit.keyCompetence,
            genericCompetencies: unit.genericCompetencies,
            crossCuttingIssues: unit.crossCuttingIssues,
            isOfflineFriendly: true,
            order: unitIndex + 1
          }
        }));
      }

      const lessonPlan = await prisma.lessonPlan.create({
        data: {
          teacherId: teacher.id,
          classId: classRecord.id,
          subjectId: subject.id,
          title: `${classRecord.name} ${subject.name}: Competence-Based Lesson`,
          objectives: `Learners will practise core ${subject.name} skills and explain one connection to home or community life.`,
          competencies: ["Critical thinking", "Communication", "Cooperation"],
          crossCuttingIssues: ["Inclusive education", "Gender education"],
          teachingActivities: "Review prior knowledge, demonstrate the task, guide group practice, and check understanding.",
          learningActivities: "Learners answer warm-up questions, work in pairs, present findings, and complete an exit ticket.",
          materialsNeeded: ["Learner books", "Teacher guide", "Manila paper", "Locally available materials"],
          assessmentStrategy: "Observation checklist, oral questioning, written exit ticket, and feedback during group work.",
          homework: "Complete one home practice activity and ask a parent or guardian to sign.",
          notes: "Use flexible grouping and accessible materials for learners with support needs.",
          duration: 40
        }
      });

      const lessons = [];
      for (let lessonIndex = 0; lessonIndex < 3; lessonIndex++) {
        const lesson = await prisma.lesson.create({
          data: {
            courseId: course.id,
            unitId: units[lessonIndex === 0 ? 0 : 1]?.id,
            teacherId: teacher.id,
            schoolId: school.id,
            classId: classRecord.id,
            linkedLessonPlanId: lessonIndex === 0 ? lessonPlan.id : null,
            title: `${subject.name} Lesson ${lessonIndex + 1}: ${lessonIndex === 0 ? "Explore" : lessonIndex === 1 ? "Practise" : "Apply"}`,
            description: `Competence-based ${subject.name} lesson for ${classRecord.name}.`,
            topic: lessonIndex === 0 ? "Foundation" : lessonIndex === 1 ? "Guided practice" : "Application",
            body: [
              `Class: ${classRecord.name}`,
              `Subject: ${subject.name}`,
              "Start with a short review question.",
              "Use pair or group practice with clear roles.",
              "Close with an exit ticket and teacher feedback."
            ].join("\n\n"),
            learningObjectives: `Learners will demonstrate ${subject.name} understanding through oral, written, or practical work.`,
            learnerActivities: "Think-pair-share, practice task, presentation, and exit ticket.",
            teacherActivities: "Model the task, circulate for support, ask probing questions, and give feedback.",
            assessmentCriteria: "Accuracy, participation, explanation, and improvement from feedback.",
            genericCompetencies: ["Communication", "Problem solving"],
            crossCuttingIssues: ["Inclusive education", "Gender education"],
            homework: "Review the lesson and complete the short practice task.",
            notes: "Support learners who need large print, peer reading, movement breaks, or oral response options.",
            attachments: [`/demo/resources/${slug(subject.name)}-${classRecord.name.toLowerCase()}-worksheet.pdf`],
            contentType: ContentType.MIXED,
            isOfflineFriendly: true,
            estimatedMinutes: 40,
            order: lessonIndex + 1,
            scheduledAt: addDays(SEED_NOW, lessonIndex + subjectIndex, 8 + (subjectIndex % 4), 0),
            publishedAt: addDays(SEED_NOW, -7 + lessonIndex),
            status: ContentStatus.PUBLISHED
          }
        });
        lessons.push(lesson);
      }

      if (!firstLessonByClassId.has(classRecord.id)) {
        firstLessonByClassId.set(classRecord.id, lessons[0].id);
      }

      const assignment = await prisma.assignment.create({
        data: {
          courseId: course.id,
          lessonId: lessons[1].id,
          title: `${subject.name} Home Practice`,
          description: `A short ${subject.name} practice activity connected to the current unit.`,
          dueDate: addDays(SEED_NOW, 5),
          points: 100
        }
      });

      const quiz = await prisma.quiz.create({
        data: {
          courseId: course.id,
          lessonId: lessons[2].id,
          schoolId: school.id,
          teacherId: teacher.id,
          classId: classRecord.id,
          title: `${classRecord.name} ${subject.name} Mastery Check`,
          passMark: 70,
          attemptsAllowed: 3,
          timeLimit: 20,
          assignedAt: addDays(SEED_NOW, -2, 8, 0),
          dueAt: addDays(SEED_NOW, 5, 16, 0),
          averageScore: 71 + ((subjectIndex + classRecord.levelOrder) % 15),
          completionRate: 60 + ((subjectIndex * 4) % 35),
          randomizeQuestions: true,
          showResults: true,
          topic: `${subject.name} ${ACTIVE_TERM_NAME} checkpoint`,
          status: ContentStatus.PUBLISHED
        }
      });

      const createdQuizQuestions = [];
      for (const [questionIndex, question] of quizQuestionsFor(subject.name).entries()) {
        createdQuizQuestions.push(await prisma.quizQuestion.create({
          data: {
            quizId: quiz.id,
            questionText: question.questionText,
            type: question.type,
            options: question.options,
            answer: question.answer,
            explanation: question.explanation,
            points: question.points,
            order: questionIndex + 1,
            status: RecordStatus.ACTIVE
          }
        }));
      }

      await prisma.activity.create({
        data: {
          courseId: course.id,
          unitId: units[0]?.id,
          lessonId: lessons[2].id,
          quizId: quiz.id,
          type: ActivityType.QUIZ,
          title: quiz.title,
          description: `Interactive checkpoint for ${subject.name}.`,
          order: 1,
          status: ContentStatus.PUBLISHED
        }
      });

      await prisma.activity.create({
        data: {
          courseId: course.id,
          unitId: units[1]?.id,
          lessonId: lessons[1].id,
          assignmentId: assignment.id,
          type: ActivityType.HOMEWORK,
          title: assignment.title,
          description: assignment.description,
          order: 2,
          status: ContentStatus.PUBLISHED
        }
      });

      const assessment = await prisma.assessment.create({
        data: {
          schoolId: school.id,
          courseId: course.id,
          unitId: units[0]?.id,
          lessonId: lessons[1].id,
          teacherId: teacher.id,
          classId: classRecord.id,
          subjectId: subject.id,
          title: `${classRecord.name} ${subject.name} CAT`,
          description: `Continuous assessment for ${classRecord.name} ${subject.name}.`,
          type: AssessmentType.CAT,
          totalMarks: 50,
          passMark: 25,
          passingScore: 50,
          startDate: addDays(SEED_NOW, -3, 8, 0),
          dueDate: addDays(SEED_NOW, 4, 16, 0),
          durationMinutes: 40,
          instructions: "Read each question carefully. You may answer in writing, orally with teacher support, or using accessible materials when approved.",
          rubric: {
            criteria: ["Accuracy", "Explanation", "Presentation"],
            accommodations: ["large print", "oral response", "peer reading"]
          },
          visibility: AssessmentVisibility.PUBLISHED,
          allowLateSubmission: true,
          aiGenerated: false,
          showResults: true,
          randomizeQuestions: false,
          attemptsAllowed: 1
        }
      });

      const createdAssessmentQuestions = [];
      for (const [questionIndex, question] of assessmentQuestionsFor(subject.name).entries()) {
        createdAssessmentQuestions.push(await prisma.assessmentQuestion.create({
          data: {
            assessmentId: assessment.id,
            questionText: question.questionText,
            type: question.type,
            options: question.options as Prisma.InputJsonValue | null,
            correctAnswer: question.correctAnswer as Prisma.InputJsonValue | null,
            marks: question.marks,
            explanation: question.explanation,
            orderIndex: questionIndex + 1,
            difficulty: questionIndex === 0 ? "core" : "application",
            status: RecordStatus.ACTIVE
          }
        }));
      }

      await prisma.courseEnrollment.createMany({
        data: classStudents.map((student, index) => ({
          courseId: course.id,
          studentId: student.id,
          progressPercent: (index * 9 + subjectIndex * 7) % 101,
          lastAccessedAt: addDays(SEED_NOW, -(index % 6), 15, 0),
          completedAt: subjectIndex === 0 && index < 2 ? addDays(SEED_NOW, -1, 11, 0) : null
        }))
      });

      await prisma.lessonProgress.createMany({
        data: classStudents.map((student, index) => ({
          studentId: student.id,
          lessonId: lessons[index % lessons.length].id,
          status: index % 5 === 0 ? "COMPLETED" : index % 3 === 0 ? "IN_PROGRESS" : "NOT_STARTED",
          timeSpent: index % 5 === 0 ? 2400 : index % 3 === 0 ? 900 : 0,
          startedAt: index % 3 === 0 || index % 5 === 0 ? addDays(SEED_NOW, -(index % 4), 9, 0) : null,
          completedAt: index % 5 === 0 ? addDays(SEED_NOW, -(index % 3), 10, 0) : null,
          deviceType: index % 2 === 0 ? "web" : "mobile"
        }))
      });

      for (const [index, student] of classStudents.slice(0, 8).entries()) {
        const assignmentScore = 55 + ((student.globalIndex * 5 + subjectIndex * 4) % 43);
        await prisma.assignmentSubmission.create({
          data: {
            assignmentId: assignment.id,
            studentId: student.id,
            content: `Completed ${subject.name} home practice with examples from home and school.`,
            status: index % 7 === 0 ? "RETURNED" : "GRADED",
            submittedAt: addDays(SEED_NOW, -(index % 4), 17, 0),
            feedback: assignmentScore >= 70 ? "Good effort and clear explanation." : "Revise the example and try one more practice item.",
            grade: assignmentScore
          }
        });

        let correctCount = 0;
        const answerRecords: Array<{ questionId: string; selectedAnswer: Prisma.InputJsonValue; isCorrect: boolean }> = [];
        for (const [questionIndex, question] of createdQuizQuestions.entries()) {
          const isCorrect = (student.globalIndex + subjectIndex + questionIndex) % 4 !== 0;
          if (isCorrect) correctCount++;
          const options = Array.isArray(question.options) ? question.options as string[] : [];
          const correctAnswer = question.answer as string;
          answerRecords.push({
            questionId: question.id,
            selectedAnswer: isCorrect ? correctAnswer : (options.find((option) => option !== correctAnswer) ?? options[0] ?? "No answer"),
            isCorrect
          });
        }

        const attempt = await prisma.quizAttempt.create({
          data: {
            studentId: student.id,
            quizId: quiz.id,
            score: Math.round((correctCount / createdQuizQuestions.length) * 100),
            timeUsed: 6 + (index % 8),
            status: QuizAttemptStatus.SUBMITTED,
            submittedAt: addDays(SEED_NOW, -(index % 5), 13, 0)
          }
        });

        await prisma.quizAnswer.createMany({
          data: answerRecords.map((answer) => ({
            attemptId: attempt.id,
            questionId: answer.questionId,
            selectedAnswer: answer.selectedAnswer,
            isCorrect: answer.isCorrect
          }))
        });

        const submissionAnswers: Record<string, Prisma.InputJsonValue> = {};
        let assessmentScore = 0;
        for (const [questionIndex, question] of createdAssessmentQuestions.entries()) {
          const isCorrect = (student.globalIndex + subjectIndex + questionIndex) % 5 !== 0;
          if (question.type === QuestionType.MULTIPLE_CHOICE) {
            const options = Array.isArray(question.options) ? question.options as string[] : [];
            submissionAnswers[question.id] = isCorrect
              ? question.correctAnswer as Prisma.InputJsonValue
              : options.find((option) => option !== question.correctAnswer) ?? options[0] ?? "No answer";
          } else if (question.type === QuestionType.TRUE_FALSE) {
            submissionAnswers[question.id] = isCorrect
              ? question.correctAnswer as Prisma.InputJsonValue
              : question.correctAnswer === "True" ? "False" : "True";
          } else {
            submissionAnswers[question.id] = isCorrect
              ? "A clear answer with an example from school life."
              : "Partial answer that needs more detail.";
          }
          assessmentScore += isCorrect ? question.marks : Math.floor(question.marks * 0.45);
        }

        const assessmentSubmission = await prisma.assessmentSubmission.create({
          data: {
            assessmentId: assessment.id,
            studentId: student.id,
            status: AssessmentSubmissionStatus.MARKED,
            answers: submissionAnswers,
            submittedAt: addDays(SEED_NOW, -2, 14, index),
            score: assessmentScore,
            feedback: assessmentScore >= 35 ? "Good competence progress. Keep practising explanations." : "Needs guided revision and one-to-one feedback.",
            markedBy: teacher.id,
            markedAt: addDays(SEED_NOW, -1, 10, index),
            aiAssisted: index % 4 === 0,
            aiFeedback: index % 4 === 0 ? { summary: "Suggested short remedial practice and vocabulary support." } : undefined,
            questionMarking: Object.fromEntries(createdAssessmentQuestions.map((question) => [question.id, { marks: question.marks }]))
          }
        });

        await prisma.submissionFeedback.create({
          data: {
            submissionId: assessmentSubmission.id,
            teacherId: teacher.id,
            comment: assessmentScore >= 35 ? "Strong work. Add more details in written explanations." : "Let us revise this skill in a small group.",
            rubricScores: {
              accuracy: Math.min(5, Math.max(1, Math.round(assessmentScore / 10))),
              communication: 4,
              effort: 5
            },
            strengths: assessmentScore >= 35 ? ["Good effort", "Clear examples"] : ["Attempted every question"],
            improvements: assessmentScore >= 35 ? ["Use complete sentences"] : ["Review key vocabulary", "Practise one more example"],
            nextSteps: assessmentScore >= 35 ? "Complete the extension question." : "Attend the support group on Friday."
          }
        });
      }

      if (subjectIndex === 0) {
        for (const student of classStudents.slice(0, 2)) {
          await prisma.certificate.create({
            data: {
              studentId: student.id,
              courseId: course.id,
              certificateUrl: `/certificates/${slug(SCHOOL_NAME)}-${student.studentCode}-${slug(subject.name)}.pdf`,
              issuedAt: addDays(SEED_NOW, -1, 12, 0)
            }
          });
        }
      }

      await prisma.libraryResource.create({
        data: {
          title: `${classRecord.name} ${subject.name} Learner Resource`,
          type: subject.name === "English" || subject.name === "Kinyarwanda" ? LibraryResourceType.STORY : LibraryResourceType.WORKSHEET,
          levelId: classRecord.levelId,
          subjectId: subject.id,
          fileUrl: `/library/${classRecord.name.toLowerCase()}-${slug(subject.name)}.pdf`,
          language: subject.name === "Kinyarwanda" ? "rw" : subject.name === "French" ? "fr" : "en",
          description: `Offline-friendly learner resource for ${classRecord.name} ${subject.name}.`,
          downloadable: true
        }
      });

      const teacherResource = await prisma.teacherResource.create({
        data: {
          schoolId: school.id,
          ownerId: teacher.userId,
          classId: classRecord.id,
          subjectId: subject.id,
          courseId: course.id,
          lessonId: lessons[0].id,
          className: classRecord.name,
          subjectName: subject.name,
          title: `${classRecord.name} ${subject.name} Teacher Guide`,
          description: "Scheme of work extract, lesson notes, and inclusive classroom prompts.",
          type: TeacherResourceType.PDF,
          fileSize: 240000 + subjectIndex * 1000,
          fileUrl: `/teacher/resources/${classRecord.name.toLowerCase()}-${slug(subject.name)}-guide.pdf`,
          storageProvider: "LOCAL",
          storagePath: `teacher/resources/${classRecord.name.toLowerCase()}-${slug(subject.name)}-guide.pdf`,
          originalName: `${classRecord.name}-${slug(subject.name)}-teacher-guide.pdf`,
          mimeType: "application/pdf",
          topic: units[0]?.title ?? subject.name,
          tags: [classRecord.name, subject.name, "cbc", "inclusive"],
          sharedScope: "SCHOOL",
          status: RecordStatus.ACTIVE,
          createdById: teacher.userId,
          updatedById: teacher.userId
        }
      });

      await prisma.teacherLessonResource.create({
        data: {
          schoolId: school.id,
          resourceId: teacherResource.id,
          lessonId: lessons[0].id,
          title: teacherResource.title,
          type: TeacherResourceType.PDF,
          fileUrl: teacherResource.fileUrl,
          status: RecordStatus.ACTIVE,
          createdById: teacher.userId,
          updatedById: teacher.userId
        }
      });

      courses.push({
        id: course.id,
        classId: classRecord.id,
        levelName: classRecord.levelName,
        subjectId: subject.id,
        subjectName: subject.name,
        teacherId: teacher.id,
        teacherUserId: teacher.userId,
        firstLessonId: lessons[0].id,
        firstUnitId: units[0].id,
        assignmentId: assignment.id,
        quizId: quiz.id,
        assessmentId: assessment.id
      });
    }
  }

  for (const classRecord of classes) {
    const firstCourse = courses.find((course) => course.classId === classRecord.id);
    if (!firstCourse) continue;

    const teacher = teachers.find((item) => item.id === firstCourse.teacherId) ?? teachers[0];
    await prisma.teacherLessonDeliverySession.create({
      data: {
        schoolId: school.id,
        teacherId: teacher.id,
        classId: classRecord.id,
        lessonId: firstCourse.firstLessonId,
        status: RecordStatus.COMPLETED,
        startedAt: addDays(SEED_NOW, -1, 8, 30),
        endedAt: addDays(SEED_NOW, -1, 9, 10),
        slideIndex: 8,
        notes: "Learners completed pair work and exit tickets.",
        summary: "Most learners understood the task; four learners need follow-up practice.",
        participation: {
          present: 18,
          groups: 5,
          oralResponses: 12,
          supportGiven: 4
        },
        evidenceUrl: `/delivery/${classRecord.name.toLowerCase()}-${firstCourse.firstLessonId}.jpg`,
        createdById: teacher.userId,
        updatedById: teacher.userId
      }
    });
  }

  const schoolDays = [
    "2026-05-08",
    "2026-05-11",
    "2026-05-12",
    "2026-05-13",
    "2026-05-14",
    "2026-05-15",
    "2026-05-18",
    "2026-05-19",
    "2026-05-20",
    "2026-05-21"
  ].map(isoDate);

  const attendanceRows: Prisma.AttendanceRecordCreateManyInput[] = [];
  const attendanceAnalyticsRows: Prisma.AttendanceAnalyticsCreateManyInput[] = [];
  const attendanceStatsByStudent = new Map<string, { present: number; absent: number; late: number; excused: number; total: number }>();

  for (const [dayIndex, date] of schoolDays.entries()) {
    for (const classRecord of classes) {
      const classStudents = studentsByClassId.get(classRecord.id) ?? [];
      const subjects = subjectsByLevelName.get(classRecord.levelName) ?? [];
      const subject = subjects[dayIndex % subjects.length];
      const teacher = assignmentByClassSubject.get(subjectKey(classRecord.id, subject.id)) ?? teachers[0];
      const lessonId = dayIndex % 3 === 0 ? firstLessonByClassId.get(classRecord.id) : null;

      const classCounts = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
      const genderStats: Record<string, { present: number; total: number }> = {};
      const disabilityStats: Record<string, { present: number; total: number }> = {};

      for (const student of classStudents) {
        let status = AttendanceStatus.PRESENT;
        if ((student.classIndex + dayIndex) % 19 === 0) status = AttendanceStatus.ABSENT;
        else if ((student.classIndex + dayIndex) % 13 === 0) status = AttendanceStatus.LATE;
        else if ((student.classIndex + dayIndex) % 17 === 0) status = AttendanceStatus.EXCUSED;

        classCounts[status.toLowerCase() as "present" | "absent" | "late" | "excused"]++;
        const stats = attendanceStatsByStudent.get(student.id) ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        stats[status.toLowerCase() as "present" | "absent" | "late" | "excused"]++;
        stats.total++;
        attendanceStatsByStudent.set(student.id, stats);

        const genderKey = student.gender;
        genderStats[genderKey] ??= { present: 0, total: 0 };
        genderStats[genderKey].total++;
        if (status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE) genderStats[genderKey].present++;

        const disabilityKey = student.hasDisability ? student.disabilityType ?? "Support need" : "No recorded disability";
        disabilityStats[disabilityKey] ??= { present: 0, total: 0 };
        disabilityStats[disabilityKey].total++;
        if (status === AttendanceStatus.PRESENT || status === AttendanceStatus.LATE) disabilityStats[disabilityKey].present++;

        attendanceRows.push({
          schoolId: school.id,
          classId: classRecord.id,
          studentId: student.id,
          teacherId: teacher.id,
          date,
          status,
          academicYearId: academicYear.id,
          termId: activeTerm.id,
          subjectId: subject.id,
          lessonId,
          markedAt: addDays(date, 0, 8, 10),
          markedBy: teacher.id,
          reason: status === AttendanceStatus.ABSENT
            ? "Parent reported illness"
            : status === AttendanceStatus.LATE
              ? "Arrived after morning assembly"
              : status === AttendanceStatus.EXCUSED
                ? "Medical appointment"
                : null,
          createdById: teacher.userId,
          updatedById: teacher.userId
        });
      }

      const total = classStudents.length;
      attendanceAnalyticsRows.push({
        schoolId: school.id,
        classId: classRecord.id,
        date,
        period: "DAILY",
        presentCount: classCounts.present,
        absentCount: classCounts.absent,
        lateCount: classCounts.late,
        excusedCount: classCounts.excused,
        totalStudents: total,
        attendanceRate: total ? Number((((classCounts.present + classCounts.late) / total) * 100).toFixed(2)) : 0,
        metadata: { genderStats, disabilityStats }
      });
    }
  }

  await prisma.attendanceRecord.createMany({ data: attendanceRows });
  await prisma.attendanceAnalytics.createMany({ data: attendanceAnalyticsRows });

  const studentStats = new Map<string, { total: number; count: number }>();
  const markRecordsByStudent = new Map<string, Array<{ subjectName: string; score: number; grade: string }>>();
  const performanceRows: Prisma.PerformanceRecordCreateManyInput[] = [];
  const reportGenerationRows: Prisma.ReportGenerationLogCreateManyInput[] = [];

  for (const classRecord of classes) {
    const classStudents = studentsByClassId.get(classRecord.id) ?? [];
    const subjects = subjectsByLevelName.get(classRecord.levelName) ?? [];

    for (const [subjectIndex, subject] of subjects.entries()) {
      const teacher = assignmentByClassSubject.get(subjectKey(classRecord.id, subject.id)) ?? teachers[0];
      const assessmentKey = `${ACTIVE_TERM_NAME.toUpperCase().replace(" ", "")}-CAT-${slug(subject.name).toUpperCase()}`;
      const isApproved = subjectIndex < 6;
      const markSubmission = await prisma.markSubmission.create({
        data: {
          schoolId: school.id,
          classId: classRecord.id,
          subjectId: subject.id,
          academicYearId: academicYear.id,
          termId: activeTerm.id,
          teacherId: teacher.id,
          assessmentType: "CAT",
          assessmentKey,
          maxScore: 100,
          status: isApproved ? MarkSubmissionStatus.APPROVED : MarkSubmissionStatus.SUBMITTED,
          isLocked: isApproved,
          submittedAt: addDays(SEED_NOW, -4, 15, subjectIndex),
          reviewedById: isApproved ? headteacherUser.id : null,
          reviewedAt: isApproved ? addDays(SEED_NOW, -2, 10, subjectIndex) : null,
          reviewComment: isApproved ? "Approved after sampling scripts and checking totals." : null,
          createdById: teacher.userId,
          updatedById: teacher.userId
        }
      });

      await prisma.markSubmissionEvent.create({
        data: {
          submissionId: markSubmission.id,
          actorId: teacher.userId,
          action: "SUBMIT",
          fromStatus: MarkSubmissionStatus.DRAFT,
          toStatus: MarkSubmissionStatus.SUBMITTED,
          comment: `${subject.name} CAT marks submitted for ${classRecord.name}.`,
          metadata: { className: classRecord.name, subjectName: subject.name }
        }
      });

      if (isApproved) {
        await prisma.markSubmissionEvent.create({
          data: {
            submissionId: markSubmission.id,
            actorId: headteacherUser.id,
            action: "APPROVE",
            fromStatus: MarkSubmissionStatus.SUBMITTED,
            toStatus: MarkSubmissionStatus.APPROVED,
            comment: "Approved for report card use.",
            metadata: { reviewer: headteacherUser.email }
          }
        });
      }

      const scoreRows = classStudents
        .map((student) => ({ student, score: scoreFor(student, subjectIndex, classRecord.levelOrder) }))
        .sort((a, b) => b.score - a.score);
      const rankByStudentId = new Map(scoreRows.map((row, index) => [row.student.id, index + 1]));

      for (const student of classStudents) {
        const score = scoreFor(student, subjectIndex, classRecord.levelOrder);
        const percentage = Number(score.toFixed(2));
        const grade = getGradeFromPercentage(percentage);
        const mark = await prisma.mark.create({
          data: {
            submissionId: markSubmission.id,
            studentId: student.id,
            teacherId: teacher.id,
            schoolId: school.id,
            classId: classRecord.id,
            subjectId: subject.id,
            academicYearId: academicYear.id,
            termId: activeTerm.id,
            assessmentType: "CAT",
            assessmentKey,
            score,
            maxScore: 100,
            percentage,
            grade,
            rank: rankByStudentId.get(student.id),
            teacherComments: performanceLevel(score),
            headteacherComments: isApproved ? getRemarks(percentage) : null,
            status: isApproved ? "APPROVED" : "SUBMITTED",
            isLocked: isApproved,
            submittedAt: addDays(SEED_NOW, -4, 15, subjectIndex),
            reviewedById: isApproved ? headteacherUser.id : null,
            reviewedAt: isApproved ? addDays(SEED_NOW, -2, 10, subjectIndex) : null,
            approvedAt: isApproved ? addDays(SEED_NOW, -2, 11, subjectIndex) : null
          }
        });

        if (subjectIndex < 2) {
          performanceRows.push({
            schoolId: school.id,
            classId: classRecord.id,
            studentId: student.id,
            teacherId: teacher.id,
            subjectName: subject.name,
            assessmentType: "CAT",
            score,
            maxScore: 100,
            performanceLevel: performanceLevel(score),
            recordedAt: addDays(SEED_NOW, -4, 14, subjectIndex),
            status: RecordStatus.ACTIVE,
            createdById: teacher.userId,
            updatedById: teacher.userId
          });
        }

        if (student.classIndex < 2) {
          await prisma.markAuditLog.create({
            data: {
              markId: mark.id,
              changedById: teacher.userId,
              action: "SCORE_UPDATE",
              oldScore: Math.max(0, score - 3),
              newScore: score,
              oldValue: { score: Math.max(0, score - 3) },
              newValue: { score },
              reason: "Corrected after second marking review."
            }
          });
        }

        const stats = studentStats.get(student.id) ?? { total: 0, count: 0 };
        stats.total += score;
        stats.count++;
        studentStats.set(student.id, stats);

        const marks = markRecordsByStudent.get(student.id) ?? [];
        marks.push({ subjectName: subject.name, score, grade });
        markRecordsByStudent.set(student.id, marks);
      }
    }

    reportGenerationRows.push({
      schoolId: school.id,
      classId: classRecord.id,
      academicYearId: academicYear.id,
      termId: activeTerm.id,
      generatedById: headteacherUser.id,
      format: "PDF",
      status: "COMPLETED"
    });
  }

  await prisma.performanceRecord.createMany({ data: performanceRows });
  await prisma.reportGenerationLog.createMany({ data: reportGenerationRows });

  const nationalExamClasses = [
    { levelName: "P6", examLevel: NationalExamLevel.P6 },
    { levelName: "S3", examLevel: NationalExamLevel.S3 },
    { levelName: "S6", examLevel: NationalExamLevel.S6 }
  ];

  for (const examClass of nationalExamClasses) {
    const classRecord = classes.find((item) => item.levelName === examClass.levelName);
    if (!classRecord) continue;
    const classStudents = studentsByClassId.get(classRecord.id) ?? [];
    const examSubjects = (subjectsByLevelName.get(classRecord.levelName) ?? [])
      .filter((subject) => {
        const subjectRecord = subjectsByLevelName.get(classRecord.levelName)?.find((item) => item.id === subject.id);
        return subjectRecord?.name !== "Physical Education and Sports";
      })
      .slice(0, examClass.examLevel === NationalExamLevel.S6 ? 6 : 8);

    for (const [studentIndex, student] of classStudents.entries()) {
      const registration = await prisma.nationalExamRegistration.create({
        data: {
          studentId: student.id,
          schoolId: school.id,
          classId: classRecord.id,
          academicYearId: academicYear.id,
          examLevel: examClass.examLevel,
          candidateNumber: `${examClass.levelName}-${String(studentIndex + 1).padStart(4, "0")}-KLS`,
          status: student.hasDisability ? ExamRegistrationStatus.READY : ExamRegistrationStatus.VERIFIED,
          accommodations: student.hasDisability ? { support: student.disabilityType, needsAccessibleMaterials: true } : undefined,
          registeredAt: addDays(SEED_NOW, -14, 10, studentIndex)
        }
      });

      await prisma.nationalExamResult.createMany({
        data: examSubjects.map((subject, subjectIndex) => {
          const score = scoreFor(student, subjectIndex, classRecord.levelOrder);
          return {
            registrationId: registration.id,
            studentId: student.id,
            subjectId: subject.id,
            examLevel: examClass.examLevel,
            score,
            grade: getGradeFromPercentage(score),
            aggregatePoints: Math.max(1, 10 - Math.floor(score / 10)),
            remarks: performanceLevel(score)
          };
        })
      });
    }
  }

  const riskStudents = students.filter((student) => student.classIndex === 0 || student.classIndex === 3).slice(0, 12);
  for (const [index, student] of riskStudents.entries()) {
    const classRecord = classes.find((item) => item.id === student.classId) ?? classes[0];
    const firstCourse = courses.find((course) => course.classId === student.classId) ?? courses[0];
    const teacher = teachers.find((item) => item.id === firstCourse.teacherId) ?? teachers[0];
    const attendance = attendanceStatsByStudent.get(student.id) ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    const severity = attendance.absent >= 2 ? LearnerRiskLevel.HIGH : LearnerRiskLevel.MEDIUM;

    await prisma.studentRiskScore.create({
      data: {
        studentId: student.id,
        riskLevel: severity,
        score: severity === LearnerRiskLevel.HIGH ? 78 : 56,
        factors: {
          absences: attendance.absent,
          lateArrivals: attendance.late,
          latestPerformanceBand: performanceLevel(scoreFor(student, index % 2, classRecord.levelOrder)),
          supportPlan: student.hasDisability ? "active" : "not required"
        },
        predictions: {
          nextTwoWeeks: severity === LearnerRiskLevel.HIGH ? "Needs immediate follow-up" : "Monitor with teacher support"
        },
        lastCalculated: SEED_NOW
      }
    });

    await prisma.attendanceAlert.create({
      data: {
        schoolId: school.id,
        studentId: student.id,
        type: attendance.absent >= 2 ? "ABSENCE_PATTERN" : "LATE_PATTERN",
        severity,
        message: `${student.name} needs attendance follow-up in ${classRecord.name}.`,
        resolved: index % 4 === 0,
        createdAt: addDays(SEED_NOW, -1, 9, index)
      }
    });

    await prisma.intervention.create({
      data: {
        schoolId: school.id,
        classId: student.classId,
        studentId: student.id,
        teacherId: teacher.id,
        riskLevel: severity,
        title: severity === LearnerRiskLevel.HIGH ? "Attendance and learning support" : "Small-group practice support",
        recommendation: student.hasDisability
          ? "Review the learner support plan, provide accessible materials, and contact the parent this week."
          : "Schedule a short remedial group, check homework completion, and contact the parent if attendance drops.",
        dueDate: addDays(SEED_NOW, 7),
        status: RecordStatus.ACTIVE,
        createdById: teacher.userId,
        updatedById: teacher.userId
      }
    });
  }

  const reportComments: Prisma.ReportCommentCreateManyInput[] = [];
  for (const classRecord of classes) {
    const classStudents = studentsByClassId.get(classRecord.id) ?? [];
    const ranked = classStudents
      .map((student) => {
        const stats = studentStats.get(student.id) ?? { total: 0, count: 1 };
        return { student, average: Number((stats.total / stats.count).toFixed(2)), total: Number(stats.total.toFixed(2)) };
      })
      .sort((a, b) => b.average - a.average);
    const rankByStudentId = new Map(ranked.map((row, index) => [row.student.id, index + 1]));

    for (const row of ranked) {
      const attendance = attendanceStatsByStudent.get(row.student.id) ?? { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      const grade = getGradeFromPercentage(row.average);
      await prisma.reportCard.create({
        data: {
          studentId: row.student.id,
          classId: classRecord.id,
          academicYearId: academicYear.id,
          termId: activeTerm.id,
          totalMarks: row.total,
          averagePercentage: row.average,
          grade,
          classRank: rankByStudentId.get(row.student.id),
          attendanceSummary: `${attendance.present} present, ${attendance.late} late, ${attendance.absent} absent, ${attendance.excused} excused out of ${attendance.total} school days.`,
          teacherComments: row.average >= 70 ? "Good progress this term. Keep practising consistently." : "Needs regular practice and teacher follow-up.",
          headteacherComments: row.average >= 70 ? "Approved. Continue supporting the learner's strengths." : "Approved with support plan and parent follow-up.",
          promotionRecommendation: row.average >= 50 ? "PROMOTED" : "REPEATED",
          status: "APPROVED",
          approvedById: headteacherUser.id,
          approvedAt: addDays(SEED_NOW, -1, 15, 0),
          verificationCode: `KL-${row.student.studentCode}-${ACTIVE_TERM_NAME.replace(" ", "")}`,
          pdfUrl: `/uploads/reports/${slug(SCHOOL_NAME)}-${row.student.studentCode}-${slug(ACTIVE_TERM_NAME)}.pdf`,
          pdfGeneratedAt: addDays(SEED_NOW, -1, 14, 30),
          attendanceData: attendance,
          reportData: {
            subjects: markRecordsByStudent.get(row.student.id) ?? [],
            className: classRecord.name,
            academicYear: ACADEMIC_YEAR_NAME,
            term: ACTIVE_TERM_NAME
          },
          aiInsights: {
            summary: row.average >= 70 ? "Learner is progressing well." : "Learner may benefit from targeted practice.",
            supportNeeds: row.student.hasDisability ? row.student.disabilityType : null
          }
        }
      });

      reportComments.push(
        {
          studentId: row.student.id,
          academicYearId: academicYear.id,
          termId: activeTerm.id,
          commentType: "TEACHER",
          commentText: row.average >= 70 ? "Consistent participation and strong progress." : "Needs more practice and regular attendance.",
          createdById: teachers[0].userId
        },
        {
          studentId: row.student.id,
          academicYearId: academicYear.id,
          termId: activeTerm.id,
          commentType: "HEADTEACHER",
          commentText: "Reviewed and approved for parent access.",
          createdById: headteacherUser.id
        }
      );
    }
  }

  await prisma.reportComment.createMany({ data: reportComments });

  await prisma.studentPromotion.createMany({
    data: students.map((student) => ({
      studentId: student.id,
      schoolId: school.id,
      fromClassId: null,
      toClassId: student.classId,
      academicYear: ACADEMIC_YEAR_NAME,
      status: PromotionStatus.PROMOTED,
      reason: "Registered into current class for the active academic year.",
      promotedById: headteacherUser.id
    }))
  });

  await prisma.studentTransfer.createMany({
    data: students.slice(0, 3).map((student, index) => ({
      studentId: student.id,
      fromSchoolId: school.id,
      toSchoolId: null,
      reason: index === 0 ? "Family relocation request under review." : "Parent requested transfer consultation.",
      status: TransferStatus.PENDING,
      approvedById: index === 0 ? headteacherUser.id : null,
      transferDate: addDays(SEED_NOW, index)
    }))
  });

  const sampleStudents = students.slice(0, 12);
  for (const [index, student] of sampleStudents.entries()) {
    const conversation = await prisma.aIConversation.create({
      data: {
        studentId: student.id,
        title: index % 2 === 0 ? "Mathematics practice help" : "Reading support"
      }
    });

    await prisma.aIMessage.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: AIMessageRole.USER,
          content: index % 2 === 0 ? "Help me understand fractions." : "Help me read this paragraph.",
          sourceType: AIMessageSourceType.CHAT,
          lessonId: firstLessonByClassId.get(student.classId)
        },
        {
          conversationId: conversation.id,
          role: AIMessageRole.ASSISTANT,
          content: index % 2 === 0
            ? "Start by dividing the whole into equal parts. One of two equal parts is one half."
            : "Read one sentence at a time, underline new words, and say the main idea aloud.",
          sourceType: index % 2 === 0 ? AIMessageSourceType.EXPLAIN_LESSON : AIMessageSourceType.REMEDIAL,
          lessonId: firstLessonByClassId.get(student.classId)
        }
      ]
    });
  }

  await prisma.aIUsageLog.createMany({
    data: [
      ...teachers.slice(0, 6).map((teacher, index) => ({
        userId: teacher.userId,
        feature: index % 2 === 0 ? "lesson-plan" : "quiz-generation",
        model: "gpt-4o-mini",
        inputTokens: 800 + index * 45,
        outputTokens: 1200 + index * 80,
        costEstimate: Number((0.02 + index * 0.004).toFixed(4)),
        createdAt: addDays(SEED_NOW, -index)
      })),
      ...students.slice(0, 6).map((student, index) => ({
        userId: student.userId,
        feature: "student-ai-tutor",
        model: "gpt-4o-mini",
        inputTokens: 250 + index * 25,
        outputTokens: 420 + index * 30,
        costEstimate: Number((0.006 + index * 0.001).toFixed(4)),
        createdAt: addDays(SEED_NOW, -index)
      }))
    ]
  });

  await prisma.teacherAiOutput.createMany({
    data: courses.slice(0, 12).map((course, index) => {
      const classRecord = classes.find((item) => item.id === course.classId) ?? classes[0];
      return {
        schoolId: school.id,
        teacherId: course.teacherUserId,
        taskType: index % 3 === 0 ? "lesson_plan" : index % 3 === 1 ? "assessment" : "parent_message",
        subjectId: course.subjectId,
        subjectName: course.subjectName,
        classId: course.classId,
        className: classRecord.name,
        levelId: classRecord.levelId,
        gradeLevel: classRecord.name,
        topicName: index % 3 === 0 ? "Competence-based lesson activities" : "Term 3 classroom support",
        output: `AI-assisted draft for ${classRecord.name} ${course.subjectName}, reviewed by the teacher before use.`,
        teacherRequest: `Prepare ${course.subjectName} support content for ${classRecord.name}.`,
        title: `${classRecord.name} ${course.subjectName} AI Draft`
      };
    })
  });

  await prisma.aIInsight.createMany({
    data: classes.flatMap((classRecord, index) => [
      {
        schoolId: school.id,
        userId: teachers[index % teachers.length].userId,
        classId: classRecord.id,
        type: AIInsightType.ATTENDANCE_ANALYTICS,
        title: `${classRecord.name} attendance follow-up`,
        summary: "A small group of learners need parent follow-up after recent absence or late arrival patterns.",
        confidence: 0.82,
        recommendations: ["Contact parents", "Check transport barriers", "Review support plans"],
        source: "attendance-records",
        status: RecordStatus.ACTIVE,
        approvedAt: addDays(SEED_NOW, -1, 12, 0),
        createdById: teachers[index % teachers.length].userId,
        updatedById: teachers[index % teachers.length].userId
      },
      {
        schoolId: school.id,
        userId: teachers[index % teachers.length].userId,
        classId: classRecord.id,
        type: AIInsightType.PERFORMANCE_ANALYTICS,
        title: `${classRecord.name} CAT performance pattern`,
        summary: "Most learners are on track, with targeted support needed for vocabulary-heavy questions.",
        confidence: 0.77,
        recommendations: ["Use peer explanation", "Add vocabulary cards", "Give short remedial tasks"],
        source: "marks-and-assessments",
        status: RecordStatus.DRAFT,
        createdById: teachers[index % teachers.length].userId,
        updatedById: teachers[index % teachers.length].userId
      }
    ])
  });

  await prisma.message.createMany({
    data: [
      {
        threadId: "kura-school-leadership",
        senderId: headteacherUser.id,
        recipientId: adminUser.id,
        senderRole: UserRole.HEAD_TEACHER,
        recipientRole: UserRole.ADMIN,
        body: "Please confirm that all Term 3 marks submissions are ready for parent report cards.",
        createdAt: addDays(SEED_NOW, -2, 8, 15)
      },
      {
        threadId: "teacher-parent-p1",
        senderId: teachers[0].userId,
        recipientId: parents[0].userId,
        senderRole: UserRole.TEACHER,
        recipientRole: UserRole.PARENT,
        body: "Your child is making good progress. Please continue the reading practice at home.",
        createdAt: addDays(SEED_NOW, -1, 16, 30)
      },
      {
        threadId: "student-teacher-support",
        senderId: students[0].userId,
        recipientId: teachers[0].userId,
        senderRole: UserRole.STUDENT,
        recipientRole: UserRole.TEACHER,
        body: "Teacher, I need help with today's Mathematics practice.",
        createdAt: addDays(SEED_NOW, 0, 7, 45)
      },
      {
        threadId: "student-teacher-support",
        senderId: teachers[0].userId,
        recipientId: students[0].userId,
        senderRole: UserRole.TEACHER,
        recipientRole: UserRole.STUDENT,
        body: "I will help you during the support period. Bring your exercise book.",
        readAt: addDays(SEED_NOW, 0, 8, 0),
        createdAt: addDays(SEED_NOW, 0, 7, 55)
      }
    ]
  });

  const notifications: Prisma.NotificationCreateManyInput[] = [
    {
      userId: headteacherUser.id,
      title: "Marks ready for approval",
      body: "Term 3 CAT marks are ready for review.",
      type: NotificationType.SYSTEM,
      createdAt: addDays(SEED_NOW, -2, 8, 30)
    },
    {
      userId: adminUser.id,
      title: "Attendance synced",
      body: "Daily attendance analytics have been generated for all classes.",
      type: NotificationType.ATTENDANCE,
      createdAt: addDays(SEED_NOW, -1, 9, 30)
    },
    ...teachers.slice(0, 10).map((teacher, index) => ({
      userId: teacher.userId,
      title: "Lesson schedule",
      body: `You have ${classes[index % classes.length].name} lesson resources ready for today.`,
      type: NotificationType.LESSON_PUBLISHED,
      createdAt: addDays(SEED_NOW, 0, 6, index)
    })),
    ...students.slice(0, 20).map((student, index) => ({
      userId: student.userId,
      title: index % 2 === 0 ? "New quiz available" : "Learning goal updated",
      body: index % 2 === 0 ? "Your class mastery check is open." : "Keep working toward your weekly reading goal.",
      type: index % 2 === 0 ? NotificationType.QUIZ_RESULT : NotificationType.GOAL,
      createdAt: addDays(SEED_NOW, 0, 12, index)
    })),
    ...parents.slice(0, 12).map((parent, index) => ({
      userId: parent.userId,
      title: "Parent report update",
      body: "A Term 3 progress update is ready in the parent portal.",
      type: NotificationType.MESSAGE,
      createdAt: addDays(SEED_NOW, -1, 18, index)
    }))
  ];
  await prisma.notification.createMany({ data: notifications });

  await prisma.permission.createMany({
    data: [
      { key: "school.dashboard.read", description: "View school dashboard metrics" },
      { key: "students.manage", description: "Create and update learner records" },
      { key: "staff.manage", description: "Manage staff and teaching assignments" },
      { key: "marks.approve", description: "Approve submitted marks and report cards" },
      { key: "attendance.manage", description: "Mark and analyse attendance" },
      { key: "ai.teacher.use", description: "Use teacher AI planning tools" }
    ]
  });

  await prisma.auditLog.createMany({
    data: [
      {
        schoolId: school.id,
        userId: adminUser.id,
        role: UserRole.ADMIN,
        action: "SEED_SCHOOL",
        entityType: "School",
        entityId: school.id,
        metadata: { name: school.name, students: 120, teachers: 10 },
        createdAt: addDays(SEED_NOW, -8)
      },
      {
        schoolId: school.id,
        userId: headteacherUser.id,
        role: UserRole.HEAD_TEACHER,
        action: "APPROVE_MARKS",
        entityType: "MarkSubmission",
        metadata: { term: ACTIVE_TERM_NAME },
        createdAt: addDays(SEED_NOW, -2)
      },
      {
        schoolId: school.id,
        userId: teachers[0].userId,
        role: UserRole.TEACHER,
        action: "MARK_ATTENDANCE",
        entityType: "AttendanceRecord",
        metadata: { date: "2026-05-21", className: "P1" },
        createdAt: addDays(SEED_NOW, 0, 8, 15)
      }
    ]
  });

  await prisma.systemSetting.createMany({
    data: [
      {
        schoolId: school.id,
        key: "school.academicCalendar",
        value: {
          academicYear: ACADEMIC_YEAR_NAME,
          activeTerm: ACTIVE_TERM_NAME,
          schoolDaysPerWeek: 5,
          attendanceCutoffTime: "08:00"
        },
        status: RecordStatus.ACTIVE,
        createdById: adminUser.id,
        updatedById: adminUser.id
      },
      {
        schoolId: school.id,
        key: "ai.teacherControls",
        value: {
          lessonPlanning: true,
          quizGeneration: true,
          parentDrafts: true,
          requireTeacherReview: true
        },
        status: RecordStatus.ACTIVE,
        createdById: superAdminUser.id,
        updatedById: superAdminUser.id
      },
      {
        schoolId: null,
        key: "platform.defaultLocale",
        value: { locale: "en-RW", timezone: "Africa/Kigali" },
        status: RecordStatus.ACTIVE,
        createdById: superAdminUser.id,
        updatedById: superAdminUser.id
      }
    ]
  });

  const counts = {
    schools: await prisma.school.count(),
    teachers: await prisma.teacher.count(),
    students: await prisma.student.count(),
    girls: await prisma.student.count({ where: { gender: Gender.FEMALE } }),
    learnersWithDisability: await prisma.student.count({ where: { hasDisability: true } }),
    parents: await prisma.parent.count(),
    classes: await prisma.class.count(),
    subjects: await prisma.subject.count(),
    secondaryCombinations: await prisma.secondaryCombination.count(),
    supportPlans: await prisma.learnerSupportPlan.count(),
    timetablePeriods: await prisma.timetablePeriod.count(),
    nationalExamRegistrations: await prisma.nationalExamRegistration.count(),
    courses: await prisma.course.count(),
    attendanceRecords: await prisma.attendanceRecord.count(),
    marks: await prisma.mark.count(),
    reportCards: await prisma.reportCard.count()
  };

  console.log("\nSeed completed.");
  console.log("Created record counts:", counts);
  console.log("\nDemo accounts, all using password:", DEFAULT_PASSWORD);
  console.log("Head teacher: head.kura@example.com");
  console.log("School admin: admin.kura@example.com");
  console.log("Director of studies: dos.kura@example.com");
  console.log("Teacher: teacher1.kura@example.com through teacher10.kura@example.com");
  console.log("Parent: parent1@example.com through parent60@example.com");
  console.log("Student: student.p1.1.kura@example.com through student.s6.10.kura@example.com");
  console.log("Super admin: super@kuralearn.demo");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
