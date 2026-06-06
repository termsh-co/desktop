import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export async function spawnLocalShell(
  sessionId: string,
  cols: number,
  rows: number,
): Promise<void> {
  await invoke("spawn_local_shell", { sessionId, cols, rows });
}

export async function spawnSshShell(
  sessionId: string,
  hostId: string,
  cols: number,
  rows: number,
  connectPassword?: string,
): Promise<void> {
  await invoke("spawn_ssh_shell", {
    sessionId,
    hostId,
    cols,
    rows,
    connectPassword: connectPassword ?? null,
  });
}

/** Tuş girişi — invoke yerine tek yönlü event (düşük gecikme). */
export function terminalWrite(sessionId: string, data: string): void {
  void emit("terminal-write", { sessionId, data });
}

/** PTY boyutu — invoke kuyruğunu tıkamaması için event. */
export function terminalResize(sessionId: string, cols: number, rows: number): void {
  void emit("terminal-resize", { sessionId, cols, rows });
}

export async function closeSession(sessionId: string): Promise<void> {
  await invoke("close_session", { sessionId });
}

export async function disposeBackendSession(sessionId: string): Promise<void> {
  try {
    await closeSession(sessionId);
  } catch {
    // Oturum zaten kapanmış olabilir.
  }
}

export function decodeTerminalData(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
