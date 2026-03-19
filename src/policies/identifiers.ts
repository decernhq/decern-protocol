export const DECISION_ID_MAX_LENGTH = 128;
export const DECISION_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
/** Short ref format: ADR-1, ADR-01, ADR-001, etc. */
export const ADR_REF_REGEX = /^ADR-\d+$/i;

export type DecisionLookup =
  | { ok: true; by: "decisionId" | "adrRef"; id: string }
  | { ok: false };

export function validateDecisionId(id: string | null | undefined): { ok: true; id: string } | { ok: false } {
  if (id == null || typeof id !== "string") return { ok: false };
  const trimmed = id.trim();
  if (trimmed.length === 0 || trimmed.length > DECISION_ID_MAX_LENGTH) return { ok: false };
  if (!DECISION_ID_REGEX.test(trimmed)) return { ok: false };
  return { ok: true, id: trimmed };
}

export function validateAdrRef(adrRef: string | null | undefined): { ok: true; id: string } | { ok: false } {
  const trimmed = adrRef?.trim() ?? "";
  if (trimmed.length === 0 || trimmed.length > DECISION_ID_MAX_LENGTH) return { ok: false };
  if (!ADR_REF_REGEX.test(trimmed)) return { ok: false };
  return { ok: true, id: trimmed };
}

/** Validate lookup params for endpoints where adrRef has priority over decisionId. */
export function resolveDecisionLookup(adrRef: string | null | undefined, decisionId: string | null | undefined): DecisionLookup {
  const adr = validateAdrRef(adrRef);
  if (adr.ok) return { ok: true, by: "adrRef", id: adr.id };

  const dec = validateDecisionId(decisionId);
  if (dec.ok) return { ok: true, by: "decisionId", id: dec.id };

  return { ok: false };
}

/** Validate input where exactly one of adrRef or decisionId must be provided. */
export function resolveExclusiveDecisionLookup(
  adrRef: string | null | undefined,
  decisionId: string | null | undefined
): DecisionLookup {
  const hasAdrRef = (adrRef?.trim() ?? "").length > 0;
  const hasDecisionId = (decisionId?.trim() ?? "").length > 0;
  if (hasAdrRef === hasDecisionId) return { ok: false };
  return resolveDecisionLookup(adrRef, decisionId);
}
