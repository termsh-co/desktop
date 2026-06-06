import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";

export type ExplorerMenuItem = {
  id: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

type Props = {
  x: number;
  y: number;
  items: ExplorerMenuItem[];
  onClose: () => void;
};

export function ExplorerContextMenu({ x, y, items, onClose }: Props) {
  const { t } = useTranslation("common");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointer = (event: MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("scroll", onClose, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const pad = 8;
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - rect.width - pad);
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - rect.height - pad);
    }
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }, [x, y, items]);

  return createPortal(
    <>
      <button type="button" className="fe-ctx__backdrop" aria-label={t("actions.close")} onClick={onClose} />
      <div
        ref={panelRef}
        className="fe-ctx"
        role="menu"
        style={{ left: x, top: y }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="fe-ctx__item"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>,
    document.body,
  );
}
