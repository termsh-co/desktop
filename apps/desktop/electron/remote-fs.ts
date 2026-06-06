import { basename } from "node:path";
import type { SFTPWrapper } from "ssh2";
import { withSftp } from "./ssh-sftp";

export type RemoteFileKind = "file" | "directory" | "symlink" | "other";

export type RemoteFileEntry = {
  name: string;
  path: string;
  kind: RemoteFileKind;
  size: number | null;
  modifiedAt?: string;
};

function mapFileKind(isFile: boolean, isDir: boolean, isLink: boolean): RemoteFileKind {
  if (isLink) return "symlink";
  if (isDir) return "directory";
  if (isFile) return "file";
  return "other";
}

function joinRemotePath(dir: string, name: string): string {
  const base = dir === "/" ? "" : dir.replace(/\/$/, "");
  return `${base}/${name}`.replace(/\/+/g, "/");
}

function normalizeRemotePath(path: string): string {
  const p = path.trim();
  return p.length === 0 ? "/" : p;
}

function remoteDirWithFile(dir: string, fileName: string): string {
  const base = normalizeRemotePath(dir);
  if (base === "/") return `/${fileName}`;
  return `${base.replace(/\/$/, "")}/${fileName}`;
}

function sortEntries(entries: RemoteFileEntry[]): void {
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function listRemoteDir(
  hostId: string,
  remotePath: string,
  passwordOverride?: string,
): Promise<RemoteFileEntry[]> {
  const normalized = normalizeRemotePath(remotePath);
  return withSftp(hostId, passwordOverride, async (sftp) => {
    const raw = await new Promise<
      Array<{ filename: string; attrs: { mode: number; size: number; mtime?: number } }>
    >((resolve, reject) => {
      sftp.readdir(normalized, (err, list) => {
        if (err) reject(err);
        else resolve(list ?? []);
      });
    });

    const result: RemoteFileEntry[] = raw
      .filter((entry) => entry.filename !== "." && entry.filename !== "..")
      .map((entry) => {
        const attrs = entry.attrs;
        const isDir = (attrs.mode & 0o170000) === 0o040000;
        const isLink = (attrs.mode & 0o170000) === 0o120000;
        const isFile = (attrs.mode & 0o170000) === 0o100000;
        const mtime = attrs.mtime
          ? new Date(attrs.mtime * 1000).toISOString()
          : undefined;

        return {
          name: entry.filename,
          path: joinRemotePath(normalized, entry.filename),
          kind: mapFileKind(isFile, isDir, isLink),
          size: isFile ? attrs.size : null,
          modifiedAt: mtime,
        };
      });

    sortEntries(result);
    return result;
  });
}

function sftpFastPut(sftp: SFTPWrapper, localPath: string, remotePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => (err ? reject(err) : resolve()));
  });
}

function sftpFastGet(sftp: SFTPWrapper, remotePath: string, localPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sftp.fastGet(remotePath, localPath, (err) => (err ? reject(err) : resolve()));
  });
}

export async function uploadRemoteFile(
  hostId: string,
  localPath: string,
  remotePath: string,
  passwordOverride?: string,
): Promise<void> {
  const target = remotePath.endsWith("/")
    ? remoteDirWithFile(remotePath, basename(localPath))
    : remotePath;

  await withSftp(hostId, passwordOverride, (sftp) => sftpFastPut(sftp, localPath, target));
}

export async function downloadRemoteFile(
  hostId: string,
  remotePath: string,
  localPath: string,
  passwordOverride?: string,
): Promise<void> {
  await withSftp(hostId, passwordOverride, (sftp) =>
    sftpFastGet(sftp, remotePath, localPath),
  );
}
