/**
 * Runtime validation of evidence records against the v1 schema.
 *
 * Uses structural checks (no external JSON-Schema lib to keep protocol
 * dependency-free). Rejects missing required fields and unknown top-level fields.
 */

import {
  SCHEMA_VERSION,
  TIMESTAMP_SOURCES,
  CI_PROVIDERS,
  VERDICTS,
  REASON_CODES,
  CHECK_TYPES,
  type EvidenceRecord,
} from "./record.js";

// ── Helpers ─────────────────────────────────────────────────────────

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function isStringEnum(v: unknown, values: readonly string[]): boolean {
  return typeof v === "string" && (values as readonly string[]).includes(v);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// ── Known top-level keys (strict mode) ──────────────────────────────

const REQUIRED_KEYS: readonly string[] = [
  "evidence_id",
  "schema_version",
  "timestamp_utc",
  "timestamp_source",
  "workspace_id",
  "repository_identifier",
  "pull_request_id",
  "commit_sha",
  "base_commit_sha",
  "author_identity",
  "ci_provider",
  "decision_id",
  "decision_version",
  "decision_content_hash",
  "diff_hash",
  "diff_size_bytes",
  "diff_files_touched",
  "judge_invocation",
  "deterministic_checks",
  "verdict",
  "reason_code",
  "reason_detail",
  "previous_evidence_hash",
  "current_evidence_hash",
  "signature",
];

const OPTIONAL_KEYS: readonly string[] = ["override"];

const ALL_KNOWN_KEYS = new Set([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);

// ── Validation ──────────────────────────────────────────────────────

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

function validateAuthorIdentity(obj: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isPlainObject(obj)) return [`${path} must be an object`];
  if (!isNonEmptyString(obj.provider)) errors.push(`${path}.provider is required`);
  if (!isNonEmptyString(obj.id)) errors.push(`${path}.id is required`);
  if (!isNonEmptyString(obj.email)) errors.push(`${path}.email is required`);
  if (!isNonEmptyString(obj.display_name)) errors.push(`${path}.display_name is required`);
  return errors;
}

function validateJudgeInvocation(obj: unknown): string[] {
  if (obj === null) return [];
  const errors: string[] = [];
  if (!isPlainObject(obj)) return ["judge_invocation must be an object or null"];
  if (!isNonEmptyString(obj.provider)) errors.push("judge_invocation.provider is required");
  if (!isNonEmptyString(obj.model)) errors.push("judge_invocation.model is required");
  if (typeof obj.model_version !== "string") errors.push("judge_invocation.model_version is required");
  if (obj.temperature !== null && typeof obj.temperature !== "number") errors.push("judge_invocation.temperature must be number or null");
  if (obj.top_p !== null && typeof obj.top_p !== "number") errors.push("judge_invocation.top_p must be number or null");
  if (!isNonEmptyString(obj.prompt_hash)) errors.push("judge_invocation.prompt_hash is required");
  if (!isNonEmptyString(obj.response_hash)) errors.push("judge_invocation.response_hash is required");
  if (typeof obj.latency_ms !== "number") errors.push("judge_invocation.latency_ms is required");
  if (!isPlainObject(obj.token_usage)) {
    errors.push("judge_invocation.token_usage is required");
  } else {
    if (typeof obj.token_usage.input_tokens !== "number") errors.push("judge_invocation.token_usage.input_tokens is required");
    if (typeof obj.token_usage.output_tokens !== "number") errors.push("judge_invocation.token_usage.output_tokens is required");
  }
  return errors;
}

function validateDeterministicChecks(arr: unknown): string[] {
  if (!Array.isArray(arr)) return ["deterministic_checks must be an array"];
  const errors: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const p = `deterministic_checks[${i}]`;
    if (!isPlainObject(item)) {
      errors.push(`${p} must be an object`);
      continue;
    }
    if (!isNonEmptyString(item.check_id)) errors.push(`${p}.check_id is required`);
    if (!isStringEnum(item.check_type, CHECK_TYPES as unknown as string[])) errors.push(`${p}.check_type is invalid`);
    if (item.result !== "pass" && item.result !== "fail") errors.push(`${p}.result must be "pass" or "fail"`);
    if (!isNonEmptyString(item.details_hash)) errors.push(`${p}.details_hash is required`);
  }
  return errors;
}

function validateSignature(obj: unknown): string[] {
  if (!isPlainObject(obj)) return ["signature must be an object"];
  const errors: string[] = [];
  if (!isNonEmptyString(obj.algorithm)) errors.push("signature.algorithm is required");
  if (!isNonEmptyString(obj.key_id)) errors.push("signature.key_id is required");
  if (!isNonEmptyString(obj.value)) errors.push("signature.value is required");
  return errors;
}

function validateOverride(obj: unknown): string[] {
  if (obj === undefined) return [];
  if (!isPlainObject(obj)) return ["override must be an object"];
  const errors: string[] = [];
  if (!isNonEmptyString(obj.override_id)) errors.push("override.override_id is required");
  if (!isPlainObject(obj.overridden_by)) {
    errors.push("override.overridden_by is required");
  } else {
    errors.push(...validateAuthorIdentity(obj.overridden_by, "override.overridden_by"));
  }
  if (!isNonEmptyString(obj.override_reason)) errors.push("override.override_reason is required");
  if (!isNonEmptyString(obj.override_timestamp)) errors.push("override.override_timestamp is required");
  if (!isNonEmptyString(obj.override_auth_method)) errors.push("override.override_auth_method is required");
  return errors;
}

/**
 * Validate a candidate evidence record. Returns errors if any required
 * field is missing/invalid or any unknown top-level field is present.
 */
export function validateEvidenceRecord(record: unknown): ValidationResult {
  if (!isPlainObject(record)) {
    return { valid: false, errors: ["record must be a plain object"] };
  }

  const errors: string[] = [];

  // Strict mode: reject unknown top-level keys
  for (const key of Object.keys(record)) {
    if (!ALL_KNOWN_KEYS.has(key)) {
      errors.push(`unknown field: "${key}"`);
    }
  }

  // Required string fields
  if (!isNonEmptyString(record.evidence_id)) errors.push("evidence_id is required");
  if (record.schema_version !== SCHEMA_VERSION) errors.push(`schema_version must be "${SCHEMA_VERSION}"`);
  if (!isNonEmptyString(record.timestamp_utc)) errors.push("timestamp_utc is required");
  if (!isStringEnum(record.timestamp_source, TIMESTAMP_SOURCES as unknown as string[])) errors.push("timestamp_source is invalid");
  if (!isNonEmptyString(record.workspace_id)) errors.push("workspace_id is required");
  if (!isNonEmptyString(record.repository_identifier)) errors.push("repository_identifier is required");
  if (!isNonEmptyString(record.pull_request_id)) errors.push("pull_request_id is required");
  if (!isNonEmptyString(record.commit_sha)) errors.push("commit_sha is required");
  if (!isNonEmptyString(record.base_commit_sha)) errors.push("base_commit_sha is required");
  if (!isNonEmptyString(record.decision_id)) errors.push("decision_id is required");
  if (typeof record.decision_version !== "string") errors.push("decision_version is required");
  if (!isNonEmptyString(record.decision_content_hash)) errors.push("decision_content_hash is required");
  if (!isNonEmptyString(record.diff_hash)) errors.push("diff_hash is required");
  if (typeof record.diff_size_bytes !== "number" || record.diff_size_bytes < 0) errors.push("diff_size_bytes must be a non-negative number");
  if (!Array.isArray(record.diff_files_touched)) errors.push("diff_files_touched must be an array");
  if (!isStringEnum(record.verdict, VERDICTS as unknown as string[])) errors.push("verdict is invalid");
  if (!isStringEnum(record.reason_code, REASON_CODES as unknown as string[])) errors.push("reason_code is invalid");
  if (typeof record.reason_detail !== "string") errors.push("reason_detail is required");
  if (typeof record.reason_detail === "string" && record.reason_detail.length > 2000) errors.push("reason_detail exceeds 2000 chars");

  // Nullable string fields
  if (record.previous_evidence_hash !== null && typeof record.previous_evidence_hash !== "string") {
    errors.push("previous_evidence_hash must be a string or null");
  }
  if (!isNonEmptyString(record.current_evidence_hash)) errors.push("current_evidence_hash is required");

  // Sub-objects
  errors.push(...validateAuthorIdentity(record.author_identity, "author_identity"));
  if (!isStringEnum(record.ci_provider, CI_PROVIDERS as unknown as string[])) errors.push("ci_provider is invalid");
  errors.push(...validateJudgeInvocation(record.judge_invocation));
  errors.push(...validateDeterministicChecks(record.deterministic_checks));
  errors.push(...validateSignature(record.signature));
  errors.push(...validateOverride(record.override));

  return errors.length === 0
    ? { valid: true }
    : { valid: false, errors };
}

/**
 * Type guard: validates and narrows unknown to EvidenceRecord.
 */
export function isValidEvidenceRecord(record: unknown): record is EvidenceRecord {
  return validateEvidenceRecord(record).valid;
}
