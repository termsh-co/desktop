import { useTranslation } from "react-i18next";
import { NewSessionMenu } from "@/components/layout/NewSessionMenu";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { Session } from "@termsh/shared";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useTerminalLayoutStore } from "@/stores/terminalLayoutStore";

function sessionIcon(session: Session): IconName {
  if (session.kind === "local") return "laptop";
  if (session.kind === "remote") return "folder";
  return "terminal";
}

function sessionTabLabel(session: Session): string {
  if (session.kind !== "remote") return session.title;
  const protocol = (session.remoteProtocol ?? "sftp").toUpperCase();
  return `${session.title} · ${protocol}`;
}

export function SessionTabBar() {
  const { t } = useTranslation("session");
  const setView = useNavStore((s) => s.setView);
  const view = useNavStore((s) => s.view);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const closeSession = useSessionStore((s) => s.closeSession);
  const openLocalShell = useSessionStore((s) => s.openLocalShell);
  const splitMode = useTerminalLayoutStore((s) => s.splitMode);
  const toggleSplitMode = useTerminalLayoutStore((s) => s.toggleSplitMode);
  const terminalSessions = sessions.filter((s) => s.kind !== "remote");

  const goTerminal = () => setView("terminal");
  const goHome = () => setView("hosts");

  const onTerminal = () => {
    if (sessions.length === 0) {
      openLocalShell();
    }
    goTerminal();
  };

  const openSession = (sessionId: string) => {
    setActiveSession(sessionId);
    goTerminal();
  };

  const onClose = async (sessionId: string) => {
    const remaining = sessions.filter((s) => s.id !== sessionId);
    await closeSession(sessionId);
    if (remaining.length > 0) {
      goTerminal();
    } else {
      goHome();
    }
  };

  const inSessionView = view === "terminal";

  const splitTitle =
    splitMode === "off"
      ? t("splitOff")
      : splitMode === "vertical"
        ? t("splitVertical")
        : t("splitHorizontal");

  return (
    <div className="session-bar" aria-label={t("tabBarAria")}>
      <button
        type="button"
        className={`session-bar__terminal ${inSessionView ? "session-bar__terminal--active" : ""} ${
          sessions.length > 0 ? "session-bar__terminal--compact" : ""
        }`}
        onClick={onTerminal}
        title={t("terminalTitle")}
      >
        <Icon name="terminal" size={15} />
        <span className="session-bar__terminal-label">{t("terminal")}</span>
        {sessions.length > 0 && <span className="session-bar__badge">{sessions.length}</span>}
      </button>

      <div className="session-bar__cluster">
        <nav className="session-bar__tabs mac-scrollbar" role="tablist" aria-label={t("openSessionsAria")}>
          {sessions.map((session) => {
            const active = inSessionView && session.id === activeSessionId;
            return (
              <div key={session.id} className={`session-tab ${active ? "session-tab--active" : ""}`}>
                <button
                  type="button"
                  role="tab"
                  className="session-tab__label"
                  aria-selected={active}
                  onClick={() => openSession(session.id)}
                  title={sessionTabLabel(session)}
                >
                  <Icon name={sessionIcon(session)} size={13} />
                  <span>{sessionTabLabel(session)}</span>
                </button>
                <button
                  type="button"
                  className="session-tab__close"
                  onClick={() => void onClose(session.id)}
                  aria-label={t("closeSession")}
                  title={t("common:actions.close")}
                >
                  ×
                </button>
              </div>
            );
          })}
        </nav>

        <NewSessionMenu placement="above" />

        {inSessionView && terminalSessions.length >= 2 && (
          <button
            type="button"
            className="session-tab session-tab__aux"
            onClick={toggleSplitMode}
            title={splitTitle}
            aria-label={t("splitAria")}
          >
            <Icon
              name={splitMode === "horizontal" ? "split_horizontal" : "split_vertical"}
              size={14}
            />
          </button>
        )}
      </div>
    </div>
  );
}
