/**
 * Parse a pure-Markdown ADR file into structured decision fields.
 */
export interface ParsedAdr {
    title: string;
    status: string;
    author: string | null;
    date: string | null;
    tags: string[];
    context: string;
    options: string[];
    decision: string;
    consequences: string;
    pullRequestUrls: string[];
    externalLinks: {
        url: string;
        label?: string;
    }[];
    supersedes: string | null;
}
export declare function parseAdrMarkdown(markdown: string): ParsedAdr;
//# sourceMappingURL=parser.d.ts.map