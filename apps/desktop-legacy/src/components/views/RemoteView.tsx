import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Host } from "@termsh/shared";
import { RemoteSiteRow } from "@/components/remote/RemoteSiteRow";
import { Icon } from "@/components/ui/Icon";
import { useHostStore } from "@/stores/hostStore";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";

function matchesQuery(host: Host, q: string): boolean {
  if (!q) return true;
  const hay = [host.name, host.hostname, host.username, host.group ?? "", ...host.tags]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function RemoteView() {
  const { t } = useTranslation("remote");
  const hosts = useHostStore((s) => s.hosts);
  const loadHosts = useHostStore((s) => s.load);
  const openHostDrawer = useNavStore((s) => s.openHostDrawer);
  const setView = useNavStore((s) => s.setView);
  const openRemoteSession = useSessionStore((s) => s.openRemoteSession);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (hosts.length === 0) void loadHosts();
  }, [hosts.length, loadHosts]);

  const activeHostId =
    sessions.find((s) => s.id === activeSessionId && s.kind === "remote")?.hostId ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hosts.filter((h) => matchesQuery(h, q));
  }, [hosts, query]);

  const connect = (host: Host) => {
    openRemoteSession(host, "sftp");
    setView("terminal");
  };

  const openEdit = (host: Host, e: MouseEvent) => {
    e.stopPropagation();
    openHostDrawer(host);
  };

  return (
    <div className="view view--hosts">
      <div className="content-toolbar">
        <div className="content-toolbar__search">
          <Icon name="search" size={15} />
          <input
            type="search"
            placeholder={t("view.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />
        </div>
        <button type="button" className="content-toolbar__btn content-toolbar__btn--primary" onClick={() => openHostDrawer(null)}>
          <Icon name="add" size={16} />
          {t("view.addServer")}
        </button>
      </div>

      <div className="host-list mac-scrollbar">
        {hosts.length === 0 && (
          <div className="host-list__empty">
            <p>{t("view.empty")}</p>
            <button type="button" className="btn btn--primary" onClick={() => openHostDrawer(null)}>
              {t("view.addServer")}
            </button>
          </div>
        )}

        {hosts.length > 0 && filtered.length === 0 && (
          <p className="host-list__empty">{t("view.noResults")}</p>
        )}

        {filtered.length > 0 && (
          <ul className="host-list__items">
            {filtered.map((host) => (
              <RemoteSiteRow
                key={host.id}
                host={host}
                active={activeHostId === host.id}
                onConnect={() => connect(host)}
                onEdit={(e) => openEdit(host, e)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
