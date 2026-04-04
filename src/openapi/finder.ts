import { existsSync, statSync } from "fs";
import { join } from "path";
import chalk from "chalk";
import { ask, askOption, printOptions } from "@src/utils/prompt.js";

const OPENAPI_FILES = [
    "openapi.json",
    "openapi.yaml",
    "openapi.yml",
    "swagger.json",
    "swagger.yaml",
    "swagger.yml",
    "api.json",
    "api.yaml",
    "api.yml",
];

const SEARCH_DIRS = [".", "docs", "api", "spec", "swagger", "openapi"];

export interface FindResult {
    found: boolean;
    path?: string;
    createNew?: boolean;
}

export function findOpenAPIFile(projectPath: string): string | null {
    let stat: ReturnType<typeof statSync>;
    try {
        stat = statSync(projectPath);
    } catch {
        throw new Error(`Path not found: "${projectPath}"`);
    }

    if (stat.isFile()) return projectPath;

    for (const dir of SEARCH_DIRS) {
        for (const file of OPENAPI_FILES) {
            const fullPath = join(projectPath, dir, file);
            if (existsSync(fullPath)) return fullPath;
        }
    }

    return null;
}

export async function promptForOpenAPIPath(): Promise<FindResult> {
    console.log(chalk.bold.white("\n  No OpenAPI spec found."));
    const options = [
        { key: "G", label: "Generate from source code" },
        { key: "F", label: "Provide path to an existing file" },
        { key: "N", label: "Cancel" },
    ];
    printOptions(options);

    while (true) {
        const choice = await askOption(options);

        if (choice === "g") return { found: false, createNew: true };
        if (choice === "n") return { found: false, createNew: false };

        const path = await ask("File path");
        if (existsSync(path)) return { found: true, path };
        console.log(chalk.red(`  ✖ File not found: "${path}"`));
    }
}

export async function resolveOpenAPIFile(inputPath: string): Promise<FindResult> {
    const found = findOpenAPIFile(inputPath);
    if (found) return { found: true, path: found };
    return promptForOpenAPIPath();
}
