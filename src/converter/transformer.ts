import { z } from "zod";
import { OpenAPIEndpoint, MCPTool } from "@src/models/types.js";
import { SYSTEM_PROMPT_TO_MCP, buildConversionPrompt } from "@src/converter/prompts.js";
import { initClient, complete, parseStructuredResponse } from "@src/converter/llm-client.js";

const JSONSchemaZod = z
    .object({
        type: z.string().optional(),
        description: z.string().optional(),
        enum: z.array(z.string()).optional(),
    })
    .passthrough();

const MCPToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.object({
        type: z.literal("object"),
        properties: z.record(JSONSchemaZod),
        required: z.array(z.string()),
    }),
});

const MCPToolArraySchema = z.array(MCPToolSchema);

export async function transform(endpoints: OpenAPIEndpoint[], model: string | undefined): Promise<MCPTool[]> {
    const conversionPrompt: string = buildConversionPrompt(endpoints);
    const client = initClient();
    const completion: string = await complete(client, model, conversionPrompt, SYSTEM_PROMPT_TO_MCP);

    return parseStructuredResponse(completion, MCPToolArraySchema);
}
