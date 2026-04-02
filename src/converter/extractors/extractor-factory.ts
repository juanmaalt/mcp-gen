import { Extractor, UnsupportedLanguageError } from "@src/converter/extractors/extractor.js";
import { NodeExtractor } from "@src/converter/extractors/node-extractor.js";

export function getExtractor(language: string): Extractor {
    switch (language) {
        case "typescript":
        case "javascript":
            return new NodeExtractor();
        default:
            throw new UnsupportedLanguageError(language);
    }
}
