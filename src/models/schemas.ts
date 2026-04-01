import { z } from "zod";

const JSONSchemaZod = z.object({
        type: z.string().optional(),
        description: z.string().optional(),
        enum: z.array(z.string()).optional(),
    })
    .passthrough();

const MCPToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.object({
        type: z.literal("object"),
        properties: z.record(JSONSchemaZod),
        required: z.array(z.string()).optional(),
    }),
});

export const MCPToolArraySchema = z.array(MCPToolSchema);


const OpenAPIParameterZod = z.object({
    name: z.string(),
    in: z.enum(["query", "path", "header", "cookie"]),
    required: z.boolean().optional(),
    description: z.string().optional(),
    schema: JSONSchemaZod.optional(),
});

const OpenAPIOperationZod = z.object({
    operationId: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    parameters: z.array(OpenAPIParameterZod).optional(),
    requestBody: z.object({
        required: z.boolean().optional(),
        content: z.record(z.object({ schema: JSONSchemaZod })),
    }).optional(),
    responses: z.record(z.object({
        description: z.string(),
        content: z.record(z.object({ schema: JSONSchemaZod })).optional(),
    })).optional(),
});

export const OpenAPIZod = z.object({
    openapi: z.string().optional(),
    info: z.object({
        title: z.string().optional(),
        version: z.string().optional(),
    }).passthrough(),
    paths: z.record(z.object({
        get: OpenAPIOperationZod.optional(),
        post: OpenAPIOperationZod.optional(),
        put: OpenAPIOperationZod.optional(),
        patch: OpenAPIOperationZod.optional(),
        delete: OpenAPIOperationZod.optional(),
    }).passthrough()),
});
