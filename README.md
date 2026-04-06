# mcp-gen

CLI tool that converts OpenAPI specifications into [MCP (Model Context Protocol)](https://modelcontextprotocol.io) tool definitions using an LLM.

## How it works

1. Looks for an OpenAPI spec (JSON or YAML) in the given path
2. If none is found, analyzes your source code to generate one:
   - Detects route/controller files and schema/DTO files by filename patterns
   - Shows you the detected files and asks you to confirm, modify, or cancel
   - Sends the full contents of the confirmed files to the LLM
3. Parses all endpoints — paths, methods, parameters, and request bodies
4. Converts them to MCP tool definitions using an LLM in configurable chunks (`--chunk-size`), with rich descriptions based on request and response models
5. Outputs a JSON file or prints the result to the console

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file at the project root:

```env
OPENAI_API_KEY=sk-...
```

## Usage

```bash
# Point at a directory — mcp-gen will search for an OpenAPI file
npm run dev -- analyze ./my-project/

# Point directly at an OpenAPI file
npm run dev -- analyze ./docs/openapi.yaml

# Save output to ./my-project/docs/tools.json
npm run dev -- analyze ./my-project/ --output tools

# Use a specific OpenAI model
npm run dev -- analyze ./docs/openapi.yaml --model gpt-4o

# Process 10 files (or endpoints) per LLM request instead of the default 5
npm run dev -- analyze ./my-project/ --chunk-size 10

# Show detailed logs
npm run dev -- analyze ./docs/openapi.yaml --verbose
```

## Source code analysis

When no OpenAPI file is found, `mcp-gen` will offer to generate one from your source code.

It scans the project directory, detects the dominant language, and classifies files using language-specific patterns:

**TypeScript / JavaScript**

| Group | Detected by filename |
|---|---|
| Route / controller files | `routes`, `router`, `controller`, `handler`, `endpoint`, `app`, `server`, `main`, `index` |
| Schema / type / DTO files | `.dto`, `schema`, `model`, `type`, `interface`, `entity`, `payload`, `request`, `response` |

**Python**

| Group | Detected by filename |
|---|---|
| Route / controller files | `routes`, `views`, `controller`, `handler`, `endpoint`, `urls`, `app`, `main`, `server` |
| Schema / type / DTO files | `schema`, `model`, `type`, `serializer`, `payload`, `request`, `response` |

**Go**

| Group | Detected by filename |
|---|---|
| Route / controller files | `routes`, `handler`, `controller`, `endpoint`, `main`, `server`, `app`, `router` |
| Schema / type / DTO files | `model`, `type`, `schema`, `dto`, `payload`, `request`, `response` |

**Kotlin**

| Group | Detected by filename |
|---|---|
| Route / controller files | `routes`, `controller`, `handler`, `endpoint`, `resource`, `main`, `application`, `server`, `app` |
| Schema / type / DTO files | `dto`, `model`, `entity`, `schema`, `payload`, `request`, `response` |

**Java**

| Group | Detected by filename |
|---|---|
| Route / controller files | `routes`, `controller`, `handler`, `endpoint`, `resource`, `servlet`, `main`, `application`, `server`, `app` |
| Schema / type / DTO files | `dto`, `model`, `entity`, `schema`, `payload`, `request`, `response` |

**Scala**

| Group | Detected by filename |
|---|---|
| Route / controller files | `routes`, `controller`, `handler`, `endpoint`, `resource`, `main`, `application`, `server`, `app`, `router` |
| Schema / type / DTO files | `dto`, `model`, `entity`, `schema`, `payload`, `request`, `response` |

You are then shown the detected files and presented with three options:

```
  [C] Continue   [M] Modify   [N] Cancel
```

- **C** — send the files as-is to the LLM
- **M** — enter a modify loop where you can add or remove individual file paths
- **N** — cancel without doing anything

> The full contents of the confirmed files are sent to the LLM in chunks. For large codebases, prefer pointing directly at the relevant subdirectory (e.g. `src/api/`) rather than the project root. The generated OpenAPI spec is saved to `{path}/docs/openapi.json`.

## OpenAPI file discovery

When given a directory, `mcp-gen` searches these locations automatically:

| Subdirectories | Filenames |
|---|---|
| `.`, `docs/`, `api/`, `spec/`, `swagger/`, `openapi/` | `openapi.json`, `openapi.yaml`, `openapi.yml`, `swagger.json`, `swagger.yaml`, `swagger.yml`, `api.json`, `api.yaml`, `api.yml` |

If no spec is found, you are prompted:

```
  [G] Generate from source code   [F] Provide path to an existing file   [N] Cancel
```

- **G** — scan and classify source files, then generate an OpenAPI spec via LLM
- **F** — enter a path to an existing OpenAPI file manually
- **N** — exit

## Output format

```json
{
  "tools": [
    {
      "name": "get_user_by_id",
      "description": "Retrieves a user by their unique identifier. Accepts a path parameter user_id (string). Returns the full user object including id, name, email, and createdAt timestamp.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "user_id": { "type": "string", "description": "The unique identifier of the user to retrieve" }
        },
        "required": ["user_id"]
      }
    }
  ],
  "metadata": {
    "generatedAt": "2025-01-01T00:00:00.000Z",
    "sourceFile": "./docs/openapi.yaml",
    "endpointsProcessed": 12
  }
}
```

## Project structure

```
src/
├── index.ts                   # CLI entry point
├── cli/
│   └── commands.ts            # analyze command orchestration
├── converter/
│   ├── code-converter.ts      # file selection prompt and OpenAPI generation from source
│   ├── file-classifier.ts     # language-aware file classification (route vs schema)
│   ├── llm-client.ts          # OpenAI client and response parsing
│   ├── prompts.ts             # LLM system and user prompts
│   └── transformer.ts         # OpenAPI → MCP conversion
├── generator/
│   └── mcp-schema.ts          # assembles and writes the MCP definition
├── models/
│   ├── schemas.ts             # Zod validation schemas
│   └── types.ts               # TypeScript interfaces
├── openapi/
│   ├── finder.ts              # OpenAPI file discovery and prompting
│   └── parser.ts              # JSON/YAML parser with $ref resolution
└── utils/
    ├── file-utils.ts          # file I/O and language detection
    ├── logger.ts              # colored console output
    └── prompt.ts              # interactive CLI prompt helpers
```

## Requirements

- Node.js 18+
- OpenAI API key
- An OpenAPI 3.x spec, or source code in TypeScript, JavaScript, Python, Go, Kotlin, Java, or Scala
