import type { RemoteFileEntry } from "@termsh/shared";

export function isDirectoryEntry(entry: RemoteFileEntry): boolean {
  return entry.kind === "directory" || entry.kind === "symlink";
}

export function isFileEntry(entry: RemoteFileEntry): boolean {
  return entry.kind === "file";
}

/** Sürükle-bırak: yalnızca gerçek dosyalar */
export function isDraggableEntry(entry: RemoteFileEntry): boolean {
  if (entry.name === "..") return false;
  return isFileEntry(entry);
}

/** Liste görünümünde gösterilmeyecek girdiler */
export function listableEntries(entries: RemoteFileEntry[]): RemoteFileEntry[] {
  return entries.filter((e) => e.name !== "." && e.name !== "..");
}
