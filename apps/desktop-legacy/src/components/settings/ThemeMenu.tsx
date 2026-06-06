import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { THEMES } from "@/lib/themes";
import { useThemeStore } from "@/stores/themeStore";

export function ThemeMenu() {
  const { t } = useTranslation(["common", "settings"]);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const close = () => setOpen(false);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    const trigger = rootRef.current?.querySelector("button");
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const rect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const pad = 8;
    let left = rect.right - menuRect.width;
    let top = rect.bottom + 4;

    if (left + menuRect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - menuRect.width - pad);
    }
    if (left < pad) left = pad;
    if (top + menuRect.height > window.innerHeight - pad) {
      top = Math.max(pad, rect.top - menuRect.height - 4);
    }

    setMenuStyle({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="theme-picker" ref={rootRef}>
      <button
        type="button"
        className="app-header__action theme-picker__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        title={t("settings:theme.title")}
      >
        <span
          className="theme-picker__swatch"
          style={{ background: THEMES.find((th) => th.id === themeId)?.swatch ?? "#001d49" }}
          aria-hidden
        />
      </button>
      {open &&
        createPortal(
          <>
            <button
              type="button"
              className="theme-picker__backdrop"
              aria-label={t("actions.close")}
              onClick={close}
            />
            <ul
              ref={menuRef}
              className="theme-picker__menu"
              role="menu"
              style={
                menuStyle
                  ? { top: menuStyle.top, left: menuStyle.left }
                  : { visibility: "hidden" as const }
              }
            >
              {THEMES.map((th) => {
                const active = themeId === th.id;
                return (
                  <li key={th.id} role="none">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      className={`theme-picker__item ${active ? "is-active" : ""}`}
                      onClick={() => {
                        setTheme(th.id);
                        close();
                      }}
                    >
                      <span className="theme-picker__item-swatch" style={{ background: th.swatch }} aria-hidden />
                      <span className="theme-picker__item-label">{th.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>,
          document.body,
        )}
    </div>
  );
}
