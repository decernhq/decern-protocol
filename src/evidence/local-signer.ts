/**
 * LocalSigner: Ed25519 signing using Node.js crypto.
 *
 * Algorithm: Ed25519 (RFC 8032). Available in Node.js 18+.
 * Key ID: base64url(SHA-256(publicKey)) per the Signer interface contract.
 *
 * Key format:
 * - Constructor accepts a 32-byte Ed25519 seed (base64-encoded string or Buffer).
 * - If no seed provided, generates a new keypair (useful for testing).
 */

import {
  createHash,
  sign,
  verify,
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
  type KeyObject,
} from "node:crypto";
import type { Signer, SignatureBundle } from "./signer.js";

/** ASN.1 DER prefix for Ed25519 PKCS8 private key wrapping a 32-byte seed (RFC 8410). */
const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
/** ASN.1 DER prefix for Ed25519 SPKI public key (RFC 8410). */
const SPKI_ED25519_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function base64urlEncode(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString("base64url");
}

function computeKeyId(publicKeyRaw: Uint8Array): string {
  const hash = createHash("sha256").update(publicKeyRaw).digest();
  return base64urlEncode(hash);
}

export class LocalSigner implements Signer {
  private readonly privKey: KeyObject;
  private readonly publicKeyRaw: Uint8Array;
  private readonly keyId: string;

  constructor(privateKeySeed?: string | Buffer) {
    if (privateKeySeed) {
      const seedBuf = typeof privateKeySeed === "string"
        ? Buffer.from(privateKeySeed, "base64")
        : privateKeySeed;

      if (seedBuf.length !== 32) {
        throw new Error(`Ed25519 seed must be 32 bytes, got ${seedBuf.length}`);
      }

      const pkcs8Der = Buffer.concat([PKCS8_ED25519_PREFIX, seedBuf]);
      this.privKey = createPrivateKey({ key: pkcs8Der, format: "der", type: "pkcs8" });
      const pubObj = createPublicKey(this.privKey);
      const spki = pubObj.export({ type: "spki", format: "der" }) as Buffer;
      this.publicKeyRaw = new Uint8Array(spki.subarray(-32));
    } else {
      const { publicKey, privateKey } = generateKeyPairSync("ed25519");
      this.privKey = privateKey;
      const spki = publicKey.export({ type: "spki", format: "der" }) as Buffer;
      this.publicKeyRaw = new Uint8Array(spki.subarray(-32));
    }

    this.keyId = computeKeyId(this.publicKeyRaw);
  }

  async sign(payload: Uint8Array): Promise<Uint8Array> {
    const signature = sign(null, payload, this.privKey);
    return new Uint8Array(signature);
  }

  async getPublicKey(): Promise<Uint8Array> {
    return this.publicKeyRaw;
  }

  async getKeyId(): Promise<string> {
    return this.keyId;
  }

  getAlgorithm(): string {
    return "Ed25519";
  }

  /** Sign an evidence hash (hex string) and return a SignatureBundle. */
  async signHash(hashHex: string): Promise<SignatureBundle> {
    const hashBytes = Buffer.from(hashHex, "hex");
    const sig = await this.sign(hashBytes);
    return {
      algorithm: this.getAlgorithm(),
      key_id: await this.getKeyId(),
      value: Buffer.from(sig).toString("base64"),
    };
  }

  /** Verify a signature against a hash and raw 32-byte public key. */
  static verifySignature(hashHex: string, signatureBase64: string, publicKeyRaw: Uint8Array): boolean {
    const hashBytes = Buffer.from(hashHex, "hex");
    const sigBytes = Buffer.from(signatureBase64, "base64");
    const spkiDer = Buffer.concat([SPKI_ED25519_PREFIX, publicKeyRaw]);
    return verify(null, hashBytes, { key: spkiDer, format: "der", type: "spki" }, sigBytes);
  }
}
