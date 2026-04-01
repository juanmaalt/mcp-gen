import { OpenAPIEndpoint, MCPTool } from "@src/models/types.js";
import { SYSTEM_PROMPT_TO_MCP, buildConversionPrompt } from "@src/converter/prompts.js";
import { initClient, complete, parseStructuredResponse } from "@src/converter/llm-client.js";
import { MCPToolArraySchema } from "@src/models/schemas.js";

function normalizeInputSchema(tool: Record<string, unknown>): Record<string, unknown> {
    const schema = tool["inputSchema"] as Record<string, unknown> | undefined;
    if (schema && schema["type"] !== "object") {
        return {
            ...tool,
            inputSchema: {
                type: "object",
                properties: { body: schema },
                required: ["body"],
            },
        };
    }
    return tool;
}

function normalizer(input: unknown): any {
    return Array.isArray(input) ? input.map(normalizeInputSchema) : input;
}

export async function transform(endpoints: OpenAPIEndpoint[], model: string | undefined): Promise<MCPTool[]> {
    const conversionPrompt: string = buildConversionPrompt(endpoints);
    const client = initClient();
    const completion: string = await complete(client, model, conversionPrompt, SYSTEM_PROMPT_TO_MCP);

    return parseStructuredResponse(completion, MCPToolArraySchema, normalizer);
}
