export declare const DECISION_ID_MAX_LENGTH = 128;
export declare const DECISION_ID_REGEX: RegExp;
/** Short ref format: ADR-1, ADR-01, ADR-001, etc. */
export declare const ADR_REF_REGEX: RegExp;
export type DecisionLookup = {
    ok: true;
    by: "decisionId" | "adrRef";
    id: string;
} | {
    ok: false;
};
export declare function validateDecisionId(id: string | null | undefined): {
    ok: true;
    id: string;
} | {
    ok: false;
};
export declare function validateAdrRef(adrRef: string | null | undefined): {
    ok: true;
    id: string;
} | {
    ok: false;
};
/** Validate lookup params for endpoints where adrRef has priority over decisionId. */
export declare function resolveDecisionLookup(adrRef: string | null | undefined, decisionId: string | null | undefined): DecisionLookup;
/** Validate input where exactly one of adrRef or decisionId must be provided. */
export declare function resolveExclusiveDecisionLookup(adrRef: string | null | undefined, decisionId: string | null | undefined): DecisionLookup;
//# sourceMappingURL=identifiers.d.ts.map