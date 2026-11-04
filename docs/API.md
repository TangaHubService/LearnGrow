# KuraLearn API

Base URL: `/api/v1`

Swagger UI is served by the backend at `/api-docs`.

The raw OpenAPI 3 JSON document is available at `/api-docs/openapi.json` and is generated from the implemented Express routes grouped by module.

All student, teacher, messaging, notification, library, and AI routes require a JWT access token.

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

## Student

- `GET /students/me`
- `PUT /students/me`
- `POST /students/profile-setup`
- `GET /students/me/dashboard`
- `GET /students/me/subjects`
- `GET /students/me/analytics`
- `GET /students/me/rewards`
- `GET /students/me/certificates`
- `GET /students/me/goals`
- `POST /students/me/goals`
- `PUT /goals/:id`

## Learning

- `GET /levels/:levelId/subjects`
- `GET /subjects/:subjectId/courses`
- `GET /lessons/:id`
- `POST /lessons/:id/progress`
- `POST /lessons/:id/complete`
- `POST /practice/attempts`
- `GET /quizzes/:id`
- `POST /quizzes/:id/submit`
- `GET /quiz-attempts/:id/results`

## Library, Messages, Notifications

- `GET /library`
- `GET /library/:id`
- `GET /messages`
- `GET /messages/:threadId`
- `POST /messages`
- `GET /notifications`
- `PUT /notifications/:id/read`

## LearnGrow Teacher

Protected by `TEACHER`, `HEAD_TEACHER`, `ADMIN`, or `SUPER_ADMIN`:

- `GET /teacher/dashboard`
- `GET /teacher/classes`
- `POST /teacher/classes`
- `GET /teacher/classes/:id`
- `PUT /teacher/classes/:id`
- `POST /teacher/classes/:id/archive`
- `GET /teacher/students`
- `POST /teacher/students`
- `PUT /teacher/students/:id`
- `GET /teacher/lessons`
- `POST /teacher/lessons`
- `PUT /teacher/lessons/:id`
- `POST /teacher/lessons/:id/publish`
- `POST /teacher/lessons/:id/duplicate`
- `POST /teacher/lessons/:id/archive`
- `POST /teacher/delivery-sessions`
- `PUT /teacher/delivery-sessions/:id`
- `POST /teacher/delivery-sessions/:id/end`
- `GET /teacher/quizzes`
- `POST /teacher/quizzes`
- `PUT /teacher/quizzes/:id`
- `POST /teacher/quizzes/:id/assign`
- `POST /teacher/quizzes/:id/archive`
- `GET /teacher/reports`
- `GET /teacher/messages`
- `POST /teacher/messages`
- `GET /teacher/resources`
- `POST /teacher/resources`
- `PUT /teacher/resources/:id`
- `POST /teacher/resources/:id/archive`
- `GET /teacher/notifications`
- `GET /teacher/audit-logs`
- `POST /teacher/ai-outputs`
- `GET /teacher/ai-outputs`

## AI

The backend uses the OpenAI Responses API via the official Node SDK. Student responses are child-safe and teacher copilot outputs are returned as approval-required drafts. All AI routes are rate-limited.

- `POST /ai/chat`
- `POST /ai/hint`
- `POST /ai/explain-lesson`
- `POST /ai/translate`
- `POST /ai/recommend-remedial`
- `POST /ai/generate-practice`
- `GET /ai/conversations`
- `GET /ai/conversations/:id`

Teacher copilot routes:

- `POST /ai/lesson-objectives`
- `POST /ai/lesson-plan`
- `POST /ai/quiz-generate`
- `POST /ai/analyze-performance`
- `POST /ai/student-risk`
- `POST /ai/intervention-recommendations`
- `POST /ai/report-summary`
- `POST /ai/parent-message-draft`
- `POST /ai/translate-or-simplify`

Teacher AI responses include:

```json
{
  "feature": "lesson-plan",
  "approvalRequired": true,
  "title": "Lesson plan draft",
  "output": "string",
  "bullets": ["string"],
  "confidence": 0.82,
  "explanation": "string",
  "recommendedActions": [
    { "label": "Review draft", "action": "OPEN_APPROVAL_DRAWER" }
  ]
}
```

`POST /ai/chat` returns:

```json
{
  "reply": "string",
  "language": "en",
  "suggestedActions": [
    { "label": "Review lesson", "action": "OPEN_LESSON", "targetId": "lessonId" }
  ],
  "practiceQuestion": {
    "questionText": "string",
    "options": ["A", "B", "C"],
    "hint": "string"
  }
}
```

## Admin Readiness

Protected by the `ADMIN` role:

- `GET /admin/dashboard`
- `/admin/levels`
- `/admin/subjects`
- `/admin/courses`
- `/admin/lessons`
- `/admin/quizzes`
- `/admin/library`
- `/admin/users`
- `/admin/schools`
- `/admin/imports`
- `/admin/audit-logs`
