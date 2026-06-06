import type { RemoteFileEntry } from "@termsh/common";

export function listableEntries(entries: RemoteFileEntry[]): RemoteFileEntry[] {
  return entries.filter((e) => e.name !== "." && e.name !== "..");
}
