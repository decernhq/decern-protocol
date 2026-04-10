/**
 * Verdict computation: combines judge outcome and deterministic checks
 * to produce the final gate verdict, respecting judge_mode.
 *
 * judge_mode values:
 * - "blocking": judge can block the gate
 * - "advisory": judge runs but cannot block (warns only)
 * - "deterministic_only": verdict from deterministic checks only, judge is recorded but ignored
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
 * - In `advisory` mode: judge runs but never blocks, only warns.
 * - In `blocking` mode: judge can block.
 */
export function computeVerdict(input: ComputeVerdictInput): ComputeVerdictOutput {
  const { judgeOutcome, deterministicResults, judgeMode } = input;

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

  // Step 3: No judge invocation — pass on deterministic checks alone
  if (!judgeOutcome) {
    return {
      verdict: "pass",
      reasonCode: "PASS",
      reasonDetail: "All checks passed (no judge invoked).",
    };
  }

  // Step 4: Judge ran
  if (!judgeOutcome.allowed) {
    if (judgeMode === "advisory") {
      // Advisory: log warning but don't block
      return {
        verdict: "warn",
        reasonCode: "PASS_OBSERVATION",
        reasonDetail: `Judge (advisory) would block: ${judgeOutcome.reason}`,
      };
    }
    // Blocking mode
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
