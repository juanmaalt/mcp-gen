import chalk from "chalk";

const log = console.log;

export class Writer {
    info = (msg: string) => log(chalk.blue(msg));
    success = (msg: string) => log(chalk.green(msg));
    warn = (msg: string) => log(chalk.yellow(msg));
    error = (msg: string) => log(chalk.red(msg));
    tools = (definitions: string) => log(chalk.bold.cyan(definitions));
}
