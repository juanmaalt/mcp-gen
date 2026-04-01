import { OpenAPIEndpoint } from "@src/models/types.js";

export const SYSTEM_PROMPT_TO_MCP = `You are an expert in MCP (Model Context Protocol).
Your task is to convert OpenAPI endpoints into MCP tool definitions.

For each endpoint:
1. Generate a snake_case name from the operationId or method+path
2. Write a clear description from summary/description
3. Combine path params, query params, and request body into inputSchema

CRITICAL: inputSchema MUST always have "type": "object" and a "properties" field.
If the request body is an array, wrap it: use a property like "items" with type "array".
Never set inputSchema.type to anything other than "object".

Respond with a JSON array only. No markdown, no explanations.`;

export const buildConversionPrompt = (endpoints: OpenAPIEndpoint[]): string => {
    const stripped = endpoints.map(({ responses: _r, ...rest }) => rest);
    const endpointsJson = JSON.stringify(stripped, null, 2);

    return `Convert these OpenAPI endpoints to MCP tools:
${endpointsJson}

Return JSON array matching this structure:
[{
  "name": "get_user_by_id",
  "description": "Retrieves a user by their unique identifier",
  "inputSchema": {
    "type": "object",
    "properties": {
      "user_id": { "type": "string", "description": "The user's ID" }
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
