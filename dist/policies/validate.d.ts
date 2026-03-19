export type DecisionGateFailureReason = "linked_pr_required" | "not_approved";
export interface DecisionValidationInput {
    decisionId: string;
    adrRef: string | null;
    status: string;
    pullRequestUrlsRaw: unknown;
    blocking: boolean;
    requireLinkedPR: boolean;
    requireApproved: boolean;
}
export type DecisionValidationResult = {
    valid: false;
    reason: DecisionGateFailureReason;
    status?: string;
} | {
    valid: true;
    decisionId: string;
    adrRef: string | null;
    observation: boolean;
    status: string;
};
/** Normalize pull_request_urls: array, JSON-string array, or Postgres text array. */
export declare function normalizePullRequestUrls(value: unknown): string[];
/**
 * Pure decision-gate validation.
 * The caller resolves policies/capabilities, DB fetches, and auth; this function only evaluates inputs.
 */
export declare function validateDecisionAgainstPolicy(input: DecisionValidationInput): DecisionValidationResult;
//# sourceMappingURL=validate.d.ts.map