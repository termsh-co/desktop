#!/usr/bin/env node
/**
 * Ensures native postinstall steps ran (pnpm may skip without onlyBuiltDependencies).
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function ensureElectron() {
  try {
    const electronPkg = join(root, "node_modules/electron/package.json");
    if (!existsSync(electronPkg)) return;
    const electronDir = dirname(electronPkg);
    const dist = join(electronDir, "dist/Electron.app");
    const distLinux = join(electronDir, "dist/electron");
    const distWin = join(electronDir, "dist/electron.exe");
    if (existsSync(dist) || existsSync(distLinux) || existsSync(distWin)) return;

    const install = join(electronDir, "install.js");
    if (!existsSync(install)) return;

    console.log("termsh: downloading Electron binary…");
    const r = spawnSync(process.execPath, [install], { cwd: electronDir, stdio: "inherit" });
    if (r.status !== 0) process.exit(r.status ?? 1);
  } catch {
    /* electron optional at root */
  }
}

ensureElectron();
