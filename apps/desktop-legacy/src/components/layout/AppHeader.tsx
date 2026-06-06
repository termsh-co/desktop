import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { UpdateNotificationButton } from "@/components/layout/UpdateNotificationButton";
import { ThemeMenu } from "@/components/settings/ThemeMenu";
import { Icon } from "@/components/ui/Icon";
import { startDraggingMainWindow } from "@/lib/window";
import { useNavStore } from "@/stores/navStore";
import { useSyncStore } from "@/stores/syncStore";

type Props = {
  onVault: () => void;
  vaultReady: boolean;
  onNewHost: () => void;
  onOpenVaultSetup: () => void;
  serverSegment: "ssh" | "sftp";
  onServerSegmentChange: (s: "ssh" | "sftp") => void;
};

export function AppHeader({
  onVault,
  vaultReady,
  onNewHost,
  onOpenVaultSetup,
  serverSegment,
  onServerSegmentChange,
}: Props) {
  const setView = useNavStore((s) => s.setView);
  const syncEnabled = useSyncStore((s) => s.enabled);
  const setSyncEnabled = useSyncStore((s) => s.setEnabled);

  return (
    <header
      className="app-header"
      onMouseDown={(e) => {
        const el = e.target as HTMLElement;
        if (el.closest("button, input, select, a")) return;
        void startDraggingMainWindow();
      }}
    >
      <div className="app-header__spacer" aria-hidden />

      <button
        type="button"
        className="app-header__home"
        onClick={() => setView("hosts")}
        title="Home"
      >
        <Icon name="home" size={16} />
      </button>

      <div className="header-segment" role="radiogroup" aria-label="Server type">
        <button
          type="button"
          role="radio"
          className={`header-segment__btn ${serverSegment === "ssh" ? "header-segment__btn--active" : ""}`}
          aria-checked={serverSegment === "ssh"}
          onClick={() => onServerSegmentChange("ssh")}
        >
          <Icon name="terminal" size={12} />
          Host
        </button>
        <button
          type="button"
          role="radio"
          className={`header-segment__btn ${serverSegment === "sftp" ? "header-segment__btn--active" : ""}`}
          aria-checked={serverSegment === "sftp"}
          onClick={() => onServerSegmentChange("sftp")}
        >
          <Icon name="folder" size={12} />
          SFTP
        </button>
        <span
          className="header-segment__indicator"
          style={{ transform: serverSegment === "sftp" ? "translateX(100%)" : "translateX(0)" }}
        />
      </div>

      <div className="app-header__search-wrap">
        <HeaderSearch onNewHost={onNewHost} onOpenVaultSetup={onOpenVaultSetup} onVault={onVault} />
      </div>

      <div className="app-header__actions">
        <button
          type="button"
          className={`app-header__action app-header__action--cloud ${
            syncEnabled ? "app-header__action--cloud-on" : "app-header__action--cloud-off"
          }`}
          onClick={() => setSyncEnabled(!syncEnabled)}
          title={syncEnabled ? "Bulut senkronizasyonu: açık" : "Bulut senkronizasyonu: kapalı"}
          aria-label={syncEnabled ? "Senkronizasyon açık" : "Senkronizasyon kapalı"}
          aria-pressed={syncEnabled}
        >
          <Icon name={syncEnabled ? "cloud" : "cloud_off"} size={17} />
        </button>
        <UpdateNotificationButton />
        <button type="button" className="app-header__action" onClick={onVault} title="Kasa">
          <Icon name={vaultReady ? "lock_open" : "lock"} size={17} />
        </button>
        <div className="app-header__avatar" title="Account">
          <Icon name="key" size={16} />
        </div>
        <ThemeMenu />
      </div>
    </header>
  );
}
