export declare const DECISION_STATUSES: readonly ["proposed", "approved", "superseded", "rejected"];
export type DecisionStatus = (typeof DECISION_STATUSES)[number];
export declare function isValidDecisionStatus(status: string): status is DecisionStatus;
export interface ExternalLink {
    url: string;
    label?: string;
}
/** Parse multiline "label | url" or plain URL text into ExternalLink[]. */
export declare function parseExternalLinks(raw: string | null | undefined): ExternalLink[];
/** Parse newline-separated options text into string[]. */
export declare function parseOptions(raw: string | null | undefined): string[];
/** Parse comma-separated tags text into lowercase trimmed string[]. */
export declare function parseTags(raw: string | null | undefined): string[];
/** Parse newline-separated pull request URLs into string[]. */
export declare function parsePullRequestUrls(raw: string | null | undefined): string[];
export interface PreparedDecisionData {
    title: string;
    status: DecisionStatus;
    context: string;
    options: string[];
    decision: string;
    consequences: string;
    tags: string[];
    externalLinks: ExternalLink[];
    pullRequestUrls: string[];
    linkedDecisionId: string | null;
}
export interface RawDecisionFormInput {
    title: string | null | undefined;
    status: string | null | undefined;
    context: string | null | undefined;
    options: string | null | undefined;
    decision: string | null | undefined;
    consequences: string | null | undefined;
    tags: string | null | undefined;
    externalLinks: string | null | undefined;
    pullRequestUrls: string | null | undefined;
    linkedDecisionId: string | null | undefined;
}
export type PrepareDecisionResult = {
    ok: true;
    data: PreparedDecisionData;
} | {
    ok: false;
    error: string;
};
/** Validate and normalize raw form input into structured decision data. */
export declare function prepareDecisionData(input: RawDecisionFormInput): PrepareDecisionResult;
//# sourceMappingURL=decision.d.ts.map