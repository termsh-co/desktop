import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import {
  closeSession,
  decodeTerminalData,
  disposeBackendSession,
  spawnLocalShell,
  spawnSshShell,
  terminalResize,
  terminalWrite,
} from "./ipc";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  emit: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);
const mockedEmit = vi.mocked(emit);

describe("terminal ipc", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
    mockedInvoke.mockResolvedValue(undefined);
    mockedEmit.mockReset();
    mockedEmit.mockResolvedValue(undefined);
  });

  it("spawnLocalShell invokes with session geometry", async () => {
    await spawnLocalShell("session-1", 120, 40);
    expect(mockedInvoke).toHaveBeenCalledWith("spawn_local_shell", {
      sessionId: "session-1",
      cols: 120,
      rows: 40,
    });
  });

  it("spawnSshShell invokes with host id", async () => {
    await spawnSshShell("session-2", "host-abc", 100, 30);
    expect(mockedInvoke).toHaveBeenCalledWith("spawn_ssh_shell", {
      sessionId: "session-2",
      hostId: "host-abc",
      cols: 100,
      rows: 30,
      connectPassword: null,
    });
  });

  it("terminalWrite emits stdin payload", () => {
    terminalWrite("session-1", "ls\n");
    expect(mockedEmit).toHaveBeenCalledWith("terminal-write", {
      sessionId: "session-1",
      data: "ls\n",
    });
  });

  it("terminalResize emits dimensions", () => {
    terminalResize("session-1", 100, 30);
    expect(mockedEmit).toHaveBeenCalledWith("terminal-resize", {
      sessionId: "session-1",
      cols: 100,
      rows: 30,
    });
  });

  it("closeSession invokes close_session", async () => {
    await closeSession("session-1");
    expect(mockedInvoke).toHaveBeenCalledWith("close_session", { sessionId: "session-1" });
  });

  it("disposeBackendSession swallows invoke errors", async () => {
    mockedInvoke.mockRejectedValueOnce(new Error("already closed"));
    await expect(disposeBackendSession("session-1")).resolves.toBeUndefined();
  });

  it("decodeTerminalData decodes base64 bytes", () => {
    const encoded = btoa("hello");
    const bytes = decodeTerminalData(encoded);
    expect(new TextDecoder().decode(bytes)).toBe("hello");
  });

  it("decodeTerminalData handles empty payload", () => {
    const bytes = decodeTerminalData(btoa(""));
    expect(bytes.length).toBe(0);
  });
});
