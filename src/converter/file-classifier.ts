import { basename } from "path";

const w = (...words: string[]) => words.map((word) => new RegExp(`\\b${word}\\b`, "i"));

const BASE_ROUTE = w("routes?", "controllers?", "handlers?", "endpoints?");
const BASE_SCHEMA = w("schemas?", "models?", "payloads?", "requests?", "responses?");

const PATTERNS: Record<string, { route: RegExp[]; schema: RegExp[] }> = {
    typescript: {
        route: [...BASE_ROUTE, ...w("routers?"), /\b(app|server|main|index)\.[tj]sx?$/i],
        schema: [...BASE_SCHEMA, ...w("routers?", "types?", "interfaces?", "entities?"), /\.dto\.[tj]sx?$/i],
    },
    javascript: {
        route: [...BASE_ROUTE, ...w("routers?"), /\b(app|server|main|index)\.jsx?$/i],
        schema: [...BASE_SCHEMA, ...w("types?")],
    },
    python: {
        route: [...BASE_ROUTE, ...w("views?", "urls?"), /\b(app|main|server)\.py$/i],
        schema: [...BASE_SCHEMA, ...w("types?", "serializers?")],
    },
    go: {
        route: [...BASE_ROUTE, /\b(main|server|app|router)\.go$/i],
        schema: [...BASE_SCHEMA, ...w("types?", "dtos?")],
    },
    kotlin: {
        route: [...BASE_ROUTE, ...w("resources?"), /\b(main|application|server|app)\.kt$/i],
        schema: [...BASE_SCHEMA, ...w("dtos?", "entities?")],
    },
    java: {
        route: [...BASE_ROUTE, ...w("resources?", "servlets?"), /\b(main|application|server|app)\.java$/i],
        schema: [...BASE_SCHEMA, ...w("dtos?", "entities?")],
    },
    scala: {
        route: [...BASE_ROUTE, ...w("resources?"), /\b(main|application|server|app|router)\.scala$/i],
        schema: [...BASE_SCHEMA, ...w("dtos?", "entities?")],
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
