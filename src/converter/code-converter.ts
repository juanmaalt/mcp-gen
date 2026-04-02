import * as readline from "readline";
import { Writer } from "@src/utils/logger.js";
import { OpenAPIZod } from "@src/models/schemas.js";
import { initClient, complete, parseStructuredResponse } from "@src/converter/llm-client.js";
import { SYSTEM_PROMPT_TO_OPENAPI, buildAnalysisPrompt } from "@src/converter/prompts.js";
import { findFiles, readFile, writeOutput, detectLanguage } from "@src/utils/file-utils.js";
import { getExtractor } from "@src/converter/extractors/extractor-factory.js";
import { UnsupportedLanguageError } from "@src/converter/extractors/extractor.js";

async function promptProceedWithFullSource(writer: Writer, language: string): Promise<boolean> {
    writer.warn(
        `Warning: no extractor available for language "${language}". The full source code will be sent to the LLM.`,
    );
    const userInput = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        userInput.question("Proceed with full source? (y/N): ", (answer) => {
            userInput.close();
            resolve(answer.trim().toLowerCase() === "y");
        });
    });
}

async function extractCodeSnippets(writer: Writer, files: string[], language: string): Promise<string> {
    let code = files.map(readFile).join("\n\n");

    try {
        const extractor = getExtractor(language);
        code = extractor.extract(code);
        writer.info(`Sending ${code.length} characters to LLM (declarations only)...`);
    } catch (err) {
        if (!(err instanceof UnsupportedLanguageError)) throw err;

        const proceed = await promptProceedWithFullSource(writer, language);
        if (!proceed) throw new Error("Aborted by user.");
        writer.info(`Sending ${code.length} characters to LLM (full source)...`);
    }

    return code;
}

export async function analyzeCodeAndGenerateOpenAPI(
    writer: Writer,
    model: string | undefined,
    projectPath: string,
): Promise<string> {
    const files: string[] = findFiles(projectPath);
    writer.info(`Found ${files.length} source file(s) to analyze.`);

    const langCounts = files.reduce<Record<string, number>>((acc, f) => {
        const lang = detectLanguage(f);
        acc[lang] = (acc[lang] ?? 0) + 1;
        return acc;
    }, {});
    const language: string = Object.entries(langCounts).sort(([, count1], [, count2]) => count2 - count1)[0]?.[0] ?? "unknown";
    writer.info(`Detected language: ${language}`);

    const code: string = await extractCodeSnippets(writer, files, language);

    const openapiResult: string = await analyze(model, code, language);
    const openapi = parseStructuredResponse(openapiResult, OpenAPIZod);
    writer.success("OpenAPI spec parsed successfully.");

    const filePath = `${projectPath}/docs/openapi.json`;
    writeOutput(filePath, JSON.stringify(openapi, null, 2));

    return filePath;
}

async function analyze(model: string | undefined, code: string, language: string): Promise<string> {
    const analysisPrompt: string = buildAnalysisPrompt(code, language);
    const client = initClient();
    return complete(client, model, analysisPrompt, SYSTEM_PROMPT_TO_OPENAPI);
}
