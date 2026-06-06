import { encryptBlob, decryptBlob } from "./vault-crypto";

export type SyncPayload = {
  item_type: string;
  item_ref: string;
  data: string;
  version: number;
};

export type SyncBlobDto = {
  record_id: string;
  encrypted_blob: string;
  version: number;
  updated_at?: string;
};

export function encryptSyncPayload(key: Buffer, payload: SyncPayload): SyncBlobDto {
  const plain = Buffer.from(JSON.stringify(payload), "utf8");
  const blob = encryptBlob(key, plain);
  return {
    record_id: payload.item_ref,
    encrypted_blob: blob.toString("base64"),
    version: payload.version,
  };
}

export function decryptSyncPayload(key: Buffer, blob: SyncBlobDto): SyncPayload {
  const combined = Buffer.from(blob.encrypted_blob, "base64");
  const plain = decryptBlob(key, combined);
  return JSON.parse(plain.toString("utf8")) as SyncPayload;
}
