/**
 * Decision Gate policies: pure protocol rules, plan-agnostic.
 * The protocol does not know product plans (free/team/business).
 * External layers provide capabilities and policy inputs.
 */
/** Input policy flags consumed by protocol rule evaluation. */
export interface GatePolicyInput {
    /** Workspace policy: high-impact changes should use blocking mode by default. */
    highImpact: boolean;
    /** Workspace policy: require at least one linked PR. */
    requireLinkedPR: boolean;
    /** Workspace policy: require approved status. */
    requireApproved: boolean;
}
/**
 * Capabilities provided by the host product.
 * The protocol only evaluates rules based on these flags.
 */
export interface GateEnforcementCapabilities {
    /** Host supports blocking mode for this caller/workspace. */
    canBlock: boolean;
    /** Host can enforce linked PR requirement. */
    canRequireLinkedPR: boolean;
    /** Host can enforce approved status requirement. */
    canRequireApproved: boolean;
}
export interface GateJudgeCapabilities {
    /** Host enables judge feature for this caller/workspace. */
    judgeEnabled: boolean;
    /** Host allows judge responses to block CI; when false, advisory mode. */
    judgeCanBlock: boolean;
}
/**
 * 1. Blocking mode
 * Blocking is active only when host allows it and highImpact is true.
 */
export declare function isBlockingRequired(capabilities: GateEnforcementCapabilities, params: GatePolicyInput): boolean;
/**
 * 2. Linked PR
 * Requirement is active only when host supports it and policy enables it.
 */
export declare function isLinkedPRRequired(capabilities: GateEnforcementCapabilities, params: GatePolicyInput): boolean;
/**
 * 3. Status (approved)
 * Requirement is active only when host supports it and policy enables it.
 */
export declare function isApprovalRequired(capabilities: GateEnforcementCapabilities, params: GatePolicyInput): boolean;
/** Default params when no DB row and no query param. */
export declare function defaultGatePolicyInput(): GatePolicyInput;
/** Map workspace_policies row to protocol policy input. */
export declare function dbRowToGatePolicyInput(row: {
    high_impact: boolean;
    require_linked_pr: boolean;
    require_approved: boolean;
}): Partial<GatePolicyInput>;
/**
 * Build policy input: defaults + optional DB row (workspace policies) + query param overrides.
 * Query params override DB; DB overrides defaults.
 */
export declare function mergeGatePolicyInput(dbRow: {
    high_impact: boolean;
    require_linked_pr: boolean;
    require_approved: boolean;
} | null, searchParams: URLSearchParams): GatePolicyInput;
/** Judge advisory mode is active whenever host does not allow blocking. */
export declare function isJudgeAdvisoryMode(capabilities: GateJudgeCapabilities): boolean;
/** Judge is available when host enables it for this caller/workspace. */
export declare function isJudgeAvailable(capabilities: GateJudgeCapabilities): boolean;
//# sourceMappingURL=decision-gate.d.ts.map