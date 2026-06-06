/** 0 = hareketsizlikte kesme yok */
export type SshIdleTimeoutMinutes = 0 | 15 | 30 | 60 | 120;

export const SSH_IDLE_TIMEOUT_VALUES: SshIdleTimeoutMinutes[] = [0, 15, 30, 60, 120];

/** @deprecated Use SSH_IDLE_TIMEOUT_VALUES + i18n labels in settings. */
export const SSH_IDLE_TIMEOUT_OPTIONS: { value: SshIdleTimeoutMinutes; label: string }[] =
  SSH_IDLE_TIMEOUT_VALUES.map((value) => ({ value, label: String(value) }));

export function isSshIdleTimeout(value: number): value is SshIdleTimeoutMinutes {
  return SSH_IDLE_TIMEOUT_VALUES.includes(value as SshIdleTimeoutMinutes);
}

export function sshIdleTimeoutMs(minutes: SshIdleTimeoutMinutes): number {
  return minutes * 60 * 1000;
}
