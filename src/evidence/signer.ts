/**
 * Signer interface for evidence records.
 *
 * Implementations:
 * - LocalSigner: Ed25519 key from env var or file (SaaS default)
 * - ExternalKMSSigner: stub for AWS KMS, GCP KMS, HashiCorp Vault, PKCS#11 HSM
 *
 * See docs/evidence/SIGNING.md for extension guide.
 */

export interface Signer {
  /** Sign a payload (typically the evidence hash bytes). Returns raw signature bytes. */
  sign(payload: Uint8Array): Promise<Uint8Array>;

  /** Get the Ed25519 public key (32 bytes). */
  getPublicKey(): Promise<Uint8Array>;

  /**
   * Key identifier: base64url(SHA-256(publicKey)).
   * Allows verification without a central key registry.
   */
  getKeyId(): Promise<string>;

  /** Algorithm identifier for the signature field. "Ed25519" for v1. */
  getAlgorithm(): string;
}

export interface SignatureBundle {
  algorithm: string;
  key_id: string;
  /** Base64-encoded signature. */
  value: string;
}
