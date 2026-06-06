export const MIME_LOCAL_PATH = "application/x-termsh-local-path";
export const MIME_REMOTE_PATH = "application/x-termsh-remote-path";

export type PaneSide = "local" | "remote";

export function setLocalDragData(dataTransfer: DataTransfer, path: string) {
  dataTransfer.setData(MIME_LOCAL_PATH, path);
  dataTransfer.setData("text/plain", path);
  dataTransfer.effectAllowed = "copy";
}

export function setRemoteDragData(dataTransfer: DataTransfer, path: string) {
  dataTransfer.setData(MIME_REMOTE_PATH, path);
  dataTransfer.setData("text/plain", path);
  dataTransfer.effectAllowed = "copy";
}

export function readLocalDragPath(dataTransfer: DataTransfer): string | null {
  return dataTransfer.getData(MIME_LOCAL_PATH) || null;
}

export function readRemoteDragPath(dataTransfer: DataTransfer): string | null {
  return dataTransfer.getData(MIME_REMOTE_PATH) || null;
}

/** Finder / desktop drops (Electron File.path) */
export function readDroppedFilePaths(dataTransfer: DataTransfer): string[] {
  const paths: string[] = [];
  if (dataTransfer.files?.length) {
    for (const file of Array.from(dataTransfer.files)) {
      const withPath = file as File & { path?: string };
      if (withPath.path) paths.push(withPath.path);
    }
  }
  return paths;
}

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

export function dropPaneSideAtPoint(clientX: number, clientY: number): string | null {
  const panes = document.querySelectorAll<HTMLElement>("[data-fe-drop-pane]");
  let fallback: string | null = null;

  for (const pane of Array.from(panes)) {
    const explorer = pane.closest(".fe") as HTMLElement | null;
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

    const side = pane.dataset["feDropPane"] ?? null;
    if (!side) continue;

    const hit = document.elementFromPoint(clientX, clientY);
    if (hit && pane.contains(hit)) return side;
    fallback = side;
  }

  return fallback;
}
