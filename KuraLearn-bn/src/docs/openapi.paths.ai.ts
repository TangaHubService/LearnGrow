import { bearerSecurity, jsonBody, operation, uuidParam, type OpenApiPaths } from "./openapi.shared.js";

const studentAiSecurity = bearerSecurity;
const teacherAiSecurity = bearerSecurity;

function studentAi(summary: string, schema: string) {
  return operation({
    tag: "Student AI",
    summary,
    description: "Requires STUDENT role and is rate-limited to 20 requests per minute.",
    security: studentAiSecurity,
    requestBody: jsonBody(schema),
    response: "AI response"
  });
}

function teacherAi(summary: string, schema: string) {
  return operation({
    tag: "Teacher AI",
    summary,
    description: "Requires TEACHER, HEAD_TEACHER, ADMIN, or SUPER_ADMIN role and is rate-limited to 20 requests per minute.",
    security: teacherAiSecurity,
    requestBody: jsonBody(schema),
    response: "Teacher AI response"
  });
}

export const aiPaths: OpenApiPaths = {
  "/api/v1/ai/chat": {
    post: studentAi("Chat with the AI tutor", "ChatInput")
  },
  "/api/v1/ai/hint": {
    post: studentAi("Generate a student hint", "HintInput")
  },
  "/api/v1/ai/explain-lesson": {
    post: studentAi("Explain a lesson", "ExplainLessonInput")
  },
  "/api/v1/ai/translate": {
    post: studentAi("Translate learning content", "TranslateInput")
  },
  "/api/v1/ai/recommend-remedial": {
    post: studentAi("Recommend remedial learning", "RemedialInput")
  },
  "/api/v1/ai/generate-practice": {
    post: studentAi("Generate practice questions", "PracticeGenerateInput")
  },
  "/api/v1/ai/conversations": {
    get: operation({
      tag: "Student AI",
      summary: "List AI tutor conversations",
      description: "Requires STUDENT role.",
      security: studentAiSecurity,
      response: "AI conversations"
    })
  },
  "/api/v1/ai/conversations/{id}": {
    get: operation({
      tag: "Student AI",
      summary: "Get AI tutor conversation",
      description: "Requires STUDENT role.",
      security: studentAiSecurity,
      parameters: [uuidParam()],
      response: "AI conversation"
    })
  },
  "/api/v1/ai/lesson-objectives": {
    post: teacherAi("Generate lesson objectives", "TeacherAiInput")
  },
  "/api/v1/ai/lesson-plan": {
    post: teacherAi("Generate a lesson plan", "TeacherAiInput")
  },
  "/api/v1/ai/quiz-generate": {
    post: teacherAi("Generate quiz questions", "TeacherQuizGenerateInput")
  },
  "/api/v1/ai/analyze-performance": {
    post: teacherAi("Analyze class or learner performance", "TeacherAiInput")
  },
  "/api/v1/ai/student-risk": {
    post: teacherAi("Predict student risk", "TeacherAiInput")
  },
  "/api/v1/ai/intervention-recommendations": {
    post: teacherAi("Recommend learner interventions", "TeacherAiInput")
  },
  "/api/v1/ai/report-summary": {
    post: teacherAi("Summarize a teacher report", "TeacherAiInput")
  },
  "/api/v1/ai/parent-message-draft": {
    post: teacherAi("Draft a parent message", "TeacherParentMessageDraftInput")
  },
  "/api/v1/ai/translate-or-simplify": {
    post: teacherAi("Translate or simplify teacher content", "TeacherTranslateOrSimplifyInput")
  },
  "/api/v1/ai/comprehensive": {
    post: teacherAi("Run comprehensive teacher AI assistant", "TeacherComprehensiveAiInput")
  }
};
