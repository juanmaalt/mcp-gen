import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

export function writeOutput(filePath: string, content: string): void {
    ensureDir(dirname(filePath));
    writeFileSync(filePath, content, "utf-8");
}

export function ensureDir(dirPath: string): void {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}
