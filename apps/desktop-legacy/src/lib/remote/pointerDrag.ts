const DRAG_THRESHOLD_PX = 5;

export type PointerDragSession = {
  startX: number;
  startY: number;
  active: boolean;
  lastTarget: string | null;
};

export function shouldActivatePointerDrag(
  session: PointerDragSession,
  clientX: number,
  clientY: number,
): boolean {
  if (session.active) return true;
  const dx = clientX - session.startX;
  const dy = clientY - session.startY;
  return Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX;
}

/** Aktif gezgin oturumundaki pane; elementFromPoint yerine geometri kullanır */
export function dropPaneSideAtPoint(clientX: number, clientY: number): string | null {
  const panes = document.querySelectorAll<HTMLElement>("[data-fe-drop-pane]");
  let fallback: string | null = null;

  for (const pane of panes) {
    const explorer = pane.closest<HTMLElement>(".fe");
    if (explorer && !explorer.classList.contains("fe--active")) continue;

    const rect = pane.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      continue;
    }

    const side = pane.dataset.feDropPane ?? null;
    if (!side) continue;

    const hit = document.elementFromPoint(clientX, clientY);
    if (hit && pane.contains(hit)) return side;
    fallback = side;
  }

  return fallback;
}
