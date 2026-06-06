import { RemoteExplorerPane } from "@/components/remote/RemoteExplorerPane";
import { TerminalPane } from "@/components/terminal/TerminalPane";
import { useSessionStore } from "@/stores/sessionStore";

export function TerminalView() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const active = sessions.find((s) => s.id === activeSessionId);

  if (active?.kind === "remote") {
    return <RemoteExplorerPane />;
  }

  return (
    <div className="view view--terminal">
      <TerminalPane />
    </div>
  );
}
