import type { OpenApiSchemas } from "./openapi.shared.js";

const uuid = { type: "string", format: "uuid" };
const dateTime = { type: "string", format: "date-time" };
const language = { type: "string", enum: ["en", "rw", "fr"], default: "en" };
const unknownObject = { type: "object", additionalProperties: true };
const stringArray = { type: "array", items: { type: "string" }, default: [] };

export const openApiSchemas: OpenApiSchemas = {
  GenericObject: unknownObject,
  ErrorResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
      code: { type: "string" },
      details: unknownObject
    }
  },
  User: {
    type: "object",
    properties: {
      id: uuid,
      email: { type: "string", format: "email" },
      name: { type: "string" },
      role: { type: "string", enum: ["STUDENT", "PARENT", "TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"] }
    }
  },
  AuthResult: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/User" },
      accessToken: { type: "string" },
      refreshToken: { type: "string" }
    }
  },
  RegisterInput: {
    type: "object",
    required: ["email", "password", "name"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
      name: { type: "string", minLength: 2 },
      role: { type: "string", enum: ["STUDENT", "PARENT", "TEACHER", "HEAD_TEACHER", "ADMIN", "SUPER_ADMIN"], default: "STUDENT" }
    }
  },
  LoginInput: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 1 }
    }
  },
  RefreshTokenInput: {
    type: "object",
    required: ["refreshToken"],
    properties: { refreshToken: { type: "string" } }
  },
  ProfileSetupInput: {
    type: "object",
    required: ["fullName", "levelId"],
    properties: {
      fullName: { type: "string", minLength: 2 },
      dateOfBirth: { type: "string", format: "date" },
      levelId: uuid,
      classId: uuid,
      schoolId: uuid,
      interests: stringArray,
      avatar: { type: "string" },
      language
    }
  },
  ProfileUpdateInput: { allOf: [{ $ref: "#/components/schemas/ProfileSetupInput" }], description: "Partial student profile update payload." },
  PlatformProgressInput: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] },
      timeSpent: { type: "integer", minimum: 0 },
      deviceType: { type: "string" }
    }
  },
  PracticeAttemptInput: {
    type: "object",
    properties: {
      lessonId: uuid,
      subjectId: uuid,
      questionId: { type: "string" },
      selectedAnswer: {},
      correctAnswer: {}
    }
  },
  QuizSubmitInput: {
    type: "object",
    properties: {
      answers: { type: "object", additionalProperties: true, default: {} },
      timeUsed: { type: "integer", minimum: 0 }
    }
  },
  GoalCreateInput: {
    type: "object",
    required: ["type", "target"],
    properties: {
      type: { type: "string", enum: ["DAILY", "WEEKLY", "SUBJECT", "READING", "QUIZ_SCORE", "STREAK"] },
      target: { type: "integer", minimum: 1 },
      progress: { type: "integer", minimum: 0, default: 0 },
      dueDate: dateTime
    }
  },
  GoalUpdateInput: {
    type: "object",
    properties: {
      target: { type: "integer", minimum: 1 },
      progress: { type: "integer", minimum: 0 },
      dueDate: dateTime,
      status: { type: "string", enum: ["ACTIVE", "COMPLETED", "PAUSED", "EXPIRED"] }
    }
  },
  PlatformMessageCreateInput: {
    type: "object",
    required: ["recipientId", "body"],
    properties: {
      recipientId: uuid,
      threadId: { type: "string" },
      body: { type: "string", minLength: 1, maxLength: 1000 }
    }
  },
  LearningProgressInput: {
    type: "object",
    properties: {
      completed: { type: "boolean" },
      status: { type: "string", enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] },
      timeSpentSec: { type: "integer", minimum: 0 },
      timeSpent: { type: "integer", minimum: 0 },
      deviceType: { type: "string" }
    }
  },
  LearningQuizSubmitInput: {
    type: "object",
    required: ["answers"],
    properties: {
      answers: { type: "object", additionalProperties: true },
      timeSpentSec: { type: "integer", minimum: 0 },
      timeUsed: { type: "integer", minimum: 0 }
    }
  },
  TeacherClassCreateInput: {
    type: "object",
    required: ["name", "levelId", "subjectName"],
    properties: {
      name: { type: "string", minLength: 2 },
      levelId: uuid,
      subjectName: { type: "string", minLength: 2 },
      performance: { type: "integer", minimum: 0, maximum: 100, default: 0 }
    }
  },
  TeacherClassUpdateInput: { allOf: [{ $ref: "#/components/schemas/TeacherClassCreateInput" }], description: "Partial class update payload." },
  TeacherStudentCreateInput: {
    type: "object",
    required: ["classId", "name", "email"],
    properties: { classId: uuid, name: { type: "string", minLength: 2 }, email: { type: "string", format: "email" }, language, interests: stringArray }
  },
  TeacherStudentUpdateInput: { allOf: [{ $ref: "#/components/schemas/TeacherStudentCreateInput" }], description: "Partial student update payload." },
  TeacherLessonCreateInput: {
    type: "object",
    required: ["classId", "subjectId", "lessonContentHtml"],
    properties: {
      classId: uuid,
      subjectId: { type: "string" },
      lessonContentHtml: { type: "string" },
      status: { type: "string", enum: ["draft", "published"], default: "draft" }
    }
  },
  TeacherLessonUpdateInput: {
    allOf: [{ $ref: "#/components/schemas/TeacherLessonCreateInput" }],
    properties: { status: { type: "string", enum: ["DRAFT", "PUBLISHED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] } }
  },
  DeliverySessionInput: {
    type: "object",
    required: ["lessonPlanId", "classId"],
    properties: { lessonPlanId: uuid, classId: uuid, slideIndex: { type: "integer", minimum: 0, default: 0 }, notes: { type: "string" }, participation: unknownObject }
  },
  DeliveryUpdateInput: {
    type: "object",
    properties: { slideIndex: { type: "integer", minimum: 0 }, notes: { type: "string" }, participation: unknownObject, evidenceUrl: { type: "string" }, summary: { type: "string" } }
  },
  DeliveryEndInput: { type: "object", properties: { summary: { type: "string" } } },
  TeacherQuizCreateInput: {
    type: "object",
    required: ["classId", "subjectName", "topic", "title", "durationMinutes"],
    properties: {
      classId: uuid,
      subjectName: { type: "string", minLength: 2 },
      topic: { type: "string", minLength: 2 },
      title: { type: "string", minLength: 2 },
      durationMinutes: { type: "integer", minimum: 1 },
      randomizeQuestions: { type: "boolean", default: false },
      showResults: { type: "boolean", default: true },
      questions: { type: "array", items: { $ref: "#/components/schemas/TeacherQuizQuestionInput" }, default: [] }
    }
  },
  TeacherQuizQuestionInput: {
    type: "object",
    required: ["type", "questionText", "answer"],
    properties: {
      type: { type: "string", enum: ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "MATCHING", "ORDERING", "IMAGE_BASED"] },
      questionText: { type: "string", minLength: 2 },
      options: {},
      answer: {},
      explanation: { type: "string" },
      points: { type: "integer", minimum: 1, default: 1 }
    }
  },
  TeacherQuizUpdateInput: {
    allOf: [{ $ref: "#/components/schemas/TeacherQuizCreateInput" }],
    properties: { status: { type: "string", enum: ["DRAFT", "PUBLISHED", "ASSIGNED", "CLOSED", "ARCHIVED"] } }
  },
  AssignQuizInput: { type: "object", properties: { dueAt: dateTime, showResults: { type: "boolean" }, randomizeQuestions: { type: "boolean" } } },
  TeacherResourceCreateInput: {
    type: "object",
    required: ["title", "type"],
    properties: {
      title: { type: "string", minLength: 2 },
      type: { type: "string", enum: ["PDF", "WORD", "POWERPOINT", "IMAGE", "VIDEO", "AUDIO", "LINK", "OTHER"] },
      fileUrl: { type: "string" },
      subjectName: { type: "string" },
      className: { type: "string" },
      topic: { type: "string" },
      tags: stringArray,
      sharedScope: { type: "string", default: "PRIVATE" }
    }
  },
  TeacherMessageCreateInput: {
    type: "object",
    required: ["recipientId", "body"],
    properties: {
      recipientId: uuid,
      body: { type: "string", minLength: 1, maxLength: 1500 },
      category: { type: "string", enum: ["ANNOUNCEMENT", "REMINDER", "PERFORMANCE_NOTE", "HOMEWORK", "EMERGENCY", "GENERAL"], default: "GENERAL" },
      threadId: { type: "string" }
    }
  },
  TeacherAiOutputInput: {
    type: "object",
    required: ["title", "output"],
    properties: {
      taskType: { type: "string" },
      title: { type: "string" },
      subjectId: uuid,
      subjectName: { type: "string" },
      classId: uuid,
      className: { type: "string" },
      levelId: uuid,
      gradeLevel: { type: "string" },
      topicId: uuid,
      topicName: { type: "string" },
      subtopicId: uuid,
      subtopicName: { type: "string" },
      output: {},
      teacherRequest: { type: "string" }
    }
  },
  ChatInput: {
    type: "object",
    required: ["message"],
    properties: { conversationId: uuid, message: { type: "string", minLength: 1, maxLength: 1200 }, subject: { type: "string" }, lessonId: uuid, quizId: uuid, language, reviewMode: { type: "boolean", default: false } }
  },
  HintInput: { type: "object", required: ["question"], properties: { question: { type: "string", minLength: 1, maxLength: 1000 }, selectedAnswer: {}, level: { type: "string" }, reviewMode: { type: "boolean", default: false } } },
  ExplainLessonInput: { type: "object", required: ["lessonId"], properties: { lessonId: uuid, language } },
  TranslateInput: { type: "object", required: ["text", "targetLanguage"], properties: { text: { type: "string", minLength: 1, maxLength: 4000 }, targetLanguage: language, level: { type: "string" } } },
  RemedialInput: { type: "object", properties: { quizAttemptId: uuid, quizResult: {}, weakTopics: stringArray, lessonHistory: stringArray } },
  PracticeGenerateInput: { type: "object", required: ["subject", "topic", "level"], properties: { subject: { type: "string" }, topic: { type: "string" }, level: { type: "string" }, difficulty: { type: "string", enum: ["easy", "medium", "hard"], default: "easy" }, numberOfQuestions: { type: "integer", minimum: 1, maximum: 8, default: 3 } } },
  TeacherAiInput: {
    type: "object",
    properties: { classId: uuid, studentId: uuid, lessonId: uuid, quizId: uuid, subjectName: { type: "string" }, topic: { type: "string" }, objective: { type: "string" }, gradeLevel: { type: "string" }, language, performanceData: {}, message: { type: "string" }, targetLanguage: language }
  },
  TeacherQuizGenerateInput: { allOf: [{ $ref: "#/components/schemas/TeacherAiInput" }], properties: { numberOfQuestions: { type: "integer", minimum: 1, maximum: 20, default: 5 }, difficulty: { type: "string", enum: ["easy", "medium", "hard"], default: "medium" } } },
  TeacherParentMessageDraftInput: { allOf: [{ $ref: "#/components/schemas/TeacherAiInput" }], required: ["messagePurpose"], properties: { messagePurpose: { type: "string", minLength: 2 }, studentProgress: {}, tone: { type: "string", enum: ["warm", "professional", "urgent", "encouraging"], default: "warm" } } },
  TeacherTranslateOrSimplifyInput: { allOf: [{ $ref: "#/components/schemas/TeacherAiInput" }], required: ["text"], properties: { text: { type: "string", minLength: 1, maxLength: 6000 }, simplifyForLevel: { type: "string" } } },
  TeacherComprehensiveAiInput: {
    type: "object",
    required: ["teacherRequest"],
    properties: {
      taskType: { type: "string", enum: ["lesson_preparation", "lesson_notes", "scheme_of_work", "activity_planning", "assessment_questions", "homework_preparation", "remedial_support", "performance_analysis", "decision_support", "parent_communication", "intervention_recommendations"] },
      subjectId: uuid,
      subjectName: { type: "string" },
      classId: uuid,
      className: { type: "string" },
      studentId: uuid,
      studentName: { type: "string" },
      levelId: uuid,
      gradeLevel: { type: "string" },
      topicId: uuid,
      topicName: { type: "string" },
      subtopicId: uuid,
      subtopicName: { type: "string" },
      language,
      duration: { type: "integer", minimum: 15, maximum: 120, default: 40 },
      difficultyLevel: { type: "string", enum: ["easy", "medium", "hard"], default: "medium" },
      learnerNeeds: stringArray,
      teacherRequest: { type: "string", minLength: 10, maxLength: 2000 },
      schoolContext: { type: "string" },
      performanceData: {},
      studentProgress: {},
      numberOfQuestions: { type: "integer", minimum: 1, maximum: 30, default: 5 },
      audience: { type: "string", enum: ["teacher", "parent", "head_teacher", "admin"] },
      tone: { type: "string", enum: ["warm", "professional", "urgent", "encouraging"], default: "warm" },
      messagePurpose: { type: "string" }
    }
  }
};
