export interface OpenAPIEndpoint {
    path: string;
    method: string;
    operationId?: string;
    summary?: string;
    description?: string;
    parameters: OpenAPIParameter[];
    requestBody?: OpenAPIRequestBody;
    responses: Record<string, OpenAPIResponse>;
}

export interface OpenAPIParameter {
    name: string;
    in: "query" | "path" | "header" | "cookie";
    required: boolean;
    description?: string;
    schema: JSONSchema;
}

export interface OpenAPIRequestBody {
    required: boolean;
    content: Record<string, { schema: JSONSchema }>;
}

export interface OpenAPIResponse {
    description: string;
    content?: Record<string, { schema: JSONSchema }>;
}

export interface JSONSchema {
    type?: string;
    properties?: Record<string, JSONSchema>;
    items?: JSONSchema;
    required?: string[];
    description?: string;
    enum?: string[];
    format?: string;
    $ref?: string;
}

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, JSONSchema>;
        required?: string[];
    };
}

export interface MCPDefinition {
    tools: MCPTool[];
    metadata: {
        generatedAt: string;
        sourceFile: string;
        endpointsProcessed: number;
    };
}

export interface Options {
    output?: string;
    model?: string;
    maxTokens?: number;
    chunkSize?: number;
    verbose?: boolean;
}

export interface ParsedOpenAPI {
    title: string;
    version: string;
    endpoints: OpenAPIEndpoint[];
}
