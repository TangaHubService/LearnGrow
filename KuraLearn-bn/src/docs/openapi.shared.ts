export type OpenApiPaths = Record<string, Record<string, unknown>>;
export type OpenApiSchemas = Record<string, unknown>;

export const bearerSecurity = [{ bearerAuth: [] }];

export function schemaRef(name: string) {
  return { $ref: `#/components/schemas/${name}` };
}

export function jsonBody(schemaName: string, required = true) {
  return {
    required,
    content: {
      "application/json": {
        schema: schemaRef(schemaName)
      }
    }
  };
}

export function jsonResponse(description: string, schemaName = "GenericObject") {
  return {
    description,
    content: {
      "application/json": {
        schema: schemaRef(schemaName)
      }
    }
  };
}

export const standardErrors = {
  400: jsonResponse("Validation error", "ErrorResponse"),
  401: jsonResponse("Authentication required", "ErrorResponse"),
  403: jsonResponse("Insufficient role or permissions", "ErrorResponse"),
  404: jsonResponse("Resource not found", "ErrorResponse"),
  500: jsonResponse("Unexpected server error", "ErrorResponse")
};

export const idParam = (name = "id", description = "Resource identifier") => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string" },
  description
});

export const uuidParam = (name = "id", description = "UUID resource identifier") => ({
  name,
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
  description
});

export const dateQuery = {
  name: "date",
  in: "query",
  required: false,
  schema: { type: "string", format: "date" },
  description: "Date filter in YYYY-MM-DD format"
};

export const learningQueryParams = [
  {
    name: "levelId",
    in: "query",
    required: false,
    schema: { type: "string", format: "uuid" }
  }
];

export const libraryQueryParams = [
  { name: "levelId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
  { name: "subjectId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
  { name: "type", in: "query", required: false, schema: { type: "string" } },
  { name: "language", in: "query", required: false, schema: { type: "string", enum: ["en", "rw", "fr"] } },
  { name: "search", in: "query", required: false, schema: { type: "string" } }
];

export const teacherListQueryParams = [
  { name: "search", in: "query", required: false, schema: { type: "string" } },
  { name: "status", in: "query", required: false, schema: { type: "string" } },
  { name: "classId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
  { name: "subjectName", in: "query", required: false, schema: { type: "string" } },
  { name: "page", in: "query", required: false, schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "pageSize", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 100, default: 12 } },
  { name: "sortBy", in: "query", required: false, schema: { type: "string", default: "updatedAt" } },
  { name: "sortDir", in: "query", required: false, schema: { type: "string", enum: ["asc", "desc"], default: "desc" } }
];

export function operation(input: {
  tag: string;
  summary: string;
  description?: string;
  security?: unknown[];
  parameters?: unknown[];
  requestBody?: unknown;
  response?: string;
  responseSchema?: string;
  created?: boolean;
  noContent?: boolean;
}) {
  const successCode = input.noContent ? 204 : input.created ? 201 : 200;
  const successResponse = input.noContent
    ? { description: input.response ?? "No content" }
    : jsonResponse(input.response ?? "Successful response", input.responseSchema);

  return {
    tags: [input.tag],
    summary: input.summary,
    ...(input.description ? { description: input.description } : {}),
    ...(input.security ? { security: input.security } : {}),
    ...(input.parameters?.length ? { parameters: input.parameters } : {}),
    ...(input.requestBody ? { requestBody: input.requestBody } : {}),
    responses: {
      [successCode]: successResponse,
      ...standardErrors
    }
  };
}
