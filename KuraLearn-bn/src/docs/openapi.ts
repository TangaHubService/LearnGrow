import { env } from "../config/env.js";
import { aiPaths } from "./openapi.paths.ai.js";
import { corePaths } from "./openapi.paths.core.js";
import { platformPaths } from "./openapi.paths.platform.js";
import { teacherPaths } from "./openapi.paths.teacher.js";
import { openApiSchemas } from "./openapi.schemas.js";

function serverRoot() {
  return env.API_BASE_URL.replace(/\/api\/v1\/?$/, "");
}

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "KuraLearn API",
    version: "0.1.0",
    description: "Swagger/OpenAPI documentation for the implemented LearnGrow AI backend endpoints."
  },
  servers: [
    { url: serverRoot(), description: "Configured backend server" },
    { url: "http://localhost:4000", description: "Local development server" }
  ],
  tags: [
    { name: "Documentation" },
    { name: "Health" },
    { name: "Auth" },
    { name: "Admin" },
    { name: "Analytics" },
    { name: "Users" },
    { name: "Student Platform" },
    { name: "Catalog" },
    { name: "Student Learning" },
    { name: "Library" },
    { name: "Goals" },
    { name: "Messages" },
    { name: "Notifications" },
    { name: "Learning" },
    { name: "Teacher Dashboard" },
    { name: "Teacher Reference" },
    { name: "Teacher Classes" },
    { name: "Teacher Students" },
    { name: "Teacher Lessons" },
    { name: "Teacher Delivery" },
    { name: "Teacher Quizzes" },
    { name: "Teacher Reports" },
    { name: "Teacher Messages" },
    { name: "Teacher Resources" },
    { name: "Teacher Notifications" },
    { name: "Teacher Audit" },
    { name: "Teacher AI Outputs" },
    { name: "Student AI" },
    { name: "Teacher AI" }
  ],
  paths: {
    ...corePaths,
    ...platformPaths,
    ...teacherPaths,
    ...aiPaths
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: openApiSchemas
  }
} as const;
