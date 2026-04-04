import * as readline from "readline";
import chalk from "chalk";

export function ask(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) =>
        rl.question(chalk.cyan(`  › ${question}: `), (ans) => { rl.close(); resolve(ans.trim()); }),
    );
}

export function parsePaths(input: string): string[] {
    return input.split(",").map((p) => p.trim()).filter(Boolean);
}

export function printOptions(options: { key: string; label: string }[]): void {
    const formatted = options.map(({ key, label }) => `${chalk.bold.white(`[${key}]`)} ${label}`).join("   ");
    console.log(`\n  ${formatted}`);
}

export async function askOption(options: { key: string; label: string }[]): Promise<string> {
    const valid = new Set(options.map((o) => o.key.toLowerCase()));
    const hint = options.map((o) => o.key).join(", ");
    while (true) {
        const input = (await ask("Choice")).toLowerCase();
        if (valid.has(input)) return input;
        console.log(chalk.red(`  ✖ Invalid option. Enter ${hint}.`));
    }
}
