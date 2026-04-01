import { transform } from "@src/converter/transformer.js";
import { generateMCPDefinition, writeMCPFile } from "@src/generator/mcp-schema.js";
import { MCPDefinition, MCPTool, Options, ParsedOpenAPI } from "@src/models/types.js";
import { FindResult, resolveOpenAPIFile } from "@src/openapi/finder.js";
import { parseOpenAPIFile } from "@src/openapi/parser.js";
import { Writer } from "@src/utils/logger.js";

export async function analyzeCommand(path: string, options: Options) {
    const writer: Writer = new Writer();

    writer.info("Searching for OpenAPI specifications file.");
    const fileResult: FindResult = await resolveOpenAPIFile(path);

    if (!fileResult.found || fileResult.path == undefined) {
        writer.error("No OpenAPI file found in the mentioned path.");
        throw Error("OpenAPI file creation not implemented.");
    }

    writer.success("OpenAPI file found, parsing specifications.");
    const parsedOpenAPI: ParsedOpenAPI = parseOpenAPIFile(fileResult.path);

    writer.info("Transforming OpenAPI specs into MCP tools...");
    const tools: MCPTool[] = await transform(parsedOpenAPI.endpoints, options.model);
    const mcpDefinition: MCPDefinition = generateMCPDefinition(tools, fileResult.path);

    writer.success("MCP tools ready!");
    if (options.output != undefined) {
        writeMCPFile(mcpDefinition, options.output);
        writer.success(`MCP definitions file saved at: ${options.output}`);
    } else {
        writer.info(`Timestamp: ${mcpDefinition.metadata.generatedAt}`);
        writer.info(`Source file: ${mcpDefinition.metadata.sourceFile}`);
        writer.info(`Processed endpoints: ${mcpDefinition.metadata.endpointsProcessed}`);

        writer.info(`MCP definitions:`);
        mcpDefinition.tools.forEach((tool) => {
            writer.tool(tool.name, tool.description);
            if (options.verbose) {
                writer.schema(JSON.stringify(tool.inputSchema, null, 2));
            }
        });
    }
}
