import { Writer } from "@src/utils/logger.js";
import { OpenAPIZod } from "@src/models/schemas.js";
import { initClient, complete, parseStructuredResponse } from "@src/converter/llm-client.js";
import { SYSTEM_PROMPT_TO_OPENAPI, buildAnalysisPrompt } from "@src/converter/prompts.js";
import { findFiles, readFile, writeOutput, detectLanguage } from "@src/utils/file-utils.js";
import { Options } from "@src/models/types.js";
import { classifyFiles, ClassifiedFiles } from "@src/converter/file-classifier.js";
import { ask, parsePaths, printOptions } from "@src/utils/prompt.js";

export class UserAbortError extends Error {
    constructor() {
        super("Aborted by user.");
        this.name = "UserAbortError";
    }
}

async function modifyFiles(writer: Writer, files: string[]): Promise<string[]> {
    let current = [...files];

    while (true) {
        writer.list("Current files:", current);
        printOptions([
            { key: "A", label: "Add files" },
            { key: "R", label: "Remove files" },
            { key: "D", label: "Done" },
        ]);

        const choice = (await ask("Choice")).toLowerCase();

        if (choice === "d" || choice === "") return current;

        if (choice === "a") {
            const input = await ask("File paths to add (comma-separated)");
            const toAdd = parsePaths(input).filter((p) => !current.includes(p));
            current = [...current, ...toAdd];
            writer.success(`Added ${toAdd.length} file(s).`);
            continue;
        }

        if (choice === "r") {
            const input = await ask("File paths to remove (comma-separated)");
            const toRemove = new Set(parsePaths(input));
            const before = current.length;
            current = current.filter((f) => !toRemove.has(f));
            writer.success(`Removed ${before - current.length} file(s).`);
            continue;
        }

        writer.warn("Invalid option. Enter A, R, or D.");
    }
}

async function selectFiles(writer: Writer, classified: ClassifiedFiles): Promise<string[]> {
    const all = [...classified.route, ...classified.schema];

    writer.step("Detected files to send to the LLM:");
    writer.list("Route / controller files:", classified.route);
    writer.list("Schema / type / DTO files:", classified.schema);
    console.log();

    printOptions([
        { key: "C", label: "Continue" },
        { key: "M", label: "Modify" },
        { key: "N", label: "Cancel" },
    ]);

    while (true) {
        const choice = (await ask("Choice")).toLowerCase();

        if (choice === "c") return all;
        if (choice === "n" || choice === "") throw new UserAbortError();
        if (choice === "m") return modifyFiles(writer, all);

        writer.warn("Invalid option. Enter C, M, or N.");
    }
}

const VALID_PARAMETER_IN = new Set(["query", "path", "header", "cookie"]);

function sanitizeOpenAPIResponse(raw: unknown): unknown {
    if (typeof raw !== "object" || raw === null || !("paths" in raw)) return raw;
    const spec = raw as Record<string, unknown>;
    const paths = spec["paths"] as Record<string, unknown>;

    for (const pathItem of Object.values(paths)) {
        if (typeof pathItem !== "object" || pathItem === null) continue;
        for (const operation of Object.values(pathItem as Record<string, unknown>)) {
            if (typeof operation !== "object" || operation === null) continue;
            const op = operation as Record<string, unknown>;
            if (Array.isArray(op["parameters"])) {
                op["parameters"] = op["parameters"].filter(
                    (p: unknown) =>
                        typeof p === "object" &&
                        p !== null &&
                        VALID_PARAMETER_IN.has((p as Record<string, string>)["in"]),
                );
            }
        }
    }

    return spec;
}

const DEFAULT_CHUNK_SIZE = 5;

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

export async function analyzeCodeAndGenerateOpenAPI(
    writer: Writer,
    options: Options,
    projectPath: string,
): Promise<string> {
    const { model, maxTokens, chunkSize = DEFAULT_CHUNK_SIZE } = options;
    writer.step("Scanning project files...");
    const allFiles = findFiles(projectPath);
    writer.info(`${allFiles.length} source file(s) found.`);

    const langCounts = allFiles.reduce<Record<string, number>>((acc, f) => {
        const lang = detectLanguage(f);
        acc[lang] = (acc[lang] ?? 0) + 1;
        return acc;
    }, {});
    const language = Object.entries(langCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "unknown";
    writer.info(`Detected language: ${language}`);

    const classified = classifyFiles(allFiles, language);
    const files = await selectFiles(writer, classified);

    writer.step("Generating OpenAPI spec from source code...");
    files.forEach((f) => writer.info(f));

    const client = initClient();
    const chunks = chunkArray(files, chunkSize);
    writer.info(`Processing ${files.length} file(s) in ${chunks.length} chunk(s) of up to ${chunkSize}.`);

    const mergedPaths: Record<string, unknown> = {};

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]!;
        writer.info(`Chunk ${i + 1}/${chunks.length}: ${chunk.map((f) => f.split("/").pop()).join(", ")}`);

        const code = chunk.map((f) => `// File: ${f}\n${readFile(f)}`).join("\n\n");
        const result = await complete(client, model, maxTokens, buildAnalysisPrompt(code, language), SYSTEM_PROMPT_TO_OPENAPI);
        const partial = parseStructuredResponse(result, OpenAPIZod, sanitizeOpenAPIResponse);

        Object.assign(mergedPaths, partial.paths);
    }

    const openapi = { openapi: "3.0.0", info: { title: "API", version: "1.0.0" }, paths: mergedPaths };

    const filePath = `${projectPath}/docs/openapi.json`;
    writeOutput(filePath, JSON.stringify(openapi, null, 2));

    return filePath;
}
