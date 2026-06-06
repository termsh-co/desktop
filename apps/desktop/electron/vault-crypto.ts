import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";
import { Algorithm, hashRawSync } from "@node-rs/argon2";

/** Matches termsh-core: Argon2id m=19456 KiB, t=2, p=1 → 32-byte key. */
export function deriveMasterKey(password: string, salt: Buffer): Buffer {
  return hashRawSync(password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
    salt,
  });
}

/** AES-256-GCM: [12-byte nonce][ciphertext+tag] — same layout as termsh-core. */
export function encryptBlob(key: Buffer, plaintext: Buffer): Buffer {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([nonce, enc, tag]);
}

export function decryptBlob(key: Buffer, blob: Buffer): Buffer {
  if (blob.length < 12 + 16) throw new Error("Invalid encrypted blob");
  const nonce = blob.subarray(0, 12);
  const tag = blob.subarray(blob.length - 16);
  const ciphertext = blob.subarray(12, blob.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function constantTimeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const VERIFIER_PLAINTEXT = Buffer.from("TERMSH_VAULT_V1", "utf8");

export function makeVerifier(key: Buffer): Buffer {
  return encryptBlob(key, VERIFIER_PLAINTEXT);
}

export function checkVerifier(key: Buffer, verifier: Buffer): boolean {
  try {
    const plain = decryptBlob(key, verifier);
    return constantTimeEqual(plain, VERIFIER_PLAINTEXT);
  } catch {
    return false;
  }
}
