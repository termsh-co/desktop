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
