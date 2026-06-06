import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";

type Props = {
  onNewHost: () => void;
};

export function ContentToolbar({ onNewHost }: Props) {
  const { t } = useTranslation("hosts");
  const setView = useNavStore((s) => s.setView);
  const openLocalShell = useSessionStore((s) => s.openLocalShell);

  const openTerminal = () => {
    openLocalShell();
    setView("terminal");
  };

  return (
    <div className="content-toolbar">
      <button type="button" className="content-toolbar__btn content-toolbar__btn--primary" onClick={onNewHost}>
        <Icon name="add" size={16} />
        {t("toolbar.newHost")}
      </button>
      <button type="button" className="content-toolbar__btn" onClick={openTerminal}>
        <Icon name="terminal" size={16} />
        {t("toolbar.terminal")}
      </button>
    </div>
  );
}
