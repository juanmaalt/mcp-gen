import { OpenAPIEndpoint } from "@src/models/types.js";

export const SYSTEM_PROMPT_TO_MCP = `You are an expert in MCP (Model Context Protocol).
Your task is to convert OpenAPI endpoints into MCP tool definitions.

For each endpoint:
1. Generate a snake_case name from the operationId or method+path
2. Write a clear description from summary/description
3. Combine path params, query params, and request body into inputSchema

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
