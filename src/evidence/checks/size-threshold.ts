import type { DeterministicCheck, DiffInput, CheckConfig, CheckResult } from "./types.js";
import { hashDetails, makeCheckId } from "./types.js";

/**
 * size_threshold: blocks if the diff exceeds a configured size limit.
 * Config params: { maxBytes: number }
 */
export class SizeThresholdCheck implements DeterministicCheck {
  readonly type = "size_threshold" as const;

  check(diff: DiffInput, config: CheckConfig): CheckResult {
    const maxBytes = typeof config.params.maxBytes === "number" ? config.params.maxBytes : Infinity;
    const pass = diff.sizeBytes <= maxBytes;
    const details = pass
      ? `Diff size ${diff.sizeBytes} bytes is within threshold (${maxBytes} bytes).`
      : `Diff size ${diff.sizeBytes} bytes exceeds threshold (${maxBytes} bytes).`;
    return {
      check_id: makeCheckId(this.type, 0),
      check_type: this.type,
      result: pass ? "pass" : "fail",
      details,
      details_hash: hashDetails(details),
    };
  }
}
