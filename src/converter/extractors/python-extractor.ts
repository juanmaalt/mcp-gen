import { Extractor } from "@src/converter/extractors/extractor.js";

const CONTEXT_LINES = 8;

// Matches: Flask/FastAPI route decorators, Django URL patterns, class-based views, Pydantic models
const PATTERNS = [
    // Flask: @app.route(), @bp.route(), @blueprint.route()
    /^\s*@\w+\.route\s*\(/,
    // Flask shorthand methods: @app.get(), @app.post(), @bp.delete(), etc.
    /^\s*@\w+\.(get|post|put|patch|delete|head|options)\s*\(/,
    // FastAPI: @app.get(), @router.post(), @app.api_route(), etc.
    /^\s*@(app|router|api_router)\.(get|post|put|patch|delete|head|options|trace|api_route)\s*\(/,
    // FastAPI / Flask view function definitions (def following a route decorator)
    /^\s*async\s+def\s+\w+|^\s*def\s+\w+\s*\(/,
    // Django: path(), re_path(), url() in urlpatterns
    /^\s*(path|re_path|url)\s*\(/,
    // Django urlpatterns list
    /^\s*urlpatterns\s*=/,
    // Django class-based views
    /^\s*class\s+\w+(View|ViewSet|APIView|GenericAPIView|ListAPIView|CreateAPIView|RetrieveAPIView|UpdateAPIView|DestroyAPIView|ListCreateAPIView|RetrieveUpdateAPIView|RetrieveDestroyAPIView|RetrieveUpdateDestroyAPIView|ModelViewSet|ReadOnlyModelViewSet)\s*[(:]/,
    // Django REST Framework: @api_view(), @action()
    /^\s*@(api_view|action|permission_classes|authentication_classes|throttle_classes|parser_classes|renderer_classes)\s*[(\[]/,
    // FastAPI: APIRouter instantiation
    /^\s*(app|router|api_router)\s*=\s*(FastAPI|APIRouter)\s*\(/,
    // Flask: Blueprint / app instantiation
    /^\s*\w+\s*=\s*(Flask|Blueprint)\s*\(/,
    // Pydantic / dataclass models used as request/response schemas
    /^\s*class\s+\w+\s*\(\s*(BaseModel|Schema|TypedDict|NamedTuple)\s*\)/,
    // General Python class declarations
    /^\s*class\s+\w+/,
];

export class PythonExtractor implements Extractor {
    extract(code: string): string {
        const lines = code.split("\n");
        const collected = new Set<number>();

        lines.forEach((line, index) => {
            if (PATTERNS.some((pattern) => pattern.test(line))) {
                for (let offset = 0; offset < CONTEXT_LINES && index + offset < lines.length; offset++) {
                    collected.add(index + offset);
                }
            }
        });

        return [...collected]
            .sort((i1, i2) => i1 - i2)
            .map((i) => lines[i])
            .join("\n");
    }
}
