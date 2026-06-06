import { useTranslation } from "react-i18next";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useNavStore, type AppView } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";

type NavItem = {
  id: AppView;
  labelKey: string;
  icon: IconName;
};

const ITEMS: NavItem[] = [
  { id: "hosts", labelKey: "nav.servers", icon: "dns" },
  { id: "snippets", labelKey: "nav.snippets", icon: "code" },
  { id: "vault", labelKey: "nav.vault", icon: "lock" },
  { id: "keys", labelKey: "nav.keys", icon: "key" },
  { id: "settings", labelKey: "nav.settings", icon: "settings" },
];

export function AppSidebarNav() {
  const { t } = useTranslation("common");
  const view = useNavStore((s) => s.view);
  const setView = useNavStore((s) => s.setView);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  const effectiveView = view === "terminal" ? "hosts" : view;

  return (
    <aside className="sidebar" aria-label={t("nav.navigation")}>
      <div className="sidebar__inner">
        <nav className="sidebar__nav" aria-label={t("nav.pages")}>
          {ITEMS.map((item) => {
            const active = effectiveView === item.id;
            const label = t(item.labelKey);
            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar__item ${active ? "sidebar__item--active" : ""}`}
                onClick={() => setView(item.id)}
                aria-current={active ? "page" : undefined}
                title={label}
              >
                <span className="sidebar__icon">
                  <Icon name={item.icon} size={18} />
                </span>
                <span className="sidebar__label">{label}</span>
              </button>
            );
          })}
        </nav>

        {sessions.length > 0 && (
          <div className="sidebar__sessions">
            <div className="sidebar__divider" />
            {sessions.slice(0, 5).map((s) => {
              const active = s.id === activeSessionId && view === "terminal";
              const icon: IconName =
                s.kind === "local" ? "laptop" : s.kind === "remote" ? "folder" : "terminal";
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`sidebar__item sidebar__item--session ${active ? "sidebar__item--active" : ""}`}
                  onClick={() => {
                    setActiveSession(s.id);
                    setView("terminal");
                  }}
                  title={s.title}
                >
                  <span className="sidebar__icon">
                    <Icon name={icon} size={16} />
                  </span>
                  <span className="sidebar__label">{s.title}</span>
                  <span className={`sidebar__dot ${active ? "sidebar__dot--live" : ""}`} />
                </button>
              );
            })}
            {sessions.length > 5 && (
              <span className="sidebar__more">+{sessions.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
