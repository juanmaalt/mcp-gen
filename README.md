# mcp-gen

CLI tool that converts OpenAPI specifications into [MCP (Model Context Protocol)](https://modelcontextprotocol.io) tool definitions using an LLM.

## How it works

1. Finds your OpenAPI spec (JSON or YAML) in the given path
2. Parses all endpoints — paths, methods, parameters, and request bodies
3. Sends the endpoints to an LLM to generate MCP-compatible tool schemas
4. Outputs a JSON file or prints the tools to the console

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

# Save output to a file
npm run dev -- analyze ./docs/openapi.yaml --output tools.json

# Use a specific OpenAI model
npm run dev -- analyze ./docs/openapi.yaml --model gpt-4o

# Show detailed logs for each step of the process
npm run dev -- analyze ./docs/openapi.yaml --verbose
```

If no OpenAPI file is found automatically, the CLI will prompt you to provide a path or generate one. If you choose to generate, **the full contents of all code files in the project directory are sent to the LLM** — this may consume a significant number of tokens for large codebases.

## Output

Both stdout and file output share the same JSON format:

```json
{
  "tools": [
    {
      "name": "get_user_by_id",
      "description": "Retrieves a user by their unique identifier",
      "inputSchema": {
        "type": "object",
        "properties": {
          "user_id": { "type": "string", "description": "The user's ID" }
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

## OpenAPI file discovery

When given a directory, `mcp-gen` searches the following subdirectories for common spec filenames:

| Subdirectories searched | Filenames recognized |
|---|---|
| `.`, `docs/`, `api/`, `spec/`, `swagger/`, `openapi/` | `openapi.json`, `openapi.yaml`, `openapi.yml`, `swagger.json`, `swagger.yaml`, `swagger.yml`, `api.json`, `api.yaml`, `api.yml` |

## Project structure

```
src/
├── index.ts              # CLI entry point
├── cli/
│   └── commands.ts       # analyze command
├── converter/
│   ├── code-converter.ts # Generates OpenAPI spec from source code via LLM
│   ├── code-extractor.ts # Extracts endpoint and class declarations from source files
│   ├── llm-client.ts     # OpenAI client wrapper
│   ├── prompts.ts        # System and user prompts
│   └── transformer.ts    # Orchestrates OpenAPI → MCP conversion
├── generator/
│   └── mcp-schema.ts     # Assembles and writes MCPDefinition
├── models/
│   ├── schemas.ts        # Zod validation schemas
│   └── types.ts          # TypeScript interfaces
├── openapi/
│   ├── finder.ts         # OpenAPI file discovery
│   └── parser.ts         # OpenAPI spec parser (JSON/YAML, resolves $ref)
└── utils/
    ├── file-utils.ts     # File I/O helpers
    └── logger.ts         # Colored console output
```

## Requirements

- Node.js 18+
- OpenAI API key
- An OpenAPI 3.x spec (JSON or YAML)
