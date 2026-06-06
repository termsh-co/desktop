export type {
  AuthType,
  Host,
  SaveHostPayload,
  Session,
  SessionKind,
  SshPhase,
  RemotePhase,
  RemoteProtocol,
  RemoteAuthType,
  RemoteServer,
  RemoteFileKind,
  RemoteFileEntry,
  BiometricKind,
  VaultStatus,
  AppInfo,
  Snippet,
  SshKey,
} from "./types";
export type { HostPlatform } from "./hostPlatform";
export { HOST_PLATFORMS, HOST_PLATFORM_LABELS } from "./hostPlatform";
export { getHostPlatformIcon, HOST_PLATFORM_ICONS, type PlatformBrandIcon } from "./platformIcons";
export { resolveHostPlatform } from "./resolveHostPlatform";
export { detectPlatformFromText } from "./detectPlatform";
export {
  THEME_IDS,
  getXtermTheme,
  normalizeThemeId,
  type ThemeId,
} from "./themes";
export {
  SSH_IDLE_TIMEOUT_VALUES,
  isSshIdleTimeout,
  sshIdleTimeoutMs,
  type SshIdleTimeoutMinutes,
} from "./sshIdle";
export {
  APP_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_BCP47,
  LOCALE_LABELS,
  isAppLocale,
  resolveDeviceLocale,
  readPersistedLocale,
  resolveInitialLocale,
  toBcp47,
  type AppLocale,
} from "./locale";
export {
  parseAppError,
  formatAppError,
  translateTerminalChunk,
  type AppErrorPayload,
  type ErrorTranslator,
} from "./appError";
