import { describe, it, expect } from "vitest";
import { resolveOutputPath } from "@src/cli/commands.js";

describe("resolveOutputPath", () => {
    it("appends .json when no extension is given", () => {
        expect(resolveOutputPath("/project", "tools")).toBe("/project/docs/tools.json");
    });

    it("replaces an existing extension with .json", () => {
        expect(resolveOutputPath("/project", "tools.json")).toBe("/project/docs/tools.json");
        expect(resolveOutputPath("/project", "tools.yaml")).toBe("/project/docs/tools.json");
        expect(resolveOutputPath("/project", "tools.yml")).toBe("/project/docs/tools.json");
    });

    it("uses the analyzed path as the base", () => {
        expect(resolveOutputPath("/some/deep/path", "output")).toBe("/some/deep/path/docs/output.json");
    });
});
