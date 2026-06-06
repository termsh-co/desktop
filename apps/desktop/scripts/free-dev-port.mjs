#!/usr/bin/env node
/** Kill any process listening on the desktop dev port before starting ng serve + Electron. */
import { execSync } from "node:child_process";

const port = Number(process.env.TERMSH_DEV_PORT ?? 4200);

try {
  const out = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" }).trim();
  if (!out) process.exit(0);
  for (const pid of out.split(/\s+/)) {
    if (pid) {
      try {
        process.kill(Number(pid), "SIGTERM");
      } catch {
        /* already gone */
      }
    }
  }
  console.log(`[termsh] Freed port ${port} (was in use)`);
} catch {
  /* port free */
}
