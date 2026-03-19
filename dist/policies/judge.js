/** Build decision text for LLM prompts (pure, protocol-level shape). */
export function buildJudgeDecisionText(input) {
    const parts = [
        `# ${input.title}`,
        input.context?.trim() || "",
        input.options?.length ? `Options considered:\n${input.options.map((o) => `- ${o}`).join("\n")}` : "",
        `## Decision\n${input.decision?.trim() || ""}`,
        input.consequences?.trim() ? `## Consequences\n${input.consequences.trim()}` : "",
    ];
    return parts.filter(Boolean).join("\n\n");
}
/**
 * Parse LLM response into normalized judge output.
 * Accepts raw JSON or fenced ```json blocks.
 */
export function parseJudgeResponse(raw) {
    const trimmed = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    try {
        const parsed = JSON.parse(trimmed);
        const allowed = parsed.allowed === true;
        const reason = typeof parsed.reason === "string"
            ? parsed.reason
            : allowed
                ? "Change aligns with the decision."
                : "Change does not align with the decision.";
        let score = null;
        if (typeof parsed.score === "number" && !Number.isNaN(parsed.score)) {
            score = Math.max(0, Math.min(100, parsed.score));
        }
        else if (typeof parsed.score === "string") {
            const n = parseFloat(parsed.score);
            if (!Number.isNaN(n))
                score = Math.max(0, Math.min(100, n));
        }
        const advisoryNotes = typeof parsed.advisoryNotes === "string" && parsed.advisoryNotes.trim().length > 0
            ? parsed.advisoryNotes.trim()
            : null;
        return { allowed, reason, score, advisoryNotes };
    }
    catch {
        return {
            allowed: false,
            reason: "Judge response invalid.",
            score: null,
            advisoryNotes: null,
        };
    }
}
/** Compute final gate verdict from parsed judge response and threshold. */
export function computeJudgeOutcome(input) {
    const finalAllowed = input.parsed.score != null ? input.parsed.score >= input.thresholdPercent : input.parsed.allowed;
    const confidence = input.parsed.score != null ? input.parsed.score / 100 : input.parsed.allowed ? 1 : 0;
    const advisoryMessage = finalAllowed &&
        input.parsed.score != null &&
        input.parsed.score < 100 &&
        (input.parsed.advisoryNotes ?? input.parsed.reason)
        ? (input.parsed.advisoryNotes ?? input.parsed.reason)
        : undefined;
    const reason = input.parsed.reason ||
        (finalAllowed ? "Change aligns with the decision." : "Change does not align with the decision.");
    return {
        allowed: finalAllowed,
        reason,
        confidence,
        advisoryMessage,
    };
}
