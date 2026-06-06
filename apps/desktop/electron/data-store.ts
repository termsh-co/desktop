import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";

function dataDir(): string {
  const dir = join(app.getPath("userData"), "termsh");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function dataPath(filename: string): string {
  return join(dataDir(), filename);
}

export function readJson<T>(filename: string, fallback: T): T {
  const path = dataPath(filename);
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(filename: string, data: unknown): void {
  writeFileSync(dataPath(filename), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
