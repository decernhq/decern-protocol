/**
 * Hash chain verification for evidence records.
 *
 * Walks a sequence of records in chain order and verifies:
 * 1. Each record's `current_evidence_hash` matches recomputation.
 * 2. Each record's `previous_evidence_hash` matches the preceding record's `current_evidence_hash`.
 * 3. The first record has `previous_evidence_hash === null`.
 */

import { verifyRecordHash } from "./hash.js";
import type { EvidenceRecord } from "./record.js";

export type VerifyChainResult =
  | { valid: true; recordCount: number }
  | {
      valid: false;
      brokenAt: string;       // evidence_id where the break was detected
      brokenIndex: number;    // 0-based index in the input array
      reason: string;
      expected?: string;
      actual?: string;
    };

/**
 * Verify a chain of evidence records.
 *
 * @param records - Array of EvidenceRecord in chain order (oldest first).
 *                  Must be from a single workspace.
 * @returns Verification result. If invalid, includes the exact break point.
 */
export function verifyChain(records: EvidenceRecord[]): VerifyChainResult {
  if (records.length === 0) {
    return { valid: true, recordCount: 0 };
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    // Check 1: first record must have null previous_evidence_hash
    if (i === 0 && record.previous_evidence_hash !== null) {
      return {
        valid: false,
        brokenAt: record.evidence_id,
        brokenIndex: i,
        reason: "First record must have previous_evidence_hash === null",
        expected: "null",
        actual: record.previous_evidence_hash,
      };
    }

    // Check 2: non-first records must reference the previous record's hash
    if (i > 0) {
      const prev = records[i - 1];
      if (record.previous_evidence_hash !== prev.current_evidence_hash) {
        return {
          valid: false,
          brokenAt: record.evidence_id,
          brokenIndex: i,
          reason: "previous_evidence_hash does not match preceding record's current_evidence_hash",
          expected: prev.current_evidence_hash,
          actual: record.previous_evidence_hash ?? "(null)",
        };
      }
    }

    // Check 3: recompute current_evidence_hash and compare
    if (!verifyRecordHash(record)) {
      return {
        valid: false,
        brokenAt: record.evidence_id,
        brokenIndex: i,
        reason: "current_evidence_hash does not match recomputation (record may have been tampered with)",
      };
    }
  }

  return { valid: true, recordCount: records.length };
}
