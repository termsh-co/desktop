import { Component, computed, inject, input, output, signal } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { toBcp47, type RemoteFileEntry } from "@termsh/common";
import { SettingsStateService } from "@termsh/state";
import {
  ExplorerContextMenuComponent,
  type ExplorerMenuItem,
} from "./explorer-context-menu.component";
import {
  MIME_LOCAL_PATH,
  MIME_REMOTE_PATH,
  type PaneSide,
  dropPaneSideAtPoint,
  readDroppedFilePaths,
  readLocalDragPath,
  readRemoteDragPath,
  shouldActivatePointerDrag,
} from "./remote-drag";
import {
  fileTypeLabel,
  formatBytes,
  formatModified,
  isDirectoryEntry,
  isDraggableEntry,
  isFileEntry,
} from "./remote-format";
import {
  DEFAULT_SORT,
  type SortKey,
  type SortState,
  sortExplorerEntries,
  toggleSort,
} from "./remote-sort";

@Component({
  selector: "termsh-remote-file-grid",
  standalone: true,
  imports: [TranslateModule, ExplorerContextMenuComponent],
  template: `
    <section class="fe-pane" [class]="'fe-pane fe-pane--' + side()">
      <div class="fe-pane__head">
        <span class="fe-pane__tag">{{ label() }}</span>
        <div class="fe-pane__tools">
          <button
            type="button"
            class="fe-tool"
            [disabled]="!canUp() || busy()"
            [title]="'remote.grid.goParent' | translate"
            (click)="up.emit()"
          >
            <span class="fe-tool__up">↑</span>
          </button>
          <button
            type="button"
            class="fe-tool"
            [disabled]="busy()"
            [title]="'remote.grid.refresh' | translate"
            (click)="refresh.emit()"
          >
            ↻
          </button>
        </div>
        <code class="fe-pane__path">{{ path() }}</code>
      </div>

      <div
        class="fe-grid-wrap"
        [attr.data-fe-drop-pane]="side()"
        (dragover)="onDragOver($event)"
        (dragenter)="onDragEnter($event)"
        (dragleave)="onDragLeave()"
        (drop)="onDrop($event)"
        (contextmenu)="onPaneContextMenu($event)"
      >
        <div class="fe-grid__header" role="row">
          @for (col of columns; track col.key) {
            <button
              type="button"
              [class]="col.className + (sort().key === col.key ? ' fe-grid__th--active' : '')"
              (click)="onHeaderClick(col.key)"
            >
              {{ col.labelKey | translate }}
              @if (sort().key === col.key) {
                <span class="fe-grid__sort">{{ sort().dir === 'asc' ? '↑' : '↓' }}</span>
              }
            </button>
          }
        </div>
        <div class="fe-grid__body" role="list">
          @if (busy()) {
            <p class="fe-grid__empty">{{ 'remote.grid.loading' | translate }}</p>
          } @else if (sortedEntries().length === 0 && !parentDir()) {
            <p class="fe-grid__empty">{{ 'remote.grid.emptyDir' | translate }}</p>
          } @else {
            @if (parentDir(); as parent) {
              <button
                type="button"
                class="fe-grid__row fe-grid__row--parent"
                role="listitem"
                (click)="open.emit(parent)"
                (contextmenu)="onEntryContextMenu($event, parent)"
              >
                <span class="fe-grid__col fe-grid__col-name">
                  <span class="fe-grid__entry-icon">📁</span>
                  <span class="fe-grid__name">..</span>
                </span>
                <span class="fe-grid__col fe-grid__col-size">—</span>
                <span class="fe-grid__col fe-grid__col-type">{{ 'remote.grid.parentDir' | translate }}</span>
                <span class="fe-grid__col fe-grid__col-date">—</span>
              </button>
            }
            @for (entry of sortedEntries(); track entry.path) {
              <button
                type="button"
                class="fe-grid__row"
                [class.fe-grid__row--selected]="selectedPath() === entry.path"
                [class.fe-grid__row--file]="isDraggable(entry)"
                role="listitem"
                (click)="onRowClick(entry)"
                (dblclick)="open.emit(entry)"
                (pointerdown)="onFilePointerDown(entry, $event)"
                (contextmenu)="onEntryContextMenu($event, entry)"
              >
                <span class="fe-grid__col fe-grid__col-name">
                  <span class="fe-grid__entry-icon">{{ entryIcon(entry) }}</span>
                  <span class="fe-grid__name">{{ entry.name }}</span>
                </span>
                <span class="fe-grid__col fe-grid__col-size">{{ formatSize(entry.size) }}</span>
                <span class="fe-grid__col fe-grid__col-type">{{ displayFileType(entry) }}</span>
                <span class="fe-grid__col fe-grid__col-date">{{ formatDate(entry.modifiedAt) }}</span>
              </button>
            }
          }
        </div>
      </div>

      @if (showDropZone()) {
        <div
          class="fe-pane__drop-overlay"
          [class.fe-pane__drop-overlay--active]="dropHighlight()"
          aria-hidden="true"
        >
          <span class="fe-pane__drop-title">{{ 'remote.grid.dropTitle' | translate }}</span>
          <span class="fe-pane__drop-sub">
            {{
              side() === 'remote'
                ? ('remote.grid.dropUpload' | translate)
                : ('remote.grid.dropDownload' | translate)
            }}
          </span>
        </div>
      }
    </section>

    @if (dragGhost(); as ghost) {
      <div
        class="fe-drag-ghost"
        [style.left.px]="ghost.x + 14"
        [style.top.px]="ghost.y + 10"
        aria-hidden="true"
      >
        <span class="fe-drag-ghost__icon">{{ entryIcon(ghost.entry) }}</span>
        <span class="fe-drag-ghost__name">{{ ghost.entry.name }}</span>
      </div>
    }

    @if (contextMenu(); as menu) {
      <termsh-explorer-context-menu
        [x]="menu.x"
        [y]="menu.y"
        [items]="menu.items"
        (close)="contextMenu.set(null)"
      />
    }
  `,
})
export class RemoteFileGridComponent {
  readonly side = input.required<PaneSide>();
  readonly label = input.required<string>();
  readonly path = input.required<string>();
  readonly entries = input.required<RemoteFileEntry[]>();
  readonly parentDir = input<RemoteFileEntry | null>(null);
  readonly selectedPath = input<string | null>(null);
  readonly busy = input(false);
  readonly canUp = input(false);
  readonly isDropTarget = input(false);
  readonly dragHoverActive = input(false);

  readonly select = output<RemoteFileEntry>();
  readonly open = output<RemoteFileEntry>();
  readonly up = output<void>();
  readonly refresh = output<void>();
  readonly uploadFile = output<string>();
  readonly downloadFile = output<string>();
  readonly pickUpload = output<void>();
  readonly dropLocalPaths = output<string[]>();
  readonly dropRemotePaths = output<string[]>();
  readonly dropOsPaths = output<string[]>();
  readonly dragSessionStart = output<void>();
  readonly dragSessionEnd = output<void>();
  readonly dragHoverTarget = output<PaneSide | null>();
  readonly pointerDrop = output<{ from: PaneSide; to: PaneSide; paths: string[] }>();

  private readonly settings = inject(SettingsStateService);
  private readonly translate = inject(TranslateService);

  readonly sort = signal<SortState>(DEFAULT_SORT);
  readonly dragOver = signal(false);
  readonly dragGhost = signal<{ entry: RemoteFileEntry; x: number; y: number } | null>(null);
  readonly contextMenu = signal<{ x: number; y: number; items: ExplorerMenuItem[] } | null>(null);

  readonly columns: { key: SortKey; labelKey: string; className: string }[] = [
    { key: "name", labelKey: "remote.grid.colName", className: "fe-grid__th fe-grid__col-name" },
    { key: "size", labelKey: "remote.grid.colSize", className: "fe-grid__th fe-grid__col-size" },
    { key: "type", labelKey: "remote.grid.colType", className: "fe-grid__th fe-grid__col-type" },
    { key: "modified", labelKey: "remote.grid.colModified", className: "fe-grid__th fe-grid__col-date" },
  ];

  readonly sortedEntries = computed(() => {
    const locale = toBcp47(this.settings.snapshot.locale);
    return sortExplorerEntries(this.entries(), this.sort(), null, locale);
  });

  private dragDepth = 0;
  private suppressClick = false;
  private pointerDrag: {
    entry: RemoteFileEntry;
    startX: number;
    startY: number;
    active: boolean;
    lastTarget: string | null;
  } | null = null;

  showDropZone() {
    return this.isDropTarget() || (this.dragOver() && !this.pointerDrag?.active);
  }

  dropHighlight() {
    return this.dragHoverActive() || this.dragOver();
  }

  isDraggable(entry: RemoteFileEntry) {
    return isDraggableEntry(entry);
  }

  formatSize(size: number | null) {
    return formatBytes(size);
  }

  formatDate(iso?: string) {
    const locale = toBcp47(this.settings.snapshot.locale);
    return formatModified(iso, locale);
  }

  displayFileType(entry: RemoteFileEntry): string {
    const key = fileTypeLabel(entry);
    const dot = entry.name.lastIndexOf(".");
    if (dot > 0 && dot < entry.name.length - 1 && key !== "folder" && key !== "link") {
      return entry.name.slice(dot + 1).toLowerCase();
    }
    return this.translate.instant(`remote.grid.fileTypes.${key}`, { defaultValue: key });
  }

  entryIcon(entry: RemoteFileEntry): string {
    if (entry.kind === "directory") return "📁";
    if (entry.kind === "symlink") return "🔗";
    return "📄";
  }

  onHeaderClick(key: SortKey) {
    this.sort.update((prev) => toggleSort(prev, key));
  }

  onRowClick(entry: RemoteFileEntry) {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    this.select.emit(entry);
  }

  private copyPath(entryPath: string) {
    void navigator.clipboard.writeText(entryPath);
  }

  onEntryContextMenu(event: MouseEvent, entry: RemoteFileEntry) {
    event.preventDefault();
    event.stopPropagation();
    this.select.emit(entry);

    const items: ExplorerMenuItem[] = [];

    if (isDirectoryEntry(entry)) {
      items.push({
        id: "open",
        label: this.translate.instant(
          entry.name === ".." ? "remote.grid.goParent" : "remote.grid.open",
        ),
        onClick: () => this.open.emit(entry),
      });
    } else if (this.side() === "local" && isFileEntry(entry)) {
      items.push({
        id: "upload",
        label: this.translate.instant("remote.grid.uploadToServer"),
        onClick: () => this.uploadFile.emit(entry.path),
      });
    } else if (this.side() === "remote" && isFileEntry(entry)) {
      items.push({
        id: "download",
        label: this.translate.instant("remote.grid.download"),
        onClick: () => this.downloadFile.emit(entry.path),
      });
    }

    items.push({
      id: "copy-path",
      label: this.translate.instant("remote.grid.copyPath"),
      onClick: () => this.copyPath(entry.path),
    });

    this.contextMenu.set({ x: event.clientX, y: event.clientY, items });
  }

  onPaneContextMenu(event: MouseEvent) {
    event.preventDefault();
    const items: ExplorerMenuItem[] = [
      {
        id: "refresh",
        label: this.translate.instant("remote.grid.refresh"),
        onClick: () => this.refresh.emit(),
      },
      {
        id: "up",
        label: this.translate.instant("remote.grid.parentDir"),
        disabled: !this.canUp(),
        onClick: () => this.up.emit(),
      },
    ];
    if (this.side() === "remote") {
      items.push({
        id: "pick-upload",
        label: this.translate.instant("remote.grid.pickUpload"),
        onClick: () => this.pickUpload.emit(),
      });
    }
    this.contextMenu.set({ x: event.clientX, y: event.clientY, items });
  }

  private acceptMime(types: readonly string[]) {
    const list = [...types];
    const side = this.side();
    const acceptMime = side === "remote" ? MIME_LOCAL_PATH : MIME_REMOTE_PATH;
    return (
      list.includes(acceptMime) ||
      (side === "remote" && list.includes(MIME_LOCAL_PATH)) ||
      (side === "local" && list.includes(MIME_REMOTE_PATH)) ||
      list.includes("Files")
    );
  }

  onDragOver(event: DragEvent) {
    if (!this.acceptsTransfer(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    this.dragOver.set(true);
  }

  onDragEnter(event: DragEvent) {
    if (!this.acceptsTransfer(event)) return;
    event.preventDefault();
    this.dragDepth += 1;
    this.dragOver.set(true);
  }

  onDragLeave() {
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) this.dragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragDepth = 0;
    this.dragOver.set(false);
    this.dragSessionEnd.emit();

    const dt = event.dataTransfer;
    if (!dt) return;

    const osPaths = readDroppedFilePaths(dt);
    if (osPaths.length > 0) {
      this.dropOsPaths.emit(osPaths);
      return;
    }

    const localPath = readLocalDragPath(dt);
    if (localPath && this.side() === "remote") {
      this.dropLocalPaths.emit([localPath]);
      return;
    }

    const remotePath = readRemoteDragPath(dt);
    if (remotePath && this.side() === "local") {
      this.dropRemotePaths.emit([remotePath]);
    }
  }

  private acceptsTransfer(event: DragEvent) {
    return this.acceptMime(event.dataTransfer?.types ?? []);
  }

  onFilePointerDown(entry: RemoteFileEntry, event: PointerEvent) {
    if (!isDraggableEntry(entry) || event.button !== 0) return;
    event.preventDefault();

    const row = event.currentTarget as HTMLElement;
    row.setPointerCapture(event.pointerId);
    this.pointerDrag = {
      entry,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      lastTarget: null,
    };

    const onMove = (ev: PointerEvent) => {
      const session = this.pointerDrag;
      if (!session) return;

      if (!shouldActivatePointerDrag(session, ev.clientX, ev.clientY)) return;

      if (!session.active) {
        session.active = true;
        document.body.classList.add("fe-is-dragging");
        this.dragSessionStart.emit();
      }

      this.dragGhost.set({ entry: session.entry, x: ev.clientX, y: ev.clientY });

      const overSide = dropPaneSideAtPoint(ev.clientX, ev.clientY);
      if (overSide) session.lastTarget = overSide;
      const validTarget = overSide !== null && overSide !== this.side();
      this.dragHoverTarget.emit(validTarget ? (overSide as PaneSide) : null);
    };

    const onUp = (ev: PointerEvent) => {
      const session = this.pointerDrag;
      try {
        row.releasePointerCapture(ev.pointerId);
      } catch {
        /* already released */
      }

      if (session?.active) {
        this.suppressClick = true;
        this.dragGhost.set(null);
        const overSide = dropPaneSideAtPoint(ev.clientX, ev.clientY) ?? session.lastTarget;
        if (overSide && overSide !== this.side()) {
          this.pointerDrop.emit({
            from: this.side(),
            to: overSide as PaneSide,
            paths: [session.entry.path],
          });
        }
      }

      this.endPointerDrag();
      this.dragDepth = 0;
      this.dragOver.set(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  private endPointerDrag() {
    this.pointerDrag = null;
    this.dragGhost.set(null);
    document.body.classList.remove("fe-is-dragging");
    this.dragHoverTarget.emit(null);
    this.dragSessionEnd.emit();
  }
}
