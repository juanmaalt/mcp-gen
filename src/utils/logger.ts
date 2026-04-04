import chalk from "chalk";

const log = console.log;

export class Writer {
    private verbose: boolean;

    constructor(_verbose: boolean | undefined) {
        this.verbose = _verbose ?? false;
    }

    step = (msg: string) => log(chalk.bold.white(`\n  ${msg}`));

    success = (msg: string) => log(chalk.green(`  ✔ ${msg}`));

    warn = (msg: string) => log(chalk.yellow(`  ⚠ ${msg}`));

    error = (msg: string) => log(chalk.red(`  ✖ ${msg}`));

    info = (msg: string) => { if (this.verbose) log(chalk.dim(`    ${msg}`)); };

    list = (label: string, items: string[]) => {
        log(chalk.dim(`\n    ${label}`));
        if (items.length === 0) {
            log(chalk.dim("      (none)"));
        } else {
            items.forEach((item) => log(chalk.dim(`      ${item}`)));
        }
    };

    tools = (definitions: string) => log(chalk.bold.cyan(definitions));
}
