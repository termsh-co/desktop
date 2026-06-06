export type {
  TermshDesktopApi,
  VaultUnlockOptions,
  SaveSnippetPayload,
  SaveKeyPayload,
  GenerateKeyPayload,
  GenerateKeyResult,
  UpdateCheckResult,
  SyncConfig,
  SyncEvent,
  SyncStatus,
} from "./api";
export { getTermshApi, createBrowserStub } from "./termsh-bridge";
export { TermshPlatformService } from "./termsh-platform.service";

/** Electron / web / extension platform abstraction. */
export type PlatformKind = "electron" | "web" | "browser";
