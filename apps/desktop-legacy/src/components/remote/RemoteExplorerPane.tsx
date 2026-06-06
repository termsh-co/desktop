import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import type { Host, RemoteFileEntry, Session } from "@termsh/shared";
import { open } from "@tauri-apps/plugin-dialog";
import { FileExplorerGrid } from "@/components/remote/FileExplorerGrid";
import { formatAppError } from "@/lib/errors/appError";
import { isDirectoryEntry, isFileEntry } from "@/lib/remote/entries";
import {
  localCopyInto,
  localHomeDir,
  localListDir,
  remoteDownloadHost,
  remoteListDirHost,
  remoteUploadHost,
} from "@/lib/remote/ipc";
import {
  basename,
  joinLocalPath,
  normalizeRemotePath,
  parentLocalPath,
  parentRemotePath,
  remoteDirWithFile,
} from "@/lib/remote/paths";
import { useHostStore } from "@/stores/hostStore";
import { useSessionStore } from "@/stores/sessionStore";

type TransferItem = {
  id: string;
  label: string;
  direction: "up" | "down";
  status: "running" | "done" | "error";
  message?: string;
};

function parentDirEntry(_path: string, parent: string | null): RemoteFileEntry | null {
  if (!parent) return null;
  return {
    name: "..",
    path: parent,
    kind: "directory",
    size: null,
  };
}

type SessionPaneProps = {
  session: Session;
  host: Host | null;
  active: boolean;
};

function RemoteExplorerSession({ session, host, active }: SessionPaneProps) {
  const { t } = useTranslation("remote");
  const markRemoteConnecting = useSessionStore((s) => s.markRemoteConnecting);
  const markRemoteReady = useSessionStore((s) => s.markRemoteReady);
  const markRemoteFailed = useSessionStore((s) => s.markRemoteFailed);
  const setRemotePath = useSessionStore((s) => s.setRemotePath);
  const closeSession = useSessionStore((s) => s.closeSession);

  const remotePath = session.remotePath ?? "/";
  const protocol = (session.remoteProtocol ?? "sftp").toUpperCase();

  const [localPath, setLocalPath] = useState("");
  const [remoteEntries, setRemoteEntries] = useState<RemoteFileEntry[]>([]);
  const [localEntries, setLocalEntries] = useState<RemoteFileEntry[]>([]);
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const [remoteSelected, setRemoteSelected] = useState<string | null>(null);
  const [remoteBusy, setRemoteBusy] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [dragFrom, setDragFrom] = useState<"local" | "remote" | null>(null);
  const [dragHoverTarget, setDragHoverTarget] = useState<"local" | "remote" | null>(null);

  const hostId = session.hostId ?? "";
  const remoteBootstrapped = useRef(false);

  useEffect(() => {
    remoteBootstrapped.current = false;
  }, [session.id]);

  useEffect(() => {
    const clearDrag = () => {
      setDragFrom(null);
      setDragHoverTarget(null);
    };
    window.addEventListener("dragend", clearDrag);
    return () => window.removeEventListener("dragend", clearDrag);
  }, []);

  const onSplitDragEnter = (event: DragEvent) => {
    if (event.dataTransfer.types.includes("Files")) {
      setDragFrom("local");
    }
  };

  const loadRemote = useCallback(
    async (targetPath: string) => {
      if (!hostId) return;
      const normalized = normalizeRemotePath(targetPath);
      setRemoteBusy(true);
      const alreadyReady =
        useSessionStore.getState().sessions.find((s) => s.id === session.id)?.remotePhase ===
        "ready";
      if (!alreadyReady) markRemoteConnecting(session.id);
      try {
        const rows = await remoteListDirHost({ hostId, path: normalized });
        setRemoteEntries(rows);
        setRemotePath(session.id, normalized);
        setRemoteSelected(null);
        markRemoteReady(session.id);
      } catch (err) {
        markRemoteFailed(session.id, formatAppError(err));
        setRemoteEntries([]);
      } finally {
        setRemoteBusy(false);
      }
    },
    [hostId, markRemoteConnecting, markRemoteFailed, markRemoteReady, session.id, setRemotePath],
  );

  const loadLocal = useCallback(async (targetPath: string) => {
    setLocalBusy(true);
    try {
      const rows = await localListDir(targetPath);
      setLocalEntries(rows);
      setLocalPath(targetPath);
      setLocalSelected(null);
    } catch (err) {
      setTransfers((prev) => [
        {
          id: crypto.randomUUID(),
          label: t("explorer.localList"),
          direction: "down",
          status: "error",
          message: formatAppError(err),
        },
        ...prev.slice(0, 7),
      ]);
    } finally {
      setLocalBusy(false);
    }
  }, [t]);

  useEffect(() => {
    if (!active || localPath) return;
    void localHomeDir().then((home) => loadLocal(home));
  }, [active, loadLocal, localPath]);

  useEffect(() => {
    if (!active || !hostId) return;
    if (remoteBootstrapped.current) return;
    if (session.remotePhase === "failed") return;
    if (session.remotePhase === "ready" && remoteEntries.length > 0) {
      remoteBootstrapped.current = true;
      return;
    }
    remoteBootstrapped.current = true;
    void loadRemote(session.remotePath ?? "/");
  }, [active, hostId, loadRemote, remoteEntries.length, session.id, session.remotePath, session.remotePhase]);

  const pushTransfer = (item: Omit<TransferItem, "id">) => {
    const id = crypto.randomUUID();
    setTransfers((prev) => [{ ...item, id }, ...prev.slice(0, 7)]);
    return id;
  };

  const finishTransfer = (id: string, status: "done" | "error", message?: string) => {
    setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status, message } : t)));
  };

  const runUpload = async (localFilePath: string) => {
    const name = basename(localFilePath);
    const entry = localEntries.find((e) => e.path === localFilePath);
    if (entry && !isFileEntry(entry)) {
      pushTransfer({
        label: name,
        direction: "up",
        status: "error",
        message: t("explorer.errors.foldersCannotUpload"),
      });
      return;
    }
    if (!hostId) {
      pushTransfer({
        label: name,
        direction: "up",
        status: "error",
        message: t("explorer.errors.noServerSession"),
      });
      return;
    }
    const remoteTarget = remoteDirWithFile(remotePath, name);
    const transferId = pushTransfer({ label: name, direction: "up", status: "running" });
    try {
      await remoteUploadHost({ hostId, localPath: localFilePath, remotePath: remoteTarget });
      finishTransfer(transferId, "done");
    } catch (err) {
      finishTransfer(transferId, "error", formatAppError(err));
    }
  };

  const runDownload = async (remoteFilePath: string) => {
    const name = basename(remoteFilePath);
    const entry = remoteEntries.find((e) => e.path === remoteFilePath);
    if (entry && !isFileEntry(entry)) {
      pushTransfer({
        label: name,
        direction: "down",
        status: "error",
        message:
          entry.kind === "symlink"
            ? t("explorer.errors.symlinkCannotDownload")
            : t("explorer.errors.foldersCannotDownload"),
      });
      return;
    }
    if (!hostId) {
      pushTransfer({
        label: name,
        direction: "down",
        status: "error",
        message: t("explorer.errors.noServerSession"),
      });
      return;
    }
    if (!localPath) {
      pushTransfer({
        label: name,
        direction: "down",
        status: "error",
        message: t("explorer.errors.localFolderNotLoaded"),
      });
      return;
    }
    const localTarget = joinLocalPath(localPath, name);
    const transferId = pushTransfer({ label: name, direction: "down", status: "running" });
    try {
      await remoteDownloadHost({ hostId, remotePath: remoteFilePath, localPath: localTarget });
      finishTransfer(transferId, "done");
    } catch (err) {
      finishTransfer(transferId, "error", formatAppError(err));
    }
  };

  const uploadMany = async (paths: string[]) => {
    for (const p of paths) {
      await runUpload(p);
    }
    await loadRemote(remotePath);
  };

  const downloadMany = async (paths: string[]) => {
    if (paths.length === 0) return;
    for (const p of paths) {
      await runDownload(p);
    }
    if (localPath) await loadLocal(localPath);
  };

  const handlePointerDrop = (from: "local" | "remote", to: "local" | "remote", paths: string[]) => {
    if (from === to || paths.length === 0) return;
    if (from === "local" && to === "remote") {
      void uploadMany(paths);
    } else if (from === "remote" && to === "local") {
      void downloadMany(paths);
    }
  };

  const copyIntoLocal = async (paths: string[]) => {
    if (!localPath || paths.length === 0) return;
    const transferId = pushTransfer({
      label: t("explorer.filesCount", { count: paths.length }),
      direction: "down",
      status: "running",
    });
    try {
      await localCopyInto(localPath, paths);
      finishTransfer(transferId, "done");
      await loadLocal(localPath);
    } catch (err) {
      finishTransfer(transferId, "error", formatAppError(err));
    }
  };

  const localSelectedEntry = localEntries.find((e) => e.path === localSelected) ?? null;
  const remoteSelectedEntry = remoteEntries.find((e) => e.path === remoteSelected) ?? null;

  const canUpload = localSelectedEntry && isFileEntry(localSelectedEntry);
  const canDownload = remoteSelectedEntry && isFileEntry(remoteSelectedEntry);

  const onPickUpload = async () => {
    const picked = await open({ multiple: true, directory: false });
    if (!picked) return;
    const paths = Array.isArray(picked) ? picked : [picked];
    await uploadMany(paths);
  };

  const localParent = parentLocalPath(localPath);
  const remoteParent = parentRemotePath(remotePath);

  const subtitle = host ? `${host.username}@${host.hostname}:${host.port}` : "—";

  return (
    <div
      className={`fe ${active ? "fe--active" : ""}`}
      aria-hidden={!active}
      onContextMenu={(e) => e.preventDefault()}
    >
      <header className="fe__head">
        <div className="fe__conn">
          <span className="fe__proto">{protocol}</span>
          <span className="fe__title">{session.title}</span>
          <span className="fe__addr">{subtitle}</span>
        </div>
        <div className="fe__xfer">
          <button
            type="button"
            className="fe__xfer-btn"
            disabled={!canUpload || remoteBusy}
            onClick={() => canUpload && localSelectedEntry && void runUpload(localSelectedEntry.path).then(() => loadRemote(remotePath))}
            title={t("explorer.uploadSelectedTitle")}
          >
            {t("explorer.upload")}
          </button>
          <button
            type="button"
            className="fe__xfer-btn"
            disabled={!canDownload || remoteBusy || localBusy}
            onClick={() =>
              canDownload &&
              remoteSelectedEntry &&
              void runDownload(remoteSelectedEntry.path).then(() => loadLocal(localPath))
            }
            title={t("explorer.downloadSelectedTitle")}
          >
            {t("explorer.download")}
          </button>
          <button
            type="button"
            className="fe__xfer-btn fe__xfer-btn--ghost"
            disabled={remoteBusy}
            onClick={() => void onPickUpload()}
          >
            {t("explorer.pickFile")}
          </button>
        </div>
      </header>

      {session.remoteError && (
        <div className="fe__banner">
          <span>{formatAppError(session.remoteError)}</span>
          <button type="button" className="fe__banner-btn" onClick={() => void loadRemote(remotePath)}>
            {t("explorer.retry")}
          </button>
          <button type="button" className="fe__banner-btn" onClick={() => void closeSession(session.id)}>
            {t("common:actions.close")}
          </button>
        </div>
      )}

      <div
        className="fe__split"
        onDragEnter={onSplitDragEnter}
      >
        <FileExplorerGrid
          side="local"
          label={t("explorer.local")}
          path={localPath}
          entries={localEntries}
          parentEntry={parentDirEntry(localPath, localParent)}
          selectedPath={localSelected}
          busy={localBusy}
          canUp={Boolean(localParent)}
          onUp={() => localParent && void loadLocal(localParent)}
          onRefresh={() => localPath && void loadLocal(localPath)}
          onSelect={(e) => {
            if (e.name === ".." && isDirectoryEntry(e)) {
              void loadLocal(e.path);
              return;
            }
            setLocalSelected(e.path);
          }}
          onOpenDir={(e) => isDirectoryEntry(e) && void loadLocal(e.path)}
          onDropLocalPaths={(paths) => void uploadMany(paths)}
          onDropRemotePaths={(paths) => void downloadMany(paths)}
          onDropOsPaths={(paths) => void copyIntoLocal(paths)}
          isDropTarget={dragFrom === "remote"}
          dragHoverActive={dragHoverTarget === "local"}
          onDragSessionStart={() => setDragFrom("local")}
          onDragSessionEnd={() => {
            setDragFrom(null);
            setDragHoverTarget(null);
          }}
          onDragHoverTarget={setDragHoverTarget}
          onPointerDrop={handlePointerDrop}
          onUploadFile={(path) =>
            void runUpload(path).then(() => loadRemote(remotePath))
          }
        />

        <FileExplorerGrid
          side="remote"
          label={t("explorer.remote")}
          path={remotePath}
          entries={remoteEntries}
          parentEntry={parentDirEntry(remotePath, remoteParent)}
          selectedPath={remoteSelected}
          busy={remoteBusy}
          canUp={Boolean(remoteParent)}
          onUp={() => remoteParent && void loadRemote(remoteParent)}
          onRefresh={() => void loadRemote(remotePath)}
          onSelect={(e) => {
            if (e.name === ".." && isDirectoryEntry(e)) {
              void loadRemote(e.path);
              return;
            }
            setRemoteSelected(e.path);
          }}
          onOpenDir={(e) => isDirectoryEntry(e) && void loadRemote(e.path)}
          onDropLocalPaths={(paths) => void uploadMany(paths)}
          onDropRemotePaths={(paths) => void downloadMany(paths)}
          onDropOsPaths={(paths) => void uploadMany(paths.filter((p) => !p.endsWith("/")))}
          isDropTarget={dragFrom === "local"}
          dragHoverActive={dragHoverTarget === "remote"}
          onDragSessionStart={() => setDragFrom("remote")}
          onDragSessionEnd={() => {
            setDragFrom(null);
            setDragHoverTarget(null);
          }}
          onDragHoverTarget={setDragHoverTarget}
          onPointerDrop={handlePointerDrop}
          onDownloadFile={(path) => void runDownload(path).then(() => loadLocal(localPath))}
          onPickUpload={() => void onPickUpload()}
        />
      </div>

      {transfers.length > 0 && (
        <footer className="fe__foot">
          <ul className="fe__foot-list">
            {transfers.map((xfer) => (
              <li key={xfer.id} className={`fe__foot-item fe__foot-item--${xfer.status}`}>
                <span>{xfer.direction === "up" ? "↑" : "↓"}</span>
                <span>{xfer.label}</span>
                <span>
                  {xfer.status === "running"
                    ? t("explorer.transferRunning")
                    : xfer.status === "done"
                      ? t("explorer.transferDone")
                      : t("explorer.transferError")}
                </span>
                {xfer.message && <span className="fe__foot-err">{xfer.message}</span>}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </div>
  );
}

export function RemoteExplorerPane() {
  const { t } = useTranslation("remote");
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const hosts = useHostStore((s) => s.hosts);

  const remoteSessions = useMemo(() => sessions.filter((s) => s.kind === "remote"), [sessions]);

  if (remoteSessions.length === 0) {
    return (
      <div className="terminal terminal--idle">
        <p className="terminal__hint">{t("explorer.idleHint")}</p>
      </div>
    );
  }

  return (
    <div className="view view--remote-explorer">
      {remoteSessions.map((session) => (
        <RemoteExplorerSession
          key={session.id}
          session={session}
          host={hosts.find((h) => h.id === session.hostId) ?? null}
          active={session.id === activeSessionId}
        />
      ))}
    </div>
  );
}
