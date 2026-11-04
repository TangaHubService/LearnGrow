import { bearerSecurity, idParam, jsonBody, learningQueryParams, libraryQueryParams, operation, uuidParam, type OpenApiPaths } from "./openapi.shared.js";

export const platformPaths: OpenApiPaths = {
  "/api/v1/students/me": {
    get: operation({ tag: "Student Platform", summary: "Get current student profile", security: bearerSecurity, response: "Current student profile" }),
    put: operation({ tag: "Student Platform", summary: "Update current student profile", security: bearerSecurity, requestBody: jsonBody("ProfileUpdateInput"), response: "Updated student profile" })
  },
  "/api/v1/students/profile-setup": {
    post: operation({ tag: "Student Platform", summary: "Create student profile setup", security: bearerSecurity, requestBody: jsonBody("ProfileSetupInput"), response: "Created student profile", created: true })
  },
  "/api/v1/students/me/dashboard": {
    get: operation({ tag: "Student Platform", summary: "Get student dashboard", security: bearerSecurity, response: "Student learning dashboard" })
  },
  "/api/v1/levels/{levelId}/subjects": {
    get: operation({ tag: "Catalog", summary: "List subjects for a level", security: bearerSecurity, parameters: [uuidParam("levelId", "Level id")], response: "Subjects available for the level" })
  },
  "/api/v1/students/me/subjects": {
    get: operation({ tag: "Catalog", summary: "List current student's subjects", security: bearerSecurity, response: "Student subjects" })
  },
  "/api/v1/subjects/{subjectId}/courses": {
    get: operation({ tag: "Catalog", summary: "List courses for a subject", security: bearerSecurity, parameters: [uuidParam("subjectId", "Subject id")], response: "Subject courses" })
  },
  "/api/v1/lessons/{id}": {
    get: operation({ tag: "Student Learning", summary: "Get student lesson", security: bearerSecurity, parameters: [uuidParam()], response: "Lesson details with learner progress" })
  },
  "/api/v1/lessons/{id}/progress": {
    post: operation({ tag: "Student Learning", summary: "Update student lesson progress", security: bearerSecurity, parameters: [uuidParam()], requestBody: jsonBody("PlatformProgressInput"), response: "Updated lesson progress" })
  },
  "/api/v1/lessons/{id}/complete": {
    post: operation({ tag: "Student Learning", summary: "Mark lesson complete", security: bearerSecurity, parameters: [uuidParam()], requestBody: jsonBody("GenericObject", false), response: "Completed lesson progress" })
  },
  "/api/v1/practice/attempts": {
    post: operation({ tag: "Student Learning", summary: "Record a practice attempt", security: bearerSecurity, requestBody: jsonBody("PracticeAttemptInput"), response: "Created practice attempt", created: true })
  },
  "/api/v1/quizzes/{id}": {
    get: operation({ tag: "Student Learning", summary: "Get student quiz", security: bearerSecurity, parameters: [uuidParam()], response: "Quiz details" })
  },
  "/api/v1/quizzes/{id}/submit": {
    post: operation({ tag: "Student Learning", summary: "Submit student quiz", security: bearerSecurity, parameters: [uuidParam()], requestBody: jsonBody("QuizSubmitInput"), response: "Quiz attempt result", created: true })
  },
  "/api/v1/quiz-attempts/{id}/results": {
    get: operation({ tag: "Student Learning", summary: "Get quiz attempt results", security: bearerSecurity, parameters: [uuidParam()], response: "Quiz attempt results" })
  },
  "/api/v1/students/me/analytics": {
    get: operation({ tag: "Student Platform", summary: "Get student analytics", security: bearerSecurity, response: "Student analytics" })
  },
  "/api/v1/students/me/rewards": {
    get: operation({ tag: "Student Platform", summary: "Get student rewards", security: bearerSecurity, response: "Student rewards" })
  },
  "/api/v1/students/me/certificates": {
    get: operation({ tag: "Student Platform", summary: "Get student certificates", security: bearerSecurity, response: "Student certificates" })
  },
  "/api/v1/library": {
    get: operation({ tag: "Library", summary: "List library resources", security: bearerSecurity, parameters: libraryQueryParams, response: "Library resources" })
  },
  "/api/v1/library/{id}": {
    get: operation({ tag: "Library", summary: "Get library resource", security: bearerSecurity, parameters: [uuidParam()], response: "Library resource details" })
  },
  "/api/v1/students/me/goals": {
    get: operation({ tag: "Goals", summary: "List student goals", security: bearerSecurity, response: "Student goals" }),
    post: operation({ tag: "Goals", summary: "Create student goal", security: bearerSecurity, requestBody: jsonBody("GoalCreateInput"), response: "Created student goal", created: true })
  },
  "/api/v1/goals/{id}": {
    put: operation({ tag: "Goals", summary: "Update student goal", security: bearerSecurity, parameters: [uuidParam()], requestBody: jsonBody("GoalUpdateInput"), response: "Updated student goal" })
  },
  "/api/v1/messages": {
    get: operation({ tag: "Messages", summary: "List message threads", security: bearerSecurity, response: "Message threads" }),
    post: operation({ tag: "Messages", summary: "Create a message", security: bearerSecurity, requestBody: jsonBody("PlatformMessageCreateInput"), response: "Created message", created: true })
  },
  "/api/v1/messages/{threadId}": {
    get: operation({ tag: "Messages", summary: "Get message thread", security: bearerSecurity, parameters: [idParam("threadId", "Thread id")], response: "Thread messages" })
  },
  "/api/v1/notifications": {
    get: operation({ tag: "Notifications", summary: "List notifications", security: bearerSecurity, response: "Notifications" })
  },
  "/api/v1/notifications/{id}/read": {
    put: operation({ tag: "Notifications", summary: "Mark notification as read", security: bearerSecurity, parameters: [uuidParam()], response: "Updated notification" })
  },
  "/api/v1/learning/lessons": {
    get: operation({ tag: "Learning", summary: "List learning lessons", security: bearerSecurity, parameters: learningQueryParams, response: "Lessons" })
  },
  "/api/v1/learning/lessons/{id}": {
    get: operation({ tag: "Learning", summary: "Get learning lesson", security: bearerSecurity, parameters: [uuidParam()], response: "Learning lesson details" })
  },
  "/api/v1/learning/lessons/{id}/progress": {
    patch: operation({ tag: "Learning", summary: "Patch learning progress", security: bearerSecurity, parameters: [uuidParam()], requestBody: jsonBody("LearningProgressInput"), response: "Updated progress" }),
    post: operation({ tag: "Learning", summary: "Post learning progress", security: bearerSecurity, parameters: [uuidParam()], requestBody: jsonBody("LearningProgressInput"), response: "Updated progress" })
  },
  "/api/v1/learning/paths": {
    get: operation({ tag: "Learning", summary: "Get learning paths", security: bearerSecurity, parameters: learningQueryParams, response: "Learning paths" })
  },
  "/api/v1/learning/quizzes": {
    get: operation({ tag: "Learning", summary: "List learning quizzes", security: bearerSecurity, parameters: learningQueryParams, response: "Quizzes" })
  },
  "/api/v1/learning/quizzes/{id}": {
    get: operation({ tag: "Learning", summary: "Get learning quiz", security: bearerSecurity, parameters: [uuidParam()], response: "Learning quiz details" })
  },
  "/api/v1/learning/quizzes/{id}/submit": {
    post: operation({ tag: "Learning", summary: "Submit learning quiz", security: bearerSecurity, parameters: [uuidParam()], requestBody: jsonBody("LearningQuizSubmitInput"), response: "Quiz submission result" })
  },
  "/api/v1/learning/progress": {
    get: operation({ tag: "Learning", summary: "Get student learning progress", security: bearerSecurity, response: "Student progress summary" })
  }
};
