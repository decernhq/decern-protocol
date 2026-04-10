import { describe, it, expect } from "vitest";
import { sha256, computeEvidenceHash, verifyRecordHash } from "./hash.js";
import { SCHEMA_VERSION, type EvidenceRecord } from "./record.js";

function makeRecordInput(overrides: Record<string, unknown> = {}) {
  return {
    evidence_id: "019078a0-0000-7000-8000-000000000001",
    schema_version: SCHEMA_VERSION,
    timestamp_utc: "2026-04-10T12:00:00.000000Z",
    timestamp_source: "system_ntp" as const,
    workspace_id: "ws-001",
    repository_identifier: "github.com/acme/payments",
    pull_request_id: "42",
    commit_sha: "abc123",
    base_commit_sha: "000111",
    author_identity: { provider: "github", id: "1", email: "a@b.com", display_name: "A" },
    ci_provider: "github_actions" as const,
    decision_id: "dec-001",
    decision_version: "1",
    decision_content_hash: "sha256:aabb",
    diff_hash: "sha256:1122",
    diff_size_bytes: 1024,
    diff_files_touched: ["src/main.ts"],
    judge_invocation: null,
    deterministic_checks: [],
    verdict: "pass" as const,
    reason_code: "PASS" as const,
    reason_detail: "Aligned.",
    previous_evidence_hash: null as string | null,
    ...overrides,
  };
}

describe("sha256", () => {
  it("produces consistent hex hash", () => {
    const h = sha256("hello");
    expect(h).toHaveLength(64);
    expect(h).toBe(sha256("hello"));
  });

  it("different input produces different hash", () => {
    expect(sha256("a")).not.toBe(sha256("b"));
  });
});

describe("computeEvidenceHash", () => {
  it("produces a 64-char hex string", () => {
    const hash = computeEvidenceHash(makeRecordInput());
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
  });

  it("is deterministic", () => {
    const input = makeRecordInput();
    expect(computeEvidenceHash(input)).toBe(computeEvidenceHash(input));
  });

  it("changes when any field changes", () => {
    const base = computeEvidenceHash(makeRecordInput());
    const changed = computeEvidenceHash(makeRecordInput({ verdict: "block" }));
    expect(base).not.toBe(changed);
  });

  it("changes when previous_evidence_hash changes", () => {
    const h1 = computeEvidenceHash(makeRecordInput({ previous_evidence_hash: null }));
    const h2 = computeEvidenceHash(makeRecordInput({ previous_evidence_hash: "abc123" }));
    expect(h1).not.toBe(h2);
  });
});

describe("verifyRecordHash", () => {
  it("returns true for a correctly hashed record", () => {
    const input = makeRecordInput();
    const hash = computeEvidenceHash(input);
    const record: EvidenceRecord = {
      ...input,
      current_evidence_hash: hash,
      signature: { algorithm: "Ed25519", key_id: "k1", value: "sig" },
    };
    expect(verifyRecordHash(record)).toBe(true);
  });

  it("returns false if current_evidence_hash is wrong", () => {
    const input = makeRecordInput();
    const record: EvidenceRecord = {
      ...input,
      current_evidence_hash: "0000000000000000000000000000000000000000000000000000000000000000",
      signature: { algorithm: "Ed25519", key_id: "k1", value: "sig" },
    };
    expect(verifyRecordHash(record)).toBe(false);
  });

  it("returns false if a field was modified after hashing", () => {
    const input = makeRecordInput();
    const hash = computeEvidenceHash(input);
    const record: EvidenceRecord = {
      ...input,
      current_evidence_hash: hash,
      signature: { algorithm: "Ed25519", key_id: "k1", value: "sig" },
    };
    // Tamper with the record
    (record as unknown as Record<string, unknown>).verdict = "block";
    expect(verifyRecordHash(record)).toBe(false);
  });
});
