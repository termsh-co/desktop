import {
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import type { RemoteFileEntry } from "@termsh/shared";
import {
  ExplorerContextMenu,
  type ExplorerMenuItem,
} from "@/components/remote/ExplorerContextMenu";
import { FileEntryIcon } from "@/components/remote/FileEntryIcon";
import { Icon } from "@/components/ui/Icon";
import { isDirectoryEntry, isDraggableEntry, isFileEntry } from "@/lib/remote/entries";
import {
  MIME_LOCAL_PATH,
  MIME_REMOTE_PATH,
  readDroppedFilePaths,
  readLocalDragPath,
  readRemoteDragPath,
} from "@/lib/remote/drag";
import { dropPaneSideAtPoint, shouldActivatePointerDrag } from "@/lib/remote/pointerDrag";
import { LOCALE_BCP47 } from "@/i18n/locale";
import { fileTypeLabel } from "@/lib/remote/fileTypeLabel";
import { formatBytes, formatModified } from "@/lib/remote/format";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  sortExplorerEntries,
  toggleSort,
  type SortKey,
  type SortState,
} from "@/lib/remote/sort";

const DEFAULT_SORT: SortState = { key: "name", dir: "asc" };

type PaneSide = "local" | "remote";

type Props = {
  side: PaneSide;
  label: string;
  path: string;
  entries: RemoteFileEntry[];
  parentEntry: RemoteFileEntry | null;
  selectedPath: string | null;
  busy: boolean;
  canUp: boolean;
  onUp: () => void;
  onRefresh: () => void;
  onSelect: (entry: RemoteFileEntry) => void;
  onOpenDir: (entry: RemoteFileEntry) => void;
  /** Yerel dosya uzak panele bırakıldı */
  onDropLocalPaths?: (paths: string[]) => void;
  /** Uzak dosya yerel panele bırakıldı */
  onDropRemotePaths?: (paths: string[]) => void;
  /** OS'ten dosya bırakıldı (path listesi) */
  onDropOsPaths?: (paths: string[]) => void;
  /** Karşı panelden dosya sürükleniyor — hedef göstergesi */
  isDropTarget?: boolean;
  /** İmleç bu panelin üzerindeyken hedef vurgusu */
  dragHoverActive?: boolean;
  onDragSessionStart?: () => void;
  onDragSessionEnd?: () => void;
  onDragHoverTarget?: (target: PaneSide | null) => void;
  /** Pane içi sürükleme: kaynak → hedef */
  onPointerDrop?: (from: PaneSide, to: PaneSide, paths: string[]) => void;
  onUploadFile?: (path: string) => void;
  onDownloadFile?: (path: string) => void;
  onPickUpload?: () => void;
};

export function FileExplorerGrid({
  side,
  label,
  path,
  entries,
  parentEntry,
  selectedPath,
  busy,
  canUp,
  onUp,
  onRefresh,
  onSelect,
  onOpenDir,
  onDropLocalPaths,
  onDropRemotePaths,
  onDropOsPaths,
  isDropTarget = false,
  dragHoverActive = false,
  onDragSessionStart,
  onDragSessionEnd,
  onDragHoverTarget,
  onPointerDrop,
  onUploadFile,
  onDownloadFile,
  onPickUpload,
}: Props) {
  const { t } = useTranslation("remote");
  const locale = useSettingsStore((s) => s.locale);
  const bcp47 = LOCALE_BCP47[locale];
  const columns = useMemo(
    (): { key: SortKey; label: string; className: string }[] => [
      { key: "name", label: t("grid.colName"), className: "fe-grid__col-name" },
      { key: "size", label: t("grid.colSize"), className: "fe-grid__col-size" },
      { key: "type", label: t("grid.colType"), className: "fe-grid__col-type" },
      { key: "modified", label: t("grid.colModified"), className: "fe-grid__col-date" },
    ],
    [t],
  );
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [dragOver, setDragOver] = useState(false);
  const [draggingPath, setDraggingPath] = useState<string | null>(null);
  const [dragGhost, setDragGhost] = useState<{
    entry: RemoteFileEntry;
    x: number;
    y: number;
  } | null>(null);
  const dragDepthRef = useRef(0);
  const pointerDragRef = useRef<{
    entry: RemoteFileEntry;
    startX: number;
    startY: number;
    active: boolean;
    lastTarget: string | null;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ExplorerMenuItem[];
  } | null>(null);

  const copyPath = (entryPath: string) => {
    void navigator.clipboard.writeText(entryPath);
  };

  const openEntryContextMenu = (event: MouseEvent, entry: RemoteFileEntry) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(entry);

    const items: ExplorerMenuItem[] = [];

    if (isDirectoryEntry(entry)) {
      items.push({
        id: "open",
        label: entry.name === ".." ? t("grid.goParent") : t("grid.open"),
        onClick: () => onOpenDir(entry),
      });
    } else if (side === "local" && isFileEntry(entry)) {
      items.push({
        id: "upload",
        label: t("grid.uploadToServer"),
        disabled: !onUploadFile,
        onClick: () => onUploadFile?.(entry.path),
      });
    } else if (side === "remote" && isFileEntry(entry)) {
      items.push({
        id: "download",
        label: t("grid.download"),
        disabled: !onDownloadFile,
        onClick: () => onDownloadFile?.(entry.path),
      });
    }

    items.push({
      id: "copy-path",
      label: t("grid.copyPath"),
      onClick: () => copyPath(entry.path),
    });

    setContextMenu({ x: event.clientX, y: event.clientY, items });
  };

  const openPaneContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    const items: ExplorerMenuItem[] = [
      { id: "refresh", label: t("grid.refresh"), onClick: onRefresh },
      {
        id: "up",
        label: t("grid.parentDir"),
        disabled: !canUp,
        onClick: onUp,
      },
    ];
    if (side === "remote" && onPickUpload) {
      items.push({ id: "pick-upload", label: t("grid.pickUpload"), onClick: onPickUpload });
    }
    setContextMenu({ x: event.clientX, y: event.clientY, items });
  };

  const rows = useMemo(
    () => sortExplorerEntries(entries, sort, parentEntry, bcp47),
    [entries, parentEntry, sort, bcp47],
  );

  const displayFileType = (entry: RemoteFileEntry): string => {
    const key = fileTypeLabel(entry);
    const dot = entry.name.lastIndexOf(".");
    if (dot > 0 && dot < entry.name.length - 1 && key !== "folder" && key !== "link") {
      return entry.name.slice(dot + 1).toLowerCase();
    }
    return t(`grid.fileTypes.${key}`, { defaultValue: key });
  };

  const acceptMime = side === "remote" ? MIME_LOCAL_PATH : MIME_REMOTE_PATH;

  const onHeaderClick = (key: SortKey) => {
    setSort((prev) => toggleSort(prev, key));
  };

  const sortIndicator = (key: SortKey) => {
    if (sort.key !== key) return null;
    return sort.dir === "asc" ? " ↑" : " ↓";
  };

  const endPointerDrag = () => {
    pointerDragRef.current = null;
    setDraggingPath(null);
    setDragGhost(null);
    document.body.classList.remove("fe-is-dragging");
    onDragHoverTarget?.(null);
    onDragSessionEnd?.();
  };

  const commitInternalDrop = (targetSide: string, path: string) => {
    if (targetSide === side) return;
    if (onPointerDrop) {
      onPointerDrop(side, targetSide as PaneSide, [path]);
      return;
    }
    if (targetSide === "remote" && side === "local") {
      onDropLocalPaths?.([path]);
    } else if (targetSide === "local" && side === "remote") {
      onDropRemotePaths?.([path]);
    }
  };

  const handleFilePointerDown = (entry: RemoteFileEntry, event: PointerEvent) => {
    if (!isDraggableEntry(entry) || event.button !== 0) return;
    event.preventDefault();
    const row = event.currentTarget as HTMLElement;
    row.setPointerCapture(event.pointerId);
    pointerDragRef.current = {
      entry,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      lastTarget: null,
    };

    const onMove = (ev: globalThis.PointerEvent) => {
      const session = pointerDragRef.current;
      if (!session) return;

      if (!shouldActivatePointerDrag(session, ev.clientX, ev.clientY)) return;

      if (!session.active) {
        session.active = true;
        setDraggingPath(session.entry.path);
        document.body.classList.add("fe-is-dragging");
        onDragSessionStart?.();
      }

      setDragGhost({ entry: session.entry, x: ev.clientX, y: ev.clientY });

      const overSide = dropPaneSideAtPoint(ev.clientX, ev.clientY);
      if (overSide) session.lastTarget = overSide;
      const validTarget = overSide !== null && overSide !== side;
      onDragHoverTarget?.(validTarget ? (overSide as PaneSide) : null);
    };

    const onUp = (ev: globalThis.PointerEvent) => {
      const session = pointerDragRef.current;
      try {
        row.releasePointerCapture(ev.pointerId);
      } catch {
        /* capture zaten bırakılmış olabilir */
      }
      if (session?.active) {
        suppressClickRef.current = true;
        setDragGhost(null);
        const overSide =
          dropPaneSideAtPoint(ev.clientX, ev.clientY) ?? session.lastTarget;
        if (overSide && overSide !== side) {
          commitInternalDrop(overSide, session.entry.path);
        }
      }
      endPointerDrag();
      dragDepthRef.current = 0;
      setDragOver(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const acceptsTransfer = (types: readonly string[]) => {
    const list = [...types];
    return (
      list.includes(acceptMime) ||
      (side === "remote" && list.includes(MIME_LOCAL_PATH)) ||
      (side === "local" && list.includes(MIME_REMOTE_PATH)) ||
      list.includes("Files")
    );
  };

  const handleDragOver = (event: DragEvent) => {
    if (!acceptsTransfer(event.dataTransfer.types)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  };

  const handleDragEnter = (event: DragEvent) => {
    if (!acceptsTransfer(event.dataTransfer.types)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragOver(true);
  };

  const handleDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragOver(false);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragOver(false);
    onDragSessionEnd?.();

    const osPaths = readDroppedFilePaths(event.dataTransfer);
    if (osPaths.length > 0) {
      onDropOsPaths?.(osPaths);
      return;
    }

    const localPath = readLocalDragPath(event.dataTransfer);
    if (localPath && side === "remote") {
      onDropLocalPaths?.([localPath]);
      return;
    }

    const remotePath = readRemoteDragPath(event.dataTransfer);
    if (remotePath && side === "local") {
      onDropRemotePaths?.([remotePath]);
    }
  };

  const showDropZone = isDropTarget || (dragOver && !draggingPath);
  const dropHighlight = dragHoverActive || dragOver;

  return (
    <section
      className={`fe-pane fe-pane--${side}`}
      data-fe-drop-pane={side}
      onContextMenu={(e) => e.preventDefault()}
    >
      <header className="fe-pane__head">
        <span className="fe-pane__tag">{label}</span>
        <div className="fe-pane__tools">
          <button
            type="button"
            className="fe-tool"
            disabled={busy || !canUp}
            onClick={onUp}
            title={t("grid.parentDir")}
            aria-label={t("grid.parentDir")}
          >
            <Icon name="chevron_right" size={14} className="fe-tool__up" />
          </button>
          <button
            type="button"
            className="fe-tool"
            disabled={busy}
            onClick={onRefresh}
            title={t("grid.refresh")}
            aria-label={t("grid.refresh")}
          >
            ↻
          </button>
        </div>
        <code className="fe-pane__path mac-scrollbar" title={path}>
          {path || "…"}
        </code>
      </header>

      <div
        data-fe-drop-pane={side}
        className="fe-grid-wrap"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="fe-grid__header" role="row">
          {columns.map((col) => (
            <button
              key={col.key}
              type="button"
              className={`fe-grid__th ${col.className} ${sort.key === col.key ? "fe-grid__th--active" : ""}`}
              onClick={() => onHeaderClick(col.key)}
            >
              {col.label}
              <span className="fe-grid__sort">{sortIndicator(col.key)}</span>
            </button>
          ))}
        </div>

        <div
          className="fe-grid__body mac-scrollbar"
          role="listbox"
          aria-busy={busy}
          onContextMenu={openPaneContextMenu}
        >
          {rows.map((entry) => {
            const isDir = isDirectoryEntry(entry);
            const isParent = entry.name === "..";
            const selected = selectedPath === entry.path;
            const isFile = isDraggableEntry(entry);

            return (
              <div
                key={entry.path}
                role="option"
                aria-selected={selected}
                className={`fe-grid__row ${selected ? "fe-grid__row--selected" : ""} ${isDir ? "fe-grid__row--dir" : ""} ${isParent ? "fe-grid__row--parent" : ""} ${isFile ? "fe-grid__row--file" : ""}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (isDir) { onOpenDir(entry); } else { onSelect(entry); }
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const next = (e.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null;
                    next?.focus();
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const prev = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement | null;
                    prev?.focus();
                  }
                }}
                onClick={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  onSelect(entry);
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  if (isDir) onOpenDir(entry);
                }}
                onPointerDown={isFile ? (e) => handleFilePointerDown(entry, e) : undefined}
                onContextMenu={(e) => openEntryContextMenu(e, entry)}
              >
                <span className="fe-grid__col fe-grid__col-name">
                  <FileEntryIcon entry={entry} size={16} className="fe-grid__entry-icon" />
                  <span className="fe-grid__name" title={entry.name}>
                    {entry.name}
                  </span>
                </span>
                <span className="fe-grid__col fe-grid__col-size">
                  {isDir ? "—" : formatBytes(entry.size)}
                </span>
                <span className="fe-grid__col fe-grid__col-type">{displayFileType(entry)}</span>
                <span className="fe-grid__col fe-grid__col-date">
                  {formatModified(entry.modifiedAt, bcp47)}
                </span>
              </div>
            );
          })}
          {!busy && rows.length === 0 && <p className="fe-grid__empty">{t("grid.emptyDir")}</p>}
          {busy && <p className="fe-grid__loading">{t("grid.loading")}</p>}
        </div>

      </div>

      {showDropZone && (
        <div
          className={`fe-pane__drop-overlay ${dropHighlight ? "fe-pane__drop-overlay--active" : ""}`}
          aria-hidden
        >
          <span className="fe-pane__drop-title">{t("grid.dropTitle")}</span>
          <span className="fe-pane__drop-sub">
            {side === "remote" ? t("grid.dropUpload") : t("grid.dropDownload")}
          </span>
        </div>
      )}

      {contextMenu && (
        <ExplorerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {dragGhost &&
        createPortal(
          <div
            className="fe-drag-ghost"
            style={{ left: dragGhost.x + 14, top: dragGhost.y + 10 }}
            aria-hidden
          >
            <FileEntryIcon entry={dragGhost.entry} size={18} className="fe-drag-ghost__icon" />
            <span className="fe-drag-ghost__name">{dragGhost.entry.name}</span>
          </div>,
          document.body,
        )}
    </section>
  );
}
