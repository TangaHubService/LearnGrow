import { bearerSecurity, idParam, jsonBody, operation, type OpenApiPaths } from "./openapi.shared.js";

export const corePaths: OpenApiPaths = {
  "/api-docs": {
    get: operation({
      tag: "Documentation",
      summary: "Open Swagger UI",
      response: "Swagger UI HTML page"
    })
  },
  "/api-docs/openapi.json": {
    get: operation({
      tag: "Documentation",
      summary: "Get OpenAPI JSON",
      response: "OpenAPI 3 document"
    })
  },
  "/health": {
    get: operation({
      tag: "Health",
      summary: "Check API health",
      response: "API status, service name, and timestamp"
    })
  },
  "/api/v1/auth/register": {
    post: operation({
      tag: "Auth",
      summary: "Register a user",
      requestBody: jsonBody("RegisterInput"),
      response: "Registered user and tokens",
      responseSchema: "AuthResult",
      created: true
    })
  },
  "/api/v1/auth/login": {
    post: operation({
      tag: "Auth",
      summary: "Login with email and password",
      requestBody: jsonBody("LoginInput"),
      response: "Authenticated user and tokens",
      responseSchema: "AuthResult"
    })
  },
  "/api/v1/auth/refresh": {
    post: operation({
      tag: "Auth",
      summary: "Refresh access token",
      requestBody: jsonBody("RefreshTokenInput"),
      response: "Refreshed authentication tokens",
      responseSchema: "AuthResult"
    })
  },
  "/api/v1/auth/logout": {
    post: operation({
      tag: "Auth",
      summary: "Logout current user",
      security: bearerSecurity,
      response: "Logout completed",
      noContent: true
    })
  },
  "/api/v1/auth/me": {
    get: operation({
      tag: "Auth",
      summary: "Get authenticated user",
      security: bearerSecurity,
      response: "Current user"
    })
  },
  "/api/v1/admin/dashboard": {
    get: operation({
      tag: "Admin",
      summary: "Get admin dashboard overview",
      description: "Requires ADMIN or SUPER_ADMIN role.",
      security: bearerSecurity,
      response: "School admin dashboard metrics and activity"
    })
  },
  "/api/v1/analytics/overview": {
    get: operation({
      tag: "Analytics",
      summary: "Get analytics overview",
      description: "Requires PARENT, TEACHER, or ADMIN role.",
      security: bearerSecurity,
      response: "Platform analytics overview"
    })
  },
  "/api/v1/users/me": {
    get: operation({
      tag: "Users",
      summary: "Get current user profile",
      security: bearerSecurity,
      response: "Current user profile"
    })
  },
  "/api/v1/users/students": {
    get: operation({
      tag: "Users",
      summary: "List students",
      description: "Requires TEACHER or ADMIN role.",
      security: bearerSecurity,
      response: "Students list"
    })
  },
  "/api/v1/admin/{resource}": {
    get: operation({
      tag: "Admin",
      summary: "Get admin resource placeholder",
      description: "Returns admin placeholder data for resource modules that are still being expanded.",
      security: bearerSecurity,
      parameters: [
        {
          ...idParam("resource", "Admin resource name"),
          schema: { type: "string", enum: ["levels", "subjects", "courses", "lessons", "quizzes", "library", "users", "schools", "imports", "audit-logs"] }
        }
      ],
      response: "Admin resource placeholder"
    })
  }
};
