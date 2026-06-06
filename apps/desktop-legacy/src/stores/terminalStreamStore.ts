import { create } from "zustand";

type Listener = (base64Data: string) => void;

type TerminalStreamState = {
  /** Oturum dinleyicisi yokken biriken çıktı (base64). */
  pending: Record<string, string[]>;
  listeners: Record<string, Set<Listener>>;
  push: (sessionId: string, base64Data: string) => void;
  subscribe: (sessionId: string, listener: Listener) => () => void;
  clearSession: (sessionId: string) => void;
};

export const useTerminalStreamStore = create<TerminalStreamState>((set, get) => ({
  pending: {},
  listeners: {},

  push: (sessionId, base64Data) => {
    const active = get().listeners[sessionId];
    if (active && active.size > 0) {
      for (const fn of active) {
        fn(base64Data);
      }
      return;
    }
    set((state) => {
      const queue = state.pending[sessionId] ?? [];
      return {
        pending: {
          ...state.pending,
          [sessionId]: [...queue, base64Data],
        },
      };
    });
  },

  subscribe: (sessionId, listener) => {
    const queued = get().pending[sessionId] ?? [];
    for (const chunk of queued) {
      listener(chunk);
    }

    set((state) => {
      const setForSession = new Set(state.listeners[sessionId] ?? []);
      setForSession.add(listener);
      const nextPending = { ...state.pending };
      delete nextPending[sessionId];
      return {
        listeners: { ...state.listeners, [sessionId]: setForSession },
        pending: nextPending,
      };
    });

    return () => {
      set((state) => {
        const setForSession = new Set(state.listeners[sessionId] ?? []);
        setForSession.delete(listener);
        const nextListeners = { ...state.listeners };
        if (setForSession.size === 0) {
          delete nextListeners[sessionId];
        } else {
          nextListeners[sessionId] = setForSession;
        }
        return { listeners: nextListeners };
      });
    };
  },

  clearSession: (sessionId) => {
    set((state) => {
      const nextPending = { ...state.pending };
      const nextListeners = { ...state.listeners };
      delete nextPending[sessionId];
      delete nextListeners[sessionId];
      return { pending: nextPending, listeners: nextListeners };
    });
  },
}));

/** @internal */
export function resetTerminalStreamStore() {
  useTerminalStreamStore.setState({ pending: {}, listeners: {} });
}
