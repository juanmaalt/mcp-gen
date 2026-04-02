import chalk from "chalk";

const log = console.log;

export class Writer {
    private verbose: boolean;

    constructor(_verbose: boolean | undefined) {
        this.verbose = _verbose || false;
    }

    info = (msg: string) => {
        if (this.verbose) log(chalk.blue(msg));
    };
    success = (msg: string) => {
        if (this.verbose) log(chalk.green(msg));
    };
    warn = (msg: string) => log(chalk.yellow(msg));
    error = (msg: string) => log(chalk.red(msg));
    tools = (definitions: string) => log(chalk.bold.cyan(definitions));
}
