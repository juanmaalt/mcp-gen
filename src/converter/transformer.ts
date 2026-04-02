import { OpenAPIEndpoint, MCPTool } from "@src/models/types.js";
import { SYSTEM_PROMPT_TO_MCP, buildConversionPrompt } from "@src/converter/prompts.js";
import { initClient, complete, parseStructuredResponse } from "@src/converter/llm-client.js";
import { MCPToolArraySchema } from "@src/models/schemas.js";
import { Writer } from "@src/utils/logger.js";

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

function normalizer(input: unknown): unknown {
    return Array.isArray(input) ? input.map(normalizeInputSchema) : input;
}

export async function transform(
    writer: Writer,
    model: string | undefined,
    endpoints: OpenAPIEndpoint[],
): Promise<MCPTool[]> {
    writer.info(`Converting ${endpoints.length} endpoint(s) to MCP tools...`);
    const conversionPrompt: string = buildConversionPrompt(endpoints);
    const client = initClient();
    const completion: string = await complete(client, model, conversionPrompt, SYSTEM_PROMPT_TO_MCP);

    const tools = parseStructuredResponse(completion, MCPToolArraySchema, normalizer);
    writer.success(`${tools.length} MCP tool(s) generated.`);
    return tools;
}
