/**
 * Deterministic check system types.
 *
 * Each check type implements a pure function that evaluates a diff against
 * a decision's check configuration and returns a pass/fail result.
 */

import type { CheckType } from "../record.js";
import { sha256 } from "../hash.js";
import { canonicalize } from "../canonical.js";

export interface DiffInput {
  files: string[];
  rawDiff: string;
  sizeBytes: number;
}

export interface CheckConfig {
  type: CheckType;
  params: Record<string, unknown>;
}

export interface CheckResult {
  check_id: string;
  check_type: CheckType;
  result: "pass" | "fail";
  details: string;
  details_hash: string;
}

/**
 * Common interface for all deterministic check implementations.
 */
export interface DeterministicCheck {
  readonly type: CheckType;
  check(diff: DiffInput, config: CheckConfig): CheckResult;
}

/** Compute SHA-256 of canonical check details for the evidence record. */
export function hashDetails(details: string): string {
  return sha256(canonicalize(details));
}

/** Generate a check_id from type and a counter/identifier. */
export function makeCheckId(type: CheckType, index: number): string {
  return `${type}_${index}`;
}
