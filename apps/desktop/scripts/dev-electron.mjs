#!/usr/bin/env node
/**
 * Start ng serve, wait until Angular is actually ready, then launch Electron.
 * Avoids black screen when wait-on hits a stale process or Electron starts too early.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const clientsRoot = path.resolve(appRoot, "../..");
const require = createRequire(import.meta.url);
const waitOn = require("wait-on");

const DEV_ORIGIN = "http://127.0.0.1:4200";
const DEV_RESOURCE = "http-get://127.0.0.1:4200";

/** @type {import("node:child_process").ChildProcess | null} */
let ng = null;
/** @type {import("node:child_process").ChildProcess | null} */
let electron = null;

function runNodeScript(name) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, name)], {
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${name} exited ${code}`))));
  });
}

function spawnLogged(label, cmd, args, cwd, extraEnv = {}) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, CI: "1", FORCE_COLOR: "1", ...extraEnv },
  });
  child.on("error", (err) => {
    console.error(`[termsh] ${label} failed:`, err.message);
    shutdown(1);
  });
  return child;
}

function shutdown(code = 0) {
  if (electron && !electron.killed) electron.kill("SIGTERM");
  if (ng && !ng.killed) ng.kill("SIGTERM");
  process.exit(code);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));

async function waitForAngularShell() {
  await waitOn({
    resources: [DEV_RESOURCE],
    delay: 800,
    interval: 400,
    timeout: 180_000,
    validateStatus: (status) => status >= 200 && status < 400,
    log: true,
  });

  for (let attempt = 1; attempt <= 60; attempt++) {
    try {
      const res = await fetch(DEV_ORIGIN);
      const html = await res.text();
      if (html.includes("termsh-root") && html.includes("main")) {
        console.log("[termsh] Angular dev server ready");
        return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Dev server responded but Angular index was not ready");
}

await runNodeScript("free-dev-port.mjs");

console.log("[termsh] Starting Angular dev server…");
ng = spawnLogged(
  "web",
  "pnpm",
  ["exec", "ng", "serve", "desktop", "--port", "4200", "--host", "127.0.0.1"],
  clientsRoot,
);

try {
  await waitForAngularShell();
} catch (err) {
  console.error("[termsh]", err instanceof Error ? err.message : err);
  shutdown(1);
}

console.log("[termsh] Launching Electron…");
electron = spawnLogged("electron", "pnpm", ["exec", "electron", "."], appRoot, {
  TERMSH_DEVTOOLS: "1",
});

electron.on("exit", (code, signal) => {
  if (ng && !ng.killed) ng.kill("SIGTERM");
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
