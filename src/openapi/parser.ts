import { extname } from "path";
import { parse as parseYaml } from "yaml";
import { readFile } from "@src/utils/file-utils.js";
import { OpenAPIEndpoint, OpenAPIParameter, OpenAPIRequestBody, OpenAPIResponse, JSONSchema, ParsedOpenAPI } from "@src/models/types.js";

type Spec = Record<string, unknown>;

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

export function parseOpenAPIFile(filePath: string): ParsedOpenAPI {
    const content = readFile(filePath);
    const spec = extname(filePath).toLowerCase() === ".json"
        ? JSON.parse(content)
        : parseYaml(content);
    return parseOpenAPISpec(spec);
}

function parseOpenAPISpec(spec: Spec): ParsedOpenAPI {
    const paths = (spec["paths"] ?? {}) as Record<string, Record<string, Spec>>;
    const endpoints: OpenAPIEndpoint[] = [];

    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods)) {
            if (!HTTP_METHODS.has(method)) continue;
            endpoints.push({
                path,
                method: method.toUpperCase(),
                operationId: operation["operationId"] as string | undefined,
                summary: operation["summary"] as string | undefined,
                description: operation["description"] as string | undefined,
                parameters: parseParameters((operation["parameters"] ?? []) as Spec[], spec),
                requestBody: parseRequestBody(operation["requestBody"] as Spec | undefined, spec),
                responses: (operation["responses"] ?? {}) as Record<string, OpenAPIResponse>,
            });
        }
    }

    const info = (spec["info"] ?? {}) as Record<string, string>;
    return {
        title: info["title"] ?? "Unknown API",
        version: info["version"] ?? "1.0.0",
        endpoints,
    };
}

function parseParameters(params: Spec[], spec: Spec): OpenAPIParameter[] {
    return params.map((param) => {
        const resolved = resolveRef(param, spec);
        return {
            name: resolved["name"] as string,
            in: resolved["in"] as OpenAPIParameter["in"],
            required: (resolved["required"] as boolean) ?? false,
            description: resolved["description"] as string | undefined,
            schema: resolveRef((resolved["schema"] ?? {}) as Spec, spec) as JSONSchema,
        };
    });
}

function parseRequestBody(body: Spec | undefined, spec: Spec): OpenAPIRequestBody | undefined {
    if (!body) return undefined;

    const resolved = resolveRef(body, spec);
    const rawContent = (resolved["content"] ?? {}) as Record<string, Spec>;
    const content: Record<string, { schema: JSONSchema }> = {};

    for (const [mediaType, mediaObj] of Object.entries(rawContent)) {
        content[mediaType] = {
            schema: resolveRef((mediaObj["schema"] ?? {}) as Spec, spec) as JSONSchema,
        };
    }

    return {
        required: (resolved["required"] as boolean) ?? false,
        content,
    };
}

function resolveRef(obj: Spec, spec: Spec): Spec {
    if (!obj["$ref"]) return obj;

    const refPath = (obj["$ref"] as string).replace("#/", "").split("/");
    let resolved: unknown = spec;
    for (const segment of refPath) {
        resolved = (resolved as Spec)?.[segment];
    }

    return resolved ? resolveRef(resolved as Spec, spec) : obj;
}
