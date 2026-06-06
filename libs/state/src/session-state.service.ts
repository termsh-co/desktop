import { Injectable, inject } from "@angular/core";
import type { Host, Session, SessionKind } from "@termsh/common";
import { TermshPlatformService } from "@termsh/platform";
import { BehaviorSubject } from "rxjs";
import { clearSessionActivity, touchSessionActivity } from "./session-activity";

function newSession(kind: SessionKind, title: string, hostId?: string): Session {
  return {
    id: crypto.randomUUID(),
    kind,
    title,
    hostId,
    sshPhase: kind === "ssh" ? "connecting" : undefined,
  };
}

@Injectable({ providedIn: "root" })
export class SessionStateService {
  private readonly platform = inject(TermshPlatformService);
  private readonly sessions$ = new BehaviorSubject<Session[]>([]);
  private readonly activeSessionId$ = new BehaviorSubject<string | null>(null);

  readonly sessionsStream$ = this.sessions$.asObservable();
  readonly activeSessionIdStream$ = this.activeSessionId$.asObservable();

  get sessions(): Session[] {
    return this.sessions$.value;
  }

  get activeSessionId(): string | null {
    return this.activeSessionId$.value;
  }

  private patchSession(sessionId: string, patch: Partial<Session>) {
    this.sessions$.next(
      this.sessions$.value.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)),
    );
  }

  openLocalShell() {
    const session = newSession("local", "Local");
    this.sessions$.next([...this.sessions$.value, session]);
    this.activeSessionId$.next(session.id);
  }

  openRemoteSession(host: Host) {
    const existing = this.sessions$.value.find((s) => s.hostId === host.id && s.kind === "remote");
    if (existing) {
      this.activeSessionId$.next(existing.id);
      return;
    }
    const session: Session = {
      ...newSession("remote", host.name, host.id),
      remoteProtocol: "sftp",
      remotePhase: "connecting",
      remotePath: "/",
    };
    this.sessions$.next([...this.sessions$.value, session]);
    this.activeSessionId$.next(session.id);
  }

  openSshSession(host: Host) {
    const existing = this.sessions$.value.find((s) => s.hostId === host.id && s.kind === "ssh");
    if (existing) {
      this.activeSessionId$.next(existing.id);
      if (existing.sshPhase === "failed") {
        this.patchSession(existing.id, { sshPhase: "connecting", sshError: undefined });
      }
      return;
    }
    const session = newSession("ssh", host.name, host.id);
    this.sessions$.next([...this.sessions$.value, session]);
    this.activeSessionId$.next(session.id);
  }

  markSshConnecting(sessionId: string) {
    this.patchSession(sessionId, { sshPhase: "connecting", sshError: undefined });
  }

  markSshReady(sessionId: string) {
    touchSessionActivity(sessionId);
    this.patchSession(sessionId, { sshPhase: "ready", sshError: undefined });
  }

  markSshFailed(sessionId: string, error: string) {
    this.patchSession(sessionId, { sshPhase: "failed", sshError: error });
  }

  markRemoteConnecting(sessionId: string) {
    this.patchSession(sessionId, { remotePhase: "connecting", remoteError: undefined });
  }

  markRemoteReady(sessionId: string) {
    this.patchSession(sessionId, { remotePhase: "ready", remoteError: undefined });
  }

  markRemoteFailed(sessionId: string, error: string) {
    this.patchSession(sessionId, { remotePhase: "failed", remoteError: error });
  }

  setRemotePath(sessionId: string, path: string) {
    this.patchSession(sessionId, { remotePath: path });
  }

  setActiveSession(id: string) {
    this.activeSessionId$.next(id);
  }

  async closeSession(id: string) {
    const session = this.sessions$.value.find((s) => s.id === id);
    if (session && (session.kind === "local" || session.kind === "ssh")) {
      await this.platform.ptyClose(id);
    }
    clearSessionActivity(id);
    const remaining = this.sessions$.value.filter((s) => s.id !== id);
    this.sessions$.next(remaining);
    if (this.activeSessionId$.value === id) {
      this.activeSessionId$.next(remaining[0]?.id ?? null);
    }
  }
}
