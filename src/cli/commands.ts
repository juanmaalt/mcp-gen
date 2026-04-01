import { Writer } from "@src/utils/logger.js";
import { transform } from "@src/converter/transformer.js";
import { parseOpenAPIFile } from "@src/openapi/parser.js";
import { FindResult, resolveOpenAPIFile } from "@src/openapi/finder.js";
import { analyzeCodeAndGenerateOpenAPI } from "@src/converter/code-converter.js";
import { generateMCPDefinition, writeMCPFile } from "@src/generator/mcp-schema.js";
import { MCPDefinition, MCPTool, Options, ParsedOpenAPI } from "@src/models/types.js";

export async function analyzeCommand(path: string, options: Options) {
    const writer: Writer = new Writer();

    writer.info("Searching for OpenAPI specifications file.");
    const fileResult: FindResult = await resolveOpenAPIFile(path);

    if (!fileResult.found && !fileResult.createNew) {
        writer.error("Process stoped, no OpenAPI file found in the mentioned path and creation was rejected.");
        throw Error("No OpenAPI file available.");
    }

    let openApiFilePath: string = fileResult.path || "";

    if (!fileResult.found && fileResult.createNew) {
        openApiFilePath = await analyzeCodeAndGenerateOpenAPI(path, options.model);
    }

    writer.success("OpenAPI file found, parsing specifications.");
    const parsedOpenAPI: ParsedOpenAPI = parseOpenAPIFile(openApiFilePath);

    writer.info("Transforming OpenAPI specs into MCP tools...");
    const tools: MCPTool[] = await transform(parsedOpenAPI.endpoints, options.model);
    const mcpDefinition: MCPDefinition = generateMCPDefinition(tools, openApiFilePath);

    writer.success("MCP tools ready!");
    if (options.output != undefined) {
        writeMCPFile(mcpDefinition, options.output);
        writer.success(`MCP definitions file saved at: ${options.output}`);
    } else {
        writer.tools(JSON.stringify(mcpDefinition, null, 2));
    }
}
