import chalk from "chalk";
import { MCPTool } from "@src/models/types.js";

const log = console.log;

export class Writer {
    info = (msg: string) => log(chalk.blue(msg));
    success = (msg: string) => log(chalk.green(msg));
    warn = (msg: string) => log(chalk.yellow(msg));
    error = (msg: string) => log(chalk.red(msg));

    tool = (tool: MCPTool, index: number) => {
        log(chalk.bold.cyan(`  [${index + 1}]`));
        log(JSON.stringify(tool, null, 2));
    };
}
