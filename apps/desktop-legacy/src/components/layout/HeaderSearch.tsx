import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import { usePaletteActions } from "@/hooks/usePaletteActions";

export const HEADER_SEARCH_INPUT_ID = "header-search-input";

type Props = {
  onNewHost: () => void;
  onOpenVaultSetup: () => void;
  onVault: () => void;
};

export function HeaderSearch({ onNewHost, onOpenVaultSetup, onVault }: Props) {
  const { t } = useTranslation("palette");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { filterActions } = usePaletteActions({ onNewHost, onOpenVaultSetup, onVault });

  const results = filterActions(query, 10);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        (document.getElementById(HEADER_SEARCH_INPUT_ID) as HTMLInputElement | null)?.blur();
      }
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const runAction = (run: () => void) => {
    run();
    setQuery("");
    setOpen(false);
  };

  return (
    <div className={`header-search ${open ? "header-search--open" : ""}`} ref={rootRef}>
      <Icon name="search" size={15} className="header-search__icon" />
      <input
        id={HEADER_SEARCH_INPUT_ID}
        className="header-search__input"
        type="search"
        placeholder={t("searchPlaceholder")}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label={t("searchAria")}
        aria-expanded={open}
        aria-controls="header-search-results"
        autoComplete="off"
        spellCheck={false}
      />
      <kbd className="header-search__kbd" aria-hidden>
        ⌘K
      </kbd>

      {open && (
        <div id="header-search-results" className="header-search__dropdown mac-scrollbar" role="listbox">
          {results.length === 0 ? (
            <p className="header-search__empty">{t("empty")}</p>
          ) : (
            <ul className="header-search__list">
              {results.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    className="header-search__item"
                    role="option"
                    onClick={() => runAction(action.run)}
                  >
                    <span className="header-search__label">{action.label}</span>
                    {action.hint && <span className="header-search__hint">{action.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
