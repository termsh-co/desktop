import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearSessionActivity,
  getSessionActivity,
  resetSessionActivityForTests,
  touchSessionActivity,
} from "./session-activity";

describe("session activity", () => {
  beforeEach(() => {
    resetSessionActivityForTests();
  });

  afterEach(() => {
    resetSessionActivityForTests();
  });

  it("tracks and clears session activity", () => {
    touchSessionActivity("s1", 1000);
    expect(getSessionActivity("s1")).toBe(1000);
    clearSessionActivity("s1");
    expect(getSessionActivity("s1")).toBeUndefined();
  });
});
