import "dotenv/config";
import OpenAI from "openai";
import z from "zod";

const DEFAULT_MAX_TOKENS = 16384;
const DEFAULT_MODEL = "gpt-4o-mini";

export const initClient = (): OpenAI => {
    if (!process.env["OPENAI_API_KEY"]) {
        throw new Error("OPENAI_API_KEY environment variable is required");
    }

    return new OpenAI({
        apiKey: process.env["OPENAI_API_KEY"],
    });
};

export const complete = async (
    client: OpenAI,
    model: string = DEFAULT_MODEL,
    maxTokens: number = DEFAULT_MAX_TOKENS,
    prompt: string,
    systemPrompt: string,
): Promise<string> => {
    const response = await client.chat.completions.create({
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
        throw new Error("LLM returned empty response");
    }

    if (choice.finish_reason === "length") {
        throw new Error(
            `LLM output was truncated (hit max_tokens=${maxTokens}). ` +
            `Reduce --chunk-size or increase --max-tokens.`,
        );
    }

    return choice.message.content;
};

export function parseStructuredResponse<T>(
    response: string,
    schema: z.ZodSchema<T>,
    normalizer?: (input: unknown) => unknown,
): T {
    let parsed: unknown;
    try {
        parsed = normalizer ? normalizer(JSON.parse(response)) : JSON.parse(response);
    } catch (err) {
        throw new Error(`LLM returned malformed JSON.\n\nDetail: ${err instanceof SyntaxError ? err.message : String(err)}`);
    }

    return schema.parse(parsed);
}
