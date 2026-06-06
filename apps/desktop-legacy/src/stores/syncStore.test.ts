import { beforeEach, describe, expect, it, vi } from "vitest";
import { initI18n } from "@/i18n";
import { useSyncStore } from "@/stores/syncStore";

vi.mock("@/lib/sync/ipc", () => ({
  syncStatus: vi.fn(),
  syncPull: vi.fn(),
  syncPush: vi.fn(),
  syncDelete: vi.fn(),
}));

import * as syncIpc from "@/lib/sync/ipc";

function resetSyncStore() {
  useSyncStore.setState({
    serverUrl: "",
    accessToken: "",
    enabled: false,
    autoSync: false,
    status: null,
    syncing: false,
    lastResult: null,
    error: null,
  });
}

describe("syncStore", () => {
  beforeEach(() => {
    initI18n("en");
    resetSyncStore();
    vi.clearAllMocks();
  });

  it("has empty defaults", () => {
    const s = useSyncStore.getState();
    expect(s.serverUrl).toBe("");
    expect(s.accessToken).toBe("");
    expect(s.enabled).toBe(false);
    expect(s.autoSync).toBe(false);
  });

  it("setServerUrl updates the url", () => {
    useSyncStore.getState().setServerUrl("https://sync.example.com");
    expect(useSyncStore.getState().serverUrl).toBe("https://sync.example.com");
  });

  it("setAccessToken updates the token", () => {
    useSyncStore.getState().setAccessToken("jwt-token-123");
    expect(useSyncStore.getState().accessToken).toBe("jwt-token-123");
  });

  it("setEnabled toggles sync", () => {
    useSyncStore.getState().setEnabled(true);
    expect(useSyncStore.getState().enabled).toBe(true);
  });

  it("setAutoSync toggles auto sync", () => {
    useSyncStore.getState().setAutoSync(true);
    expect(useSyncStore.getState().autoSync).toBe(true);
  });

  it("checkStatus returns error when no config", async () => {
    await useSyncStore.getState().checkStatus();
    expect(useSyncStore.getState().error).toBe("Server URL and access token are required.");
  });

  it("checkStatus calls syncStatus IPC", async () => {
    vi.mocked(syncIpc.syncStatus).mockResolvedValue({
      connected: true,
      email: "test@example.com",
      lastSyncedAt: null,
      pendingChanges: 0,
    });
    useSyncStore.setState({ serverUrl: "https://s.example.com", accessToken: "t" });
    await useSyncStore.getState().checkStatus();
    expect(syncIpc.syncStatus).toHaveBeenCalled();
    expect(useSyncStore.getState().status?.connected).toBe(true);
  });

  it("triggerPull calls syncPull IPC", async () => {
    vi.mocked(syncIpc.syncPull).mockResolvedValue({ added: 2, updated: 1 });
    useSyncStore.setState({ serverUrl: "https://s.example.com", accessToken: "t" });
    await useSyncStore.getState().triggerPull();
    expect(syncIpc.syncPull).toHaveBeenCalled();
    expect(useSyncStore.getState().lastResult?.added).toBe(2);
  });

  it("triggerPush calls syncPush IPC", async () => {
    vi.mocked(syncIpc.syncPush).mockResolvedValue({ added: 0, updated: 3 });
    useSyncStore.setState({ serverUrl: "https://s.example.com", accessToken: "t" });
    await useSyncStore.getState().triggerPush();
    expect(syncIpc.syncPush).toHaveBeenCalled();
    expect(useSyncStore.getState().lastResult?.updated).toBe(3);
  });

  it("triggerDelete calls syncDelete IPC", async () => {
    vi.mocked(syncIpc.syncDelete).mockResolvedValue(undefined);
    useSyncStore.setState({ serverUrl: "https://s.example.com", accessToken: "t" });
    await useSyncStore.getState().triggerDelete("host", "h1");
    expect(syncIpc.syncDelete).toHaveBeenCalledWith(
      { apiUrl: "https://s.example.com", accessToken: "t" },
      "host",
      "h1",
    );
  });

  it("does not sync when no config", async () => {
    await useSyncStore.getState().triggerPull();
    expect(syncIpc.syncPull).not.toHaveBeenCalled();
  });

  it("skips auto-sync when disabled", async () => {
    vi.mocked(syncIpc.syncPush).mockResolvedValue({ added: 0, updated: 0 });
    vi.mocked(syncIpc.syncPull).mockResolvedValue({ added: 0, updated: 0 });
    useSyncStore.setState({
      serverUrl: "https://s.example.com",
      accessToken: "t",
      enabled: true,
      autoSync: false,
    });
    await useSyncStore.getState().runAutoSync();
    expect(syncIpc.syncPush).not.toHaveBeenCalled();
    expect(syncIpc.syncPull).not.toHaveBeenCalled();
  });
});
