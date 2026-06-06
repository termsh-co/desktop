export function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

export function formatModified(iso?: string, locale = "en"): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function normalizeRemotePath(path: string): string {
  const p = path.trim();
  return p.length === 0 ? "/" : p;
}

export function parentRemotePath(path: string): string | null {
  const normalized = normalizeRemotePath(path);
  if (normalized === "/") return null;
  const idx = normalized.lastIndexOf("/");
  if (idx <= 0) return "/";
  return normalized.slice(0, idx);
}

export function parentLocalPath(path: string): string | null {
  const normalized = path.replace(/[/\\]+$/, "");
  if (normalized.length === 0) return null;
  const sep = path.includes("\\") ? "\\" : "/";
  const idx = normalized.lastIndexOf(sep);
  if (idx <= 0) {
    return sep === "\\" ? normalized.slice(0, 2) : "/";
  }
  return normalized.slice(0, idx);
}

export function joinLocalPath(dir: string, name: string): string {
  const sep = dir.includes("\\") ? "\\" : "/";
  return `${dir.replace(/[/\\]+$/, "")}${sep}${name}`;
}

export function basename(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

export function remoteDirWithFile(dir: string, fileName: string): string {
  const base = normalizeRemotePath(dir);
  if (base === "/") return `/${fileName}`;
  return `${base.replace(/\/$/, "")}/${fileName}`;
}

export function isFileEntry(entry: { kind: string }): boolean {
  return entry.kind === "file";
}

/** Drag-and-drop: real files only */
export function isDraggableEntry(entry: { kind: string; name: string }): boolean {
  if (entry.name === "..") return false;
  return isFileEntry(entry);
}

export function isDirectoryEntry(entry: { kind: string }): boolean {
  return entry.kind === "directory" || entry.kind === "symlink";
}

export function fileTypeLabel(entry: { kind: string; name: string }): string {
  if (isDirectoryEntry(entry)) return "folder";
  const dot = entry.name.lastIndexOf(".");
  if (dot > 0 && dot < entry.name.length - 1) {
    return entry.name.slice(dot + 1).toLowerCase();
  }
  if (entry.kind === "file") return "document";
  if (entry.kind === "symlink") return "link";
  return "other";
}

