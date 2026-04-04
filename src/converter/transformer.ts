import { OpenAPIEndpoint, MCPTool, Options } from "@src/models/types.js";
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
    const arr = Array.isArray(input)
        ? input
        : typeof input === "object" && input !== null
            ? Object.values(input as Record<string, unknown>).find(Array.isArray)
            : undefined;
    return Array.isArray(arr) ? arr.map(normalizeInputSchema) : input;
}

const DEFAULT_CHUNK_SIZE = 5;

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

export async function transform(
    writer: Writer,
    options: Options,
    endpoints: OpenAPIEndpoint[],
): Promise<MCPTool[]> {
    const { model, maxTokens, chunkSize = DEFAULT_CHUNK_SIZE } = options;
    const client = initClient();
    const chunks = chunkArray(endpoints, chunkSize);
    writer.info(`Processing ${endpoints.length} endpoint(s) in ${chunks.length} chunk(s) of up to ${chunkSize}.`);

    const allTools: MCPTool[] = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]!;
        writer.info(`Chunk ${i + 1}/${chunks.length}: ${chunk.map((e) => `${e.method} ${e.path}`).join(", ")}`);

        const completion = await complete(client, model, maxTokens, buildConversionPrompt(chunk), SYSTEM_PROMPT_TO_MCP);
        const tools = parseStructuredResponse(completion, MCPToolArraySchema, normalizer);
        allTools.push(...tools);
    }

    writer.info(`${allTools.length} tool(s) parsed from LLM response.`);
    return allTools;
}
