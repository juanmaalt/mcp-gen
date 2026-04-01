import { MCPTool, MCPDefinition } from "@src/models/types.js";
import { writeOutput } from "@src/utils/file-utils.js";

export function generateMCPDefinition(tools: MCPTool[], sourceFile: string): MCPDefinition {
    return {
        tools: tools,
        metadata: {
            generatedAt: new Date().toISOString(),
            sourceFile: sourceFile,
            endpointsProcessed: tools.length,
        },
    };
}

export function writeMCPFile(definition: MCPDefinition, outputPath: string): void {
    const content: string = JSON.stringify(definition, null, 2);
    writeOutput(outputPath, content);
}
