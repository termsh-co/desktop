import { useTranslation } from "react-i18next";
import type { Session } from "@termsh/shared";
import { Icon } from "@/components/ui/Icon";

type Props = {
  role: "primary" | "secondary";
  session: Session | null;
  secondaryOptions?: Session[];
  secondarySessionId?: string | null;
  onSecondaryChange?: (id: string) => void;
};

export function SplitPaneBar({
  role,
  session,
  secondaryOptions = [],
  secondarySessionId,
  onSecondaryChange,
}: Props) {
  const { t } = useTranslation("terminal");
  const icon = session?.kind === "local" ? "laptop" : "terminal";

  return (
    <div
      className="terminal-split__bar"
      role="group"
      aria-label={role === "primary" ? t("split.primaryAria") : t("split.secondaryAria")}
    >
      <span className="terminal-split__bar-tag">
        {role === "primary" ? t("split.primary") : t("split.split")}
      </span>

      {role === "primary" ? (
        <span className="terminal-split__bar-title">
          {session ? (
            <>
              <Icon name={icon} size={12} />
              <span>{session.title}</span>
            </>
          ) : (
            "—"
          )}
        </span>
      ) : (
        <label className="terminal-split__bar-select-wrap">
          <select
            className="terminal-split__bar-select"
            aria-label={t("split.secondarySession")}
            value={secondarySessionId ?? ""}
            onChange={(e) => onSecondaryChange?.(e.target.value)}
            disabled={secondaryOptions.length === 0}
          >
            {secondaryOptions.length === 0 && (
              <option value="">{t("split.noOtherSession")}</option>
            )}
            {secondaryOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.kind === "local" ? t("split.local") : s.title}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
