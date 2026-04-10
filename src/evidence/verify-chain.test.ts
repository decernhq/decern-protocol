import { describe, it, expect } from "vitest";
import { verifyChain } from "./verify-chain.js";
import { computeEvidenceHash } from "./hash.js";
import { SCHEMA_VERSION, type EvidenceRecord } from "./record.js";

/** Build a chain of N records with valid hashes. */
function buildChain(n: number): EvidenceRecord[] {
  const chain: EvidenceRecord[] = [];
  for (let i = 0; i < n; i++) {
    const previousHash = i === 0 ? null : chain[i - 1].current_evidence_hash;
    const input = {
      evidence_id: `eid-${String(i).padStart(3, "0")}`,
      schema_version: SCHEMA_VERSION as typeof SCHEMA_VERSION,
      timestamp_utc: `2026-04-10T12:00:${String(i).padStart(2, "0")}.000000Z`,
      timestamp_source: "system_ntp" as const,
      workspace_id: "ws-001",
      repository_identifier: "github.com/acme/payments",
      pull_request_id: String(i + 1),
      commit_sha: `commit-${i}`,
      base_commit_sha: `base-${i}`,
      author_identity: { provider: "github", id: "1", email: "a@b.com", display_name: "A" },
      ci_provider: "github_actions" as const,
      decision_id: "dec-001",
      decision_version: "1",
      decision_content_hash: "sha256:aabb",
      diff_hash: `sha256:diff-${i}`,
      diff_size_bytes: 1024 + i,
      diff_files_touched: [`file-${i}.ts`],
      judge_invocation: null,
      deterministic_checks: [] as [],
      verdict: "pass" as const,
      reason_code: "PASS" as const,
      reason_detail: `Record ${i}`,
      previous_evidence_hash: previousHash,
    };
    const currentHash = computeEvidenceHash(input);
    chain.push({
      ...input,
      current_evidence_hash: currentHash,
      signature: { algorithm: "Ed25519", key_id: "k1", value: `sig-${i}` },
    });
  }
  return chain;
}

describe("verifyChain", () => {
  it("verifies an empty chain", () => {
    expect(verifyChain([])).toEqual({ valid: true, recordCount: 0 });
  });

  it("verifies a single record", () => {
    const chain = buildChain(1);
    expect(verifyChain(chain)).toEqual({ valid: true, recordCount: 1 });
  });

  it("verifies a chain of 10 records", () => {
    const chain = buildChain(10);
    expect(verifyChain(chain)).toEqual({ valid: true, recordCount: 10 });
  });

  it("detects tampered record in the middle (acceptance criteria #2)", () => {
    const chain = buildChain(10);
    // Tamper with record at index 5
    (chain[5] as unknown as Record<string, unknown>).reason_detail = "TAMPERED";
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.brokenAt).toBe("eid-005");
      expect(result.brokenIndex).toBe(5);
      expect(result.reason).toContain("tampered");
    }
  });

  it("detects tampered record at the beginning", () => {
    const chain = buildChain(10);
    (chain[0] as unknown as Record<string, unknown>).verdict = "block";
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.brokenAt).toBe("eid-000");
      expect(result.brokenIndex).toBe(0);
    }
  });

  it("detects tampered record at the end", () => {
    const chain = buildChain(10);
    (chain[9] as unknown as Record<string, unknown>).diff_size_bytes = 999999;
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.brokenAt).toBe("eid-009");
      expect(result.brokenIndex).toBe(9);
    }
  });

  it("detects broken chain link (previous_evidence_hash mismatch)", () => {
    const chain = buildChain(10);
    // Rebuild record 5 with wrong previous hash but correct self-hash
    const tampered = { ...chain[5], previous_evidence_hash: "wrong-hash" };
    const newHash = computeEvidenceHash(tampered);
    chain[5] = { ...tampered, current_evidence_hash: newHash };
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.brokenAt).toBe("eid-005");
      expect(result.reason).toContain("previous_evidence_hash");
    }
  });

  it("detects first record with non-null previous_evidence_hash", () => {
    const chain = buildChain(3);
    // Force first record to have a non-null previous hash
    const tampered = { ...chain[0], previous_evidence_hash: "should-be-null" };
    const newHash = computeEvidenceHash(tampered);
    chain[0] = { ...tampered, current_evidence_hash: newHash };
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.brokenAt).toBe("eid-000");
      expect(result.reason).toContain("First record");
    }
  });

  it("detects single-byte tampering in any field", () => {
    const chain = buildChain(5);
    // Change a single character in a hash field
    const original = chain[2].diff_hash;
    (chain[2] as unknown as Record<string, unknown>).diff_hash = original.slice(0, -1) + "X";
    const result = verifyChain(chain);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.brokenAt).toBe("eid-002");
    }
  });
});
