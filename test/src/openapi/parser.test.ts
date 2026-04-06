import { describe, it, expect } from "vitest";
import { join } from "path";
import { fileURLToPath } from "url";
import { parseOpenAPIFile } from "@src/openapi/parser.js";

const ASSETS = join(fileURLToPath(import.meta.url), "../../../assets");

describe("parseOpenAPIFile", () => {
    it("parses a JSON spec and extracts endpoints", () => {
        const result = parseOpenAPIFile(join(ASSETS, "petstore.json"));

        expect(result.title).toBe("Petstore");
        expect(result.version).toBe("1.0.0");
        expect(result.endpoints).toHaveLength(3);
    });

    it("extracts GET /pets correctly", () => {
        const { endpoints } = parseOpenAPIFile(join(ASSETS, "petstore.json"));
        const ep = endpoints.find((e) => e.method === "GET" && e.path === "/pets")!;

        expect(ep.operationId).toBe("listPets");
        expect(ep.parameters).toHaveLength(1);
        expect(ep.parameters[0]).toMatchObject({ name: "limit", in: "query", required: false });
    });

    it("extracts POST /pets with request body", () => {
        const { endpoints } = parseOpenAPIFile(join(ASSETS, "petstore.json"));
        const ep = endpoints.find((e) => e.method === "POST")!;

        expect(ep.operationId).toBe("createPet");
        expect(ep.requestBody?.required).toBe(true);
        expect(ep.requestBody?.content["application/json"]).toBeDefined();
    });

    it("resolves $ref in request body schema", () => {
        const { endpoints } = parseOpenAPIFile(join(ASSETS, "petstore.json"));
        const ep = endpoints.find((e) => e.method === "POST")!;
        const schema = ep.requestBody?.content["application/json"]?.schema as Record<string, unknown>;

        expect(schema?.["properties"]).toBeDefined();
    });

    it("extracts path parameters", () => {
        const { endpoints } = parseOpenAPIFile(join(ASSETS, "petstore.json"));
        const ep = endpoints.find((e) => e.path === "/pets/{id}")!;

        expect(ep.parameters[0]).toMatchObject({ name: "id", in: "path", required: true });
    });

    it("only includes HTTP method operations, not extension fields", () => {
        const { endpoints } = parseOpenAPIFile(join(ASSETS, "petstore.json"));
        expect(endpoints.every((e) => ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(e.method))).toBe(true);
    });
});
