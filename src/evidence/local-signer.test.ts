import { describe, it, expect } from "vitest";
import { LocalSigner } from "./local-signer.js";
import { randomBytes } from "node:crypto";

describe("LocalSigner", () => {
  it("generates a keypair when no seed is provided", async () => {
    const signer = new LocalSigner();
    const pubKey = await signer.getPublicKey();
    expect(pubKey).toBeInstanceOf(Uint8Array);
    expect(pubKey.length).toBe(32);
  });

  it("derives consistent key from seed", async () => {
    const seed = randomBytes(32);
    const signer1 = new LocalSigner(seed);
    const signer2 = new LocalSigner(seed);
    const key1 = await signer1.getKeyId();
    const key2 = await signer2.getKeyId();
    expect(key1).toBe(key2);
  });

  it("accepts base64-encoded seed string", async () => {
    const seed = randomBytes(32).toString("base64");
    const signer = new LocalSigner(seed);
    const pubKey = await signer.getPublicKey();
    expect(pubKey.length).toBe(32);
  });

  it("rejects seed with wrong length", () => {
    expect(() => new LocalSigner(Buffer.alloc(16))).toThrow("32 bytes");
  });

  it("returns Ed25519 algorithm", () => {
    const signer = new LocalSigner();
    expect(signer.getAlgorithm()).toBe("Ed25519");
  });

  it("signs and verifies a payload (acceptance criteria #3a)", async () => {
    const signer = new LocalSigner();
    const hashHex = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

    const bundle = await signer.signHash(hashHex);
    const pubKey = await signer.getPublicKey();

    expect(bundle.algorithm).toBe("Ed25519");
    expect(bundle.key_id).toBeTruthy();

    // Verify succeeds with correct data
    const valid = LocalSigner.verifySignature(hashHex, bundle.value, pubKey);
    expect(valid).toBe(true);
  });

  it("rejects modified payload (acceptance criteria #3b)", async () => {
    const signer = new LocalSigner();
    const hashHex = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    const bundle = await signer.signHash(hashHex);
    const pubKey = await signer.getPublicKey();

    // Modify the hash — verification must fail
    const tamperedHash = "0000000000000000000000000000000000000000000000000000000000000000";
    const valid = LocalSigner.verifySignature(tamperedHash, bundle.value, pubKey);
    expect(valid).toBe(false);
  });

  it("verifies with rotated key (acceptance criteria #3c)", async () => {
    // Sign with key A
    const signerA = new LocalSigner();
    const hashHex = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
    const bundleA = await signerA.signHash(hashHex);
    const pubKeyA = await signerA.getPublicKey();

    // Create a new key B (simulating rotation)
    const signerB = new LocalSigner();
    const pubKeyB = await signerB.getPublicKey();

    // Old signature still verifies with old key
    expect(LocalSigner.verifySignature(hashHex, bundleA.value, pubKeyA)).toBe(true);

    // Old signature does NOT verify with new key
    expect(LocalSigner.verifySignature(hashHex, bundleA.value, pubKeyB)).toBe(false);

    // New key can sign its own records
    const bundleB = await signerB.signHash(hashHex);
    expect(LocalSigner.verifySignature(hashHex, bundleB.value, pubKeyB)).toBe(true);
  });

  it("key_id is base64url-encoded SHA-256 of public key", async () => {
    const signer = new LocalSigner();
    const keyId = await signer.getKeyId();
    // base64url: no +, /, or = padding
    expect(keyId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(keyId.length).toBe(43); // SHA-256 = 32 bytes → 43 chars base64url (no padding)
  });
});
