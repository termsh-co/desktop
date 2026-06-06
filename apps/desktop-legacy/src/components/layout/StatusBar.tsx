import { useTranslation } from "react-i18next";
import { useHostStore } from "@/stores/hostStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useSyncStore } from "@/stores/syncStore";
import { useVaultStore } from "@/stores/vaultStore";

export function StatusBar() {
  const { t } = useTranslation("common");
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const hosts = useHostStore((s) => s.hosts);
  const vaultStatus = useVaultStore((s) => s.status);
  const syncStatus = useSyncStore((s) => s.status);
  const syncEnabled = useSyncStore((s) => s.enabled);

  const active = sessions.find((s) => s.id === activeSessionId);
  const activeHost =
    active?.hostId && (active.kind === "ssh" || active.kind === "remote")
      ? hosts.find((h) => h.id === active.hostId)
      : null;

  const conn =
    active?.kind === "ssh" && activeHost
      ? t("status.ssh", { user: activeHost.username, host: activeHost.hostname })
      : active?.kind === "remote" && activeHost
        ? t("status.remote", {
            protocol: (active.remoteProtocol ?? "sftp").toUpperCase(),
            user: activeHost.username,
            host: activeHost.hostname,
          })
        : active?.kind === "local"
          ? t("status.local")
          : t("status.disconnected");

  const vault = !vaultStatus?.isSetup
    ? t("status.vaultNone")
    : vaultStatus.isUnlocked
      ? t("status.vaultUnlocked")
      : t("status.vaultLocked");

  const syncLabel = syncEnabled
    ? syncStatus?.connected
      ? t("status.syncConnected", { email: syncStatus.email ?? "—" })
      : t("status.syncNoConnection")
    : t("status.syncOff");

  return (
    <footer className="status-bar" aria-live="polite">
      <span className="status-bar__item">{conn}</span>
      <span className="status-bar__sep" />
      <span className="status-bar__item">{t("status.sessions", { count: sessions.length })}</span>
      <span className="status-bar__sep" />
      <span className="status-bar__item">{vault}</span>
      <span className="status-bar__sep" />
      <span className="status-bar__item status-bar__muted">{t("status.hosts", { count: hosts.length })}</span>
      <span className="status-bar__sep" />
      <span className="status-bar__item status-bar__muted">{syncLabel}</span>
    </footer>
  );
}
