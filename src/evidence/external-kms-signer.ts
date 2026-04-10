/**
 * ExternalKMSSigner: stub interface for external Key Management Systems.
 *
 * This is a placeholder for future integration with:
 * - AWS KMS (Ed25519 signing keys)
 * - GCP Cloud KMS
 * - HashiCorp Vault (Transit secrets engine)
 * - PKCS#11 HSM (via node-pkcs11 or similar)
 *
 * See docs/evidence/SIGNING.md for the integration guide.
 *
 * To implement: extend this class and provide real sign() / getPublicKey() methods
 * that delegate to the KMS API. The interface is designed so that no refactoring
 * of the evidence layer is needed — just swap the Signer implementation.
 */

import type { Signer } from "./signer.js";

export class ExternalKMSSigner implements Signer {
  constructor(_config: ExternalKMSConfig) {
    // Config is accepted but not used in the stub.
  }

  async sign(_payload: Uint8Array): Promise<Uint8Array> {
    throw new Error(
      "ExternalKMSSigner is not implemented. " +
      "See docs/evidence/SIGNING.md for integration guide."
    );
  }

  async getPublicKey(): Promise<Uint8Array> {
    throw new Error(
      "ExternalKMSSigner is not implemented. " +
      "See docs/evidence/SIGNING.md for integration guide."
    );
  }

  async getKeyId(): Promise<string> {
    throw new Error(
      "ExternalKMSSigner is not implemented. " +
      "See docs/evidence/SIGNING.md for integration guide."
    );
  }

  getAlgorithm(): string {
    return "Ed25519";
  }
}

/**
 * Configuration for external KMS integrations.
 * Each provider will need different fields; this is the union type.
 */
export interface ExternalKMSConfig {
  provider: "aws_kms" | "gcp_kms" | "hashicorp_vault" | "pkcs11";
  /** AWS KMS key ARN, GCP key resource name, Vault key name, or PKCS#11 slot config. */
  keyIdentifier: string;
  /** Provider-specific options. */
  options?: Record<string, unknown>;
}
