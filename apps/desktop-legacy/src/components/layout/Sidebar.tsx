import { Icon, type IconName } from "@/components/ui/Icon";
import { useNavStore, type AppView } from "@/stores/navStore";

type NavItem = {
  id: AppView;
  label: string;
  icon: IconName;
};

const ITEMS: NavItem[] = [
  { id: "hosts", label: "Servers", icon: "dns" },
  { id: "snippets", label: "Snippets", icon: "code" },
  { id: "keys", label: "Keys", icon: "key" },
  { id: "settings", label: "Settings", icon: "gear" },
];

export function Sidebar() {
  const view = useNavStore((s) => s.view);
  const setView = useNavStore((s) => s.setView);
  const effectiveView = view === "terminal" ? "hosts" : view;

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav" aria-label="Main">
        {ITEMS.map((item) => {
          const active = effectiveView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar__item ${active ? "sidebar__item--active" : ""}`}
              onClick={() => setView(item.id)}
              aria-current={active ? "page" : undefined}
              title={item.label}
            >
              <Icon name={item.icon} size={18} />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
