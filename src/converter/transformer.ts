import { z } from "zod";
import { OpenAPIEndpoint, MCPTool } from "@src/models/types.js";
import { SYSTEM_PROMPT_TO_MCP, buildConversionPrompt } from "@src/converter/prompts.js";
import { initClient, complete } from "@src/converter/llm-client.js";

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
        required: z.array(z.string()).optional(),
    }),
});

const MCPToolArraySchema = z.array(MCPToolSchema);

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

export async function transform(endpoints: OpenAPIEndpoint[], model: string | undefined): Promise<MCPTool[]> {
    const conversionPrompt: string = buildConversionPrompt(endpoints);
    const client = initClient();
    const completion: string = await complete(client, model, conversionPrompt, SYSTEM_PROMPT_TO_MCP);

    const raw = JSON.parse(completion.replace(/```json\n?|\n?```/g, "").trim());
    const normalized = Array.isArray(raw) ? raw.map(normalizeInputSchema) : raw;
    return MCPToolArraySchema.parse(normalized);
}
