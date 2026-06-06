import { describe, expect, it } from "vitest";
import { sshIdleTimeoutMs } from "./sshIdle";

describe("sshIdleTimeoutMs", () => {
  it("converts minutes to milliseconds", () => {
    expect(sshIdleTimeoutMs(30)).toBe(30 * 60 * 1000);
    expect(sshIdleTimeoutMs(0)).toBe(0);
  });
});
