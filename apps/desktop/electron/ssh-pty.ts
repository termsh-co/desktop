import type { WebContents } from "electron";
import { Client, type ClientChannel } from "ssh2";
import type { SshSpawnConfig } from "./pty-manager";
import { applyPasswordAuth } from "./ssh-auth";

export type TerminalSessionHandle = {
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
};

export function spawnSsh2Terminal(
  sessionId: string,
  config: SshSpawnConfig,
  cols: number,
  rows: number,
  webContents: WebContents,
  onExit: () => void,
): TerminalSessionHandle {
  const conn = new Client();
  let stream: ClientChannel | null = null;
  let colsState = Math.max(cols, 2);
  let rowsState = Math.max(rows, 2);
  let closed = false;

  const finish = (message?: string) => {
    if (closed) return;
    closed = true;
    if (message && !webContents.isDestroyed()) {
      webContents.send("termsh:pty-data", { sessionId, data: message });
    }
    if (!webContents.isDestroyed()) {
      webContents.send("termsh:pty-exit", { sessionId });
    }
    onExit();
  };

  const connectConfig: Parameters<Client["connect"]>[0] = {
    host: config.hostname,
    port: config.port,
    username: config.username,
    readyTimeout: 20_000,
    strictVendor: false,
  };

  if (config.privateKeyPem?.trim()) {
    connectConfig.privateKey = config.privateKeyPem.trim();
  } else if (config.password?.trim()) {
    applyPasswordAuth(conn, connectConfig, config.password);
  }

  if (!connectConfig.privateKey && !connectConfig.password) {
    finish("\r\n\x1b[31mSSH connection failed:\x1b[0m No credentials configured\r\n");
    return {
      write: () => undefined,
      resize: () => undefined,
      kill: () => undefined,
    };
  }

  conn.on("ready", () => {
    if (closed) {
      conn.end();
      return;
    }
    conn.shell(
      { term: "xterm-color", cols: colsState, rows: rowsState },
      (err, channel) => {
        if (closed) {
          conn.end();
          return;
        }
        if (err) {
          conn.end();
          finish(`\r\n\x1b[31mSSH shell failed:\x1b[0m ${err.message}\r\n`);
          return;
        }
        stream = channel;
        channel.on("data", (data: Buffer) => {
          if (webContents.isDestroyed()) return;
          webContents.send("termsh:pty-data", {
            sessionId,
            data: data.toString("utf8"),
          });
        });
        channel.stderr.on("data", (data: Buffer) => {
          if (webContents.isDestroyed()) return;
          webContents.send("termsh:pty-data", {
            sessionId,
            data: data.toString("utf8"),
          });
        });
        channel.on("close", () => {
          conn.end();
          finish();
        });
      },
    );
  });

  conn.on("error", (err) => {
    finish(`\r\n\x1b[31mSSH connection failed:\x1b[0m ${err.message}\r\n`);
  });

  conn.on("close", () => {
    if (!closed) finish();
  });

  conn.connect(connectConfig);

  return {
    write(data: string) {
      stream?.write(data);
    },
    resize(c: number, r: number) {
      colsState = Math.max(c, 2);
      rowsState = Math.max(r, 2);
      stream?.setWindow(rowsState, colsState, 0, 0);
    },
    kill() {
      if (closed) return;
      closed = true;
      try {
        stream?.end();
      } catch {
        /* already closed */
      }
      try {
        conn.end();
      } catch {
        /* already closed */
      }
      if (!webContents.isDestroyed()) {
        webContents.send("termsh:pty-exit", { sessionId });
      }
      onExit();
    },
  };
}
