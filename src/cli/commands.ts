import { join, basename, extname } from "path";
import { Writer } from "@src/utils/logger.js";
import { transform } from "@src/converter/transformer.js";
import { parseOpenAPIFile } from "@src/openapi/parser.js";
import { FindResult, resolveOpenAPIFile } from "@src/openapi/finder.js";
import { analyzeCodeAndGenerateOpenAPI, UserAbortError } from "@src/converter/code-converter.js";
import { generateMCPDefinition, writeMCPFile } from "@src/generator/mcp-schema.js";
import { MCPTool, Options, ParsedOpenAPI } from "@src/models/types.js";

export function resolveOutputPath(analyzedPath: string, filename: string): string {
    const name = basename(filename, extname(filename));
    return join(analyzedPath, "docs", `${name}.json`);
}

export async function analyzeCommand(path: string, options: Options) {
    const writer: Writer = new Writer(options.verbose);

    writer.step("Looking for an existing OpenAPI spec...");
    const fileResult: FindResult = await resolveOpenAPIFile(path);

    if (!fileResult.found && !fileResult.createNew) {
        writer.error("No OpenAPI spec provided. Exiting.");
        process.exit(1);
    }

    let openApiFilePath: string;

    if (fileResult.found) {
        openApiFilePath = fileResult.path!;
        writer.success(`OpenAPI spec found: ${openApiFilePath}`);
    } else {
        try {
            openApiFilePath = await analyzeCodeAndGenerateOpenAPI(writer, options, path);
            writer.success(`OpenAPI spec generated: ${openApiFilePath}`);
        } catch (err) {
            if (err instanceof UserAbortError) {
                writer.warn("Cancelled.");
                process.exit(0);
            }
            throw err;
        }
    }

    writer.step("Parsing OpenAPI spec...");
    const parsedOpenAPI: ParsedOpenAPI = parseOpenAPIFile(openApiFilePath);
    writer.success(`Found ${parsedOpenAPI.endpoints.length} endpoint(s).`);

    writer.step("Converting endpoints to MCP tools...");
    const tools: MCPTool[] = await transform(writer, options, parsedOpenAPI.endpoints);
    const mcpDefinition = generateMCPDefinition(tools, openApiFilePath);
    writer.success(`${mcpDefinition.metadata.endpointsProcessed} MCP tool(s) ready.`);

    if (options.output !== undefined) {
        const outputPath = resolveOutputPath(path, options.output);
        writeMCPFile(mcpDefinition, outputPath);
        writer.success(`Saved to: ${outputPath}`);
    } else {
        writer.tools(JSON.stringify(mcpDefinition, null, 2));
    }
}
