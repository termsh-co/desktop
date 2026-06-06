import { invoke } from "@tauri-apps/api/core";
import type { AppInfo } from "@termsh/shared";

export async function fetchAppInfo(): Promise<AppInfo> {
  return invoke<AppInfo>("app_info");
}
