import { describe, it, expect } from "vitest";
import { detectLanguage } from "@src/utils/file-utils.js";

describe("detectLanguage", () => {
    it.each([
        ["file.ts",    "typescript"],
        ["file.tsx",   "unknown"],
        ["file.js",    "javascript"],
        ["file.jsx",   "unknown"],
        ["file.py",    "python"],
        ["file.go",    "go"],
        ["file.kt",    "kotlin"],
        ["file.java",  "java"],
        ["file.scala", "scala"],
        ["file.rb",    "unknown"],
        ["file",       "unknown"],
    ])("%s → %s", (file, expected) => {
        expect(detectLanguage(file)).toBe(expected);
    });
});
