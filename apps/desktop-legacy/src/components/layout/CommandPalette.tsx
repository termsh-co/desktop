import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePaletteActions } from "@/hooks/usePaletteActions";
import { useNavStore } from "@/stores/navStore";

type Props = {
  onNewHost: () => void;
  onOpenVaultSetup: () => void;
  onVault: () => void;
};

/** @deprecated HeaderSearch kullanın; geriye dönük kısayol için tutuldu. */
export function CommandPalette({ onNewHost, onOpenVaultSetup, onVault }: Props) {
  const { t } = useTranslation("palette");
  const open = useNavStore((s) => s.paletteOpen);
  const closePalette = useNavStore((s) => s.closePalette);
  const [query, setQuery] = useState("");
  const { filterActions } = usePaletteActions({ onNewHost, onOpenVaultSetup, onVault });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = filterActions(query, 12);

  if (!open) return null;

  return (
    <div className="palette-backdrop" role="presentation" onClick={closePalette}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t("commandPaletteAria")}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          className="palette__input"
          type="search"
          placeholder={t("palettePlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-label={t("searchAria")}
        />
        <ul className="palette__list mac-scrollbar">
          {filtered.length === 0 && <li className="palette__empty">{t("empty")}</li>}
          {filtered.map((action) => (
            <li key={action.id}>
              <button
                type="button"
                className="palette__item"
                onClick={() => {
                  action.run();
                  closePalette();
                }}
              >
                <span>{action.label}</span>
                {action.hint && <span className="palette__hint">{action.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="palette__foot">{t("paletteFoot")}</p>
      </div>
    </div>
  );
}
