import { program } from "commander";
import { analyzeCommand } from "@src/cli/commands.js";

program.name("mcp-gen").description("Generate MCP tool definitions from your code").version("0.1.0");

program
    .command("analyze <path>")
    .description("Analyze code and generate MCP definitions")
    .option("-o, --output <name>", "Output filename (e.g. tools or tools.json). Saved to {path}/docs/{name}.json. If omitted, prints to terminal.")
    .option("-m, --model <model>", "The OpenAI model to use for analysis. By default: gpt-4o-mini")
    .option("-t, --max-tokens <number>", "Maximum tokens for LLM responses. By default: 16384", parseInt)
    .option("-c, --chunk-size <number>", "Number of files (code→OpenAPI) or endpoints (OpenAPI→MCP) per LLM request. By default: 5", parseInt)
    .option("-v, --verbose", "Show detailed processing logs")
    .showHelpAfterError()
    .action(analyzeCommand);

program.parse();
