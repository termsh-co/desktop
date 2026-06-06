import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type KeyAlgorithm = "ed25519" | "rsa";

export function generateSshKeyPair(algorithm: KeyAlgorithm): {
  privatePem: string;
  publicPem: string;
} {
  const dir = mkdtempSync(join(tmpdir(), "termsh-keygen-"));
  const keyPath = join(dir, "id_termsh");
  try {
    const args =
      algorithm === "ed25519"
        ? ["-t", "ed25519", "-f", keyPath, "-N", "", "-q"]
        : ["-t", "rsa", "-b", "4096", "-f", keyPath, "-N", "", "-q"];
    execFileSync("ssh-keygen", args, { stdio: "pipe" });
    const privatePem = readFileSync(keyPath, "utf8");
    const publicPem = readFileSync(`${keyPath}.pub`, "utf8").trim();
    return { privatePem, publicPem };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
