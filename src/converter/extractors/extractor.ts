export interface Extractor {
    extract(code: string): string;
}

export class UnsupportedLanguageError extends Error {
    constructor(public readonly language: string) {
        super(`No extractor available for language: "${language}"`);
        this.name = "UnsupportedLanguageError";
    }
}
