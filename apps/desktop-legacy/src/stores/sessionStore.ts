import { create } from "zustand";
import type { Host, RemoteProtocol, Session, SessionKind } from "@termsh/shared";
import { remoteDisconnectHost } from "@/lib/remote/ipc";
import { disposeBackendSession } from "@/lib/terminal/ipc";
import { isTauriRuntime } from "@/lib/env";
import {
  clearSessionActivity,
  touchSessionActivity,
} from "@/lib/session/activity";
import { useTerminalStreamStore } from "@/stores/terminalStreamStore";

function newSession(kind: SessionKind, title: string, hostId?: string): Session {
  return {
    id: crypto.randomUUID(),
    kind,
    title,
    hostId,
    sshPhase: kind === "ssh" ? "connecting" : undefined,
    remotePhase: kind === "remote" ? "connecting" : undefined,
    remoteProtocol: kind === "remote" ? "sftp" : undefined,
    remotePath: kind === "remote" ? "/" : undefined,
  };
}

type SessionState = {
  sessions: Session[];
  activeSessionId: string | null;
  openLocalShell: () => void;
  openSshSession: (host: Host) => void;
  openRemoteSession: (host: Host, protocol?: RemoteProtocol) => void;
  markSshConnecting: (sessionId: string) => void;
  markSshReady: (sessionId: string) => void;
  markSshFailed: (sessionId: string, error: string) => void;
  markRemoteConnecting: (sessionId: string) => void;
  markRemoteReady: (sessionId: string) => void;
  markRemoteFailed: (sessionId: string, error: string) => void;
  setRemotePath: (sessionId: string, path: string) => void;
  closeSession: (id: string) => Promise<void>;
  setActiveSession: (id: string) => void;
};

type SessionPatch = Partial<
  Pick<Session, "sshPhase" | "sshError" | "remotePhase" | "remoteError" | "remotePath">
>;

function patchSession(sessions: Session[], sessionId: string, patch: SessionPatch): Session[] {
  return sessions.map((s) => (s.id === sessionId ? { ...s, ...patch } : s));
}

function isTerminalBackendSession(session: Session): boolean {
  return session.kind === "local" || session.kind === "ssh";
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSessionId: null,

  openLocalShell: () => {
    const session = newSession("local", "Local");
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    }));
  },

  openSshSession: (host) => {
    const existing = get().sessions.find((s) => s.hostId === host.id && s.kind === "ssh");
    if (existing) {
      if (existing.sshPhase === "ready") {
        touchSessionActivity(existing.id);
        set({ activeSessionId: existing.id });
        return;
      }
      set((state) => ({
        activeSessionId: existing.id,
        sessions: patchSession(state.sessions, existing.id, {
          sshPhase: "connecting",
          sshError: undefined,
        }),
      }));
      return;
    }
    const session = newSession("ssh", host.name, host.id);
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    }));
  },

  openRemoteSession: (host, protocol = "sftp") => {
    const existing = get().sessions.find((s) => s.hostId === host.id && s.kind === "remote");
    if (existing) {
      if (existing.remotePhase === "ready") {
        touchSessionActivity(existing.id);
      }
      set({ activeSessionId: existing.id });
      return;
    }
    const session: Session = {
      ...newSession("remote", host.name, host.id),
      remoteProtocol: protocol,
    };
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    }));
  },

  markSshConnecting: (sessionId) => {
    set((state) => ({
      sessions: patchSession(state.sessions, sessionId, {
        sshPhase: "connecting",
        sshError: undefined,
      }),
    }));
  },

  markSshReady: (sessionId) => {
    touchSessionActivity(sessionId);
    set((state) => ({
      sessions: patchSession(state.sessions, sessionId, {
        sshPhase: "ready",
        sshError: undefined,
      }),
    }));
  },

  markSshFailed: (sessionId, error) => {
    set((state) => ({
      sessions: patchSession(state.sessions, sessionId, {
        sshPhase: "failed",
        sshError: error,
      }),
    }));
  },

  markRemoteConnecting: (sessionId) => {
    set((state) => ({
      sessions: patchSession(state.sessions, sessionId, {
        remotePhase: "connecting",
        remoteError: undefined,
      }),
    }));
  },

  markRemoteReady: (sessionId) => {
    touchSessionActivity(sessionId);
    set((state) => ({
      sessions: patchSession(state.sessions, sessionId, {
        remotePhase: "ready",
        remoteError: undefined,
      }),
    }));
  },

  markRemoteFailed: (sessionId, error) => {
    set((state) => ({
      sessions: patchSession(state.sessions, sessionId, {
        remotePhase: "failed",
        remoteError: error,
      }),
    }));
  },

  setRemotePath: (sessionId, path) => {
    set((state) => ({
      sessions: patchSession(state.sessions, sessionId, { remotePath: path }),
    }));
  },

  closeSession: async (id) => {
    const session = get().sessions.find((s) => s.id === id);
    if (session && isTerminalBackendSession(session)) {
      await disposeBackendSession(id);
      useTerminalStreamStore.getState().clearSession(id);
      clearSessionActivity(id);
    }

    if (session?.kind === "remote" && session.hostId && isTauriRuntime()) {
      const stillRemoteForHost = get().sessions.some(
        (s) => s.id !== id && s.kind === "remote" && s.hostId === session.hostId,
      );
      if (!stillRemoteForHost) {
        try {
          await remoteDisconnectHost(session.hostId);
        } catch {
          // Pool zaten kapalı olabilir.
        }
      }
    }

    const { sessions, activeSessionId } = get();
    const next = sessions.filter((s) => s.id !== id);
    let nextActive = activeSessionId;
    if (activeSessionId === id) {
      const closedIndex = sessions.findIndex((s) => s.id === id);
      const neighbor = next[closedIndex] ?? next[closedIndex - 1];
      nextActive = neighbor?.id ?? null;
    }
    set({ sessions: next, activeSessionId: nextActive });
  },

  setActiveSession: (id) => set({ activeSessionId: id }),
}));

/** @internal Test helper */
export function resetSessionStore() {
  useSessionStore.setState({ sessions: [], activeSessionId: null });
}
