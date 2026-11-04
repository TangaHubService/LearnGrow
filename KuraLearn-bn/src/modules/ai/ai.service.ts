import OpenAI from "openai";
import { env } from "../../config/env.js";
import { resolveActorSchoolId } from "../../middleware/access.js";
import { AppError } from "../../http/errors.js";
import { prisma } from "../../prisma/client.js";

export const AI_SYSTEM_PROMPT =
  "You are KuraLearn AI Tutor, a safe, friendly learning assistant for nursery and primary school children. Use simple, age-appropriate language. Be encouraging. Help the learner understand, but do not shame them. For quizzes, give hints and explanations, but do not reveal the direct answer unless the quiz is already submitted or reviewMode is true. Avoid unsafe content, personal questions, adult topics, political persuasion, harmful instructions, and external links. If a child asks for something unsafe or unrelated, gently redirect them back to learning. Support English, Kinyarwanda, and French.";

export const TEACHER_AI_SYSTEM_PROMPT =
  "You are KuraLean Teacher Copilot, a professional education planning and decision-support assistant for nursery and primary teachers, specializing in the Rwanda Competence-Based Curriculum (CBC). Produce structured, practical, classroom-ready content that aligns with CBC standards, including Key Unit Competencies, Generic Competencies, and Cross-Cutting Issues. Use simple language suitable for the class level, include practical activities and assessment with answers where relevant, support inclusion and differentiation, and make every output teacher-reviewable before saving or sending.";

const chatFormat = {
  type: "json_schema",
  name: "kuralearn_ai_chat",
  strict: true,
  schema: {
    type: "object",
    properties: {
      reply: { type: "string" },
      language: { type: "string", enum: ["en", "rw", "fr"] },
      suggestedActions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            action: { type: "string", enum: ["OPEN_LESSON", "OPEN_QUIZ", "REVIEW_LESSON", "PRACTICE_MORE", "NONE"] },
            targetId: { type: "string" }
          },
          required: ["label", "action", "targetId"],
          additionalProperties: false
        }
      },
      practiceQuestion: {
        anyOf: [
          {
            type: "object",
            properties: {
              questionText: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              hint: { type: "string" }
            },
            required: ["questionText", "options", "hint"],
            additionalProperties: false
          },
          { type: "null" }
        ]
      }
    },
    required: ["reply", "language", "suggestedActions", "practiceQuestion"],
    additionalProperties: false
  }
};

const practiceFormat = {
  type: "json_schema",
  name: "kuralearn_practice_questions",
  strict: true,
  schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            questionText: { type: "string" },
            type: { type: "string", enum: ["multiple_choice"] },
            options: { type: "array", items: { type: "string" } },
            correctAnswer: { type: "string" },
            hint: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["questionText", "type", "options", "correctAnswer", "hint", "explanation"],
          additionalProperties: false
        }
      }
    },
    required: ["questions"],
    additionalProperties: false
  }
};

const teacherInsightFormat = {
  type: "json_schema",
  name: "learngrow_teacher_ai_output",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      output: { type: "string" },
      bullets: { type: "array", items: { type: "string" } },
      confidence: { type: "number" },
      explanation: { type: "string" },
      recommendedActions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            action: { type: "string" }
          },
          required: ["label", "action"],
          additionalProperties: false
        }
      }
    },
    required: ["title", "output", "bullets", "confidence", "explanation", "recommendedActions"],
    additionalProperties: false
  }
};

const client = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
const teacherRoles = ["TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"];

type TutorResult = {
  reply: string;
  language: "en" | "rw" | "fr";
  suggestedActions: Array<{ label: string; action: string; targetId: string }>;
  practiceQuestion: { questionText: string; options: string[]; hint: string } | null;
};

function fallbackTutor(message: string, language: "en" | "rw" | "fr" = "en"): TutorResult {
  const prefix =
    language === "rw"
      ? "Reka tugerageze gahoro gahoro."
      : language === "fr"
        ? "Essayons pas a pas."
        : "Let's try it step by step.";
  return {
    reply: `${prefix} ${message.includes("?") ? "Read the question again, find the key words, and try one small step first." : "Tell me which part feels tricky and I will give you a gentle hint."}`,
    language,
    suggestedActions: [{ label: "Practice more", action: "PRACTICE_MORE", targetId: "" }],
    practiceQuestion: {
      questionText: "What is one small step you can try next?",
      options: ["Read again", "Skip it", "Guess fast"],
      hint: "Choose the action that helps your brain slow down."
    }
  };
}

function parseJsonOutput<T>(outputText: string, fallback: T): T {
  try {
    return JSON.parse(outputText) as T;
  } catch {
    return fallback;
  }
}

function parseRequiredJsonOutput<T>(outputText: string): T {
  try {
    return JSON.parse(outputText) as T;
  } catch {
    throw new AppError(502, "AI could not generate the response. Please try again.", "AI_RESPONSE_PARSE_FAILED");
  }
}

async function studentContext(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    include: { user: true, level: true, class: true, school: true }
  });
  if (!student) throw new AppError(403, "Only students can use AI tutor features", "NOT_STUDENT");
  return student;
}

async function teacherContext(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { teacher: true } });
  if (!user || !teacherRoles.includes(user.role)) {
    throw new AppError(403, "Teacher access is required for LearnGrow AI features", "TEACHER_ACCESS_REQUIRED");
  }
  const schoolId = await resolveActorSchoolId(userId);
  return { user, schoolId, teacher: user.teacher };
}

export async function callOpenAIJson<T>({
  userId,
  feature,
  prompt,
  format,
  model = env.OPENAI_MODEL,
  instructions = AI_SYSTEM_PROMPT,
  fallback
}: {
  userId: string;
  feature: string;
  prompt: string;
  format: unknown;
  model?: string;
  instructions?: string;
  fallback: T;
}) {
  console.log(`[AI] ${feature} request`, { model, promptLength: prompt.length });

  if (!client) {
    console.warn(`[AI] ${feature} fallback: OpenAI client is not configured`);
    return fallback;
  }

  try {
    const response = await client.responses.create({
      model,
      instructions,
      input: prompt,
      text: { format: format as never }
    });

    const usage = response.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    await prisma.aIUsageLog.create({
      data: {
        userId,
        feature,
        model,
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
        costEstimate: 0
      }
    });
    return parseJsonOutput<T>(response.output_text, fallback);
  } catch (error) {
    console.error(`[AI] ${feature} generation failed`, error);
    return fallback;
  }
}

// ─── OpenAI error classifier ────────────────────────────────────────

function classifyOpenAIError(error: unknown): AppError {
  const e = error as Record<string, unknown>;
  const status = (e.status ?? e.statusCode) as number | undefined;
  const code = (e.code ?? e.error_code) as string | undefined;
  const type = (e.type ?? e.error_type) as string | undefined;
  const msg = String(e.message ?? "");

  // Log the real error for debugging — never log API key or private student data
  console.error("[AI] OpenAI API error", { status, code, type, message: msg.slice(0, 500) });

  if (status === 401 || code === "invalid_api_key") {
    return new AppError(502, "AI service authentication failed. Contact support.", "AI_AUTH_FAILED");
  }
  if (status === 429 || code === "rate_limit_exceeded" || type === "requests" || type === "tokens") {
    return new AppError(429, "AI is temporarily busy. Please wait a moment and try again.", "AI_RATE_LIMIT");
  }
  if (status === 400 && (msg.includes("model") || code === "model_not_found")) {
    return new AppError(502, "AI model is unavailable. Contact support.", "AI_INVALID_MODEL");
  }
  if (status === 400 && (msg.includes("maximum context") || msg.includes("token"))) {
    return new AppError(400, "Your request is too large. Shorten the input and try again.", "AI_INPUT_TOO_LARGE");
  }
  if (status === 400 && (msg.includes("schema") || msg.includes("json_schema") || msg.includes("additionalProperties"))) {
    return new AppError(502, "AI response schema validation failed. Contact support.", "AI_SCHEMA_ERROR");
  }
  if (msg.toLowerCase().includes("timeout") || code === "timeout") {
    return new AppError(504, "AI request timed out. Please try again.", "AI_TIMEOUT");
  }
  if (status && status >= 500) {
    return new AppError(502, "AI provider is temporarily unavailable. Please try again in a moment.", "AI_PROVIDER_ERROR");
  }
  return new AppError(502, "AI could not generate the response. Please try again.", "AI_GENERATION_FAILED");
}

// ─── Retry with exponential backoff ──────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const e = err as Record<string, unknown>;
      const status = (e.status ?? e.statusCode) as number | undefined;
      const isRetryable = status === 429 || status === 500 || status === 502 || status === 503;
      if (!isRetryable || attempt === maxAttempts) throw err;
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 8000);
      console.warn(`[AI] Retryable error (${status}), attempt ${attempt}/${maxAttempts}, retrying in ${delayMs}ms`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      lastError = err;
    }
  }
  throw lastError;
}

export async function callRequiredOpenAIJson<T>({
  userId,
  feature,
  prompt,
  format,
  model = env.OPENAI_MODEL,
  instructions = TEACHER_AI_SYSTEM_PROMPT
}: {
  userId: string;
  feature: string;
  prompt: string;
  format: unknown;
  model?: string;
  instructions?: string;
}) {
  if (!client) {
    console.error(`[AI] ${feature}: OpenAI client not initialized. Check OPENAI_API_KEY in .env`);
    throw new AppError(503, "AI service is not configured. Contact support.", "AI_UNAVAILABLE");
  }

  const promptBytes = Buffer.byteLength(prompt, "utf8");
  console.log(`[AI] ${feature} starting`, { model, promptLength: prompt.length, promptBytes });

  // Reject obviously oversized prompts before hitting OpenAI
  if (promptBytes > 80_000) {
    throw new AppError(400, "Your request is too large. Shorten the input and try again.", "AI_INPUT_TOO_LARGE");
  }

  try {
    const response = await withRetry(() =>
      client!.responses.create({
        model,
        instructions,
        input: prompt,
        text: { format: format as never }
      })
    );

    const usage = response.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    console.log(`[AI] ${feature} success`, { model, inputTokens: usage?.input_tokens, outputTokens: usage?.output_tokens });

    await prisma.aIUsageLog.create({
      data: {
        userId,
        feature,
        model,
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
        costEstimate: 0
      }
    });
    return parseRequiredJsonOutput<T>(response.output_text);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw classifyOpenAIError(error);
  }
}

export async function chatWithTutor(userId: string, input: {
  conversationId?: string;
  message: string;
  subject?: string;
  lessonId?: string;
  quizId?: string;
  language: "en" | "rw" | "fr";
  reviewMode: boolean;
}) {
  console.log("[AI] student chat request", {
    userId,
    subject: input.subject ?? "not provided",
    hasLessonContext: Boolean(input.lessonId),
    hasQuizContext: Boolean(input.quizId),
    reviewMode: input.reviewMode,
    language: input.language,
    messageLength: input.message.length
  });

  const student = await studentContext(userId);
  const lesson = input.lessonId
    ? await prisma.lesson.findUnique({ where: { id: input.lessonId }, include: { course: { include: { subject: true } } } })
    : null;

  const conversation = input.conversationId
    ? await prisma.aIConversation.findFirst({ where: { id: input.conversationId, studentId: student.id } })
    : await prisma.aIConversation.create({
        data: { studentId: student.id, title: input.message.slice(0, 48) || "AI tutor chat" }
      });

  if (!conversation) {
    throw new AppError(404, "Conversation not found", "AI_CONVERSATION_NOT_FOUND");
  }

  await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: input.message,
      sourceType: "CHAT",
      lessonId: input.lessonId,
      quizId: input.quizId
    }
  });

  const fallback = fallbackTutor(input.message, input.language);
  const prompt = [
    `Student: ${student.user.name}`,
    `Level: ${student.level.name} (${student.level.category})`,
    `Preferred language: ${input.language}`,
    `Subject: ${input.subject ?? lesson?.course.subject.name ?? "general learning"}`,
    `Lesson context: ${lesson ? `${lesson.title}: ${lesson.body}` : "No active lesson"}`,
    `Review mode: ${input.reviewMode ? "true" : "false"}`,
    `Student message: ${input.message}`,
    "Return JSON that matches the schema."
  ].join("\n");

  const result = await callOpenAIJson<TutorResult>({
    userId,
    feature: "ai.chat",
    prompt,
    format: chatFormat,
    fallback
  });

  await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: result.reply,
      sourceType: "CHAT",
      lessonId: input.lessonId,
      quizId: input.quizId
    }
  });

  return { conversationId: conversation.id, ...result };
}

export async function explainLesson(userId: string, lessonId: string, language: "en" | "rw" | "fr") {
  const student = await studentContext(userId);
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { include: { subject: true } } } });
  if (!lesson) throw new AppError(404, "Lesson not found", "LESSON_NOT_FOUND");
  return chatWithTutor(userId, {
    message: `Explain this lesson in simple words. Include one example and one short practice question.\n\n${lesson.body}`,
    subject: lesson.course.subject.name,
    lessonId,
    language,
    reviewMode: true
  }).then((result) => ({
    simplifiedExplanation: result.reply,
    example: result.practiceQuestion?.questionText ?? `Try one ${lesson.course.subject.name} example.`,
    shortPracticeQuestion: result.practiceQuestion
      ? { questionText: result.practiceQuestion.questionText, options: result.practiceQuestion.options, hint: result.practiceQuestion.hint }
      : null,
    level: student.level.name
  }));
}

export async function generateHint(userId: string, input: { question: string; selectedAnswer?: unknown; level?: string; reviewMode: boolean }) {
  const student = await studentContext(userId);
  const result = await chatWithTutor(userId, {
    message: `Give a hint for this question without revealing the direct answer unless reviewMode is true. Question: ${input.question}. Selected answer: ${JSON.stringify(input.selectedAnswer ?? null)}`,
    subject: "quiz practice",
    language: student.language as "en" | "rw" | "fr",
    reviewMode: input.reviewMode
  });
  return {
    hint: result.reply,
    encouragement: "You are thinking carefully. Keep going.",
    reviewMode: input.reviewMode
  };
}

export async function translateLearningContent(userId: string, input: { text: string; targetLanguage: "en" | "rw" | "fr"; level?: string }) {
  await studentContext(userId);
  const result = await chatWithTutor(userId, {
    message: `Translate this learning content into ${input.targetLanguage} for level ${input.level ?? "primary"}: ${input.text}`,
    language: input.targetLanguage,
    reviewMode: true
  });
  return { translatedText: result.reply, language: input.targetLanguage };
}

export async function recommendRemedial(userId: string, input: { quizAttemptId?: string; quizResult?: unknown; weakTopics: string[]; lessonHistory: string[] }) {
  const student = await studentContext(userId);
  const lessons = await prisma.lesson.findMany({
    where: { course: { levelId: student.levelId, subject: { name: { in: input.weakTopics.length ? input.weakTopics : undefined } } } },
    take: 3,
    include: { course: { include: { subject: true } } }
  });
  const result = await chatWithTutor(userId, {
    message: `Recommend remedial study. Quiz result: ${JSON.stringify(input.quizResult ?? {})}. Weak topics: ${input.weakTopics.join(", ") || "unknown"}. Lesson history: ${input.lessonHistory.join(", ") || "none"}.`,
    language: student.language as "en" | "rw" | "fr",
    reviewMode: true
  });
  return {
    recommendedLessons: lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, subject: lesson.course.subject.name })),
    shortExplanation: result.reply,
    practicePlan: ["Review one short lesson", "Try two practice questions", "Retake the quiz when ready"]
  };
}

export async function generatePracticeQuestions(userId: string, input: {
  subject: string;
  topic: string;
  level: string;
  difficulty: "easy" | "medium" | "hard";
  numberOfQuestions: number;
}) {
  await studentContext(userId);
  const fallback = {
    questions: Array.from({ length: input.numberOfQuestions }, (_, index) => ({
      questionText: `${input.topic} practice question ${index + 1}`,
      type: "multiple_choice",
      options: ["A", "B", "C"],
      correctAnswer: "A",
      hint: "Look for the choice that matches the lesson idea.",
      explanation: "Practice helps you remember the idea."
    }))
  };

  const result = await callOpenAIJson<typeof fallback>({
    userId,
    feature: "ai.generate_practice",
    model: env.OPENAI_FAST_MODEL,
    format: practiceFormat,
    fallback,
    prompt: [
      `Generate ${input.numberOfQuestions} child-safe multiple choice practice questions.`,
      `Subject: ${input.subject}`,
      `Topic: ${input.topic}`,
      `Level: ${input.level}`,
      `Difficulty: ${input.difficulty}`,
      "Return JSON only."
    ].join("\n")
  });

  return result.questions;
}

export async function listConversations(userId: string) {
  const student = await studentContext(userId);
  return prisma.aIConversation.findMany({
    where: { studentId: student.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } }
  });
}

export async function getConversation(userId: string, conversationId: string) {
  const student = await studentContext(userId);
  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, studentId: student.id },
    include: { messages: { orderBy: { createdAt: "asc" } } }
  });
  if (!conversation) throw new AppError(404, "Conversation not found", "AI_CONVERSATION_NOT_FOUND");
  return conversation;
}

export async function listTeacherConversations(userId: string) {
  const { teacher } = await teacherContext(userId);
  // School office staff can open the assistant without having a teaching profile or saved chats.
  if (!teacher) return [];
  return prisma.teacherAiOutput.findMany({
    where: { teacherId: teacher.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      taskType: true,
      subjectName: true,
      className: true,
      output: true,
      teacherRequest: true,
      createdAt: true,
      updatedAt: true
    }
  }).then(outputs => outputs.map((o) => ({
    id: o.id,
    title: o.title || o.taskType,
    lastMessage: o.teacherRequest.slice(0, 80),
    updatedAt: o.updatedAt.toISOString(),
    messageCount: 1,
    taskType: o.taskType
  })));
}

export async function getTeacherConversation(userId: string, conversationId: string) {
  const { teacher } = await teacherContext(userId);
  if (!teacher) throw new AppError(403, "Teacher not found", "TEACHER_NOT_FOUND");
  const output = await prisma.teacherAiOutput.findFirst({
    where: { id: conversationId, teacherId: teacher.id }
  });
  if (!output) throw new AppError(404, "Conversation not found", "AI_CONVERSATION_NOT_FOUND");
  return {
    conversation: output,
    messages: [
      { id: "1", role: "user", content: output.teacherRequest, createdAt: output.createdAt },
      { id: "2", role: "assistant", content: output.output, createdAt: output.createdAt }
    ]
  };
}

type TeacherAiOutput = {
  title: string;
  output: string;
  bullets: string[];
  confidence: number;
  explanation: string;
  recommendedActions: Array<{ label: string; action: string }>;
};

function fallbackTeacherOutput(feature: string, title: string, bullets: string[]): TeacherAiOutput {
  return {
    title,
    output: bullets.join("\n"),
    bullets,
    confidence: 0.72,
    explanation: `Draft generated locally because the OpenAI API is not configured or the request could not complete for ${feature}.`,
    recommendedActions: [
      { label: "Review draft", action: "OPEN_APPROVAL_DRAWER" },
      { label: "Edit before saving", action: "EDIT_OUTPUT" }
    ]
  };
}

function teacherResponse(feature: string, result: TeacherAiOutput, metadata: Record<string, unknown> = {}) {
  return {
    feature,
    approvalRequired: true,
    generatedAt: new Date().toISOString(),
    source: client ? "openai" : "fallback",
    ...result,
    metadata
  };
}

export async function runTeacherAi(userId: string, feature: string, promptLines: string[], fallback: TeacherAiOutput, useFastModel = false) {
  const { user, schoolId } = await teacherContext(userId);
  const prompt = [
    `School ID: ${schoolId}`,
    `Requester role: ${user.role}`,
    `Requester name: ${user.name}`,
    "Do not include private personal details that are not needed. Produce a teacher-reviewable draft that requires approval before saving or sending.",
    ...promptLines
  ].join("\n");
  return callOpenAIJson<TeacherAiOutput>({
    userId,
    feature,
    model: useFastModel ? env.OPENAI_FAST_MODEL : env.OPENAI_MODEL,
    instructions: TEACHER_AI_SYSTEM_PROMPT,
    format: teacherInsightFormat,
    prompt,
    fallback
  });
}

export async function generateTeacherLessonObjectives(userId: string, input: {
  topic: string;
  gradeLevel: string;
  subjectName: string;
  language?: "en" | "rw" | "fr";
}) {
  const fallback = fallbackTeacherOutput("ai.lesson_objectives", "Lesson objectives draft", [
    `Learners explain the main idea of ${input.topic} in simple words.`,
    `Learners solve one guided ${input.subjectName} task with support.`,
    "Learners share one example with a partner."
  ]);
  const result = await runTeacherAi(userId, "ai.lesson_objectives", [
    `Task: Generate measurable lesson objectives.`,
    `Subject: ${input.subjectName}`,
    `Topic: ${input.topic}`,
    `Grade level: ${input.gradeLevel}`,
    `Language: ${input.language ?? "en"}`
  ], fallback, true);
  return teacherResponse("lesson-objectives", result, { subjectName: input.subjectName, topic: input.topic, gradeLevel: input.gradeLevel });
}

export async function generateTeacherLessonPlan(userId: string, input: {
  topic: string;
  gradeLevel: string;
  subjectName: string;
  objective?: string;
  language?: "en" | "rw" | "fr";
}) {
  const fallback = fallbackTeacherOutput("ai.lesson_plan", "Lesson plan draft", [
    "Start with a quick prior-knowledge question.",
    `Teach ${input.topic} with concrete examples and guided practice.`,
    "Use pair work, a short formative check, and inclusion support for learners who need extra scaffolding.",
    "End with a simple exit ticket and homework review task."
  ]);
  const result = await runTeacherAi(userId, "ai.lesson_plan", [
    `Task: Create an inclusive primary-school lesson plan.`,
    `Subject: ${input.subjectName}`,
    `Topic: ${input.topic}`,
    `Grade level: ${input.gradeLevel}`,
    `Objective: ${input.objective ?? "Suggest a suitable objective"}`,
    `Language: ${input.language ?? "en"}`,
    "Include activities, resources, assessment method, homework, and inclusion notes."
  ], fallback);
  return teacherResponse("lesson-plan", result, { subjectName: input.subjectName, topic: input.topic, gradeLevel: input.gradeLevel });
}

export async function generateTeacherQuiz(userId: string, input: {
  topic: string;
  gradeLevel: string;
  subjectName: string;
  objective?: string;
  numberOfQuestions: number;
  difficulty: "easy" | "medium" | "hard";
  language?: "en" | "rw" | "fr";
}) {
  const fallback = fallbackTeacherOutput("ai.quiz_generate", "Quiz draft", [
    `Create ${input.numberOfQuestions} ${input.difficulty} questions for ${input.topic}.`,
    "Mix multiple choice and true/false where suitable.",
    "Include an answer key and short explanation for every answer."
  ]);
  const result = await runTeacherAi(userId, "ai.quiz_generate", [
    `Task: Generate a quiz draft with answer key and explanations.`,
    `Subject: ${input.subjectName}`,
    `Topic: ${input.topic}`,
    `Objective: ${input.objective ?? "Use the topic and level"}`,
    `Grade level: ${input.gradeLevel}`,
    `Difficulty: ${input.difficulty}`,
    `Number of questions: ${input.numberOfQuestions}`,
    `Language: ${input.language ?? "en"}`,
    "Flag duplicate or unclear questions in the explanation."
  ], fallback, true);
  return teacherResponse("quiz-generate", result, { subjectName: input.subjectName, topic: input.topic, gradeLevel: input.gradeLevel });
}

export async function analyzeTeacherPerformance(userId: string, input: {
  performanceData?: unknown;
  subjectName?: string;
  classId?: string;
  language?: "en" | "rw" | "fr";
}) {
  const fallback = fallbackTeacherOutput("ai.analyze_performance", "Performance analysis", [
    "Several learners may need short targeted review before the next assessment.",
    "Compare attendance and quiz results to separate content gaps from participation gaps.",
    "Plan a 15-minute reteach block for the weakest topic."
  ]);
  const result = await runTeacherAi(userId, "ai.analyze_performance", [
    "Task: Analyze class performance, explain likely causes, and recommend next actions.",
    `Subject: ${input.subjectName ?? "all subjects"}`,
    `Class reference: ${input.classId ?? "not provided"}`,
    `Language: ${input.language ?? "en"}`,
    `Performance data JSON: ${JSON.stringify(input.performanceData).slice(0, 5000)}`
  ], fallback);
  return teacherResponse("analyze-performance", result, { subjectName: input.subjectName, classId: input.classId });
}

export async function predictTeacherStudentRisk(userId: string, input: {
  studentId?: string;
  performanceData?: unknown;
  attendanceData?: unknown;
  participationData?: unknown;
  language?: "en" | "rw" | "fr";
}) {
  const fallback = fallbackTeacherOutput("ai.student_risk", "Learner risk prediction", [
    "Risk level: MEDIUM.",
    "Look for repeated low scores, missed lessons, and low participation.",
    "Schedule a short check-in and one targeted practice activity."
  ]);
  const result = await runTeacherAi(userId, "ai.student_risk", [
    "Task: Predict learner academic risk without using sensitive unnecessary personal details.",
    `Learner reference: ${input.studentId ?? "not provided"}`,
    `Language: ${input.language ?? "en"}`,
    `Performance data JSON: ${JSON.stringify(input.performanceData).slice(0, 3500)}`,
    `Attendance data JSON: ${JSON.stringify(input.attendanceData ?? {}).slice(0, 1500)}`,
    `Participation data JSON: ${JSON.stringify(input.participationData ?? {}).slice(0, 1500)}`
  ], fallback);
  return teacherResponse("student-risk", result, { studentId: input.studentId });
}

export async function recommendTeacherInterventions(userId: string, input: {
  studentId?: string;
  performanceData?: unknown;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  learnerNeeds: string[];
  language?: "en" | "rw" | "fr";
}) {
  const fallback = fallbackTeacherOutput("ai.intervention_recommendations", "Intervention recommendations", [
    "Use a short reteach activity with concrete examples.",
    "Pair the learner with a supportive peer for guided practice.",
    "Check progress after three practice tasks and update the support plan."
  ]);
  const result = await runTeacherAi(userId, "ai.intervention_recommendations", [
    "Task: Recommend practical classroom interventions for a primary learner.",
    `Learner reference: ${input.studentId ?? "not provided"}`,
    `Risk level: ${input.riskLevel ?? "unknown"}`,
    `Learner needs: ${input.learnerNeeds.join(", ") || "not provided"}`,
    `Language: ${input.language ?? "en"}`,
    `Performance data JSON: ${JSON.stringify(input.performanceData).slice(0, 4000)}`
  ], fallback);
  return teacherResponse("intervention-recommendations", result, { studentId: input.studentId, riskLevel: input.riskLevel });
}

export async function summarizeTeacherReport(userId: string, input: {
  reportData?: unknown;
  audience: "teacher" | "parent" | "head_teacher" | "admin";
  language?: "en" | "rw" | "fr";
}) {
  const fallback = fallbackTeacherOutput("ai.report_summary", "Report summary", [
    "Overall performance is steady with a few learners needing targeted support.",
    "Attendance and quiz completion should be reviewed together.",
    "Next steps: reteach weak topics, monitor interventions, and share parent-friendly updates."
  ]);
  const result = await runTeacherAi(userId, "ai.report_summary", [
    "Task: Summarize a school report with clear narrative and next steps.",
    `Audience: ${input.audience}`,
    `Language: ${input.language ?? "en"}`,
    `Report data JSON: ${JSON.stringify(input.reportData).slice(0, 6000)}`
  ], fallback);
  return teacherResponse("report-summary", result, { audience: input.audience });
}

export async function generateTeacherParentMessageDraft(userId: string, input: {
  studentId?: string;
  messagePurpose: string;
  studentProgress?: unknown;
  tone: "warm" | "professional" | "urgent" | "encouraging";
  language?: "en" | "rw" | "fr";
}) {
  const fallback = fallbackTeacherOutput("ai.parent_message_draft", "Parent message draft", [
    "Hello, I wanted to share a quick update about your child's learning progress.",
    "They are making effort, and we will support them with a short practice activity this week.",
    "Thank you for encouraging study time at home."
  ]);
  const result = await runTeacherAi(userId, "ai.parent_message_draft", [
    "Task: Draft a parent-friendly message. Avoid sensitive labels and keep the tone supportive.",
    `Learner reference: ${input.studentId ?? "not provided"}`,
    `Purpose: ${input.messagePurpose}`,
    `Tone: ${input.tone}`,
    `Language: ${input.language ?? "en"}`,
    `Student progress JSON: ${JSON.stringify(input.studentProgress ?? {}).slice(0, 3000)}`
  ], fallback, true);
  return teacherResponse("parent-message-draft", result, { studentId: input.studentId, tone: input.tone });
}

export async function translateOrSimplifyTeacherContent(userId: string, input: {
  text: string;
  targetLanguage?: "en" | "rw" | "fr";
  simplifyForLevel?: string;
  language?: "en" | "rw" | "fr";
}) {
  const fallback = fallbackTeacherOutput("ai.translate_or_simplify", "Translated or simplified content", [
    input.text.slice(0, 500),
    "Review this draft for classroom accuracy before using it."
  ]);
  const result = await runTeacherAi(userId, "ai.translate_or_simplify", [
    "Task: Translate and/or simplify teacher-facing or learner-facing learning content.",
    `Target language: ${input.targetLanguage ?? input.language ?? "en"}`,
    `Simplify for level: ${input.simplifyForLevel ?? "primary"}`,
    `Text: ${input.text}`
  ], fallback, true);
  return teacherResponse("translate-or-simplify", result, { targetLanguage: input.targetLanguage, simplifyForLevel: input.simplifyForLevel });
}

export type TeacherTaskType = 
  | "lesson_preparation"
  | "lesson_notes"
  | "scheme_of_work"
  | "activity_planning"
  | "assessment_questions"
  | "homework_preparation"
  | "remedial_support"
  | "performance_analysis"
  | "decision_support"
  | "parent_communication"
  | "intervention_recommendations"
  | "course_outline";

const taskTypeLabels: Record<TeacherTaskType, string> = {
  lesson_preparation: "Lesson Preparation",
  lesson_notes: "Lesson Notes",
  scheme_of_work: "Scheme of Work",
  activity_planning: "Activity Planning",
  assessment_questions: "Assessment Questions",
  homework_preparation: "Homework Preparation",
  remedial_support: "Remedial Support Plan",
  performance_analysis: "Learner Performance Analysis",
  decision_support: "Decision Support",
  parent_communication: "Parent Communication Draft",
  intervention_recommendations: "Intervention Recommendations",
  course_outline: "Course Outline"
};

function inferTeacherTaskType(description: string): TeacherTaskType {
  const text = description.toLowerCase();
  if (/\b(assessment|question|questions|quiz|test|marks|marking guide|exam)\b/.test(text)) return "assessment_questions";
  if (/\b(homework|assignment|take home|take-home)\b/.test(text)) return "homework_preparation";
  if (/\b(scheme of work|scheme|term plan|weekly breakdown|course preparation|course prep|course outline|syllabus)\b/.test(text)) return "scheme_of_work";
  if (/\b(activity|group work|exercise|practice activity|classroom game)\b/.test(text)) return "activity_planning";
  if (/\b(parent|guardian|message|communication|draft|letter)\b/.test(text)) return "parent_communication";
  if (/\b(remedial|struggling|slow learner|catch up|support plan|reading difficulty)\b/.test(text)) return "remedial_support";
  if (/\b(intervention|support strategy|at risk|at-risk)\b/.test(text)) return "intervention_recommendations";
  if (/\b(performance|analyse|analyze|score|scores|attendance|weakness|strength)\b/.test(text)) return "performance_analysis";
  if (/\b(decision|should i|recommend|risk|next steps|guidance)\b/.test(text)) return "decision_support";
  if (/\b(notes|lesson notes|teaching notes)\b/.test(text)) return "lesson_notes";
  return "lesson_preparation";
}

// ─── Comprehensive output schema ─────────────────────────────────────
// NOTE: In strict mode with additionalProperties:false, ALL properties listed
// must also appear in 'required'. The old schema had optional CBC fields
// (keyCompetence, genericCompetencies, etc.) in 'properties' but NOT in
// 'required', which caused OpenAI to reject the request with a 400 schema
// validation error (masked as 502). Those fields are now captured inside
// sections items so the schema stays strictly valid.
const comprehensiveOutputFormat = {
  type: "json_schema",
  name: "kuralearn_teacher_comprehensive_output",
  strict: true,
  schema: {
    type: "object",
    properties: {
      taskType: { type: "string" },
      title: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            heading: { type: "string" },
            content: { type: "string" },
            items: { type: "array", items: { type: "string" } }
          },
          required: ["heading", "content", "items"],
          additionalProperties: false
        }
      },
      readyToUse: { type: "boolean" },
      estimatedDuration: { type: "string" },
      materials: { type: "array", items: { type: "string" } },
      recommendations: { type: "array", items: { type: "string" } }
    },
    required: ["taskType", "title", "sections", "readyToUse", "estimatedDuration", "materials", "recommendations"],
    additionalProperties: false
  }
};

function buildCourseOutlinePrompt(input: {
  subjectName: string;
  gradeLevel: string;
  teacherRequest: string;
  language: string;
}): string {
  return [
    `TASK: Generate a structured course outline for ${input.subjectName} at ${input.gradeLevel} level, aligned with the Rwanda Competence-Based Curriculum (CBC).`,
    `Specific Request: ${input.teacherRequest}`,
    `Language: ${input.language}`,
    "",
    "CBC REQUIREMENTS:",
    "- Each logical unit (section) must include a 'Key Unit Competence'.",
    "- Lessons should follow a logical progression towards unit goals.",
    "",
    "RESPONSE FORMAT (JSON ONLY):",
    "{",
    '  "title": "Course Outline Title",',
    '  "sections": [',
    "    {",
    '      "heading": "Unit Name",',
    '      "content": "Key Unit Competence and summary of unit goals.",',
    '      "items": [',
    '        "Lesson 1: Name (40 min)",',
    '        "Lesson 2: Name (40 min)"',
    "      ]",
    "    }",
    "  ]",
    "}",
    "",
    "Organize into 4-8 logical units (sections) with 3-5 lessons (items) each.",
    "",
    "ADDITIONAL FIELDS REQUIRED:",
    '- "readyToUse": true,',
    '- "estimatedDuration": "e.g., 40 hours",',
    '- "materials": ["List of overall required materials"],',
    '- "recommendations": ["Pedagogical recommendations for the teacher"],',
    '- "taskType": "course_outline"',
    "",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildLessonPreparationPrompt(input: {
  subjectName: string;
  gradeLevel: string;
  topicName?: string;
  subtopicName?: string;
  teacherRequest: string;
  duration: number;
  language: string;
  schoolContext?: string;
}): string {
  return [
    `TASK: Generate a complete, high-quality, and CBC-aligned lesson plan for ${input.subjectName} ready for direct classroom use in Rwanda.`,
    `Subject: ${input.subjectName}`,
    `Grade Level: ${input.gradeLevel}`,
    `Topic: ${input.topicName || "Not specified"}`,
    `Subtopic: ${input.subtopicName || "Not specified"}`,
    `Duration: ${input.duration} minutes`,
    `Language: ${input.language}`,
    `Teacher's specific request: ${input.teacherRequest}`,
    input.schoolContext ? `School Context: ${input.schoolContext}` : "",
    "",
    "CBC PEDAGOGICAL REQUIREMENTS:",
    "- Align with Rwanda Competence-Based Curriculum standards.",
    "- Focus on Competency Development (Generic and Key Competencies).",
    "- Include 'Cross-Cutting Issues' where relevant (e.g., Peace & Values, Environment, Gender).",
    "- Use 'Instructional Objectives' that are specific, measurable, and learner-centered.",
    "- Incorporate student-centered learning and active participation.",
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING IN THE 'sections' ARRAY OR TOP-LEVEL FIELDS:",
    "1. Lesson Title & Overview",
    "2. Learning Objectives (Instructional Objectives)",
    "3. Competencies to be developed (Generic & Key)",
    "4. Cross-Cutting Issues addressed",
    "5. Teaching and Learning Materials",
    "6. Lesson Development (Introduction, Development, Activity, Conclusion)",
    "7. Teacher Activities & Learner Activities (must be clearly separated in content)",
    "8. Assessment Criteria (how to check if objectives are met)",
    "9. Homework/Extension & Inclusion/Differentiation notes",
    "",
    "ADDITIONAL FIELDS REQUIRED:",
    '- "taskType": "lesson_preparation",',
    '- "readyToUse": true,',
    '- "estimatedDuration": "e.g., 40 minutes",',
    '- "materials": ["List of required materials"],',
    '- "recommendations": ["Pedagogical tips"],',
    "",
    "Return JSON only using the comprehensive format. Map CBC components to the 'sections' array or top-level properties appropriately."
  ].filter(Boolean).join("\n");
}


function buildAssessmentPrompt(input: {
  subjectName: string;
  gradeLevel: string;
  topicName?: string;
  teacherRequest: string;
  numberOfQuestions: number;
  difficulty: string;
  language: string;
}): string {
  return [
    `TASK: Generate assessment questions ready for classroom use.`,
    `Subject: ${input.subjectName}`,
    `Grade Level: ${input.gradeLevel}`,
    `Topic: ${input.topicName || "Not specified"}`,
    `Number of Questions: ${input.numberOfQuestions}`,
    `Difficulty: ${input.difficulty}`,
    `Language: ${input.language}`,
    `Teacher's specific request: ${input.teacherRequest}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Assessment Title - descriptive title",
    "2. Instructions - clear directions for learners",
    "3. Questions - the actual questions (mix of question types)",
    "4. Total Marks - maximum possible score",
    "5. Answers - correct answers for all questions",
    "6. Marking Guide - how to award marks with criteria",
    "",
    "ADDITIONAL FIELDS REQUIRED:",
    '- "taskType": "assessment_questions",',
    '- "readyToUse": true,',
    '- "estimatedDuration": "e.g., 60 minutes",',
    '- "materials": ["Question paper", "Answer sheet"],',
    '- "recommendations": ["Review instructions before starting"],',
    "",
    "Make questions appropriate for the grade level.",
    "Include a variety of question types: multiple choice, true/false, short answer, fill in the blank.",
    "Ensure answers are accurate and marking guide is clear.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildActivityPlanningPrompt(input: {
  subjectName: string;
  gradeLevel: string;
  topicName?: string;
  teacherRequest: string;
  duration: number;
  language: string;
}): string {
  return [
    `TASK: Generate a structured activity plan ready for classroom use.`,
    `Subject: ${input.subjectName}`,
    `Grade Level: ${input.gradeLevel}`,
    `Topic: ${input.topicName || "Not specified"}`,
    `Duration: ${input.duration} minutes`,
    `Language: ${input.language}`,
    `Teacher's specific request: ${input.teacherRequest}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Activity Title - clear, engaging title",
    "2. Learning Objective - what learners will achieve",
    "3. Materials Needed - all resources required",
    "4. Preparation Steps - what teacher needs to prepare",
    "5. Step-by-Step Instructions - clear procedure",
    "6. Learner Grouping - how to arrange students (individual, pairs, groups)",
    "7. Teacher Guidance - what the teacher does during the activity",
    "8. Expected Outcomes - what successful completion looks like",
    "9. Differentiation - adaptations for different learner needs",
    "10. Assessment - how to check learning",
    "",
    "ADDITIONAL FIELDS REQUIRED:",
    '- "taskType": "activity_planning",',
    '- "readyToUse": true,',
    '- "estimatedDuration": "e.g., 20 minutes",',
    '- "materials": ["List of materials"],',
    '- "recommendations": ["Safety tips"],',
    "",
    "Make activities practical, engaging, and appropriate for the grade level.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildPerformanceAnalysisPrompt(input: {
  subjectName?: string;
  className?: string;
  teacherRequest: string;
  performanceData?: unknown;
  language: string;
}): string {
  return [
    `TASK: Analyze learner performance and provide actionable insights.`,
    `Subject: ${input.subjectName || "All subjects"}`,
    `Class: ${input.className || "Not specified"}`,
    `Teacher's specific request: ${input.teacherRequest}`,
    `Performance Data: ${JSON.stringify(input.performanceData || {}).slice(0, 5000)}`,
    `Language: ${input.language}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Summary of Learner Performance - overall picture",
    "2. Strengths - what learners are doing well",
    "3. Weaknesses - areas needing improvement",
    "4. Learners Needing Support - specific students or groups",
    "5. Recommended Interventions - specific actions to help struggling learners",
    "6. Follow-up Actions - next steps for the teacher",
    "",
    "Provide specific, actionable recommendations based on the data.",
    "Do not use generic advice - make it specific to the situation.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildDecisionSupportPrompt(input: {
  subjectName?: string;
  className?: string;
  teacherRequest: string;
  performanceData?: unknown;
  schoolContext?: string;
  language: string;
}): string {
  return [
    `TASK: Provide decision support for a teacher facing an educational situation.`,
    `Subject: ${input.subjectName || "All subjects"}`,
    `Class: ${input.className || "Not specified"}`,
    `Teacher's specific request: ${input.teacherRequest}`,
    `Available Data: ${JSON.stringify(input.performanceData || {}).slice(0, 5000)}`,
    `School Context: ${input.schoolContext || "General school context"}`,
    `Language: ${input.language}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Situation Summary - what's happening",
    "2. Available Data - what information we have",
    "3. Key Issue - the main decision to be made",
    "4. Recommended Decision - clear recommendation",
    "5. Reason for Recommendation - why this is the best choice",
    "6. Risks - potential downsides or concerns",
    "7. Next Steps - concrete actions to take",
    "",
    "Base recommendations on evidence and best practices.",
    "Consider the teacher's constraints and resources.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildParentCommunicationPrompt(input: {
  studentName?: string;
  teacherRequest: string;
  studentProgress?: unknown;
  tone: string;
  audience: string;
  language: string;
}): string {
  return [
    `TASK: Draft a parent communication message ready to send.`,
    `Student: ${input.studentName || "The student"}`,
    `Teacher's specific request: ${input.teacherRequest}`,
    `Student Progress: ${JSON.stringify(input.studentProgress || {}).slice(0, 3000)}`,
    `Tone: ${input.tone}`,
    `Audience: ${input.audience}`,
    `Language: ${input.language}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Message Title - brief subject line",
    "2. Greeting - appropriate salutation",
    "3. Purpose - why you're contacting",
    "4. Key Information - main points to convey",
    "5. Specific Details - data or examples if relevant",
    "6. Suggested Actions - what parent can do to help",
    "7. Closing - warm sign-off",
    "",
    "Keep the message clear, constructive, and supportive.",
    "Avoid technical jargon - use parent-friendly language.",
    "Make it actionable - give specific things the parent can do.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildInterventionPrompt(input: {
  subjectName?: string;
  gradeLevel?: string;
  teacherRequest: string;
  performanceData?: unknown;
  learnerNeeds?: string[];
  language: string;
}): string {
  return [
    `TASK: Generate intervention recommendations for learners needing support.`,
    `Subject: ${input.subjectName || "All subjects"}`,
    `Grade Level: ${input.gradeLevel || "Not specified"}`,
    `Teacher's specific request: ${input.teacherRequest}`,
    `Performance Data: ${JSON.stringify(input.performanceData || {}).slice(0, 4000)}`,
    `Learner Needs: ${input.learnerNeeds?.join(", ") || "Not specified"}`,
    `Language: ${input.language}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Situation Overview - what's happening with the learner(s)",
    "2. Identified Needs - specific areas requiring support",
    "3. Recommended Interventions - concrete strategies to help",
    "4. Implementation Timeline - when to do what",
    "5. Resources Needed - materials, time, support",
    "6. Success Indicators - how to know if it's working",
    "7. Follow-up Plan - ongoing monitoring",
    "",
    "Make interventions practical and implementable in a classroom.",
    "Consider different learning needs and styles.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildHomeworkPrompt(input: {
  subjectName: string;
  gradeLevel: string;
  topicName?: string;
  teacherRequest: string;
  duration: number;
  language: string;
}): string {
  return [
    `TASK: Generate homework assignments ready for learners to take home.`,
    `Subject: ${input.subjectName}`,
    `Grade Level: ${input.gradeLevel}`,
    `Topic: ${input.topicName || "Not specified"}`,
    `Estimated Completion Time: ${input.duration} minutes`,
    `Teacher's specific request: ${input.teacherRequest}`,
    `Language: ${input.language}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Homework Title - clear title",
    "2. Instructions - what to do",
    "3. Questions/Tasks - the actual work",
    "4. Resources - any materials needed",
    "5. Due Date - when to submit",
    "6. Tips for Parents - how to support their child",
    "",
    "ADDITIONAL FIELDS REQUIRED:",
    '- "taskType": "homework_preparation",',
    '- "readyToUse": true,',
    '- "estimatedDuration": "e.g., 30 minutes",',
    '- "materials": ["Notebook", "Pencil"],',
    '- "recommendations": ["Encourage independent work"],',
    "",
    "Make homework appropriate for the grade level.",
    "Include variety - not just worksheets.",
    "Ensure it's meaningful and reinforces learning.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildSchemeOfWorkPrompt(input: {
  subjectName: string;
  gradeLevel: string;
  teacherRequest: string;
  duration: number;
  language: string;
}): string {
  return [
    `TASK: Generate a scheme of work (lesson sequence) for term planning.`,
    `Subject: ${input.subjectName}`,
    `Grade Level: ${input.gradeLevel}`,
    `Duration: ${input.duration} weeks`,
    `Teacher's specific request: ${input.teacherRequest}`,
    `Language: ${input.language}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Overview - subject, level, duration, goal",
    "2. Weekly Breakdown - week by week topics",
    "3. Learning Objectives for each week",
    "4. Assessment Points - when to check understanding",
    "5. Resources Needed - materials for the term",
    "6. Differentiation Notes - how to support different learners",
    "",
    "ADDITIONAL FIELDS REQUIRED:",
    '- "taskType": "scheme_of_work",',
    '- "readyToUse": true,',
    '- "estimatedDuration": "e.g., 10 weeks",',
    '- "materials": ["Syllabus", "Textbooks"],',
    '- "recommendations": ["Review weekly goals"],',
    "",
    "Make it practical and aligned with curriculum goals.",
    "Sequence topics logically for learning progression.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildLessonNotesPrompt(input: {
  subjectName: string;
  gradeLevel: string;
  topicName?: string;
  teacherRequest: string;
  language: string;
}): string {
  return [
    `TASK: Generate detailed, student-friendly learning content/notes for students to learn the topic.`,
    `Subject: ${input.subjectName}`,
    `Grade Level: ${input.gradeLevel}`,
    `Topic: ${input.topicName || "Not specified"}`,
    `Teacher's specific request: ${input.teacherRequest}`,
    `Language: ${input.language}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Introduction - engaging, student-friendly introduction with an analogy",
    "2. Key Concepts - clear explanations, definitions, and real-world relevance",
    "3. Worked Examples - step-by-step solutions and concrete illustrations",
    "4. Self-Practice Activity - interactive 'Your Turn' exercises for learners",
    "5. Review Questions - short quiz/self-check",
    "6. Suggested Homework / Worksheet tasks",
    "",
    "ADDITIONAL FIELDS REQUIRED:",
    '- "taskType": "lesson_notes",',
    '- "readyToUse": true,',
    '- "estimatedDuration": "e.g., 10 minutes",',
    '- "materials": ["Highlight key terms in bold"],',
    '- "recommendations": ["Engage student with interactive questions"],',
    "",
    "Make notes practical and easy for students to read on their portal.",
    "Use simple, encouraging language.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

function buildRemedialSupportPrompt(input: {
  subjectName: string;
  gradeLevel: string;
  topicName?: string;
  teacherRequest: string;
  language: string;
}): string {
  return [
    `TASK: Generate a remedial support plan for learners struggling with the topic.`,
    `Subject: ${input.subjectName}`,
    `Grade Level: ${input.gradeLevel}`,
    `Topic: ${input.topicName || "Not specified"}`,
    `Teacher's specific request: ${input.teacherRequest}`,
    `Language: ${input.language}`,
    "",
    "RESPONSE MUST INCLUDE ALL OF THE FOLLOWING:",
    "1. Problem Identification - what's causing difficulty",
    "2. Learning Gaps - specific concepts not understood",
    "3. Support Strategies - how to help",
    "4. Activities - targeted practice exercises",
    "5. Materials - resources for remediation",
    "6. Progress Monitoring - how to track improvement",
    "7. Timeline - when to expect progress",
    "",
    "Make support practical and achievable.",
    "Start with basics and build gradually.",
    "Return JSON only."
  ].filter(Boolean).join("\n");
}

export async function teacherComprehensiveAi(userId: string, input: {
  taskType?: TeacherTaskType;
  subjectId?: string;
  subjectName?: string;
  classId?: string;
  className?: string;
  levelId?: string;
  gradeLevel?: string;
  topicId?: string;
  topicName?: string;
  subtopicId?: string;
  subtopicName?: string;
  teacherRequest: string;
  language?: "en" | "rw" | "fr";
  duration?: number;
  numberOfQuestions?: number;
  difficultyLevel?: "easy" | "medium" | "hard";
  performanceData?: unknown;
  schoolContext?: string;
  tone?: "warm" | "professional" | "urgent" | "encouraging";
  audience?: "teacher" | "parent" | "head_teacher" | "admin";
  studentId?: string;
  studentName?: string;
  studentProgress?: unknown;
  learnerNeeds?: string[];
}) {
  const language = input.language ?? "en";
  const duration = input.duration ?? 40;
  const taskType = input.taskType ?? inferTeacherTaskType(input.teacherRequest);
  const subjectName = input.subjectName?.trim() || "Use the subject stated in the teacher description";
  const gradeLevel = input.gradeLevel?.trim() || input.className?.trim() || "Use the class or learner level stated in the teacher description";

  let prompt: string;
  
  switch (taskType) {
    case "lesson_preparation":
      prompt = buildLessonPreparationPrompt({
        subjectName,
        gradeLevel,
        topicName: input.topicName,
        subtopicName: input.subtopicName,
        teacherRequest: input.teacherRequest,
        duration,
        language
      });
      break;
    case "assessment_questions":
      prompt = buildAssessmentPrompt({
        subjectName,
        gradeLevel,
        topicName: input.topicName,
        teacherRequest: input.teacherRequest,
        numberOfQuestions: input.numberOfQuestions ?? 5,
        difficulty: input.difficultyLevel ?? "medium",
        language
      });
      break;
    case "activity_planning":
      prompt = buildActivityPlanningPrompt({
        subjectName,
        gradeLevel,
        topicName: input.topicName,
        teacherRequest: input.teacherRequest,
        duration,
        language
      });
      break;
    case "performance_analysis":
      prompt = buildPerformanceAnalysisPrompt({
        subjectName,
        teacherRequest: input.teacherRequest,
        performanceData: input.performanceData,
        language
      });
      break;
    case "decision_support":
      prompt = buildDecisionSupportPrompt({
        subjectName,
        teacherRequest: input.teacherRequest,
        performanceData: input.performanceData,
        schoolContext: input.schoolContext,
        language
      });
      break;
    case "parent_communication":
      prompt = buildParentCommunicationPrompt({
        studentName: input.studentName,
        teacherRequest: input.teacherRequest,
        studentProgress: input.studentProgress,
        tone: input.tone ?? "warm",
        audience: input.audience ?? "parent",
        language
      });
      break;
    case "intervention_recommendations":
      prompt = buildInterventionPrompt({
        subjectName,
        gradeLevel,
        teacherRequest: input.teacherRequest,
        performanceData: input.performanceData,
        learnerNeeds: input.learnerNeeds,
        language
      });
      break;
    case "homework_preparation":
      prompt = buildHomeworkPrompt({
        subjectName,
        gradeLevel,
        topicName: input.topicName,
        teacherRequest: input.teacherRequest,
        duration: duration,
        language
      });
      break;
    case "scheme_of_work":
      prompt = buildSchemeOfWorkPrompt({
        subjectName,
        gradeLevel,
        teacherRequest: input.teacherRequest,
        duration,
        language
      });
      break;
    case "course_outline":
      prompt = buildCourseOutlinePrompt({
        subjectName,
        gradeLevel,
        teacherRequest: input.teacherRequest,
        language
      });
      break;
    case "lesson_notes":
      prompt = buildLessonNotesPrompt({
        subjectName,
        gradeLevel,
        topicName: input.topicName,
        teacherRequest: input.teacherRequest,
        language
      });
      break;
    case "remedial_support":
      prompt = buildRemedialSupportPrompt({
        subjectName,
        gradeLevel,
        topicName: input.topicName,
        teacherRequest: input.teacherRequest,
        language
      });
      break;
    default:
      prompt = buildLessonPreparationPrompt({
        subjectName,
        gradeLevel,
        topicName: input.topicName,
        teacherRequest: input.teacherRequest,
        duration,
        language
      });
  }

  prompt = [
    "Teacher's full written description:",
    input.teacherRequest,
    "",
    "Instructions for this request:",
    "Carefully read the teacher's description and identify the requested education task.",
    "Use the class, subject, topic, duration, language, objectives, learner level, and special instructions mentioned in the description.",
    "If some details are missing, make reasonable assumptions and state them briefly in the response.",
    "Do not ask unnecessary follow-up questions.",
    "Generate a complete, practical, classroom-ready output with professional structure.",
    "Use headings, clear sections, bullet points, numbered steps, tables where useful, and assessment answers where relevant.",
    "",
    "Selected real app data for this request:",
    `Task type: ${taskTypeLabels[taskType]}`,
    `Subject: ${subjectName}${input.subjectId ? ` (${input.subjectId})` : ""}`,
    `Class: ${input.className ?? gradeLevel}${input.classId ? ` (${input.classId})` : ""}`,
    `Level: ${gradeLevel}${input.levelId ? ` (${input.levelId})` : ""}`,
    `Topic: ${input.topicName ?? "not selected"}${input.topicId ? ` (${input.topicId})` : ""}`,
    `Subtopic: ${input.subtopicName ?? "not selected"}${input.subtopicId ? ` (${input.subtopicId})` : ""}`,
    input.studentName ? `Learner: ${input.studentName}${input.studentId ? ` (${input.studentId})` : ""}` : "",
    input.schoolContext ? `School context: ${input.schoolContext}` : "",
    "Use the readable names above in the teacher-facing response. Do not expose technical IDs in the response.",
    "Avoid generic content. Every section must be specific to the selected subject, class/level, topic, subtopic if present, and teacher request.",
    "Return clean JSON only using the required schema. Put table-like content into clear section items.",
    "",
    prompt
  ].filter(Boolean).join("\n");
  
  const result = await callRequiredOpenAIJson<{
    taskType: string;
    title: string;
    sections: Array<{ heading: string; content: string; items: string[] }>;
    readyToUse: boolean;
    estimatedDuration: string;
    materials: string[];
    recommendations: string[];
  }>({
    userId,
    feature: `ai.${taskType}`,
    prompt,
    format: comprehensiveOutputFormat,
    model: env.OPENAI_MODEL,
    instructions: TEACHER_AI_SYSTEM_PROMPT
  });

  return {
    feature: taskType,
    taskType: result.taskType,
    title: result.title,
    sections: result.sections,
    readyToUse: result.readyToUse,
    estimatedDuration: result.estimatedDuration,
    materials: result.materials,
    recommendations: result.recommendations,
    generatedAt: new Date().toISOString(),
    source: client ? "openai" : "fallback",
    metadata: {
      subjectName: input.subjectName ?? "",
      subjectId: input.subjectId,
      className: input.className,
      classId: input.classId,
      gradeLevel: input.gradeLevel ?? input.className ?? "",
      levelId: input.levelId,
      topicName: input.topicName,
      subtopicName: input.subtopicName,
      language: input.language
    }
  };
}

// ─── ASSESSMENT AI FEATURES ──────────────────────────────────────────

const assessmentGenerationFormat = {
  type: "json_schema", name: "kuralearn_assessment_generation", strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      instructions: { type: "string" },
      rubric: {
        type: "array",
        items: {
          type: "object",
          properties: {
            criterion: { type: "string" },
            maxMarks: { type: "number" },
            description: { type: "string" }
          },
          required: ["criterion", "maxMarks", "description"],
          additionalProperties: false
        }
      },
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            questionText: { type: "string" },
            type: { type: "string", enum: ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "MATCHING", "ORDERING"] },
            options: { type: "array", items: { type: "string" } },
            correctAnswer: { type: "string" },
            marks: { type: "number" },
            explanation: { type: "string" },
            markingScheme: { type: "string" },
            difficulty: { type: "string" }
          },
          required: ["questionText", "type", "options", "correctAnswer", "marks", "explanation", "markingScheme", "difficulty"],
          additionalProperties: false
        }
      },
      modelAnswer: { type: "string" },
      totalMarks: { type: "number" },
      estimatedDurationMinutes: { type: "number" },
      competencies: { type: "array", items: { type: "string" } }
    },
    required: ["title", "instructions", "rubric", "questions", "modelAnswer", "totalMarks", "estimatedDurationMinutes", "competencies"],
    additionalProperties: false
  },
};

const feedbackSuggestionFormat = {
  type: "json_schema", name: "kuralearn_feedback_suggestion", strict: true,
  schema: { type: "object", properties: { suggestedScore: { type: "number" }, scoreJustification: { type: "string" }, strengths: { type: "array", items: { type: "string" } }, improvements: { type: "array", items: { type: "string" } }, nextSteps: { type: "string" }, overallFeedback: { type: "string" } }, required: ["suggestedScore", "scoreJustification", "strengths", "improvements", "nextSteps", "overallFeedback"], additionalProperties: false },
};

const solutionExplanationFormat = {
  type: "json_schema", name: "kuralearn_solution_explanation", strict: true,
  schema: { type: "object", properties: { explanation: { type: "string" }, keyPoints: { type: "array", items: { type: "string" } }, commonMistakes: { type: "array", items: { type: "string" } }, studyTips: { type: "array", items: { type: "string" } }, practiceRecommendations: { type: "array", items: { type: "string" } } }, required: ["explanation", "keyPoints", "commonMistakes", "studyTips", "practiceRecommendations"], additionalProperties: false },
};

export async function generateAssessment(userId: string, input: { type: string; subject: string; topic: string; gradeLevel: string; numberOfQuestions: number; difficulty: "easy" | "medium" | "hard"; totalMarks?: number; language?: "en" | "rw" | "fr"; competencies?: string[]; alignCBC?: boolean; }) {
  await teacherContext(userId);
  const totalMarks = Math.max(input.totalMarks ?? Math.max(input.numberOfQuestions * 2, 10), input.numberOfQuestions);
  const baseMarks = Math.max(1, Math.floor(totalMarks / input.numberOfQuestions));
  const fallbackTypes = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"];
  const fallback = {
    title: `${input.type} on ${input.topic}`,
    instructions: `Answer all questions. This ${input.type} checks ${input.subject} understanding of ${input.topic} for ${input.gradeLevel}.`,
    rubric: [
      { criterion: "Concept accuracy", maxMarks: Math.ceil(totalMarks * 0.4), description: "Uses correct subject knowledge." },
      { criterion: "Reasoning", maxMarks: Math.ceil(totalMarks * 0.35), description: "Explains steps or evidence clearly." },
      { criterion: "Communication", maxMarks: Math.max(1, totalMarks - Math.ceil(totalMarks * 0.75)), description: "Writes age-appropriate, clear responses." },
    ],
    questions: Array.from({ length: input.numberOfQuestions }, (_, i) => {
      const qType = fallbackTypes[i % fallbackTypes.length]!;
      return {
        questionText: `${i + 1}. ${input.gradeLevel} ${input.subject}: answer a ${input.difficulty} ${qType.toLowerCase().replace("_", " ")} question about ${input.topic}.`,
        type: qType,
        options: qType === "TRUE_FALSE" ? ["True", "False"] : qType === "MULTIPLE_CHOICE" ? ["A", "B", "C", "D"] : [],
        correctAnswer: qType === "TRUE_FALSE" ? "True" : qType === "MULTIPLE_CHOICE" ? "A" : `A clear answer about ${input.topic}.`,
        marks: i === input.numberOfQuestions - 1 ? totalMarks - baseMarks * (input.numberOfQuestions - 1) : baseMarks,
        explanation: `The answer should demonstrate accurate understanding of ${input.topic}.`,
        markingScheme: `Award marks for correct ${input.subject} concepts, clear reasoning, and appropriate vocabulary for ${input.gradeLevel}.`,
        difficulty: input.difficulty,
      };
    }),
    modelAnswer: `Learners should show accurate understanding of ${input.topic} in ${input.subject}.`,
    totalMarks,
    estimatedDurationMinutes: Math.max(10, input.numberOfQuestions * 3),
    competencies: input.competencies ?? [],
  };

  const normalize = (raw: typeof fallback) => {
    const seen = new Set<string>();
    const questions = (raw.questions ?? [])
      .filter((question) => {
        const key = String(question.questionText ?? "").trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, input.numberOfQuestions)
      .map((question, index) => {
        const type = String(question.type ?? "MULTIPLE_CHOICE").toUpperCase();
        const safeType = ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY", "MATCHING", "ORDERING"].includes(type)
          ? type
          : "MULTIPLE_CHOICE";
        return {
          ...question,
          questionText: question.questionText.trim(),
          type: safeType,
          options: Array.isArray(question.options) ? question.options : [],
          correctAnswer: question.correctAnswer ?? "",
          marks: Number.isFinite(Number(question.marks)) && Number(question.marks) > 0 ? Number(question.marks) : baseMarks,
          explanation: question.explanation || "Teacher reviews the learner response against the marking scheme.",
          markingScheme: question.markingScheme || "Award marks for correctness, reasoning, and clarity.",
          difficulty: question.difficulty || input.difficulty,
          orderIndex: index,
        };
      });
    return {
      ...fallback,
      ...raw,
      questions: questions.length ? questions : fallback.questions,
      totalMarks: raw.totalMarks || totalMarks,
      estimatedDurationMinutes: raw.estimatedDurationMinutes || fallback.estimatedDurationMinutes,
      competencies: raw.competencies?.length ? raw.competencies : fallback.competencies,
    };
  };

  if (!client) return { aiGenerated: true, approvalRequired: true, ...normalize(fallback) };
  try {
    const prompt = [
      `Generate a complete ${input.type} for the Rwanda education system.`,
      `Subject: ${input.subject}`,
      `Topic: ${input.topic}`,
      `Grade Level: ${input.gradeLevel}`,
      `Difficulty Level: ${input.difficulty}`,
      `Number of Questions: ${input.numberOfQuestions}`,
      `Total Marks: ${totalMarks}`,
      `Language: ${input.language ?? "en"}`,
      input.competencies?.length ? `Target competencies: ${input.competencies.join(", ")}` : "",
      input.alignCBC ? "PEDAGOGICAL REQUIREMENTS: Align with Rwanda Competence-Based Curriculum (CBC). Focus on competencies development and active learning." : "",
      "QUESTION TYPE REQUIREMENTS:",
      "- Include an appropriate mix of MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, ESSAY, MATCHING, and ORDERING questions.",
      "- Multiple choice questions must have four plausible options and one correct answer.",
      "- True/false questions must use options [\"True\", \"False\"].",
      "- Open-ended questions must include a model answer and a marking scheme.",
      "- For MATCHING: options should be the keys, correctAnswer should be a JSON string of the key-value mapping.",
      "- For ORDERING: options should be the items, correctAnswer should be a JSON string of the ordered array.",
      "Avoid duplicate questions or repeated wording.",
      "Ensure all questions are age-appropriate, class-level appropriate, curriculum-aligned, and practical for a teacher to review before publishing.",
    ].filter(Boolean).join("\n");
    const response = await client.responses.create({ model: env.OPENAI_MODEL, instructions: TEACHER_AI_SYSTEM_PROMPT, input: prompt, text: { format: assessmentGenerationFormat as never } });
    const usage = response.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    await prisma.aIUsageLog.create({ data: { userId, feature: "ai.generate_assessment", model: env.OPENAI_MODEL, inputTokens: usage?.input_tokens ?? 0, outputTokens: usage?.output_tokens ?? 0, costEstimate: 0 } });
    return { aiGenerated: true, approvalRequired: true, ...normalize(parseJsonOutput(response.output_text, fallback)) };
  } catch (e) { console.error("[AI] generateAssessment failed", e); return { aiGenerated: true, approvalRequired: true, ...normalize(fallback) }; }
}

export async function suggestSubmissionFeedback(userId: string, input: { assessmentTitle: string; totalMarks: number; passMark: number; instructions?: string; rubric?: unknown; studentAnswer: string; modelAnswer?: string; }) {
  await teacherContext(userId);
  const fallback = { suggestedScore: Math.round(input.totalMarks * 0.6), scoreJustification: "Partial completion.", strengths: ["Attempted the question"], improvements: ["More detail needed"], nextSteps: "Study the topic further.", overallFeedback: "Good effort. See feedback." };
  if (!client) return { aiAssisted: true, approvalRequired: true, ...fallback };
  try {
    const prompt = [`Suggest score and feedback for a student submission. Teacher must confirm.`, `Assessment: ${input.assessmentTitle}`, `Total: ${input.totalMarks}, Pass: ${input.passMark}`, input.modelAnswer ? `Model: ${input.modelAnswer}` : "", `Student answer: ${input.studentAnswer.slice(0, 3000)}`].filter(Boolean).join("\n");
    const response = await client.responses.create({ model: env.OPENAI_FAST_MODEL, instructions: TEACHER_AI_SYSTEM_PROMPT, input: prompt, text: { format: feedbackSuggestionFormat as never } });
    const usage = response.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    await prisma.aIUsageLog.create({ data: { userId, feature: "ai.feedback_suggest", model: env.OPENAI_FAST_MODEL, inputTokens: usage?.input_tokens ?? 0, outputTokens: usage?.output_tokens ?? 0, costEstimate: 0 } });
    return { aiAssisted: true, approvalRequired: true, ...parseJsonOutput(response.output_text, fallback) };
  } catch (e) { console.error("[AI] suggestSubmissionFeedback failed", e); return { aiAssisted: true, approvalRequired: true, ...fallback }; }
}

export async function explainSubmissionSolution(userId: string, input: { assessmentTitle: string; questionText?: string; modelAnswer?: string; studentAnswer: string; subject: string; gradeLevel: string; language?: "en" | "rw" | "fr"; }) {
  const student = await studentContext(userId);
  const fallback = { explanation: `Review expected answer for ${input.subject}.`, keyPoints: [`Core ${input.subject} concepts`], commonMistakes: ["Missing key details"], studyTips: ["Review lesson notes"], practiceRecommendations: ["Practice similar questions"] };
  if (!client) return fallback;
  try {
    const prompt = [`Explain solution after submission. Encouraging, age-appropriate for ${input.gradeLevel}.`, `Subject: ${input.subject}`, `Assessment: ${input.assessmentTitle}`, input.questionText ? `Question: ${input.questionText}` : "", input.modelAnswer ? `Expected: ${input.modelAnswer}` : "", `Student answer: ${input.studentAnswer.slice(0, 2000)}`, `Language: ${input.language ?? student.language}`].filter(Boolean).join("\n");
    const response = await client.responses.create({ model: env.OPENAI_FAST_MODEL, instructions: AI_SYSTEM_PROMPT, input: prompt, text: { format: solutionExplanationFormat as never } });
    const usage = response.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    await prisma.aIUsageLog.create({ data: { userId, feature: "ai.explain_solution", model: env.OPENAI_FAST_MODEL, inputTokens: usage?.input_tokens ?? 0, outputTokens: usage?.output_tokens ?? 0, costEstimate: 0 } });
    return parseJsonOutput(response.output_text, fallback);
  } catch (e) { console.error("[AI] explainSubmissionSolution failed", e); return fallback; }
}

const convertPlanToContentFormat = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "Student-friendly title for the lesson" },
    studentContent: { type: "STRING", description: "Beautifully formatted HTML study guide notes with explanations, bold terms, real-world examples, interactive self-check activities, and short homework tasks for students. Must NOT mention teacher instructions, pedagogy, or lesson objectives." },
    estimatedMinutes: { type: "INTEGER", description: "Suggested reading duration for students in minutes (usually between 5 to 20 minutes)" }
  },
  required: ["title", "studentContent", "estimatedMinutes"]
};

export async function convertPlanToContent(userId: string, input: { lessonPlanId: string }) {
  await teacherContext(userId);
  const lessonPlan = await prisma.lessonPlan.findUnique({
    where: { id: input.lessonPlanId },
    include: { subject: true, class: true }
  });
  if (!lessonPlan) throw new AppError(404, "Lesson Plan not found", "LESSON_PLAN_NOT_FOUND");

  const fallback = {
    title: lessonPlan.title || "Lesson Study Guide",
    studentContent: `<h2>Study Guide: ${lessonPlan.title}</h2><p>Here are your study notes for this lesson. Read carefully to understand the topic.</p>`,
    estimatedMinutes: 10
  };

  if (!client) return { aiConverted: true, ...fallback };

  try {
    const prompt = [
      `TASK: Convert the following internal Teacher Lesson Plan into engaging, student-friendly learning content/notes ready for student delivery on the LMS.`,
      `STRICTLY REMOVE ALL TEACHER-FACING PEDAGOGY, METHODOLOGY, OBJECTIVES, AND MANAGEMENT GUIDELINES.`,
      "",
      `Lesson Plan Title: ${lessonPlan.title}`,
      `Subject: ${lessonPlan.subject?.name || "Subject"}`,
      `Objectives: ${lessonPlan.objectives || "Not specified"}`,
      `Competencies: ${lessonPlan.competencies.join(", ") || "None"}`,
      `Teacher Activities to explain: ${lessonPlan.teachingActivities || "Not specified"}`,
      `Learner Activities: ${lessonPlan.learningActivities || "Not specified"}`,
      `Assessment Strategy: ${lessonPlan.assessmentStrategy || "Not specified"}`,
      `Homework: ${lessonPlan.homework || "Not specified"}`,
      `Notes: ${lessonPlan.notes || "None"}`,
      "",
      `STUDENT-FACING DESIGN GUIDELINES:`,
      `- Keep it simple, inspiring, and extremely readable.`,
      `- Format using beautiful HTML (headings, paragraphs, bullet points, bold text).`,
      `- Explain key terms with simple, relatable real-world analogies.`,
      `- Include a short "Your Turn" self-practice prompt.`,
      `- If there is homework, explain it clearly to the student in friendly language.`
    ].join("\n");

    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      instructions: AI_SYSTEM_PROMPT,
      input: prompt,
      text: { format: convertPlanToContentFormat as never }
    });

    const usage = response.usage as { input_tokens?: number; output_tokens?: number } | undefined;
    await prisma.aIUsageLog.create({
      data: {
        userId,
        feature: "ai.convert_plan_to_content",
        model: env.OPENAI_MODEL,
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
        costEstimate: 0
      }
    });

    return { aiConverted: true, ...parseJsonOutput(response.output_text, fallback) };
  } catch (e) {
    console.error("[AI] convertPlanToContent failed", e);
    return { aiConverted: true, ...fallback };
  }
}
