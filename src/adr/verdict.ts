/**
 * Gate verdict types for v2.
 *
 * Case A: PR respects all ADRs → pass, silence
 * Case B: PR violates an ADR → block or warn (per-ADR enforcement)
 * Case C: PR introduces something no ADR covers → nudge, non-blocking
 */

import type { AdrEnforcement } from "./parser.js";

export type VerdictCase = "A" | "B" | "C";

export interface AdrEvaluation {
  adrId: string;
  adrTitle: string;
  adrHash: string;        // SHA-256 of ADR content at evaluation time
  result: "pass" | "violation" | "unrelated" | "skipped";
  enforcement: AdrEnforcement;
  reason: string;
}

export interface CaseCSignal {
  description: string;
  filesInvolved: string[];
  suggestedAdrTitle: string;
}

export interface GateVerdict {
  case: VerdictCase;
  exitCode: 0 | 1;
  adrsEvaluated: AdrEvaluation[];
  signals: CaseCSignal[];
  summary: string;
}

/**
 * Compute the gate verdict from ADR evaluations and case C signals.
 */
export function computeGateVerdict(
  evaluations: AdrEvaluation[],
  signals: CaseCSignal[],
): GateVerdict {
  // Any blocking violation → Case B, exit 1
  const blockingViolations = evaluations.filter(
    (e) => e.result === "violation" && e.enforcement === "blocking"
  );
  if (blockingViolations.length > 0) {
    return {
      case: "B",
      exitCode: 1,
      adrsEvaluated: evaluations,
      signals,
      summary: `Blocked: violates ${blockingViolations.map((v) => v.adrId).join(", ")}`,
    };
  }

  // Any warning violation → Case B, exit 0
  const warningViolations = evaluations.filter(
    (e) => e.result === "violation" && e.enforcement === "warning"
  );
  if (warningViolations.length > 0) {
    return {
      case: "B",
      exitCode: 0,
      adrsEvaluated: evaluations,
      signals,
      summary: `Warning: may violate ${warningViolations.map((v) => v.adrId).join(", ")}`,
    };
  }

  // Case C signals → Case C, exit 0
  if (signals.length > 0) {
    return {
      case: "C",
      exitCode: 0,
      adrsEvaluated: evaluations,
      signals,
      summary: `New architectural decisions detected (${signals.length} signal${signals.length > 1 ? "s" : ""})`,
    };
  }

  // Everything passes → Case A, exit 0
  return {
    case: "A",
    exitCode: 0,
    adrsEvaluated: evaluations,
    signals: [],
    summary: "All checks passed",
  };
}
