import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { SessionKind } from "@termsh/shared";
import { getTheme } from "@/lib/themes";
import { buildFontFamilyCss } from "@/lib/settings/terminalFont";
import { formatAppError, translateTerminalChunk } from "@/lib/errors/appError";
import {
  decodeTerminalData,
  spawnLocalShell,
  spawnSshShell,
  terminalResize,
  terminalWrite,
} from "@/lib/terminal/ipc";
import { touchSessionActivity } from "@/lib/session/activity";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTerminalStreamStore } from "@/stores/terminalStreamStore";
import { useThemeStore } from "@/stores/themeStore";
import "@xterm/xterm/css/xterm.css";

type TerminalExitEvent = {
  sessionId: string;
};

type Props = {
  sessionId: string;
  kind: SessionKind;
  hostId?: string;
  active: boolean;
  focusOnActive?: boolean;
  /** SSH zaten SshConnectScreen üzerinden başlatıldıysa true */
  backendReady?: boolean;
  /** Bağlanırken yalnızca çıktı dinle (MOTD); spawn etme */
  listenOnly?: boolean;
};

const RESIZE_DEBOUNCE_MS = 80;

export function XtermTerminal({
  sessionId,
  kind,
  hostId,
  active,
  focusOnActive = true,
  backendReady = false,
  listenOnly = false,
}: Props) {
  const { t } = useTranslation("terminal");
  const themeId = useThemeStore((s) => s.themeId);
  const terminalFontFamily = useSettingsStore((s) => s.terminalFontFamily);
  const terminalFontSize = useSettingsStore((s) => s.terminalFontSize);
  const terminalViewActive = useNavStore((s) => s.view === "terminal");
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const spawnedRef = useRef(false);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleFitAndResize = useCallback(() => {
    if (resizeTimerRef.current) {
      clearTimeout(resizeTimerRef.current);
    }
    resizeTimerRef.current = setTimeout(() => {
      resizeTimerRef.current = null;
      const term = termRef.current;
      const fit = fitRef.current;
      if (!term || !fit) return;
      fit.fit();
      if (spawnedRef.current) {
        terminalResize(sessionId, term.cols, term.rows);
      }
    }, RESIZE_DEBOUNCE_MS);
  }, [sessionId]);

  const focusTerminal = useCallback(() => {
    requestAnimationFrame(() => {
      termRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.theme = getTheme(themeId).xterm;
  }, [themeId]);

  useEffect(() => {
    const term = termRef.current;
    const fit = fitRef.current;
    if (!term || !fit) return;
    term.options.fontFamily = buildFontFamilyCss(terminalFontFamily);
    term.options.fontSize = terminalFontSize;
    fit.fit();
    if (spawnedRef.current) {
      terminalResize(sessionId, term.cols, term.rows);
    }
  }, [terminalFontFamily, terminalFontSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: useSettingsStore.getState().terminalFontSize,
      fontFamily: buildFontFamilyCss(useSettingsStore.getState().terminalFontFamily),
      theme: getTheme(useThemeStore.getState().themeId).xterm,
      smoothScrollDuration: 0,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    const dataDisposable = term.onData((data) => {
      if (kind === "ssh") {
        touchSessionActivity(sessionId);
      }
      terminalWrite(sessionId, data);
    });

    const startShell = async () => {
      if (spawnedRef.current || listenOnly) return;
      if (kind === "ssh" && backendReady) {
        spawnedRef.current = true;
        fitAddon.fit();
        terminalResize(sessionId, term.cols, term.rows);
        focusTerminal();
        return;
      }
      fitAddon.fit();
      const cols = term.cols;
      const rows = term.rows;
      try {
        if (kind === "ssh") {
          if (!hostId) {
            throw new Error(t("spawn.hostIdMissing"));
          }
          await spawnSshShell(sessionId, hostId, cols, rows);
        } else {
          await spawnLocalShell(sessionId, cols, rows);
        }
        spawnedRef.current = true;
        focusTerminal();
      } catch (err) {
        const label = kind === "ssh" ? t("spawn.sshFailed") : t("spawn.shellFailed");
        term.writeln(`\r\n\x1b[31m${label}:\x1b[0m ${formatAppError(err)}`);
      }
    };

    void startShell();

    const unsubStream = useTerminalStreamStore.getState().subscribe(sessionId, (base64) => {
      const bytes =
        kind === "ssh"
          ? translateTerminalChunk(base64, decodeTerminalData)
          : decodeTerminalData(base64);
      term.write(bytes);
    });

    const unlistenExit = listen<TerminalExitEvent>("terminal-exit", (event) => {
      if (event.payload.sessionId !== sessionId) return;
      term.writeln("\r\n\x1b[90m[oturum sona erdi]\x1b[0m");
      useSessionStore.getState().closeSession(sessionId);
    });

    const resizeObserver = new ResizeObserver(() => {
      scheduleFitAndResize();
    });
    resizeObserver.observe(container);

    const onPointerDown = () => {
      focusTerminal();
    };
    container.addEventListener("pointerdown", onPointerDown);

    return () => {
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      dataDisposable.dispose();
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      unsubStream();
      void unlistenExit.then((fn) => fn());
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      spawnedRef.current = false;
    };
  }, [sessionId, kind, hostId, backendReady, listenOnly, scheduleFitAndResize, focusTerminal, t]);

  useEffect(() => {
    if (!listenOnly || spawnedRef.current) return;
    if (backendReady && fitRef.current && termRef.current) {
      spawnedRef.current = true;
      fitRef.current.fit();
      terminalResize(sessionId, termRef.current.cols, termRef.current.rows);
      focusTerminal();
    }
  }, [listenOnly, backendReady, sessionId, focusTerminal]);

  useEffect(() => {
    if (!focusOnActive) return;
    if (!active || !terminalViewActive || !fitRef.current || !termRef.current) return;
    const term = termRef.current;
    const fit = fitRef.current;
    fit.fit();
    if (spawnedRef.current) {
      terminalResize(sessionId, term.cols, term.rows);
    }
    focusTerminal();
  }, [active, focusOnActive, terminalViewActive, sessionId, focusTerminal]);

  return (
    <div
      className={`xterm-host ${active ? "xterm-host--active" : ""}`}
      ref={containerRef}
      aria-hidden={!active}
    />
  );
}
