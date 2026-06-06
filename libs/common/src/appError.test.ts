import { describe, expect, it } from "vitest";
import { formatAppError, parseAppError } from "./appError";

const t = (key: string) => {
  if (key === "errors.VAULT_LOCKED") return "Vault is locked.";
  if (key === "errors.UNKNOWN") return "Unknown error";
  return key;
};

describe("parseAppError", () => {
  it("parses JSON error payloads", () => {
    const payload = parseAppError('{"code":"VAULT_LOCKED"}');
    expect(payload?.code).toBe("VAULT_LOCKED");
  });

  it("parses TERMSH_ERR terminal payloads", () => {
    const payload = parseAppError('\x1b[31mTERMSH_ERR:{"code":"SSH_TIMEOUT"}\x1b[0m');
    expect(payload?.code).toBe("SSH_TIMEOUT");
  });
});

describe("formatAppError", () => {
  it("translates known codes", () => {
    expect(formatAppError('{"code":"VAULT_LOCKED"}', t)).toBe("Vault is locked.");
  });
});
