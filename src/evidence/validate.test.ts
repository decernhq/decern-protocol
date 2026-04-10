import { describe, it, expect } from "vitest";
import { validateEvidenceRecord } from "./validate.js";
import { SCHEMA_VERSION, type EvidenceRecord } from "./record.js";

function makeValidRecord(): EvidenceRecord {
  return {
    evidence_id: "019078a0-0000-7000-8000-000000000001",
    schema_version: SCHEMA_VERSION,
    timestamp_utc: "2026-04-10T12:00:00.000000Z",
    timestamp_source: "system_ntp",
    workspace_id: "ws-001",
    repository_identifier: "github.com/acme/payments",
    pull_request_id: "42",
    commit_sha: "abc123def456",
    base_commit_sha: "000111222333",
    author_identity: {
      provider: "github",
      id: "12345",
      email: "dev@acme.com",
      display_name: "Dev User",
    },
    ci_provider: "github_actions",
    decision_id: "dec-001",
    decision_version: "1",
    decision_content_hash: "sha256:aabbccdd",
    diff_hash: "sha256:11223344",
    diff_size_bytes: 4096,
    diff_files_touched: ["src/main.ts", "package.json"],
    judge_invocation: {
      provider: "openai",
      model: "gpt-4o-mini",
      model_version: "2024-07-18",
      temperature: 0,
      top_p: null,
      prompt_hash: "sha256:prompt",
      response_hash: "sha256:response",
      latency_ms: 1200,
      token_usage: { input_tokens: 500, output_tokens: 150 },
    },
    deterministic_checks: [],
    verdict: "pass",
    reason_code: "PASS",
    reason_detail: "Change aligns with decision.",
    previous_evidence_hash: null,
    current_evidence_hash: "sha256:currenthash",
    signature: {
      algorithm: "Ed25519",
      key_id: "key-abc",
      value: "base64signature",
    },
  };
}

describe("validateEvidenceRecord", () => {
  it("accepts a valid record", () => {
    const result = validateEvidenceRecord(makeValidRecord());
    expect(result).toEqual({ valid: true });
  });

  it("rejects non-object input", () => {
    const result = validateEvidenceRecord("not an object");
    expect(result.valid).toBe(false);
  });

  it("rejects missing evidence_id", () => {
    const record = makeValidRecord();
    delete (record as unknown as Record<string, unknown>).evidence_id;
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain("evidence_id is required");
    }
  });

  it("rejects wrong schema_version", () => {
    const record = { ...makeValidRecord(), schema_version: "v2" };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("rejects unknown top-level field (strict mode)", () => {
    const record = { ...makeValidRecord(), extra_field: "nope" };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes("unknown field"))).toBe(true);
    }
  });

  it("rejects invalid ci_provider", () => {
    const record = { ...makeValidRecord(), ci_provider: "circleci" };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid verdict", () => {
    const record = { ...makeValidRecord(), verdict: "maybe" };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid reason_code", () => {
    const record = { ...makeValidRecord(), reason_code: "UNKNOWN_CODE" };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("rejects reason_detail over 2000 chars", () => {
    const record = { ...makeValidRecord(), reason_detail: "x".repeat(2001) };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("rejects missing author_identity fields", () => {
    const record = {
      ...makeValidRecord(),
      author_identity: { provider: "github", id: "", email: "", display_name: "" },
    };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("rejects invalid deterministic_checks items", () => {
    const record = {
      ...makeValidRecord(),
      deterministic_checks: [{ check_id: "", check_type: "invalid", result: "pass", details_hash: "x" }],
    };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("rejects missing signature fields", () => {
    const record = { ...makeValidRecord(), signature: { algorithm: "", key_id: "", value: "" } };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("accepts record with null judge_invocation", () => {
    const record = { ...makeValidRecord(), judge_invocation: null };
    const result = validateEvidenceRecord(record);
    expect(result).toEqual({ valid: true });
  });

  it("accepts record with override", () => {
    const record = {
      ...makeValidRecord(),
      reason_code: "OVERRIDE" as const,
      override: {
        override_id: "ovr-001",
        overridden_by: { provider: "github", id: "999", email: "lead@acme.com", display_name: "Lead" },
        override_reason: "Urgent hotfix approved by CTO in Slack thread.",
        override_timestamp: "2026-04-10T13:00:00.000000Z",
        override_auth_method: "supabase_session",
      },
    };
    const result = validateEvidenceRecord(record);
    expect(result).toEqual({ valid: true });
  });

  it("rejects invalid override (missing fields)", () => {
    const record = {
      ...makeValidRecord(),
      override: { override_id: "ovr-001" },
    };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("rejects negative diff_size_bytes", () => {
    const record = { ...makeValidRecord(), diff_size_bytes: -1 };
    const result = validateEvidenceRecord(record);
    expect(result.valid).toBe(false);
  });

  it("collects multiple errors at once", () => {
    const result = validateEvidenceRecord({});
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(5);
    }
  });
});
