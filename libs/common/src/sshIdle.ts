/** 0 = no idle disconnect */
export type SshIdleTimeoutMinutes = 0 | 15 | 30 | 60 | 120;

export const SSH_IDLE_TIMEOUT_VALUES: SshIdleTimeoutMinutes[] = [0, 15, 30, 60, 120];

export function isSshIdleTimeout(value: number): value is SshIdleTimeoutMinutes {
  return SSH_IDLE_TIMEOUT_VALUES.includes(value as SshIdleTimeoutMinutes);
}

export function sshIdleTimeoutMs(minutes: SshIdleTimeoutMinutes): number {
  return minutes * 60 * 1000;
}
