import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
  signal,
} from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { formatAppError, type Host, type RemoteFileEntry, type Session } from "@termsh/common";
import { TermshPlatformService } from "@termsh/platform";
import { HostStateService, SessionStateService } from "@termsh/state";
import type { PaneSide } from "./remote-drag";
import { RemoteFileGridComponent } from "./remote-file-grid.component";
import {
  basename,
  isDirectoryEntry,
  isFileEntry,
  joinLocalPath,
  parentLocalPath,
  parentRemotePath,
  remoteDirWithFile,
} from "./remote-format";

type TransferItem = {
  id: string;
  label: string;
  direction: "up" | "down";
  status: "running" | "done" | "error";
  message?: string;
};

@Component({
  selector: "termsh-remote-explorer-pane",
  standalone: true,
  imports: [TranslateModule, RemoteFileGridComponent],
  template: `
    <div class="view view--remote-explorer fe fe--active">
      <header class="fe__head">
        <div class="fe__conn">
          <span class="fe__proto">{{ protocol }}</span>
          @if (host) {
            <span class="fe__title">{{ host.name }}</span>
            <span class="fe__addr">{{ host.username }}&#64;{{ host.hostname }}:{{ host.port }}</span>
          }
        </div>
        <div class="fe__xfer">
          <button
            type="button"
            class="fe__xfer-btn"
            [disabled]="!canUpload || remoteBusy()"
            [title]="'remote.explorer.uploadSelectedTitle' | translate"
            (click)="uploadSelected()"
          >
            {{ 'remote.explorer.upload' | translate }}
          </button>
          <button
            type="button"
            class="fe__xfer-btn"
            [disabled]="!canDownload || remoteBusy() || localBusy()"
            [title]="'remote.explorer.downloadSelectedTitle' | translate"
            (click)="downloadSelected()"
          >
            {{ 'remote.explorer.download' | translate }}
          </button>
          <button
            type="button"
            class="fe__xfer-btn fe__xfer-btn--ghost"
            [disabled]="remoteBusy()"
            (click)="pickAndUpload()"
          >
            {{ 'remote.explorer.pickFile' | translate }}
          </button>
        </div>
      </header>

      @if (error()) {
        <div class="fe__banner" role="alert">
          <span>{{ error() }}</span>
          <button type="button" class="fe__banner-btn" (click)="loadRemote()">
            {{ 'remote.explorer.retry' | translate }}
          </button>
        </div>
      }

      @if (transfers().length > 0) {
        <div class="fe__xfer-status">
          @for (t of transfers(); track t.id) {
            <span class="fe__xfer-item" [class.fe__xfer-item--error]="t.status === 'error'">
              {{ t.direction === 'up' ? '↑' : '↓' }} {{ t.label }}
              @if (t.status === 'running') { {{ 'remote.explorer.transferRunning' | translate }} }
              @if (t.status === 'done') { {{ 'remote.explorer.transferDone' | translate }} }
              @if (t.status === 'error') { {{ 'remote.explorer.transferError' | translate }} }
              @if (t.message) { — {{ t.message }} }
            </span>
          }
        </div>
      }

      <div class="fe__split" (dragenter)="onSplitDragEnter($event)">
        <termsh-remote-file-grid
          side="local"
          [label]="'remote.explorer.local' | translate"
          [path]="localPath"
          [entries]="localEntries()"
          [parentDir]="localParentDir"
          [selectedPath]="localSelected()"
          [busy]="localBusy()"
          [canUp]="!!localParentPath(localPath)"
          [isDropTarget]="dragFrom() === 'remote'"
          [dragHoverActive]="dragHoverTarget() === 'local'"
          (select)="onLocalSelect($event)"
          (open)="onLocalOpen($event)"
          (up)="goLocalUp()"
          (refresh)="loadLocal()"
          (uploadFile)="runUpload($event)"
          (dropLocalPaths)="uploadMany($event)"
          (dropRemotePaths)="downloadMany($event)"
          (dropOsPaths)="copyIntoLocal($event)"
          (dragSessionStart)="dragFrom.set('local')"
          (dragSessionEnd)="clearDrag()"
          (dragHoverTarget)="onDragHoverTarget($event)"
          (pointerDrop)="handlePointerDrop($event)"
        />
        <termsh-remote-file-grid
          side="remote"
          [label]="'remote.explorer.remote' | translate"
          [path]="remotePath"
          [entries]="remoteEntries()"
          [parentDir]="remoteParentDir"
          [selectedPath]="remoteSelected()"
          [busy]="remoteBusy()"
          [canUp]="canRemoteUp"
          [isDropTarget]="dragFrom() === 'local'"
          [dragHoverActive]="dragHoverTarget() === 'remote'"
          (select)="onRemoteSelect($event)"
          (open)="onRemoteOpen($event)"
          (up)="goRemoteUp()"
          (refresh)="loadRemote()"
          (downloadFile)="runDownload($event)"
          (pickUpload)="pickAndUpload()"
          (uploadFile)="runUpload($event)"
          (dropLocalPaths)="uploadMany($event)"
          (dropRemotePaths)="downloadMany($event)"
          (dropOsPaths)="uploadOsPaths($event)"
          (dragSessionStart)="dragFrom.set('remote')"
          (dragSessionEnd)="clearDrag()"
          (dragHoverTarget)="onDragHoverTarget($event)"
          (pointerDrop)="handlePointerDrop($event)"
        />
      </div>
    </div>
  `,
})
export class RemoteExplorerPaneComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) session!: Session;
  @Input() active = false;

  private readonly platform = inject(TermshPlatformService);
  private readonly hosts = inject(HostStateService);
  private readonly sessions = inject(SessionStateService);
  private readonly translate = inject(TranslateService);

  private formatError(err: unknown): string {
    return formatAppError(err, (key, params) => this.translate.instant(key, params));
  }

  readonly remoteEntries = signal<RemoteFileEntry[]>([]);
  readonly localEntries = signal<RemoteFileEntry[]>([]);
  readonly remoteBusy = signal(false);
  readonly localBusy = signal(false);
  readonly error = signal<string | null>(null);
  readonly localSelected = signal<string | null>(null);
  readonly remoteSelected = signal<string | null>(null);
  readonly transfers = signal<TransferItem[]>([]);
  readonly dragFrom = signal<PaneSide | null>(null);
  readonly dragHoverTarget = signal<PaneSide | null>(null);

  host: Host | null = null;
  remotePath = "/";
  localPath = "";
  protocol = "SFTP";

  private bootstrapped = false;
  private lastSessionId: string | null = null;
  private readonly onWindowDragEnd = () => this.clearDrag();

  ngOnInit() {
    window.addEventListener("dragend", this.onWindowDragEnd);
  }

  ngOnDestroy() {
    window.removeEventListener("dragend", this.onWindowDragEnd);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["session"] || changes["active"]) {
      this.syncFromSession();
      if (this.active && this.host && !this.bootstrapped) {
        this.bootstrapped = true;
        void this.bootstrap();
      }
    }
  }

  get remoteParentDir(): RemoteFileEntry | null {
    const parent = parentRemotePath(this.remotePath);
    if (!parent) return null;
    return { name: "..", path: parent, kind: "directory", size: null };
  }

  get localParentDir(): RemoteFileEntry | null {
    const parent = parentLocalPath(this.localPath);
    if (!parent) return null;
    return { name: "..", path: parent, kind: "directory", size: null };
  }

  get canRemoteUp(): boolean {
    return parentRemotePath(this.remotePath) !== null;
  }

  get canUpload(): boolean {
    const entry = this.localEntries().find((e) => e.path === this.localSelected());
    return Boolean(entry && isFileEntry(entry));
  }

  get canDownload(): boolean {
    const entry = this.remoteEntries().find((e) => e.path === this.remoteSelected());
    return Boolean(entry && isFileEntry(entry));
  }

  localParentPath = parentLocalPath;

  private syncFromSession() {
    const sessionChanged = this.lastSessionId !== this.session.id;
    if (sessionChanged) {
      this.lastSessionId = this.session.id;
      this.bootstrapped = false;
      this.remoteEntries.set([]);
      this.localEntries.set([]);
      this.error.set(null);
      this.localSelected.set(null);
      this.remoteSelected.set(null);
      this.transfers.set([]);
    }

    this.host = this.session.hostId
      ? (this.hosts.hosts.find((h) => h.id === this.session.hostId) ?? null)
      : null;
    this.remotePath = this.session.remotePath ?? "/";
    this.protocol = (this.session.remoteProtocol ?? "sftp").toUpperCase();
  }

  private async bootstrap() {
    try {
      this.localPath = await this.platform.localHomeDir();
      await Promise.all([this.loadLocal(), this.loadRemote()]);
    } catch (e) {
      this.error.set(this.formatError(e));
    }
  }

  onLocalSelect(entry: RemoteFileEntry) {
    if (entry.name === ".." && isDirectoryEntry(entry)) {
      this.localPath = entry.path;
      void this.loadLocal();
      return;
    }
    this.localSelected.set(entry.path);
  }

  onLocalOpen(entry: RemoteFileEntry) {
    if (isDirectoryEntry(entry)) {
      this.localPath = entry.path;
      void this.loadLocal();
    }
  }

  onRemoteSelect(entry: RemoteFileEntry) {
    if (entry.name === ".." && isDirectoryEntry(entry)) {
      this.openRemoteDir(entry.path);
      return;
    }
    this.remoteSelected.set(entry.path);
  }

  onRemoteOpen(entry: RemoteFileEntry) {
    if (isDirectoryEntry(entry)) {
      this.openRemoteDir(entry.path);
    }
  }

  goLocalUp() {
    const parent = parentLocalPath(this.localPath);
    if (!parent) return;
    this.localPath = parent;
    void this.loadLocal();
  }

  goRemoteUp() {
    const parent = parentRemotePath(this.remotePath);
    if (!parent) return;
    this.openRemoteDir(parent);
  }

  private openRemoteDir(path: string) {
    this.sessions.setRemotePath(this.session.id, path);
    this.remotePath = path;
    void this.loadRemote();
  }

  async loadLocal() {
    if (!this.localPath) return;
    this.localBusy.set(true);
    try {
      const list = await this.platform.localListDir(this.localPath);
      this.localEntries.set(list);
    } catch (e) {
      this.error.set(this.formatError(e));
    } finally {
      this.localBusy.set(false);
    }
  }

  async loadRemote() {
    if (!this.host) {
      this.error.set("Host not found");
      this.sessions.markRemoteFailed(this.session.id, "Host not found");
      return;
    }

    this.remoteBusy.set(true);
    this.error.set(null);
    this.sessions.markRemoteConnecting(this.session.id);

    try {
      const list = await this.platform.remoteListDir(this.host.id, this.remotePath);
      this.remoteEntries.set(list);
      this.sessions.markRemoteReady(this.session.id);
    } catch (e) {
      const message = this.formatError(e);
      this.error.set(message);
      this.sessions.markRemoteFailed(this.session.id, message);
    } finally {
      this.remoteBusy.set(false);
    }
  }

  clearDrag() {
    this.dragFrom.set(null);
    this.dragHoverTarget.set(null);
  }

  onDragHoverTarget(target: PaneSide | null) {
    this.dragHoverTarget.set(target);
  }

  onSplitDragEnter(event: DragEvent) {
    if (event.dataTransfer?.types.includes("Files")) {
      this.dragFrom.set("local");
    }
  }

  handlePointerDrop(event: { from: PaneSide; to: PaneSide; paths: string[] }) {
    if (event.from === event.to || event.paths.length === 0) return;
    if (event.from === "local" && event.to === "remote") {
      void this.uploadMany(event.paths);
    } else if (event.from === "remote" && event.to === "local") {
      void this.downloadMany(event.paths);
    }
  }

  uploadOsPaths(paths: string[]) {
    void this.uploadMany(paths.filter((p) => !p.endsWith("/")));
  }

  uploadMany(paths: string[]) {
    void (async () => {
      for (const p of paths) {
        await this.runUpload(p);
      }
      await this.loadRemote();
    })();
  }

  downloadMany(paths: string[]) {
    if (paths.length === 0) return;
    void (async () => {
      for (const p of paths) {
        await this.runDownload(p);
      }
      if (this.localPath) await this.loadLocal();
    })();
  }

  copyIntoLocal(paths: string[]) {
    if (!this.localPath || paths.length === 0) return;
    void (async () => {
      const transferId = this.pushTransfer({
        label: this.translate.instant("remote.explorer.filesCount", { count: paths.length }),
        direction: "down",
        status: "running",
      });
      try {
        await this.platform.localCopyInto(this.localPath, paths);
        this.finishTransfer(transferId, "done");
        await this.loadLocal();
      } catch (e) {
        this.finishTransfer(transferId, "error", this.formatError(e));
      }
    })();
  }

  uploadSelected() {
    const path = this.localSelected();
    if (!path) return;
    void this.runUpload(path);
  }

  downloadSelected() {
    const path = this.remoteSelected();
    if (!path) return;
    void this.runDownload(path);
  }

  async pickAndUpload() {
    const paths = await this.platform.pickFiles(true);
    for (const p of paths) {
      await this.runUpload(p);
    }
    await this.loadRemote();
  }

  async runUpload(localFilePath: string) {
    const name = basename(localFilePath);
    const entry = this.localEntries().find((e) => e.path === localFilePath);
    if (entry && !isFileEntry(entry)) {
      this.pushTransfer({
        label: name,
        direction: "up",
        status: "error",
        message: this.translate.instant("remote.explorer.errors.foldersCannotUpload"),
      });
      return;
    }
    if (!this.host) {
      this.pushTransfer({
        label: name,
        direction: "up",
        status: "error",
        message: this.translate.instant("remote.explorer.errors.noServerSession"),
      });
      return;
    }

    const remoteTarget = remoteDirWithFile(this.remotePath, name);
    const transferId = this.pushTransfer({ label: name, direction: "up", status: "running" });
    try {
      await this.platform.remoteUpload(this.host.id, localFilePath, remoteTarget);
      this.finishTransfer(transferId, "done");
    } catch (e) {
      this.finishTransfer(transferId, "error", this.formatError(e));
    }
  }

  async runDownload(remoteFilePath: string) {
    const name = basename(remoteFilePath);
    const entry = this.remoteEntries().find((e) => e.path === remoteFilePath);
    if (entry && !isFileEntry(entry)) {
      this.pushTransfer({
        label: name,
        direction: "down",
        status: "error",
        message:
          entry.kind === "symlink"
            ? this.translate.instant("remote.explorer.errors.symlinkCannotDownload")
            : this.translate.instant("remote.explorer.errors.foldersCannotDownload"),
      });
      return;
    }
    if (!this.host) {
      this.pushTransfer({
        label: name,
        direction: "down",
        status: "error",
        message: this.translate.instant("remote.explorer.errors.noServerSession"),
      });
      return;
    }
    if (!this.localPath) {
      this.pushTransfer({
        label: name,
        direction: "down",
        status: "error",
        message: this.translate.instant("remote.explorer.errors.localFolderNotLoaded"),
      });
      return;
    }

    const localTarget = joinLocalPath(this.localPath, name);
    const transferId = this.pushTransfer({ label: name, direction: "down", status: "running" });
    try {
      await this.platform.remoteDownload(this.host.id, remoteFilePath, localTarget);
      this.finishTransfer(transferId, "done");
      await this.loadLocal();
    } catch (e) {
      this.finishTransfer(transferId, "error", this.formatError(e));
    }
  }

  private pushTransfer(item: Omit<TransferItem, "id">): string {
    const id = crypto.randomUUID();
    this.transfers.update((list) => [...list, { ...item, id }]);
    return id;
  }

  private finishTransfer(id: string, status: "done" | "error", message?: string) {
    this.transfers.update((list) =>
      list.map((t) => (t.id === id ? { ...t, status, message } : t)),
    );
    setTimeout(() => {
      this.transfers.update((list) => list.filter((t) => t.id !== id || t.status === "error"));
    }, status === "done" ? 2500 : 8000);
  }
}
