import { Writer } from "@src/utils/logger.js";
import { transform } from "@src/converter/transformer.js";
import { parseOpenAPIFile } from "@src/openapi/parser.js";
import { FindResult, resolveOpenAPIFile } from "@src/openapi/finder.js";
import { analyzeCodeAndGenerateOpenAPI } from "@src/converter/code-converter.js";
import { generateMCPDefinition, writeMCPFile } from "@src/generator/mcp-schema.js";
import { MCPDefinition, MCPTool, Options, ParsedOpenAPI } from "@src/models/types.js";

export async function analyzeCommand(path: string, options: Options) {
    const writer: Writer = new Writer(options.verbose);

    writer.info("Searching for OpenAPI specifications file.");
    const fileResult: FindResult = await resolveOpenAPIFile(path);

    if (!fileResult.found && !fileResult.createNew) {
        writer.error("Process stopped: no OpenAPI file found and creation was rejected.");
        process.exit(1);
    }

    let openApiFilePath: string;

    if (!fileResult.found && fileResult.createNew) {
        writer.info("No OpenAPI file found. Analyzing source code to generate one...");
        openApiFilePath = await analyzeCodeAndGenerateOpenAPI(writer, options.model, path);
        writer.success(`OpenAPI spec generated at: ${openApiFilePath}`);
    } else {
        openApiFilePath = fileResult.path!;
        writer.success("OpenAPI file found, parsing specifications.");
    }
    const parsedOpenAPI: ParsedOpenAPI = parseOpenAPIFile(openApiFilePath);

    writer.info(`Found ${parsedOpenAPI.endpoints.length} endpoint(s). Transforming to MCP tools...`);
    const tools: MCPTool[] = await transform(writer, options.model, parsedOpenAPI.endpoints);
    const mcpDefinition: MCPDefinition = generateMCPDefinition(tools, openApiFilePath);

    writer.success(`MCP tools ready! (${mcpDefinition.metadata.endpointsProcessed} tools generated)`);
    if (options.output !== undefined) {
        writeMCPFile(mcpDefinition, options.output);
        writer.success(`MCP definitions file saved at: ${options.output}`);
    } else {
        writer.tools(JSON.stringify(mcpDefinition, null, 2));
    }
}
