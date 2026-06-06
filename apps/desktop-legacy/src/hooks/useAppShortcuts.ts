import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { HEADER_SEARCH_INPUT_ID } from "@/components/layout/HeaderSearch";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function modKey(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

export function useAppShortcuts() {
  const openLocalShell = useSessionStore((s) => s.openLocalShell);
  const closeSession = useSessionStore((s) => s.closeSession);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setView = useNavStore((s) => s.setView);

  useEffect(() => {
    const unlisten = listen("tray-open-local", () => {
      openLocalShell();
      setView("terminal");
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [openLocalShell, setView]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!modKey(event) || event.altKey) return;

      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        const input = document.getElementById(HEADER_SEARCH_INPUT_ID) as HTMLInputElement | null;
        input?.focus();
        input?.select();
        return;
      }

      if (isEditableTarget(event.target)) return;

      if (key === "t" && !event.shiftKey) {
        event.preventDefault();
        openLocalShell();
        setView("terminal");
        return;
      }

      if (key === "w") {
        event.preventDefault();
        if (activeSessionId) {
          void closeSession(activeSessionId);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openLocalShell, closeSession, activeSessionId, setView]);
}
