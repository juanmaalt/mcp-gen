import { existsSync, statSync } from "fs";
import { join } from "path";
import * as readline from "readline";

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
    const stat = statSync(projectPath);
    if (stat.isFile()) {
        return projectPath;
    }

    for (const dir of SEARCH_DIRS) {
        for (const file of OPENAPI_FILES) {
            const fullPath = join(projectPath, dir, file);
            if (existsSync(fullPath)) {
                return fullPath;
            }
        }
    }

    return null;
}

export async function promptForOpenAPIPath(): Promise<FindResult> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(
            "No OpenAPI file found. Enter path to your OpenAPI file (or press 'N' to create it): ",
            (answer) => {
                rl.close();
                const trimmed = answer.trim();

                if (trimmed.toLowerCase() === "n") {
                    resolve({ found: false, createNew: true });
                } else if (existsSync(trimmed)) {
                    resolve({ found: true, path: trimmed });
                } else {
                    console.error(`File not found: ${trimmed}`);
                    resolve({ found: false, createNew: false });
                }
            },
        );
    });
}

export async function resolveOpenAPIFile(inputPath: string): Promise<FindResult> {
    const found = findOpenAPIFile(inputPath);
    if (found) {
        return { found: true, path: found };
    }

    return promptForOpenAPIPath();
}
