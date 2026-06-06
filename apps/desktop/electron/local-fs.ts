import { copyFile, readdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { RemoteFileEntry, RemoteFileKind } from "./remote-fs";

function expandLocalPath(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("~")) {
    return path.join(homedir(), trimmed.slice(1).replace(/^[/\\]/, ""));
  }
  return path.resolve(trimmed || homedir());
}

function mapLocalKind(isFile: boolean, isDir: boolean): RemoteFileKind {
  if (isDir) return "directory";
  if (isFile) return "file";
  return "other";
}

function sortEntries(entries: RemoteFileEntry[]): void {
  entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export function localHomeDir(): string {
  return homedir();
}

export async function listLocalDir(dirPath: string): Promise<RemoteFileEntry[]> {
  const dir = expandLocalPath(dirPath);
  const dirStat = await stat(dir);
  if (!dirStat.isDirectory()) {
    throw new Error(`Not a directory: ${dir}`);
  }

  const names = await readdir(dir);
  const result: RemoteFileEntry[] = [];

  for (const name of names) {
    if (name === ".") continue;
    const fullPath = path.join(dir, name);
    try {
      const metadata = await stat(fullPath);
      const isDir = metadata.isDirectory();
      const isFile = metadata.isFile();
      result.push({
        name,
        path: fullPath,
        kind: mapLocalKind(isFile, isDir),
        size: isFile ? metadata.size : null,
        modifiedAt: metadata.mtime?.toISOString(),
      });
    } catch {
      // skip inaccessible entries
    }
  }

  sortEntries(result);
  return result;
}

export async function localCopyInto(destDir: string, paths: string[]): Promise<void> {
  const dest = expandLocalPath(destDir);
  const destStat = await stat(dest);
  if (!destStat.isDirectory()) {
    throw new Error(`Not a directory: ${dest}`);
  }

  for (const src of paths) {
    const resolved = expandLocalPath(src);
    const srcStat = await stat(resolved);
    if (!srcStat.isFile()) {
      throw new Error(`Not a file: ${resolved}`);
    }
    const name = path.basename(resolved);
    await copyFile(resolved, path.join(dest, name));
  }
}
