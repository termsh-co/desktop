import { Client } from "ssh2";
import { detectPlatformFromText } from "./detect-platform";
import { resolveSshHost } from "./ssh-config";
import { applyPasswordAuth } from "./ssh-auth";
import type { HostRecord } from "./hosts-store-types";
import { hostsMarkConnected, hostsSetPlatform } from "./hosts-store";

const REMOTE_CMD =
  "cat /etc/os-release 2>/dev/null; echo '---'; uname -s 2>/dev/null; echo '---'; uname -a 2>/dev/null";

function execCapture(
  hostId: string,
  passwordOverride?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const resolved = resolveSshHost(hostId, passwordOverride);
    const { host, password, privateKey } = resolved;

    const config: Parameters<Client["connect"]>[0] = {
      host: host.hostname,
      port: host.port,
      username: host.username,
      readyTimeout: 15_000,
      strictVendor: false,
    };

    const conn = new Client();

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
        conn.exec(REMOTE_CMD, (err, stream) => {
          if (err) {
            conn.end();
            reject(err);
            return;
          }
          let out = "";
          stream
            .on("data", (chunk: Buffer) => {
              out += chunk.toString("utf8");
            })
            .on("close", () => {
              conn.end();
              resolve(out);
            })
            .stderr.on("data", (chunk: Buffer) => {
              out += chunk.toString("utf8");
            });
        });
      })
      .on("error", (err) => reject(err))
      .connect(config);
  });
}

/** Başarılı SSH sonrası uzak sunucudan platform tespit eder ve vault'a yazar. */
export async function detectAndSaveHostPlatform(
  hostId: string,
  passwordOverride?: string,
): Promise<HostRecord> {
  const output = await execCapture(hostId, passwordOverride);
  const platform = detectPlatformFromText(output);
  if (!platform) {
    return hostsMarkConnected(hostId);
  }
  return hostsSetPlatform(hostId, platform);
}
