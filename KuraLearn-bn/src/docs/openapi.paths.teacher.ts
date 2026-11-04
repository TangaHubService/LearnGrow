import { bearerSecurity, dateQuery, jsonBody, operation, teacherListQueryParams, uuidParam, type OpenApiPaths } from "./openapi.shared.js";

const teacherSecurity = bearerSecurity;

export const teacherPaths: OpenApiPaths = {
  "/api/v1/teacher/dashboard": {
    get: operation({ tag: "Teacher Dashboard", summary: "Get full teacher dashboard", security: teacherSecurity, parameters: teacherListQueryParams, response: "Teacher dashboard overview" })
  },
  "/api/v1/teacher/dashboard/profile": {
    get: operation({ tag: "Teacher Dashboard", summary: "Get current teacher dashboard profile", security: teacherSecurity, response: "Teacher profile" })
  },
  "/api/v1/teacher/dashboard/stats": {
    get: operation({ tag: "Teacher Dashboard", summary: "Get teacher dashboard stats", security: teacherSecurity, parameters: [dateQuery], response: "Teacher stat cards" })
  },
  "/api/v1/teacher/dashboard/schedule": {
    get: operation({ tag: "Teacher Dashboard", summary: "Get teacher daily schedule", security: teacherSecurity, parameters: [dateQuery], response: "Teaching schedule" })
  },
  "/api/v1/teacher/dashboard/classes": {
    get: operation({ tag: "Teacher Dashboard", summary: "Get teacher dashboard classes", security: teacherSecurity, response: "Assigned class summaries" })
  },
  "/api/v1/teacher/dashboard/notifications": {
    get: operation({ tag: "Teacher Dashboard", summary: "Get teacher dashboard notifications", security: teacherSecurity, response: "Dashboard notifications" })
  },
  "/api/v1/teacher/dashboard/assessments": {
    get: operation({ tag: "Teacher Dashboard", summary: "Get teacher assessment overview", security: teacherSecurity, response: "Assessment overview" })
  },
  "/api/v1/teacher/dashboard/learners-needing-support": {
    get: operation({ tag: "Teacher Dashboard", summary: "Get learners needing support", security: teacherSecurity, response: "Learners flagged for support" })
  },
  "/api/v1/teacher/dashboard/recent-ai-outputs": {
    get: operation({ tag: "Teacher Dashboard", summary: "Get recent AI outputs", security: teacherSecurity, response: "Recent AI outputs" })
  },
  "/api/v1/teacher/reference-data": {
    get: operation({ tag: "Teacher Reference", summary: "Get teacher reference data", security: teacherSecurity, response: "Levels, classes, students, parents, teachers, topics, and school context" })
  },
  "/api/v1/teacher/classes": {
    get: operation({ tag: "Teacher Classes", summary: "List teacher classes", security: teacherSecurity, parameters: teacherListQueryParams, response: "Paginated teacher classes" }),
    post: operation({ tag: "Teacher Classes", summary: "Create teacher class", security: teacherSecurity, requestBody: jsonBody("TeacherClassCreateInput"), response: "Created teacher class", created: true })
  },
  "/api/v1/teacher/classes/{id}": {
    get: operation({ tag: "Teacher Classes", summary: "Get teacher class details", security: teacherSecurity, parameters: [uuidParam()], response: "Teacher class details" }),
    put: operation({ tag: "Teacher Classes", summary: "Update teacher class", security: teacherSecurity, parameters: [uuidParam()], requestBody: jsonBody("TeacherClassUpdateInput"), response: "Updated teacher class" })
  },
  "/api/v1/teacher/classes/{id}/archive": {
    post: operation({ tag: "Teacher Classes", summary: "Archive teacher class", security: teacherSecurity, parameters: [uuidParam()], response: "Archived class" })
  },
  "/api/v1/teacher/students": {
    get: operation({ tag: "Teacher Students", summary: "List teacher students", security: teacherSecurity, parameters: teacherListQueryParams, response: "Paginated students" }),
    post: operation({ tag: "Teacher Students", summary: "Create teacher student", security: teacherSecurity, requestBody: jsonBody("TeacherStudentCreateInput"), response: "Created student", created: true })
  },
  "/api/v1/teacher/students/{id}": {
    put: operation({ tag: "Teacher Students", summary: "Update teacher student", security: teacherSecurity, parameters: [uuidParam()], requestBody: jsonBody("TeacherStudentUpdateInput"), response: "Updated student" })
  },
  "/api/v1/teacher/lessons": {
    get: operation({ tag: "Teacher Lessons", summary: "List teacher lessons", security: teacherSecurity, parameters: teacherListQueryParams, response: "Paginated lessons" }),
    post: operation({ tag: "Teacher Lessons", summary: "Create lesson plan", security: teacherSecurity, requestBody: jsonBody("TeacherLessonCreateInput"), response: "Created lesson plan", created: true })
  },
  "/api/v1/teacher/lessons/{id}": {
    put: operation({ tag: "Teacher Lessons", summary: "Update lesson plan", security: teacherSecurity, parameters: [uuidParam()], requestBody: jsonBody("TeacherLessonUpdateInput"), response: "Updated lesson plan" })
  },
  "/api/v1/teacher/lessons/{id}/publish": {
    post: operation({ tag: "Teacher Lessons", summary: "Publish lesson plan", security: teacherSecurity, parameters: [uuidParam()], response: "Published lesson plan" })
  },
  "/api/v1/teacher/lessons/{id}/duplicate": {
    post: operation({ tag: "Teacher Lessons", summary: "Duplicate lesson plan", security: teacherSecurity, parameters: [uuidParam()], response: "Duplicated lesson plan", created: true })
  },
  "/api/v1/teacher/delivery-sessions": {
    post: operation({ tag: "Teacher Delivery", summary: "Start delivery session", security: teacherSecurity, requestBody: jsonBody("DeliverySessionInput"), response: "Created delivery session", created: true })
  },
  "/api/v1/teacher/delivery-sessions/{id}": {
    put: operation({ tag: "Teacher Delivery", summary: "Update delivery session", security: teacherSecurity, parameters: [uuidParam()], requestBody: jsonBody("DeliveryUpdateInput"), response: "Updated delivery session" })
  },
  "/api/v1/teacher/delivery-sessions/{id}/end": {
    post: operation({ tag: "Teacher Delivery", summary: "End delivery session", security: teacherSecurity, parameters: [uuidParam()], requestBody: jsonBody("DeliveryEndInput", false), response: "Ended delivery session" })
  },
  "/api/v1/teacher/quizzes": {
    get: operation({ tag: "Teacher Quizzes", summary: "List teacher quizzes", security: teacherSecurity, parameters: teacherListQueryParams, response: "Paginated quizzes" }),
    post: operation({ tag: "Teacher Quizzes", summary: "Create teacher quiz", security: teacherSecurity, requestBody: jsonBody("TeacherQuizCreateInput"), response: "Created quiz", created: true })
  },
  "/api/v1/teacher/quizzes/{id}": {
    put: operation({ tag: "Teacher Quizzes", summary: "Update teacher quiz", security: teacherSecurity, parameters: [uuidParam()], requestBody: jsonBody("TeacherQuizUpdateInput"), response: "Updated quiz" })
  },
  "/api/v1/teacher/quizzes/{id}/assign": {
    post: operation({ tag: "Teacher Quizzes", summary: "Assign quiz", security: teacherSecurity, parameters: [uuidParam()], requestBody: jsonBody("AssignQuizInput", false), response: "Assigned quiz" })
  },
  "/api/v1/teacher/reports": {
    get: operation({ tag: "Teacher Reports", summary: "Get teacher reports", security: teacherSecurity, parameters: teacherListQueryParams, response: "Reports and analytics" })
  },
  "/api/v1/teacher/messages": {
    get: operation({ tag: "Teacher Messages", summary: "List teacher messages", security: teacherSecurity, response: "Teacher messages" }),
    post: operation({ tag: "Teacher Messages", summary: "Send teacher message", security: teacherSecurity, requestBody: jsonBody("TeacherMessageCreateInput"), response: "Sent teacher message", created: true })
  },
  "/api/v1/teacher/resources": {
    get: operation({ tag: "Teacher Resources", summary: "List teacher resources", security: teacherSecurity, parameters: teacherListQueryParams, response: "Paginated resources" }),
    post: operation({ tag: "Teacher Resources", summary: "Create teacher resource", security: teacherSecurity, requestBody: jsonBody("TeacherResourceCreateInput"), response: "Created resource", created: true })
  },
  "/api/v1/teacher/notifications": {
    get: operation({ tag: "Teacher Notifications", summary: "List teacher notifications", security: teacherSecurity, response: "Teacher notifications" })
  },
  "/api/v1/teacher/audit-logs": {
    get: operation({ tag: "Teacher Audit", summary: "List teacher audit logs", security: teacherSecurity, response: "Teacher audit log entries" })
  },
  "/api/v1/teacher/ai-outputs": {
    get: operation({ tag: "Teacher AI Outputs", summary: "List saved AI outputs", security: teacherSecurity, parameters: [
      { name: "taskType", in: "query", required: false, schema: { type: "string" } },
      { name: "subjectId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
      { name: "classId", in: "query", required: false, schema: { type: "string", format: "uuid" } }
    ], response: "Saved AI outputs" }),
    post: operation({ tag: "Teacher AI Outputs", summary: "Save AI output", security: teacherSecurity, requestBody: jsonBody("TeacherAiOutputInput"), response: "Saved AI output" })
  }
};
