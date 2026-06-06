import { i18n } from "@/i18n";

export type AppErrorPayload = {
  code: string;
  params?: Record<string, unknown>;
  detail?: string;
};

const TERMSH_ERR_RE = /(?:TERMSH_ERR|SIGNUM_ERR):(\{.*\})/;

export function parseAppError(input: unknown): AppErrorPayload | null {
  if (input == null) return null;

  if (typeof input === "object" && "code" in input && typeof (input as AppErrorPayload).code === "string") {
    return input as AppErrorPayload;
  }

  const raw = typeof input === "string" ? input : String(input);
  const trimmed = raw.trim();

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as AppErrorPayload;
      if (parsed?.code) return parsed;
    } catch {
      /* legacy plain string */
    }
  }

  const termshMatch = trimmed.match(TERMSH_ERR_RE);
  if (termshMatch?.[1]) {
    try {
      const parsed = JSON.parse(termshMatch[1]) as AppErrorPayload;
      if (parsed?.code) return parsed;
    } catch {
      /* fall through */
    }
  }

  return null;
}

export function formatAppError(input: unknown): string {
  if (input instanceof Error) {
    return formatAppError(input.message);
  }

  const payload = parseAppError(input);
  if (!payload) {
    const raw = typeof input === "string" ? input : String(input);
    return raw || i18n.t("errors:UNKNOWN");
  }

  const params: Record<string, unknown> = {
    ...(payload.params ?? {}),
    ...(payload.detail ? { detail: payload.detail } : {}),
  };

  const key = payload.code;
  const translated = i18n.t(`errors:${key}`, {
    ...params,
    defaultValue: payload.detail ?? key,
  });

  return translated;
}

/** Decode a terminal chunk and translate embedded TERMSH_ERR payloads. */
export function translateTerminalChunk(base64: string, decode: (b64: string) => Uint8Array): Uint8Array {
  const bytes = decode(base64);
  const text = new TextDecoder().decode(bytes);
  if (!text.includes("TERMSH_ERR:") && !text.includes("SIGNUM_ERR:")) return bytes;

  const message = formatAppError(text);
  const formatted = text.replace(/(?:TERMSH_ERR|SIGNUM_ERR):\{.*?\}/, message);
  return new TextEncoder().encode(formatted);
}
