import type { WebContents } from "electron";
import type { IPty } from "node-pty";
import * as pty from "node-pty";
import { spawnSsh2Terminal, type TerminalSessionHandle } from "./ssh-pty";

const sessions = new Map<string, TerminalSessionHandle>();

function attachLocalPty(
  sessionId: string,
  proc: IPty,
  webContents: WebContents,
): TerminalSessionHandle {
  const handle: TerminalSessionHandle = {
    write: (data) => proc.write(data),
    resize: (cols, rows) => proc.resize(Math.max(cols, 2), Math.max(rows, 2)),
    kill: () => {
      try {
        proc.kill();
      } catch {
        /* already dead */
      }
    },
  };

  sessions.set(sessionId, handle);
  proc.onData((data) => {
    if (!webContents.isDestroyed()) {
      webContents.send("termsh:pty-data", { sessionId, data });
    }
  });
  proc.onExit(() => {
    sessions.delete(sessionId);
    if (!webContents.isDestroyed()) {
      webContents.send("termsh:pty-exit", { sessionId });
    }
  });

  return handle;
}

function defaultShell(): string {
  if (process.platform === "win32") {
    return process.env.COMSPEC ?? "powershell.exe";
  }
  return process.env.SHELL ?? "/bin/zsh";
}

export function spawnLocalPty(
  sessionId: string,
  cols: number,
  rows: number,
  webContents: WebContents,
): void {
  closePty(sessionId);

  const proc = pty.spawn(defaultShell(), [], {
    name: "xterm-color",
    cols: Math.max(cols, 2),
    rows: Math.max(rows, 2),
    cwd: process.env.HOME ?? process.cwd(),
    env: process.env as Record<string, string>,
  });
  attachLocalPty(sessionId, proc, webContents);
}

export type SshSpawnConfig = {
  hostname: string;
  port: number;
  username: string;
  privateKeyPem?: string;
  password?: string;
};

export function spawnSshPty(
  sessionId: string,
  config: SshSpawnConfig,
  cols: number,
  rows: number,
  webContents: WebContents,
): void {
  closePty(sessionId);

  const handle = spawnSsh2Terminal(
    sessionId,
    config,
    cols,
    rows,
    webContents,
    () => {
      sessions.delete(sessionId);
    },
  );
  sessions.set(sessionId, handle);
}

export function writePty(sessionId: string, data: string): void {
  sessions.get(sessionId)?.write(data);
}

export function resizePty(sessionId: string, cols: number, rows: number): void {
  sessions.get(sessionId)?.resize(cols, rows);
}

export function closePty(sessionId: string): void {
  const handle = sessions.get(sessionId);
  if (!handle) return;
  sessions.delete(sessionId);
  handle.kill();
}

export function closeAllPty(): void {
  for (const id of [...sessions.keys()]) {
    closePty(id);
  }
}
