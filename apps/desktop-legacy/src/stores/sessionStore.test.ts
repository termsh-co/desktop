import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { resetSessionStore, useSessionStore } from "./sessionStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe("sessionStore", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
    mockedInvoke.mockResolvedValue(undefined);
    resetSessionStore();
  });

  it("openLocalShell adds a local session and activates it", () => {
    useSessionStore.getState().openLocalShell();
    const { sessions, activeSessionId } = useSessionStore.getState();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.kind).toBe("local");
    expect(sessions[0]?.title).toBe("Local");
    expect(activeSessionId).toBe(sessions[0]?.id);
  });

  it("setActiveSession switches active tab", () => {
    useSessionStore.getState().openLocalShell();
    useSessionStore.getState().openLocalShell();
    const secondId = useSessionStore.getState().sessions[1]?.id;
    useSessionStore.getState().setActiveSession(secondId!);
    expect(useSessionStore.getState().activeSessionId).toBe(secondId);
  });

  it("closeSession disposes backend for terminal sessions", async () => {
    useSessionStore.getState().openLocalShell();
    const id = useSessionStore.getState().sessions[0]!.id;
    await useSessionStore.getState().closeSession(id);
    expect(mockedInvoke).toHaveBeenCalledWith("close_session", { sessionId: id });
    expect(useSessionStore.getState().sessions).toHaveLength(0);
    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });

  it("closeSession does not call backend for remote sessions", async () => {
    const host = {
      id: "host-remote",
      name: "Files",
      hostname: "files.example.com",
      port: 22,
      username: "deploy",
      authType: "password" as const,
      tags: [],
    };
    useSessionStore.getState().openRemoteSession(host);
    const id = useSessionStore.getState().sessions[0]!.id;
    await useSessionStore.getState().closeSession(id);
    expect(mockedInvoke).not.toHaveBeenCalled();
    expect(useSessionStore.getState().sessions).toHaveLength(0);
  });

  it("openRemoteSession reuses tab for same host", () => {
    const host = {
      id: "host-2",
      name: "Storage",
      hostname: "storage.example.com",
      port: 22,
      username: "root",
      authType: "password" as const,
      tags: [],
    };
    useSessionStore.getState().openRemoteSession(host);
    const firstId = useSessionStore.getState().activeSessionId;
    useSessionStore.getState().markRemoteReady(useSessionStore.getState().sessions[0]!.id);
    useSessionStore.getState().openRemoteSession(host);
    expect(useSessionStore.getState().sessions).toHaveLength(1);
    expect(useSessionStore.getState().activeSessionId).toBe(firstId);
    expect(useSessionStore.getState().sessions[0]?.kind).toBe("remote");
  });

  it("openSshSession reuses tab for same host", () => {
    const host = {
      id: "host-1",
      name: "Prod",
      hostname: "prod.example.com",
      port: 22,
      username: "deploy",
      authType: "password" as const,
      tags: [],
    };
    useSessionStore.getState().openSshSession(host);
    const firstId = useSessionStore.getState().activeSessionId;
    const first = useSessionStore.getState().sessions[0];
    expect(first?.sshPhase).toBe("connecting");
    useSessionStore.getState().markSshReady(first!.id);
    useSessionStore.getState().openSshSession(host);
    expect(useSessionStore.getState().sessions).toHaveLength(1);
    expect(useSessionStore.getState().activeSessionId).toBe(firstId);
    expect(useSessionStore.getState().sessions[0]?.sshPhase).toBe("ready");
  });

  it("closeSession selects neighbor tab when active tab closes", async () => {
    useSessionStore.getState().openLocalShell();
    const firstId = useSessionStore.getState().sessions[0]!.id;
    useSessionStore.getState().openLocalShell();
    const secondId = useSessionStore.getState().sessions[1]!.id;
    useSessionStore.getState().setActiveSession(secondId);

    await useSessionStore.getState().closeSession(secondId);

    expect(useSessionStore.getState().activeSessionId).toBe(firstId);
    expect(useSessionStore.getState().sessions).toHaveLength(1);
  });
});
