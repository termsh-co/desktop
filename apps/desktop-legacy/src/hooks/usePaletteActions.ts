import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHostStore } from "@/stores/hostStore";
import { useNavStore, type AppView } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";

export type PaletteAction = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

type Options = {
  onNewHost: () => void;
  onOpenVaultSetup: () => void;
  onVault: () => void;
};

export function usePaletteActions({ onNewHost, onOpenVaultSetup, onVault }: Options) {
  const { t, i18n } = useTranslation("palette");
  const setView = useNavStore((s) => s.setView);
  const hosts = useHostStore((s) => s.hosts);
  const openLocalShell = useSessionStore((s) => s.openLocalShell);
  const openSshSession = useSessionStore((s) => s.openSshSession);

  const actions = useMemo<PaletteAction[]>(() => {
    const go = (view: AppView, after?: () => void) => {
      setView(view);
      after?.();
    };

    const screen = t("hintScreen");

    const nav: PaletteAction[] = [
      { id: "nav-hosts", label: t("nav.hosts"), hint: screen, run: () => go("hosts") },
      {
        id: "nav-terminal",
        label: t("nav.terminal"),
        hint: screen,
        run: () =>
          go("terminal", () => {
            if (useSessionStore.getState().sessions.length === 0) {
              openLocalShell();
            }
          }),
      },
      { id: "nav-snippets", label: t("nav.snippets"), hint: screen, run: () => go("snippets") },
      { id: "nav-remote", label: t("nav.remote"), hint: screen, run: () => go("remote") },
      { id: "nav-vault", label: t("nav.vault"), hint: screen, run: () => go("vault") },
      { id: "nav-keys", label: t("nav.keys"), hint: screen, run: () => go("keys") },
      { id: "nav-settings", label: t("nav.settings"), hint: screen, run: () => go("settings") },
      { id: "new-host", label: t("newHost"), run: () => onNewHost() },
      { id: "vault", label: t("vaultActions"), run: () => go("vault", onVault) },
      { id: "vault-setup", label: t("vaultSetup"), run: () => go("vault", onOpenVaultSetup) },
    ];

    const hostActions: PaletteAction[] = hosts.map((h) => ({
      id: `host-${h.id}`,
      label: t("connect", { name: h.name }),
      hint: `${h.username}@${h.hostname}`,
      run: () => go("terminal", () => openSshSession(h)),
    }));

    return [...nav, ...hostActions];
  }, [hosts, i18n.language, onNewHost, onOpenVaultSetup, onVault, openLocalShell, openSshSession, setView, t]);

  const filterActions = (query: string, limit = 8): PaletteAction[] => {
    const q = query.trim().toLowerCase();
    if (!q) return actions.slice(0, limit);
    return actions
      .filter((a) => a.label.toLowerCase().includes(q) || a.hint?.toLowerCase().includes(q))
      .slice(0, limit);
  };

  return { actions, filterActions };
}
