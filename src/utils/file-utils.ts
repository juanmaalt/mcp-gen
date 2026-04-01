import { extname, join, dirname } from "path";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";

const CODE_EXTENSIONS = [".ts", ".js", ".py", ".go"];

const LANG_MAP: Record<string, string> = {
    ".ts": "typescript",
    ".js": "javascript",
    ".py": "python",
    ".go": "go",
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

export function ensureDir(dirPath: string): void {
    mkdirSync(dirPath, { recursive: true });
}

export function findFiles(dirPath: string, extensions: string[] = CODE_EXTENSIONS): string[] {
    const results: string[] = [];

    function walk(dir: string) {
        const entries = readdirSync(dir);
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            const stat = statSync(fullPath);

            if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules") {
                walk(fullPath);
            } else if (stat.isFile() && extensions.includes(extname(entry).toLowerCase())) {
                results.push(fullPath);
            }
        }
    }

    const stat = statSync(dirPath);
    if (stat.isFile()) {
        return [dirPath];
    }

    walk(dirPath);
    return results;
}
