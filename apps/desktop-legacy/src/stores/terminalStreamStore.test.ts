import { beforeEach, describe, expect, it } from "vitest";
import { resetTerminalStreamStore, useTerminalStreamStore } from "./terminalStreamStore";

describe("terminalStreamStore", () => {
  beforeEach(() => {
    resetTerminalStreamStore();
  });

  it("buffers output when no listener is subscribed", () => {
    useTerminalStreamStore.getState().push("s1", "aGVsbG8=");
    expect(useTerminalStreamStore.getState().pending.s1).toEqual(["aGVsbG8="]);
  });

  it("replays buffered output on subscribe", () => {
    useTerminalStreamStore.getState().push("s1", "aGVsbG8=");
    const received: string[] = [];
    useTerminalStreamStore.getState().subscribe("s1", (chunk) => {
      received.push(chunk);
    });
    expect(received).toEqual(["aGVsbG8="]);
    expect(useTerminalStreamStore.getState().pending.s1).toBeUndefined();
  });

  it("delivers live output to active listener", () => {
    const received: string[] = [];
    useTerminalStreamStore.getState().subscribe("s1", (chunk) => {
      received.push(chunk);
    });
    useTerminalStreamStore.getState().push("s1", "d29ybGQ=");
    expect(received).toEqual(["d29ybGQ="]);
  });
});
