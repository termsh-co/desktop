import { type MouseEvent, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Host } from "@termsh/shared";
import { HostTile } from "@/components/hosts/HostTile";
import { ContentToolbar } from "@/components/layout/ContentToolbar";
import { LOCALE_BCP47 } from "@/i18n/locale";
import { useHostStore } from "@/stores/hostStore";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useSettingsStore } from "@/stores/settingsStore";

type Props = {
  onNewHost: () => void;
};

function groupHosts(hosts: Host[], locale: string): { label: string | null; hosts: Host[] }[] {
  const map = new Map<string, Host[]>();
  const ungrouped: Host[] = [];

  for (const host of hosts) {
    const key = host.group?.trim();
    if (!key) {
      ungrouped.push(host);
      continue;
    }
    const list = map.get(key) ?? [];
    list.push(host);
    map.set(key, list);
  }

  const sections: { label: string | null; hosts: Host[] }[] = [];
  if (ungrouped.length > 0) {
    sections.push({ label: null, hosts: ungrouped });
  }
  for (const [label, list] of [...map.entries()].sort(([a], [b]) => a.localeCompare(b, locale))) {
    sections.push({ label, hosts: list });
  }
  return sections;
}

export function HostsPanel({ onNewHost }: Props) {
  const { t } = useTranslation("hosts");
  const locale = useSettingsStore((s) => s.locale);
  const hosts = useHostStore((s) => s.hosts);
  const openHostDrawer = useNavStore((s) => s.openHostDrawer);
  const openSshSession = useSessionStore((s) => s.openSshSession);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const setView = useNavStore((s) => s.setView);

  const activeHostId =
    sessions.find((s) => s.id === activeSessionId && s.kind === "ssh")?.hostId ?? null;

  const sections = useMemo(
    () => groupHosts(hosts, LOCALE_BCP47[locale]),
    [hosts, locale],
  );

  const connect = (host: Host) => {
    openSshSession(host);
    setView("terminal");
  };

  const openEdit = (host: Host, e: MouseEvent) => {
    e.stopPropagation();
    openHostDrawer(host);
  };

  return (
    <div className="view view--hosts">
      <ContentToolbar onNewHost={onNewHost} />

      <div className="host-list mac-scrollbar">
        {hosts.length === 0 && (
          <div className="host-list__empty">
            <p>{t("empty.message")}</p>
            <button type="button" className="btn btn--primary" onClick={onNewHost}>
              {t("empty.addButton")}
            </button>
          </div>
        )}

        {sections.map((section) => (
          <section key={section.label ?? "__default"} className="host-list__section">
            {section.label && <h2 className="host-list__heading">{section.label}</h2>}
            <ul className="host-list__items">
              {section.hosts.map((host) => (
                <li key={host.id}>
                  <HostTile
                    host={host}
                    active={activeHostId === host.id}
                    onConnect={() => connect(host)}
                    onEdit={(e) => openEdit(host, e)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
