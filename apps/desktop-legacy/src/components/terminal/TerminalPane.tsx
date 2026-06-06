import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useTerminalLayoutStore } from "@/stores/terminalLayoutStore";
import { SplitPaneBar } from "@/components/terminal/SplitPaneBar";
import { SshConnectScreen } from "@/components/terminal/SshConnectScreen";
import { XtermTerminal } from "@/components/terminal/XtermTerminal";

export function TerminalPane() {
  const { t } = useTranslation("terminal");
  const allSessions = useSessionStore((s) => s.sessions);
  const sessions = allSessions.filter((s) => s.kind !== "remote");
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const splitMode = useTerminalLayoutStore((s) => s.splitMode);
  const secondarySessionId = useTerminalLayoutStore((s) => s.secondarySessionId);
  const setSecondarySessionId = useTerminalLayoutStore((s) => s.setSecondarySessionId);
  const [mountedTerminalIds, setMountedTerminalIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!activeSessionId) return;
    setMountedTerminalIds((prev) => {
      if (prev.has(activeSessionId)) return prev;
      const next = new Set(prev);
      next.add(activeSessionId);
      return next;
    });
  }, [activeSessionId]);

  useEffect(() => {
    if (splitMode === "off" || !activeSessionId) return;
    const valid =
      secondarySessionId &&
      secondarySessionId !== activeSessionId &&
      sessions.some((s) => s.id === secondarySessionId);
    if (valid) return;
    const pick = sessions.find((s) => s.kind !== "remote" && s.id !== activeSessionId)?.id ?? null;
    if (pick !== secondarySessionId) {
      setSecondarySessionId(pick);
    }
  }, [splitMode, activeSessionId, secondarySessionId, sessions, setSecondarySessionId]);

  useEffect(() => {
    if (splitMode === "off") return;
    if (!secondarySessionId) return;
    setMountedTerminalIds((prev) => {
      if (prev.has(secondarySessionId)) return prev;
      const next = new Set(prev);
      next.add(secondarySessionId);
      return next;
    });
  }, [splitMode, secondarySessionId]);

  useEffect(() => {
    setMountedTerminalIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const s of allSessions) {
        if (s.kind === "remote") continue;
        const shouldMount =
          s.kind === "local" ||
          s.sshPhase === "ready" ||
          s.sshPhase === "connecting" ||
          s.sshPhase === "failed";
        if (shouldMount && !next.has(s.id)) {
          next.add(s.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [allSessions]);

  const openTerminal = () => {
    useSessionStore.getState().openLocalShell();
    useNavStore.getState().setView("terminal");
  };

  if (sessions.length === 0) {
    return (
      <div className="terminal terminal--idle">
        <p className="terminal__hint">{t("idle.hint")}</p>
        <button type="button" className="btn btn--primary" onClick={openTerminal}>
          {t("idle.openTerminal")}
        </button>
      </div>
    );
  }

  const splitEnabled =
    splitMode !== "off" &&
    Boolean(activeSessionId) &&
    Boolean(secondarySessionId) &&
    secondarySessionId !== activeSessionId;

  const primary = sessions.find((s) => s.id === activeSessionId) ?? null;
  const secondary = sessions.find((s) => s.id === secondarySessionId) ?? null;
  const secondaryOptions = sessions.filter((s) => s.kind !== "remote" && s.id !== activeSessionId);

  const onSecondaryPick = (id: string) => {
    setSecondarySessionId(id);
    setMountedTerminalIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const renderSession = (sessionId: string, focusOnActive: boolean) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;
    const active = true;
    const sshConnecting = session.kind === "ssh" && session.sshPhase === "connecting";
    const sshReady = session.kind === "ssh" && session.sshPhase === "ready";
    const sshFailed = session.kind === "ssh" && session.sshPhase === "failed";

    if (!mountedTerminalIds.has(session.id)) return null;

    if (session.kind === "ssh" && (sshConnecting || sshReady)) {
      return (
        <div key={session.id} className="terminal-session terminal-session--active">
          <XtermTerminal
            sessionId={session.id}
            kind={session.kind}
            hostId={session.hostId}
            active={active}
            focusOnActive={focusOnActive}
            listenOnly={sshConnecting}
            backendReady={sshReady}
          />
          {sshConnecting && (
            <SshConnectScreen session={session} active={active} />
          )}
        </div>
      );
    }

    if (sshFailed) {
      return (
        <div key={session.id} className="terminal-session terminal-session--active">
          <SshConnectScreen session={session} active={active} />
        </div>
      );
    }

    if (session.kind === "ssh") return null;

    return (
      <XtermTerminal
        key={session.id}
        sessionId={session.id}
        kind={session.kind}
        hostId={session.hostId}
        active={active}
        focusOnActive={focusOnActive}
      />
    );
  };

  if (splitEnabled && primary && secondary) {
    return (
      <div className={`terminal terminal-split terminal-split--${splitMode}`}>
        <div className="terminal-split__pane">
          <SplitPaneBar role="primary" session={primary} />
          <div className="terminal-split__body">{renderSession(primary.id, true)}</div>
        </div>
        <div className="terminal-split__divider" aria-hidden />
        <div className="terminal-split__pane">
          <SplitPaneBar
            role="secondary"
            session={secondary}
            secondaryOptions={secondaryOptions}
            secondarySessionId={secondarySessionId}
            onSecondaryChange={onSecondaryPick}
          />
          <div className="terminal-split__body">{renderSession(secondary.id, false)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal">
      {sessions.map((session) => {
        if (session.kind === "remote") return null;
        const active = session.id === activeSessionId;
        const sshConnecting = session.kind === "ssh" && session.sshPhase === "connecting";
        const sshReady = session.kind === "ssh" && session.sshPhase === "ready";
        const sshFailed = session.kind === "ssh" && session.sshPhase === "failed";

        if (!mountedTerminalIds.has(session.id)) {
          return null;
        }

        if (session.kind === "ssh" && (sshConnecting || sshReady)) {
          return (
            <div
              key={session.id}
              className={`terminal-session ${active ? "terminal-session--active" : ""}`}
            >
              <XtermTerminal
                sessionId={session.id}
                kind={session.kind}
                hostId={session.hostId}
                active={active}
                listenOnly={sshConnecting}
                backendReady={sshReady}
              />
              {sshConnecting && active && (
                <SshConnectScreen session={session} active={active} />
              )}
            </div>
          );
        }

        if (sshFailed) {
          return (
            <div
              key={session.id}
              className={`terminal-session ${active ? "terminal-session--active" : ""}`}
            >
              <SshConnectScreen session={session} active={active} />
            </div>
          );
        }

        if (session.kind === "ssh") {
          return null;
        }

        return (
          <XtermTerminal
            key={session.id}
            sessionId={session.id}
            kind={session.kind}
            hostId={session.hostId}
            active={active}
          />
        );
      })}
    </div>
  );
}
