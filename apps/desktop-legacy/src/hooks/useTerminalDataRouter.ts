import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";
import { touchSessionActivity } from "@/lib/session/activity";
import { useSessionStore } from "@/stores/sessionStore";
import { useTerminalStreamStore } from "@/stores/terminalStreamStore";

type TerminalDataEvent = {
  sessionId: string;
  data: string;
};

/** Tüm terminal çıktısını oturum tamponuna yönlendirir (MOTD kaybını önler). */
export function useTerminalDataRouter() {
  useEffect(() => {
    const unlisten = listen<TerminalDataEvent>("terminal-data", (event) => {
      const { sessionId, data } = event.payload;
      useTerminalStreamStore.getState().push(sessionId, data);

      const session = useSessionStore.getState().sessions.find((s) => s.id === sessionId);
      if (session?.kind === "ssh") {
        touchSessionActivity(sessionId);
      }
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);
}
