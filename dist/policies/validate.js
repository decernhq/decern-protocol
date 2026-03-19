/** Normalize pull_request_urls: array, JSON-string array, or Postgres text array. */
export function normalizePullRequestUrls(value) {
    if (Array.isArray(value)) {
        return value.filter((u) => typeof u === "string" && u.trim().length > 0).map((u) => u.trim());
    }
    if (typeof value === "string" && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed))
                return normalizePullRequestUrls(parsed);
            return [];
        }
        catch {
            if (value.startsWith("{") && value.endsWith("}")) {
                return value
                    .slice(1, -1)
                    .split(",")
                    .map((s) => s.replace(/^"|"$/g, "").trim())
                    .filter(Boolean);
            }
            return [];
        }
    }
    return [];
}
/**
 * Pure decision-gate validation.
 * The caller resolves policies/capabilities, DB fetches, and auth; this function only evaluates inputs.
 */
export function validateDecisionAgainstPolicy(input) {
    const pullRequestUrls = normalizePullRequestUrls(input.pullRequestUrlsRaw);
    const hasLinkedPR = pullRequestUrls.length > 0;
    if (input.requireLinkedPR && !hasLinkedPR) {
        return { valid: false, reason: "linked_pr_required" };
    }
    if (input.requireApproved && input.status !== "approved") {
        return { valid: false, reason: "not_approved", status: input.status };
    }
    const observation = !input.blocking;
    return {
        valid: true,
        decisionId: input.decisionId,
        adrRef: input.adrRef,
        observation,
        status: input.blocking ? "approved" : input.status,
    };
}
