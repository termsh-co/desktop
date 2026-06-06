import { describe, expect, it } from "vitest";
import { initI18n } from "@/i18n";
import { formatAppError, parseAppError } from "@/lib/errors/appError";

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
    initI18n("en");
    expect(formatAppError('{"code":"VAULT_LOCKED"}')).toBe("Vault is locked.");
  });
});
