import { extname, join, dirname } from "path";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";

const CODE_EXTENSIONS = [".ts", ".js", ".py", ".go", ".kt", ".java", ".scala"];

const LANG_MAP: Record<string, string> = {
    ".ts": "typescript",
    ".js": "javascript",
    ".py": "python",
    ".go": "go",
    ".kt": "kotlin",
    ".java": "java",
    ".scala": "scala",
};

export function detectLanguage(filePath: string): string {
    return LANG_MAP[extname(filePath).toLowerCase()] || "unknown";
}

export function readFile(filePath: string): string {
    return readFileSync(filePath, "utf-8");
}

export function writeOutput(filePath: string, content: string): void {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, "utf-8");
}

const SKIP_DIRS = new Set(["node_modules", "dist", "build", "out", "lib", "coverage", ".git", "test"]);
const SKIP_FILE_SUFFIXES = [".spec.ts", ".test.ts", ".spec.js", ".test.js", ".d.ts"];

export function findFiles(dirPath: string, extensions: string[] = CODE_EXTENSIONS): string[] {
    const results: string[] = [];

    function walk(dir: string) {
        const entries = readdirSync(dir);
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            const stat = statSync(fullPath);

            if (stat.isDirectory() && !entry.startsWith(".") && !SKIP_DIRS.has(entry)) {
                walk(fullPath);
            } else if (
                stat.isFile() &&
                extensions.includes(extname(entry).toLowerCase()) &&
                !SKIP_FILE_SUFFIXES.some((suffix) => entry.endsWith(suffix))
            ) {
                results.push(fullPath);
            }
        }
    }

    let stat: ReturnType<typeof statSync>;
    try {
        stat = statSync(dirPath);
    } catch {
        throw new Error(`Path not found: "${dirPath}"`);
    }

    if (stat.isFile()) return [dirPath];

    walk(dirPath);
    return results;
}
