import { invoke } from "@tauri-apps/api/core";
import type { Host, SaveHostPayload } from "@termsh/shared";

export async function listHosts(): Promise<Host[]> {
  return invoke<Host[]>("hosts_list");
}

export async function saveHost(payload: SaveHostPayload): Promise<Host> {
  return invoke<Host>("hosts_save", { payload });
}

export async function deleteHost(id: string): Promise<void> {
  await invoke("hosts_delete", { id });
}
