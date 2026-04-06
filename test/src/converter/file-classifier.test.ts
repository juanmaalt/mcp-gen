import { describe, it, expect } from "vitest";
import { classifyFiles } from "@src/converter/file-classifier.js";

describe("classifyFiles", () => {
    describe("typescript", () => {
        it("classifies route files", () => {
            const files = ["/app/src/users.routes.ts", "/app/src/auth.controller.ts", "/app/src/app.ts"];
            const { route, schema } = classifyFiles(files, "typescript");
            expect(route).toEqual(files);
            expect(schema).toEqual([]);
        });

        it("classifies schema files", () => {
            const files = ["/app/src/user.dto.ts", "/app/src/auth.schema.ts", "/app/src/user.model.ts"];
            const { route, schema } = classifyFiles(files, "typescript");
            expect(route).toEqual([]);
            expect(schema).toEqual(files);
        });

        it("ignores unrecognised files", () => {
            const { route, schema } = classifyFiles(["/app/src/utils.ts"], "typescript");
            expect(route).toEqual([]);
            expect(schema).toEqual([]);
        });
    });

    describe("python", () => {
        it("classifies views and urls as route files", () => {
            const files = ["/app/users/views.py", "/app/users/urls.py"];
            const { route } = classifyFiles(files, "python");
            expect(route).toEqual(files);
        });

        it("classifies serializers as schema files", () => {
            const { schema } = classifyFiles(["/app/users/serializers.py"], "python");
            expect(schema).toEqual(["/app/users/serializers.py"]);
        });
    });

    describe("go", () => {
        it("classifies main.go as a route file", () => {
            const { route } = classifyFiles(["/app/main.go"], "go");
            expect(route).toEqual(["/app/main.go"]);
        });

        it("classifies dto files as schema", () => {
            const { schema } = classifyFiles(["/app/user_dto.go"], "go");
            expect(schema).toEqual(["/app/user_dto.go"]);
        });
    });

    describe("jvm languages", () => {
        it("classifies kotlin controller as route", () => {
            const { route } = classifyFiles(["/app/UserController.kt"], "kotlin");
            expect(route).toEqual(["/app/UserController.kt"]);
        });

        it("classifies java entity as schema", () => {
            const { schema } = classifyFiles(["/app/UserEntity.java"], "java");
            expect(schema).toEqual(["/app/UserEntity.java"]);
        });

        it("classifies scala resource as route", () => {
            const { route } = classifyFiles(["/app/UserResource.scala"], "scala");
            expect(route).toEqual(["/app/UserResource.scala"]);
        });
    });

    it("falls back to typescript patterns for unknown language", () => {
        const { route } = classifyFiles(["/app/users.routes.ts"], "ruby");
        expect(route).toEqual(["/app/users.routes.ts"]);
    });

    it("separates route and schema files correctly", () => {
        const files = ["/app/user.controller.ts", "/app/user.model.ts", "/app/utils.ts"];
        const { route, schema } = classifyFiles(files, "typescript");
        expect(route).toEqual(["/app/user.controller.ts"]);
        expect(schema).toEqual(["/app/user.model.ts"]);
    });
});
