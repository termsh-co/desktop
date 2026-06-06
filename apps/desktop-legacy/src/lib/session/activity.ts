/** SSH oturumu son aktivite zamanı (klavye veya sunucu çıktısı). */
const lastActivityMs = new Map<string, number>();

export function touchSessionActivity(sessionId: string, at = Date.now()): void {
  lastActivityMs.set(sessionId, at);
}

export function getSessionActivity(sessionId: string): number | undefined {
  return lastActivityMs.get(sessionId);
}

export function clearSessionActivity(sessionId: string): void {
  lastActivityMs.delete(sessionId);
}

/** @internal */
export function resetSessionActivityForTests(): void {
  lastActivityMs.clear();
}
