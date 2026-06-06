import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Host } from "@termsh/shared";
import { Icon } from "@/components/ui/Icon";

type Props = {
  host: Host;
  active?: boolean;
  onConnect: () => void;
  onEdit: (e: MouseEvent) => void;
};

function formatAddr(host: Host): string {
  if (host.port === 22 || host.port === 21) {
    return `${host.username}@${host.hostname}`;
  }
  return `${host.username}@${host.hostname}:${host.port}`;
}

export function RemoteSiteRow({ host, active, onConnect, onEdit }: Props) {
  const { t } = useTranslation("remote");
  const missingSecret =
    host.authType === "password" ? !host.credentialRef : !host.privateKeyRef;

  return (
    <article className={`host-row ${active ? "host-row--active" : ""}`}>
      <button type="button" className="host-row__main" onClick={onConnect}>
        <span className="host-row__remote-icon">
          <Icon name="folder" size={18} />
        </span>
        <span className="host-row__text">
          <span className="host-row__name">{host.name}</span>
          <span className="host-row__addr">{formatAddr(host)}</span>
        </span>
        {active && (
          <span
            className="host-row__live"
            title={t("view.connected")}
            aria-label={t("view.connected")}
          />
        )}
        {missingSecret && <span className="host-row__warn">!</span>}
      </button>
      {onEdit && (
        <button
          type="button"
          className="host-row__edit"
          onClick={onEdit}
          aria-label={t("view.editHostAria", { name: host.name })}
          title={t("common:actions.edit")}
        >
          <Icon name="edit" size={14} />
        </button>
      )}
    </article>
  );
}
