import type { MouseEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { useUpdaterStore } from "@/stores/updaterStore";

export function UpdateNotificationButton() {
  const updateAvailable = useUpdaterStore((s) => s.updateAvailable);
  const updateVersion = useUpdaterStore((s) => s.updateVersion);
  const checking = useUpdaterStore((s) => s.checking);
  const checkForUpdates = useUpdaterStore((s) => s.checkForUpdates);
  const installUpdate = useUpdaterStore((s) => s.installUpdate);
  const dismissUpdate = useUpdaterStore((s) => s.dismissUpdate);

  const title = updateAvailable
    ? `Güncelleme hazır: ${updateVersion ?? ""}`
    : checking
      ? "Güncellemeler kontrol ediliyor…"
      : "Bildirimler";

  const onClick = () => {
    if (updateAvailable) {
      void installUpdate();
      return;
    }
    void checkForUpdates({ notify: true });
  };

  const onContextMenu = (event: MouseEvent) => {
    if (!updateAvailable) return;
    event.preventDefault();
    dismissUpdate();
  };

  return (
    <button
      type="button"
      className={`app-header__action app-header__action--bell ${
        updateAvailable ? "app-header__action--bell-active" : ""
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={title}
      aria-label={title}
    >
      <Icon name="bell" size={17} />
      {updateAvailable && <span className="app-header__badge" aria-hidden />}
    </button>
  );
}
