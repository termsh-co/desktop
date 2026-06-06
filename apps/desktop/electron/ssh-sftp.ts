import { Client, type SFTPWrapper } from "ssh2";
import { resolveSshHost, type ResolvedSshHost } from "./ssh-config";
import { applyPasswordAuth } from "./ssh-auth";

export function connectSftp(resolved: ResolvedSshHost): Promise<{
  conn: Client;
  sftp: SFTPWrapper;
}> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const { host, password, privateKey } = resolved;

    const config: Parameters<Client["connect"]>[0] = {
      host: host.hostname,
      port: host.port,
      username: host.username,
      readyTimeout: 20_000,
      strictVendor: false,
    };

    if (privateKey?.trim()) {
      config.privateKey = privateKey.trim();
    } else if (password?.trim()) {
      applyPasswordAuth(conn, config, password);
    } else {
      reject(new Error("No credentials configured for host"));
      return;
    }

    conn
      .on("ready", () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }
          resolve({ conn, sftp });
        });
      })
      .on("error", (err) => reject(err))
      .connect(config);
  });
}

export async function withSftp<T>(
  hostId: string,
  passwordOverride: string | undefined,
  fn: (sftp: SFTPWrapper) => Promise<T>,
): Promise<T> {
  const resolved = resolveSshHost(hostId, passwordOverride);
  const { conn, sftp } = await connectSftp(resolved);
  try {
    return await fn(sftp);
  } finally {
    conn.end();
  }
}
