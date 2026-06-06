import type { RemoteFileEntry } from "@termsh/common";
import { isDirectoryEntry } from "./remote-format";
import { listableEntries } from "./remote-entries";

export type SortKey = "name" | "size" | "type" | "modified";
export type SortDir = "asc" | "desc";

export type SortState = {
  key: SortKey;
  dir: SortDir;
};

export const DEFAULT_SORT: SortState = { key: "name", dir: "asc" };

export function toggleSort(prev: SortState, key: SortKey): SortState {
  if (prev.key === key) {
    return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
  }
  return { key, dir: key === "name" ? "asc" : "desc" };
}

export function typeSortKey(entry: RemoteFileEntry): string {
  if (isDirectoryEntry(entry)) return "\u0000klasör";
  const dot = entry.name.lastIndexOf(".");
  const ext =
    dot > 0 && dot < entry.name.length - 1 ? entry.name.slice(dot + 1).toLowerCase() : "";
  return ext ? `1.${ext}` : `2.${entry.kind}`;
}

export function sortExplorerEntries(
  entries: RemoteFileEntry[],
  sort: SortState,
  parentEntry?: RemoteFileEntry | null,
  locale = "en-US",
): RemoteFileEntry[] {
  const rows = listableEntries(entries);
  const mult = sort.dir === "asc" ? 1 : -1;

  const sorted = [...rows].sort((a, b) => {
    const aDir = isDirectoryEntry(a);
    const bDir = isDirectoryEntry(b);
    if (aDir !== bDir) return aDir ? -1 : 1;

    switch (sort.key) {
      case "name":
        return mult * a.name.localeCompare(b.name, locale, { sensitivity: "base" });
      case "size": {
        const as = a.size ?? 0;
        const bs = b.size ?? 0;
        return mult * (as - bs);
      }
      case "type":
        return mult * typeSortKey(a).localeCompare(typeSortKey(b));
      case "modified": {
        const at = a.modifiedAt ? Date.parse(a.modifiedAt) : 0;
        const bt = b.modifiedAt ? Date.parse(b.modifiedAt) : 0;
        return mult * (at - bt);
      }
      default:
        return 0;
    }
  });

  if (parentEntry) return [parentEntry, ...sorted];
  return sorted;
}
