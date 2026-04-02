import { Extractor } from "@src/converter/extractors/extractor.js";

const CONTEXT_LINES = 5;

// Matches: Express/Fastify route registrations, NestJS decorators, class declarations
const PATTERNS = [
    // Express / Fastify: app.get(...), router.post(...), server.use(...), etc.
    /^\s*(app|router|server)\.(get|post|put|patch|delete|head|options|all|use|route)\s*\(/,
    // Express: Router() instantiation and app creation
    /^\s*(const|let|var)\s+\w+\s*=\s*(express\s*\(\s*\)|express\.Router\s*\(\s*\)|Router\s*\(\s*\))/,
    // NestJS route + HTTP method decorators
    /^\s*@(Controller|Get|Post|Put|Patch|Delete|Head|Options|All)\b/,
    // NestJS structural decorators
    /^\s*@(Module|Injectable|Guard|Interceptor|Pipe|Middleware|Catch|WebSocketGateway|MessagePattern|EventPattern)\b/,
    // NestJS composition decorators
    /^\s*@(UseGuards|UseInterceptors|UsePipes|UseFilters|UseMiddleware)\b/,
    // NestJS Swagger / OpenAPI decorators
    /^\s*@(ApiTags|ApiOperation|ApiResponse|ApiParam|ApiQuery|ApiBody|ApiProperty|ApiBearerAuth|ApiSecurity|ApiExtraModels)\b/,
    // NestJS parameter decorators (Body, Param, Query, Headers, Req, Res)
    /^\s*@(Body|Param|Query|Headers|Req|Res|Request|Response|HttpCode|Header|Redirect)\b/,
    // Class declarations
    /^\s*(export\s+)?(default\s+)?(abstract\s+)?class\s+\w+/,
];

export class NodeExtractor implements Extractor {
    extract(code: string): string {
        const lines = code.split("\n");
        const collected = new Set<number>();

        lines.forEach((line, index) => {
            if (PATTERNS.some((pattern) => pattern.test(line))) {
                for (let offset = 0; offset < CONTEXT_LINES && index + offset < lines.length; offset++) {
                    collected.add(index + offset);
                }
            }
        });

        return [...collected]
            .sort((i1, i2) => i1 - i2)
            .map((i) => lines[i])
            .join("\n");
    }
}
