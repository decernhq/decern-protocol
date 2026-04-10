/**
 * Verdict computation: combines judge outcome and deterministic checks
 * to produce the final gate verdict, respecting judge_mode.
 */

import type { Verdict, ReasonCode, JudgeMode } from "./record.js";
import type { CheckResult } from "./checks/types.js";

export interface JudgeOutcomeForVerdict {
  allowed: boolean;
  reason: string;
  confidence: number | null;
}

export interface ComputeVerdictInput {
  judgeOutcome: JudgeOutcomeForVerdict | null;
  deterministicResults: CheckResult[];
  judgeMode: JudgeMode;
  /** True if Free plan or judge_blocking=false — judge never blocks. */
  advisory: boolean;
}

export interface ComputeVerdictOutput {
  verdict: Verdict;
  reasonCode: ReasonCode;
  reasonDetail: string;
}

/**
 * Compute the final gate verdict.
 *
 * Rules:
 * - A deterministic check failure always blocks (in any mode).
 * - In `deterministic_only` mode: judge outcome is ignored for verdict.
 * - In `advisory` mode: judge contributes to verdict alongside deterministic checks.
 * - If `advisory` flag is true (Free plan / judge_blocking off): judge never blocks, only warns.
 */
export function computeVerdict(input: ComputeVerdictInput): ComputeVerdictOutput {
  const { judgeOutcome, deterministicResults, judgeMode, advisory } = input;

  // Step 1: Check deterministic results (always authoritative)
  const failedChecks = deterministicResults.filter((r) => r.result === "fail");
  if (failedChecks.length > 0) {
    const details = failedChecks.map((c) => `${c.check_type}: ${c.details}`).join("; ");
    return {
      verdict: "block",
      reasonCode: "DETERMINISTIC_RULE_VIOLATION",
      reasonDetail: details.slice(0, 2000),
    };
  }

  // Step 2: In deterministic_only mode, judge is advisory — pass if deterministic passed
  if (judgeMode === "deterministic_only") {
    return {
      verdict: "pass",
      reasonCode: "PASS",
      reasonDetail: judgeOutcome
        ? `Deterministic checks passed. Judge (advisory): ${judgeOutcome.reason}`
        : "Deterministic checks passed.",
    };
  }

  // Step 3: Advisory mode — judge contributes
  if (!judgeOutcome) {
    // No judge invocation — pass on deterministic checks alone
    return {
      verdict: "pass",
      reasonCode: "PASS",
      reasonDetail: "All checks passed (no judge invoked).",
    };
  }

  if (!judgeOutcome.allowed) {
    if (advisory) {
      // Advisory: log warning but don't block
      return {
        verdict: "warn",
        reasonCode: "PASS_OBSERVATION",
        reasonDetail: `Judge (advisory) would block: ${judgeOutcome.reason}`,
      };
    }
    return {
      verdict: "block",
      reasonCode: "JUDGE_BLOCKED",
      reasonDetail: judgeOutcome.reason.slice(0, 2000),
    };
  }

  return {
    verdict: "pass",
    reasonCode: "PASS",
    reasonDetail: judgeOutcome.reason.slice(0, 2000),
  };
}
