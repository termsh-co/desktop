import { hostCredentials, hostsList } from "./hosts-store";
import type { HostRecord } from "./hosts-store-types";

export type ResolvedSshHost = {
  host: HostRecord;
  password?: string;
  privateKey?: string;
};

export function resolveSshHost(hostId: string, passwordOverride?: string): ResolvedSshHost {
  const host = hostsList().find((h) => h.id === hostId);
  if (!host) throw new Error("Host not found");
  const creds = hostCredentials(hostId);
  return {
    host,
    password: passwordOverride?.trim() || creds.password,
    privateKey: creds.privateKey,
  };
}
