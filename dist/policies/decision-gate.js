/**
 * Decision Gate policies: pure protocol rules, plan-agnostic.
 * The protocol does not know product plans (free/team/business).
 * External layers provide capabilities and policy inputs.
 */
/**
 * 1. Blocking mode
 * Blocking is active only when host allows it and highImpact is true.
 */
export function isBlockingRequired(capabilities, params) {
    return capabilities.canBlock && params.highImpact;
}
/**
 * 2. Linked PR
 * Requirement is active only when host supports it and policy enables it.
 */
export function isLinkedPRRequired(capabilities, params) {
    return capabilities.canRequireLinkedPR && params.requireLinkedPR;
}
/**
 * 3. Status (approved)
 * Requirement is active only when host supports it and policy enables it.
 */
export function isApprovalRequired(capabilities, params) {
    return capabilities.canRequireApproved && params.requireApproved;
}
/** Default params when no DB row and no query param. */
export function defaultGatePolicyInput() {
    return { highImpact: true, requireLinkedPR: false, requireApproved: true };
}
/** Map workspace_policies row to protocol policy input. */
export function dbRowToGatePolicyInput(row) {
    return {
        highImpact: row.high_impact,
        requireLinkedPR: row.require_linked_pr,
        requireApproved: row.require_approved,
    };
}
/** Query param overrides: only keys that are present in the URL. */
function queryOverrides(searchParams) {
    const truthy = (v) => /^(true|1)$/i.test(v ?? "");
    const out = {};
    if (searchParams.has("highImpact"))
        out.highImpact = truthy(searchParams.get("highImpact"));
    if (searchParams.has("requireLinkedPR"))
        out.requireLinkedPR = truthy(searchParams.get("requireLinkedPR"));
    if (searchParams.has("requireApproved")) {
        const v = searchParams.get("requireApproved");
        out.requireApproved = v === undefined || v === null || v === "" ? true : truthy(v);
    }
    return out;
}
/**
 * Build policy input: defaults + optional DB row (workspace policies) + query param overrides.
 * Query params override DB; DB overrides defaults.
 */
export function mergeGatePolicyInput(dbRow, searchParams) {
    const base = defaultGatePolicyInput();
    const fromDb = dbRow ? dbRowToGatePolicyInput(dbRow) : {};
    const fromQuery = queryOverrides(searchParams);
    return { ...base, ...fromDb, ...fromQuery };
}
/** Judge advisory mode is active whenever host does not allow blocking. */
export function isJudgeAdvisoryMode(capabilities) {
    return !capabilities.judgeCanBlock;
}
/** Judge is available when host enables it for this caller/workspace. */
export function isJudgeAvailable(capabilities) {
    return capabilities.judgeEnabled;
}
