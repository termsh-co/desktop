import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sshIdleTimeoutMs } from "@/lib/settings/sshIdle";
import {
  clearSessionActivity,
  getSessionActivity,
  resetSessionActivityForTests,
  touchSessionActivity,
} from "@/lib/session/activity";

describe("ssh idle helpers", () => {
  beforeEach(() => {
    resetSessionActivityForTests();
  });

  afterEach(() => {
    resetSessionActivityForTests();
  });

  it("sshIdleTimeoutMs converts minutes", () => {
    expect(sshIdleTimeoutMs(30)).toBe(30 * 60 * 1000);
    expect(sshIdleTimeoutMs(0)).toBe(0);
  });

  it("tracks and clears session activity", () => {
    touchSessionActivity("s1", 1000);
    expect(getSessionActivity("s1")).toBe(1000);
    clearSessionActivity("s1");
    expect(getSessionActivity("s1")).toBeUndefined();
  });
});
