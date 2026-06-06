import { describe, expect, it } from "vitest";
import type { RemoteFileEntry } from "@termsh/common";
import { fileIconKind } from "./fileIconKind";

const file = (name: string, kind: RemoteFileEntry["kind"] = "file"): RemoteFileEntry => ({
  name,
  path: `/x/${name}`,
  kind,
  size: 1,
});

describe("fileIconKind", () => {
  it("maps folders", () => {
    expect(fileIconKind(file("src", "directory"))).toBe("folder");
    expect(fileIconKind(file("..", "directory"))).toBe("folder_up");
  });

  it("maps extensions", () => {
    expect(fileIconKind(file("a.png"))).toBe("image");
    expect(fileIconKind(file("b.csv"))).toBe("spreadsheet");
    expect(fileIconKind(file("c.zip"))).toBe("archive");
    expect(fileIconKind(file("d.ts"))).toBe("code");
  });
});
