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
export function isBlockingRequired(capabilities: GateEnforcementCapabilities, params: GatePolicyInput): boolean {
  return capabilities.canBlock && params.highImpact;
}

/**
 * 2. Linked PR
 * Requirement is active only when host supports it and policy enables it.
 */
export function isLinkedPRRequired(capabilities: GateEnforcementCapabilities, params: GatePolicyInput): boolean {
  return capabilities.canRequireLinkedPR && params.requireLinkedPR;
}

/**
 * 3. Status (approved)
 * Requirement is active only when host supports it and policy enables it.
 */
export function isApprovalRequired(capabilities: GateEnforcementCapabilities, params: GatePolicyInput): boolean {
  return capabilities.canRequireApproved && params.requireApproved;
}

/** Default params when no DB row and no query param. */
export function defaultGatePolicyInput(): GatePolicyInput {
  return { highImpact: true, requireLinkedPR: false, requireApproved: true };
}

/** Map workspace_policies row to protocol policy input. */
export function dbRowToGatePolicyInput(row: {
  high_impact: boolean;
  require_linked_pr: boolean;
  require_approved: boolean;
}): Partial<GatePolicyInput> {
  return {
    highImpact: row.high_impact,
    requireLinkedPR: row.require_linked_pr,
    requireApproved: row.require_approved,
  };
}

/** Query param overrides: only keys that are present in the URL. */
function queryOverrides(searchParams: URLSearchParams): Partial<GatePolicyInput> {
  const truthy = (v: string | null) => /^(true|1)$/i.test(v ?? "");
  const out: Partial<GatePolicyInput> = {};
  if (searchParams.has("highImpact")) out.highImpact = truthy(searchParams.get("highImpact"));
  if (searchParams.has("requireLinkedPR")) out.requireLinkedPR = truthy(searchParams.get("requireLinkedPR"));
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
export function mergeGatePolicyInput(
  dbRow: { high_impact: boolean; require_linked_pr: boolean; require_approved: boolean } | null,
  searchParams: URLSearchParams
): GatePolicyInput {
  const base = defaultGatePolicyInput();
  const fromDb = dbRow ? dbRowToGatePolicyInput(dbRow) : {};
  const fromQuery = queryOverrides(searchParams);
  return { ...base, ...fromDb, ...fromQuery };
}

/** Judge advisory mode is active whenever host does not allow blocking. */
export function isJudgeAdvisoryMode(capabilities: GateJudgeCapabilities): boolean {
  return !capabilities.judgeCanBlock;
}

/** Judge is available when host enables it for this caller/workspace. */
export function isJudgeAvailable(capabilities: GateJudgeCapabilities): boolean {
  return capabilities.judgeEnabled;
}
