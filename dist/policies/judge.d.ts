export interface JudgeDecisionTextInput {
    title: string;
    context: string;
    options: string[];
    decision: string;
    consequences: string;
}
/** Parsed LLM output (score 0-100, optional advisoryNotes). */
export interface ParsedJudgeResult {
    allowed: boolean;
    reason: string;
    score: number | null;
    advisoryNotes: string | null;
}
export interface JudgeOutcomeInput {
    parsed: ParsedJudgeResult;
    thresholdPercent: number;
}
export interface JudgeOutcome {
    allowed: boolean;
    reason: string;
    confidence: number;
    advisoryMessage?: string;
}
/** Build decision text for LLM prompts (pure, protocol-level shape). */
export declare function buildJudgeDecisionText(input: JudgeDecisionTextInput): string;
/**
 * Parse LLM response into normalized judge output.
 * Accepts raw JSON or fenced ```json blocks.
 */
export declare function parseJudgeResponse(raw: string): ParsedJudgeResult;
/** Compute final gate verdict from parsed judge response and threshold. */
export declare function computeJudgeOutcome(input: JudgeOutcomeInput): JudgeOutcome;
//# sourceMappingURL=judge.d.ts.map