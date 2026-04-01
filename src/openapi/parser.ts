import { extname } from "path";
import { parse as parseYaml } from "yaml";
import { readFile } from "@src/utils/file-utils.js";
import { OpenAPIEndpoint, OpenAPIParameter, OpenAPIRequestBody, JSONSchema, ParsedOpenAPI } from "@src/models/types.js";

export function parseOpenAPIFile(filePath: string): ParsedOpenAPI {
    const content = readFile(filePath);
    const extension = extname(filePath).toLowerCase();

    let spec: any;
    if (extension === ".json") {
        spec = JSON.parse(content);
    } else {
        spec = parseYaml(content);
    }

    return parseOpenAPISpec(spec);
}

function parseOpenAPISpec(spec: any): ParsedOpenAPI {
    const endpoints: OpenAPIEndpoint[] = [];

    const paths = spec.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods as Record<string, any>)) {
            if (["get", "post", "put", "patch", "delete"].includes(method)) {
                endpoints.push({
                    path,
                    method: method.toUpperCase(),
                    operationId: operation.operationId,
                    summary: operation.summary,
                    description: operation.description,
                    parameters: parseParameters(operation.parameters || [], spec),
                    requestBody: parseRequestBody(operation.requestBody, spec),
                    responses: operation.responses || {},
                });
            }
        }
    }

    return {
        title: spec.info?.title || "Unknown API",
        version: spec.info?.version || "1.0.0",
        endpoints,
    };
}

function parseParameters(params: any[], spec: any): OpenAPIParameter[] {
    return params.map((param) => {
        const resolved = resolveRef(param, spec);
        return {
            name: resolved.name,
            in: resolved.in,
            required: resolved.required || false,
            description: resolved.description,
            schema: resolveRef(resolved.schema || {}, spec),
        };
    });
}

function parseRequestBody(body: any, spec: any): OpenAPIRequestBody | undefined {
    if (!body) return undefined;

    const resolved = resolveRef(body, spec);
    const content: Record<string, { schema: JSONSchema }> = {};

    for (const [mediaType, mediaObj] of Object.entries(resolved.content || {})) {
        content[mediaType] = {
            schema: resolveRef((mediaObj as any).schema || {}, spec),
        };
    }

    return {
        required: resolved.required || false,
        content,
    };
}

function resolveRef(obj: any, spec: any): any {
    if (!obj || !obj.$ref) return obj;

    const refPath = obj.$ref.replace("#/", "").split("/");
    let resolved = spec;

    for (const segment of refPath) {
        resolved = resolved?.[segment];
    }

    return resolved || obj;
}
