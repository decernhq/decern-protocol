import type { DeterministicCheck, DiffInput, CheckConfig, CheckResult } from "./types.js";
import { hashDetails, makeCheckId } from "./types.js";

/**
 * regex_required: fails if a required pattern is NOT found in added lines.
 * Config params: { pattern: string } — regex pattern (must match at least one added line).
 */
export class RegexRequiredCheck implements DeterministicCheck {
  readonly type = "regex_required" as const;

  check(diff: DiffInput, config: CheckConfig): CheckResult {
    const pattern = typeof config.params.pattern === "string" ? config.params.pattern : "";
    if (!pattern) {
      return {
        check_id: makeCheckId(this.type, 0),
        check_type: this.type,
        result: "pass",
        details: "No pattern configured.",
        details_hash: hashDetails("No pattern configured."),
      };
    }
    const re = new RegExp(pattern);
    const addedLines = diff.rawDiff
      .split("\n")
      .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
    const found = addedLines.some((line) => re.test(line));
    const details = found
      ? `Required pattern /${pattern}/ found in added lines.`
      : `Required pattern /${pattern}/ NOT found in added lines.`;
    return {
      check_id: makeCheckId(this.type, 0),
      check_type: this.type,
      result: found ? "pass" : "fail",
      details,
      details_hash: hashDetails(details),
    };
  }
}

/**
 * regex_forbidden: fails if a forbidden pattern IS found in added lines.
 * Config params: { pattern: string } — regex pattern (must not match any added line).
 */
export class RegexForbiddenCheck implements DeterministicCheck {
  readonly type = "regex_forbidden" as const;

  check(diff: DiffInput, config: CheckConfig): CheckResult {
    const pattern = typeof config.params.pattern === "string" ? config.params.pattern : "";
    if (!pattern) {
      return {
        check_id: makeCheckId(this.type, 0),
        check_type: this.type,
        result: "pass",
        details: "No pattern configured.",
        details_hash: hashDetails("No pattern configured."),
      };
    }
    const re = new RegExp(pattern);
    const addedLines = diff.rawDiff
      .split("\n")
      .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
    const found = addedLines.some((line) => re.test(line));
    const details = found
      ? `Forbidden pattern /${pattern}/ found in added lines.`
      : `Forbidden pattern /${pattern}/ not found in added lines.`;
    return {
      check_id: makeCheckId(this.type, 0),
      check_type: this.type,
      result: found ? "fail" : "pass",
      details,
      details_hash: hashDetails(details),
    };
  }
}
