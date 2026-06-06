import { describe, expect, it } from "vitest";
import type { RemoteFileEntry } from "@termsh/shared";
import { sortExplorerEntries } from "./sort";

const file: RemoteFileEntry = {
  name: "b.txt",
  path: "/b.txt",
  kind: "file",
  size: 100,
  modifiedAt: "2026-01-02T00:00:00Z",
};

const dir: RemoteFileEntry = {
  name: "alpha",
  path: "/alpha",
  kind: "directory",
  size: null,
};

describe("sortExplorerEntries", () => {
  it("keeps parent .. first", () => {
    const parent: RemoteFileEntry = { name: "..", path: "/", kind: "directory", size: null };
    const sorted = sortExplorerEntries([file, dir], { key: "name", dir: "asc" }, parent);
    expect(sorted[0].name).toBe("..");
  });

  it("sorts directories before files", () => {
    const sorted = sortExplorerEntries([file, dir], { key: "name", dir: "asc" });
    expect(sorted[0].kind).toBe("directory");
    expect(sorted[1].kind).toBe("file");
  });

  it("sorts by size descending", () => {
    const small: RemoteFileEntry = { ...file, name: "a", path: "/a", size: 1 };
    const big: RemoteFileEntry = { ...file, name: "c", path: "/c", size: 999 };
    const sorted = sortExplorerEntries([small, big], { key: "size", dir: "desc" });
    expect(sorted[0].size).toBe(999);
  });
});
