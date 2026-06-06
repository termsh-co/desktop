import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Host } from "@termsh/shared";
import { HostOsIcon } from "@/components/hosts/HostOsIcon";
import { Icon } from "@/components/ui/Icon";
import { resolveHostPlatform } from "@/lib/hosts/platform";

type Props = {
  host: Host;
  active?: boolean;
  onConnect: () => void;
  onEdit?: (e: MouseEvent) => void;
};

export function HostTile({ host, active, onConnect, onEdit }: Props) {
  const { t } = useTranslation("remote");
  const platform = resolveHostPlatform(host);
  const missingSecret =
    host.authType === "password"
      ? !host.credentialRef
      : host.authType === "privateKey"
        ? !host.privateKeyRef
        : false;

  const addr =
    host.port === 22
      ? `${host.username}@${host.hostname}`
      : `${host.username}@${host.hostname}:${host.port}`;

  return (
    <article className={`host-row ${active ? "host-row--active" : ""}`}>
      <button type="button" className="host-row__main" onClick={onConnect}>
        <HostOsIcon platform={platform} size={28} />
        <span className="host-row__text">
          <span className="host-row__name">{host.name}</span>
          <span className="host-row__addr">{addr}</span>
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
