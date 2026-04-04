import { OpenAPIEndpoint } from "@src/models/types.js";

export const SYSTEM_PROMPT_TO_MCP = `You are an expert in MCP (Model Context Protocol).
Your task is to convert OpenAPI endpoints into MCP tool definitions.

For each endpoint:
1. Generate a snake_case name from the operationId or method+path
2. Write a rich, detailed description that covers:
   - What the endpoint does (from summary/description)
   - What the request body fields mean and their constraints (from requestBody schema properties and descriptions)
   - What the endpoint returns (from the response schema fields and descriptions)
   - Any relevant path or query parameters and their purpose
   The description should be a single coherent paragraph, not a list. Be specific — mention field names, types, and business meaning when available.
3. Combine path params, query params, and request body into inputSchema. Include a "description" on every property using the schema descriptions and any context you can infer.

CRITICAL: inputSchema MUST always have "type": "object" and a "properties" field.
If the request body is an array, wrap it: use a property like "items" with type "array".
Never set inputSchema.type to anything other than "object".

Respond with a JSON array only. No markdown, no explanations.`;

export const buildConversionPrompt = (endpoints: OpenAPIEndpoint[]): string => {
    const endpointsJson = JSON.stringify(endpoints, null, 2);

    return `Convert these OpenAPI endpoints to MCP tools:
${endpointsJson}

Return JSON array matching this structure:
[{
  "name": "get_user_by_id",
  "description": "Retrieves a user by their unique identifier. Accepts a path parameter user_id (string). Returns the full user object including id, name, email, and createdAt timestamp.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string", "description": "The unique identifier of the user to retrieve" }
    },
    "required": ["user_id"]
  }
}]`;
};

export const SYSTEM_PROMPT_TO_OPENAPI = `You are a code analyzer that extracts API endpoints
and converts them to OpenAPI 3.0 specifications.

For each endpoint you find:
1. Identify the HTTP method and URL path
2. Extract parameters (path, query, body) with types
3. Understand what the endpoint does
4. Generate a clear description

CRITICAL OPENAPI 3.0 RULES — strictly follow these, never use Swagger 2.0 syntax:
- The "in" field of parameters MUST be one of: "query", "path", "header", "cookie". NEVER use "formData" or "body" — these are Swagger 2.0 only.
- Form fields and request bodies MUST be expressed as "requestBody" with content type "application/json", "application/x-www-form-urlencoded", or "multipart/form-data".
- Do NOT use "in": "body" or "in": "formData" under any circumstances.

Respond with a valid OpenAPI 3.0 JSON only. No markdown, no explanations.`;

export const buildAnalysisPrompt = (code: string, language: string): string => {
    return `Analyze this ${language} code and extract all API endpoints.

Code:
\`\`\`${language}
${code}
\`\`\`

Return a complete OpenAPI 3.0 specification in JSON:
{
  "openapi": "3.0.0",
  "info": {
    "title": "API",
    "version": "1.0.0"
  },
  "paths": {
    "/users/{id}": {
      "get": {
        "operationId": "getUserById",
        "summary": "Get user by ID",
        "parameters": [...],
        "responses": {...}
      }
    }
  }
}`;
};
