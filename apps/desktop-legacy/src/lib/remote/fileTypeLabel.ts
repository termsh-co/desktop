import type { RemoteFileEntry } from "@termsh/shared";
import { isDirectoryEntry } from "@/lib/remote/entries";

export function fileTypeLabel(entry: RemoteFileEntry): string {
  if (isDirectoryEntry(entry)) return "folder";
  const dot = entry.name.lastIndexOf(".");
  if (dot > 0 && dot < entry.name.length - 1) {
    return entry.name.slice(dot + 1).toLowerCase();
  }
  if (entry.kind === "file") return "document";
  if (entry.kind === "symlink") return "link";
  return "other";
}
