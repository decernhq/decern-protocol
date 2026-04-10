/**
 * Evidence record schema v1 — TypeScript types.
 *
 * Every gate run (validate or judge) produces exactly one EvidenceRecord.
 * The record is frozen, hash-chained, and signed at creation time.
 */

// ── Enums & literals ────────────────────────────────────────────────

export const SCHEMA_VERSION = "decern_evidence_v1" as const;

export const TIMESTAMP_SOURCES = ["system_ntp", "rfc3161_tsa"] as const;
export type TimestampSource = (typeof TIMESTAMP_SOURCES)[number];

export const CI_PROVIDERS = [
  "github_actions",
  "gitlab_ci",
  "bitbucket_pipelines",
  "jenkins",
  "azure_devops",
  "unknown",
] as const;
export type CiProvider = (typeof CI_PROVIDERS)[number];

export const VERDICTS = ["pass", "warn", "block"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const REASON_CODES = [
  "PASS",
  "PASS_OBSERVATION",
  "OUT_OF_SCOPE",
  "DEPRECATED_PATTERN",
  "UNAPPROVED_DEPENDENCY",
  "NO_DECISION_REFERENCED",
  "DECISION_NOT_FOUND",
  "DECISION_NOT_APPROVED",
  "LINKED_PR_REQUIRED",
  "DETERMINISTIC_RULE_VIOLATION",
  "JUDGE_BLOCKED",
  "JUDGE_LOW_CONFIDENCE",
  "JUDGE_UNAVAILABLE",
  "OVERRIDE",
  "POLICY_VIOLATION",
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

export const CHECK_TYPES = [
  "path_denylist",
  "dependency_denylist",
  "regex_required",
  "regex_forbidden",
  "file_type_denylist",
  "size_threshold",
] as const;
export type CheckType = (typeof CHECK_TYPES)[number];

export const JUDGE_MODES = ["advisory", "deterministic_only"] as const;
export type JudgeMode = (typeof JUDGE_MODES)[number];

// ── Sub-objects ─────────────────────────────────────────────────────

export interface AuthorIdentity {
  provider: string;
  id: string;
  email: string;
  display_name: string;
}

export interface JudgeInvocation {
  provider: string;
  model: string;
  model_version: string;
  temperature: number | null;
  top_p: number | null;
  prompt_hash: string;
  response_hash: string;
  latency_ms: number;
  token_usage: { input_tokens: number; output_tokens: number };
}

export interface DeterministicCheckResult {
  check_id: string;
  check_type: CheckType;
  result: "pass" | "fail";
  details_hash: string;
}

export interface Override {
  override_id: string;
  overridden_by: AuthorIdentity;
  override_reason: string;
  override_timestamp: string;
  override_auth_method: string;
}

export interface Signature {
  algorithm: string;
  key_id: string;
  value: string;
}

// ── Main record ─────────────────────────────────────────────────────

export interface EvidenceRecord {
  evidence_id: string;
  schema_version: typeof SCHEMA_VERSION;
  timestamp_utc: string;
  timestamp_source: TimestampSource;
  workspace_id: string;
  repository_identifier: string;
  pull_request_id: string;
  commit_sha: string;
  base_commit_sha: string;
  author_identity: AuthorIdentity;
  ci_provider: CiProvider;
  decision_id: string;
  decision_version: string;
  decision_content_hash: string;
  diff_hash: string;
  diff_size_bytes: number;
  diff_files_touched: string[];
  judge_invocation: JudgeInvocation | null;
  deterministic_checks: DeterministicCheckResult[];
  verdict: Verdict;
  reason_code: ReasonCode;
  reason_detail: string;
  override?: Override;
  previous_evidence_hash: string | null;
  current_evidence_hash: string;
  signature: Signature;
}

/**
 * All fields of an EvidenceRecord except the ones computed during
 * chain append (previous_evidence_hash, current_evidence_hash, signature).
 */
export type EvidenceRecordInput = Omit<
  EvidenceRecord,
  "previous_evidence_hash" | "current_evidence_hash" | "signature"
>;
