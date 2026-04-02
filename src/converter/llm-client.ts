import "dotenv/config";
import OpenAI from "openai";
import z from "zod";

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
    model: string | undefined,
    prompt: string,
    systemPrompt: string,
): Promise<string> => {
    const response = await client.chat.completions.create({
        model: model ?? "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
        ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error("LLM returned empty response");
    }

    return content;
};

export function parseStructuredResponse<T>(
    response: string,
    schema: z.ZodSchema<T>,
    normalizer?: (input: unknown) => unknown,
): T {
    const clean = response.replace(/```(?:json)?\n?|\n?```/g, "").trim();
    const normalize = normalizer ? (s: string) => normalizer(JSON.parse(s)) : JSON.parse;
    return schema.parse(normalize(clean));
}
