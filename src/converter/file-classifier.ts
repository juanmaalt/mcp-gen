import { basename } from "path";

const w = (...words: string[]) => words.map((word) => new RegExp(`\\b${word}\\b`, "i"));

const PATTERNS: Record<string, { route: RegExp[]; schema: RegExp[] }> = {
    typescript: {
        route: [...w("routes?", "routers?", "controllers?", "handlers?", "endpoints?"), /\b(app|server|main|index)\.[tj]sx?$/i],
        schema: [/\.dto\.[tj]sx?$/i, ...w("schemas?", "models?", "types?", "interfaces?", "entities?", "payloads?", "requests?", "responses?")],
    },
    javascript: {
        route: [...w("routes?", "routers?", "controllers?", "handlers?", "endpoints?"), /\b(app|server|main|index)\.jsx?$/i],
        schema: [...w("schemas?", "models?", "types?", "payloads?", "requests?", "responses?")],
    },
    python: {
        route: [...w("routes?", "views?", "controllers?", "handlers?", "endpoints?", "urls?"), /\b(app|main|server)\.py$/i],
        schema: [...w("schemas?", "models?", "types?", "serializers?", "payloads?", "requests?", "responses?")],
    },
    go: {
        route: [...w("routes?", "handlers?", "controllers?", "endpoints?"), /\b(main|server|app|router)\.go$/i],
        schema: [...w("models?", "types?", "schemas?", "dtos?", "payloads?", "requests?", "responses?")],
    },
};

export interface ClassifiedFiles {
    route: string[];
    schema: string[];
}

export function classifyFiles(files: string[], language: string): ClassifiedFiles {
    const patterns = PATTERNS[language] ?? PATTERNS["typescript"]!;
    const route: string[] = [];
    const schema: string[] = [];

    for (const f of files) {
        const name = basename(f);
        if (patterns.route.some((p) => p.test(name) || p.test(f))) {
            route.push(f);
        } else if (patterns.schema.some((p) => p.test(name) || p.test(f))) {
            schema.push(f);
        }
    }

    return { route, schema };
}
