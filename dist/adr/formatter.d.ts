/**
 * Format structured decision fields into a pure-Markdown ADR file.
 */
export interface AdrFields {
    title: string;
    status: string;
    author?: string | null;
    date?: string | null;
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
export declare function formatAdrMarkdown(fields: AdrFields): string;
export declare function slugify(text: string): string;
export declare function adrFilename(adrRef: string, title: string): string;
export declare function adrCommitMessageCreate(adrRef: string, title: string): string;
export declare function adrCommitMessageUpdate(adrRef: string, title: string): string;
export declare function adrCommitMessageRename(adrRef: string): string;
export declare function adrCommitMessageStatus(adrRef: string, status: string): string;
export declare function adrCommitMessageDelete(adrRef: string, title: string): string;
//# sourceMappingURL=formatter.d.ts.map