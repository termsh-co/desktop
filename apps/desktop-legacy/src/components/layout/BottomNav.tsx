import { useTranslation } from "react-i18next";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useNavStore, type AppView } from "@/stores/navStore";

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

export function BottomNav() {
  const { t } = useTranslation("common");
  const view = useNavStore((s) => s.view);
  const setView = useNavStore((s) => s.setView);

  const effectiveView = view === "terminal" ? "hosts" : view;

  return (
    <nav className="bottom-nav" aria-label={t("nav.navigation")}>
      <div className="bottom-nav__dock">
        {ITEMS.map((item) => {
          const active = effectiveView === item.id;
          const label = t(item.labelKey);
          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-nav__item ${active ? "bottom-nav__item--active" : ""}`}
              onClick={() => setView(item.id)}
              aria-current={active ? "page" : undefined}
            >
              <Icon name={item.icon} size={20} />
              <span className="bottom-nav__label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
