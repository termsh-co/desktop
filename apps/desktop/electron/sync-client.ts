import type { SyncBlobDto } from "./sync-crypto";

export type SyncServerConfig = {
  apiUrl: string;
  accessToken: string;
};

function baseUrl(config: SyncServerConfig): string {
  return config.apiUrl.replace(/\/+$/, "");
}

function authHeaders(config: SyncServerConfig): HeadersInit {
  return {
    Authorization: `Bearer ${config.accessToken}`,
    Accept: "application/json",
  };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.text();
    return body || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function syncWhoami(config: SyncServerConfig): Promise<{ email: string }> {
  const res = await fetch(`${baseUrl(config)}/auth/me`, { headers: authHeaders(config) });
  if (!res.ok) throw new Error(`Auth failed (${res.status}): ${await readError(res)}`);
  const data = (await res.json()) as { email: string };
  return { email: data.email };
}

export async function syncPullBlobs(
  config: SyncServerConfig,
  since?: string,
): Promise<SyncBlobDto[]> {
  let url = `${baseUrl(config)}/sync/blobs`;
  if (since) url += `?since=${encodeURIComponent(since)}`;

  const res = await fetch(url, { headers: authHeaders(config) });
  if (!res.ok) throw new Error(`Pull failed (${res.status}): ${await readError(res)}`);
  const rows = (await res.json()) as Array<{
    record_id: string;
    encrypted_blob: string;
    version: number;
    updated_at: string;
  }>;
  return rows.map((r) => ({
    record_id: String(r.record_id),
    encrypted_blob: r.encrypted_blob,
    version: r.version,
    updated_at: r.updated_at,
  }));
}

export async function syncPushBlob(config: SyncServerConfig, blob: SyncBlobDto): Promise<void> {
  const res = await fetch(`${baseUrl(config)}/sync/blobs`, {
    method: "POST",
    headers: { ...authHeaders(config), "Content-Type": "application/json" },
    body: JSON.stringify({
      record_id: blob.record_id,
      encrypted_blob: blob.encrypted_blob,
      version: blob.version,
    }),
  });
  if (!res.ok) throw new Error(`Push failed (${res.status}): ${await readError(res)}`);
}

export async function syncDeleteBlob(config: SyncServerConfig, recordId: string): Promise<void> {
  const res = await fetch(`${baseUrl(config)}/sync/blobs/${recordId}`, {
    method: "DELETE",
    headers: authHeaders(config),
  });
  if (!res.ok) throw new Error(`Delete failed (${res.status}): ${await readError(res)}`);
}
