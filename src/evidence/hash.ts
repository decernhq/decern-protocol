/**
 * Evidence record hash computation.
 *
 * The evidence hash is: SHA-256( canonical_json(record_fields) || previous_hash )
 * where record_fields excludes `current_evidence_hash` and `signature`.
 */

import { createHash } from "node:crypto";
import { canonicalize } from "./canonical.js";
import type { EvidenceRecord } from "./record.js";

/**
 * Fields excluded from the hash input. These are computed AFTER the hash
 * (current_evidence_hash depends on all other fields; signature depends on the hash).
 */
const EXCLUDED_FROM_HASH = new Set(["current_evidence_hash", "signature"]);

/**
 * Compute SHA-256 of a UTF-8 string. Returns hex-encoded hash.
 */
export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

/**
 * Compute SHA-256 of raw bytes. Returns hex-encoded hash.
 */
export function sha256Bytes(input: Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Extract the hash-input fields from a record: all fields except
 * `current_evidence_hash` and `signature`.
 */
function hashInputFields(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!EXCLUDED_FROM_HASH.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Compute the evidence hash for a record.
 *
 * hash = SHA-256( canonical_json(fields_without_hash_and_sig) + (previous_hash ?? "") )
 *
 * The record MUST already have `previous_evidence_hash` set (to a string or null).
 */
export function computeEvidenceHash(record: Omit<EvidenceRecord, "current_evidence_hash" | "signature">): string {
  const fields = hashInputFields(record as unknown as Record<string, unknown>);
  const canonical = canonicalize(fields);
  const previousHash = record.previous_evidence_hash ?? "";
  return sha256(canonical + previousHash);
}

/**
 * Verify that a record's `current_evidence_hash` matches recomputation.
 */
export function verifyRecordHash(record: EvidenceRecord): boolean {
  const fields = hashInputFields(record as unknown as Record<string, unknown>);
  const canonical = canonicalize(fields);
  const previousHash = record.previous_evidence_hash ?? "";
  const expected = sha256(canonical + previousHash);
  return record.current_evidence_hash === expected;
}
