import { Writer } from "@src/utils/logger.js";
import { OpenAPIZod } from "@src/models/schemas.js";
import { initClient, complete, parseStructuredResponse } from "@src/converter/llm-client.js";
import { SYSTEM_PROMPT_TO_OPENAPI, buildAnalysisPrompt } from "@src/converter/prompts.js";
import { findFiles, readFile, writeOutput, detectLanguage, ensureDir } from "@src/utils/file-utils.js";

export async function analyzeCodeAndGenerateOpenAPI(
    writer: Writer,
    model: string | undefined,
    projectPath: string,
): Promise<string> {
    const files = findFiles(projectPath);
    writer.info(`Found ${files.length} source file(s) to analyze.`);

    const langCounts = files.reduce<Record<string, number>>((acc, f) => {
        const lang = detectLanguage(f);
        acc[lang] = (acc[lang] ?? 0) + 1;
        return acc;
    }, {});
    const language = Object.entries(langCounts).sort(([, count1], [, count2]) => count2 - count1)[0]?.[0] ?? "unknown";
    writer.info(`Detected language: ${language}`);

    const code = files.map(readFile).join("\n\n");
    writer.info(`Sending ${code.length} characters to LLM...`);

    const openapiResult: string = await analyze(model, code, language);
    const openapi = parseStructuredResponse(openapiResult, OpenAPIZod);
    writer.success("OpenAPI spec parsed successfully.");

    const outputPath = `${projectPath}/docs`;
    ensureDir(outputPath);

    const filePath = `${outputPath}/openapi.json`;
    writeOutput(filePath, JSON.stringify(openapi, null, 2));

    return filePath;
}

export async function analyze(model: string | undefined, code: string, language: string): Promise<string> {
    const analysisPrompt: string = buildAnalysisPrompt(code, language);
    const client = initClient();
    return await complete(client, model, analysisPrompt, SYSTEM_PROMPT_TO_OPENAPI);
}
