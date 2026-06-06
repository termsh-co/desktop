import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Host } from "@termsh/shared";
import { HostOsIcon } from "@/components/hosts/HostOsIcon";
import { Icon } from "@/components/ui/Icon";
import { LOCALE_BCP47 } from "@/i18n/locale";
import { resolveHostPlatform } from "@/lib/hosts/platform";
import { useHostStore } from "@/stores/hostStore";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useSettingsStore } from "@/stores/settingsStore";

function hostAddr(host: Host): string {
  return host.port === 22
    ? `${host.username}@${host.hostname}`
    : `${host.username}@${host.hostname}:${host.port}`;
}

type Props = {
  placement?: "above" | "below";
};

export function NewSessionMenu({ placement = "below" }: Props) {
  const { t } = useTranslation("session");
  const locale = useSettingsStore((s) => s.locale);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "host">("choose");
  const rootRef = useRef<HTMLDivElement>(null);

  const hosts = useHostStore((s) => s.hosts);
  const openLocalShell = useSessionStore((s) => s.openLocalShell);
  const openSshSession = useSessionStore((s) => s.openSshSession);
  const setView = useNavStore((s) => s.setView);
  const openHostDrawer = useNavStore((s) => s.openHostDrawer);

  const sortedHosts = useMemo(
    () => [...hosts].sort((a, b) => a.name.localeCompare(b.name, LOCALE_BCP47[locale])),
    [hosts, locale],
  );

  const close = () => {
    setOpen(false);
    setMode("choose");
  };

  const goTerminal = () => {
    setView("terminal");
    close();
  };

  const onLocal = () => {
    openLocalShell();
    goTerminal();
  };

  const onHost = (host: Host) => {
    openSshSession(host);
    goTerminal();
  };

  const onAddHost = () => {
    setView("hosts");
    openHostDrawer(null);
    close();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return (
    <div
      className={`chrome-new-menu ${placement === "above" ? "chrome-new-menu--above" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        className={`session-tab session-tab__new ${open ? "session-tab__new--open" : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={t("newSession.title")}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="add" size={14} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="chrome-new-menu__backdrop"
            aria-label={t("common:actions.close")}
            onClick={close}
          />
          <div className="chrome-new-menu__panel" role="menu" aria-label={t("newSession.title")}>
            {mode === "choose" ? (
              <>
                <p className="chrome-new-menu__heading">{t("newSession.title")}</p>
                <button
                  type="button"
                  className="chrome-new-menu__item"
                  role="menuitem"
                  onClick={onLocal}
                >
                  <span className="chrome-new-menu__icon" aria-hidden>
                    <Icon name="laptop" size={14} />
                  </span>
                  <span className="chrome-new-menu__text">
                    <span className="chrome-new-menu__label">{t("newSession.localTerminal")}</span>
                    <span className="chrome-new-menu__hint">{t("newSession.localHint")}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="chrome-new-menu__item"
                  role="menuitem"
                  onClick={() => setMode("host")}
                >
                  <span className="chrome-new-menu__icon" aria-hidden>
                    <Icon name="dns" size={14} />
                  </span>
                  <span className="chrome-new-menu__text">
                    <span className="chrome-new-menu__label">{t("newSession.host")}</span>
                    <span className="chrome-new-menu__hint">{t("newSession.hostHint")}</span>
                  </span>
                </button>
              </>
            ) : (
              <>
                <div className="chrome-new-menu__heading-row">
                  <p className="chrome-new-menu__heading">{t("newSession.host")}</p>
                  <button
                    type="button"
                    className="chrome-new-menu__back"
                    onClick={() => setMode("choose")}
                  >
                    {t("newSession.back")}
                  </button>
                </div>
                <ul
                  className="chrome-new-menu__hosts mac-scrollbar"
                  role="group"
                  aria-label={t("newSession.hostsAria")}
                >
                  {sortedHosts.length === 0 ? (
                    <li role="none">
                      <button
                        type="button"
                        className="chrome-new-menu__empty"
                        role="menuitem"
                        onClick={onAddHost}
                      >
                        {t("newSession.noHosts")}
                      </button>
                    </li>
                  ) : (
                    sortedHosts.map((host) => (
                      <li key={host.id} role="none">
                        <button
                          type="button"
                          className="chrome-new-menu__host"
                          role="menuitem"
                          onClick={() => onHost(host)}
                        >
                          <HostOsIcon platform={resolveHostPlatform(host)} size={22} />
                          <span className="chrome-new-menu__text">
                            <span className="chrome-new-menu__label">{host.name}</span>
                            <span className="chrome-new-menu__hint">{hostAddr(host)}</span>
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
