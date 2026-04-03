import { Extractor, UnsupportedLanguageError } from "@src/converter/extractors/extractor.js";
import { NodeExtractor } from "@src/converter/extractors/node-extractor.js";
import { PythonExtractor } from "@src/converter/extractors/python-extractor.js";

export function getExtractor(language: string): Extractor {
    switch (language) {
        case "typescript":
        case "javascript":
            return new NodeExtractor();
        case "python":
            return new PythonExtractor();
        default:
            throw new UnsupportedLanguageError(language);
    }
}
