import { program } from "commander";
import { analyzeCommand } from "@src/cli/commands.js";

program.name("mcp-gen").description("Generate MCP tool definitions from your code").version("0.1.0");

program
    .command("analyze <path>")
    .description("Analyze code and generate MCP definitions")
    .option("-o, --output <file>", "Output file path. If it's not defined the tools will be displayed in the terminal.")
    .option("-m, --model <model>", "The OpenAI model to use for analysis. By default: gpt-4o-mini")
    .option("-v, --verbose", "Show detailed processing logs")
    .showHelpAfterError()
    .action(analyzeCommand);

program.parse();
